from flask import Flask, jsonify, request
import requests as http_requests
from flask_cors import CORS
import sqlite3
import json
import os
import time

app = Flask(__name__)
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(get_remote_address, app=app,
                  default_limits=["200 per hour"])
from flask_talisman import Talisman
Talisman(app, force_https=True, strict_transport_security=True,
         content_security_policy=None)   # set a stricter policy later
# REPLACE: CORS(app)
# WITH (use your real frontend URL):
CORS(app,
     origins=["https://aspan-cafe-frontend.onrender.com", "http://localhost:5173"],
     supports_credentials=True)

from db import get_db

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS menu (
            id TEXT PRIMARY KEY,
            data JSONB NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            num INTEGER NOT NULL,
            ts BIGINT NOT NULL,
            status TEXT NOT NULL,
            payment_id TEXT,
            data JSONB NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            data JSONB NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            order_id TEXT NOT NULL,
            status TEXT,
            message TEXT NOT NULL,
            ts BIGINT NOT NULL,
            read_status BOOLEAN NOT NULL DEFAULT FALSE
        )
    """)
    conn.commit()
    conn.close()

# ── MENU ──────────────────────────────────────────
from auth import check_login, require_owner

@app.route("/api/login", methods=["POST"])
def login():
    body = request.get_json()
    token = check_login(body.get("username"), body.get("password"))
    if not token:
        return jsonify(error="wrong username or password"), 401
    return jsonify(token=token)


@app.route("/api/auth/check", methods=["GET"])
@require_owner
def auth_check():
    # Lets the frontend validate a stored token before entering the admin
    # panel (tokens expire after 12h; without this check the panel opened
    # with a dead token and every write silently failed with 401).
    return jsonify({"ok": True})
@app.route("/api/menu", methods=["GET"])
def get_menu():
    conn = get_db()
    rows = conn.execute("SELECT data FROM menu").fetchall()
    conn.close()
    items = [r["data"] for r in rows]
    return jsonify(items)

@app.route("/api/menu", methods=["POST"])
@require_owner
def save_menu():
    items = request.get_json()
    conn = get_db()
    conn.execute("DELETE FROM menu")
    for item in items:
        conn.execute(
            "INSERT INTO menu (id, data) VALUES (%s, %s)",
            (item["id"], json.dumps(item))
        )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

# ── ORDERS ────────────────────────────────────────

@app.route("/api/orders", methods=["GET"])
def get_orders():
    conn = get_db()
    rows = conn.execute(
        "SELECT data FROM orders "
        "WHERE status NOT IN ('pending_payment','expired','payment_failed') "
        "ORDER BY ts DESC"
    ).fetchall()
    conn.close()
    return jsonify([r["data"] for r in rows])


# 1. Standalone Turnstile Helper Function (No decorators here!)
def turnstile_ok(token, ip):
    r = http_requests.post(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        data={"secret": os.environ["TURNSTILE_SECRET"],
              "response": token, "remoteip": ip})
    return r.json().get("success", False)


# 2. Your Protected Flask API Endpoint
@app.route("/api/orders", methods=["POST"])
@limiter.limit("5 per minute")  # Locks down the order submission endpoint
def place_order():
    body = request.get_json()

    # Run the invisible captcha check immediately before any logic or database calls
    if not turnstile_ok(body.get("captcha"), request.remote_addr):
        return jsonify(error="failed bot check"), 403

    conn = get_db()
    settings_row = conn.execute("SELECT data FROM settings WHERE key='cafe_status'").fetchone()
    if settings_row and not settings_row["data"].get("isOpen", True):
        conn.close()
        return jsonify({"error": "closed"}), 403

    order = request.get_json()
    conn.execute(
        "INSERT INTO orders (id, num, ts, status, payment_id, data) VALUES (%s, %s, %s, %s, %s, %s)",
        (order["id"], order["num"], order["ts"], order["status"],
         order.get("payment_id"), json.dumps(order))
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

# Customer-facing message created when the status changes (website notifications)
def order_notification_message(status, prep_minutes=None):
    if status == "cooking":
        if prep_minutes:
            return f"Your order is being prepared. Estimated time: {prep_minutes} minutes."
        return "Your order is being prepared."
    if status == "ready":
        return "Your order is ready."
    if status == "done":
        return "Order completed. Thank you."
    if status == "cancelled":
        return "Your order has been cancelled."
    return None


@app.route("/api/orders/<order_id>", methods=["PUT"])
@require_owner
def update_order(order_id):
    body = request.get_json()
    new_status = body["status"]
    conn = get_db()
    row = conn.execute(
        "SELECT data FROM orders WHERE id = %s", (order_id,)
    ).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Not found"}), 404
    order = row["data"]
    old_status = order.get("status")
    order["status"] = new_status

    # Preparation window + per-step timestamps for the customer timeline
    now_ms = int(time.time() * 1000)
    if new_status == "cooking":
        try:
            prep_minutes = int(body.get("preparation_minutes") or 0)
        except (TypeError, ValueError):
            prep_minutes = 0
        if prep_minutes > 0:
            order["preparation_minutes"] = prep_minutes
            order["preparation_started_at"] = now_ms
            order["estimated_ready_at"] = now_ms + prep_minutes * 60000
    elif new_status == "ready":
        order["ready_at"] = now_ms
    elif new_status == "done":
        order["completed_at"] = now_ms
    elif new_status == "cancelled":
        order["cancelled_at"] = now_ms

    conn.execute(
        "UPDATE orders SET status = %s, data = %s WHERE id = %s",
        (new_status, json.dumps(order), order_id)
    )
    if new_status != old_status:
        msg = order_notification_message(new_status, order.get("preparation_minutes"))
        if msg:
            conn.execute(
                "INSERT INTO notifications (order_id, status, message, ts) VALUES (%s, %s, %s, %s)",
                (order_id, new_status, msg, now_ms)
            )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.route("/api/orders/<order_id>/notifications", methods=["GET"])
def order_notifications(order_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT id, order_id, status, message, ts, read_status "
        "FROM notifications WHERE order_id = %s ORDER BY ts ASC", (order_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/orders/<order_id>/notifications/read", methods=["POST"])
def mark_notifications_read(order_id):
    conn = get_db()
    conn.execute(
        "UPDATE notifications SET read_status = TRUE "
        "WHERE order_id = %s AND read_status = FALSE", (order_id,)
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})

@app.route("/api/orders/<order_id>/status", methods=["GET"])
def order_status(order_id):
    conn = get_db()
    row = conn.execute(
        "SELECT status FROM orders WHERE id = %s", (order_id,)
    ).fetchone()
    conn.close()
    return (jsonify({"status": row["status"]}) if row
            else (jsonify({"status": "unknown"}), 404))

# ─────────────────────────────────────────────────

@app.route("/api/bookings/availability", methods=["GET"])
def check_availability():
    date = request.args.get("date")
    time = request.args.get("time")
    if not date or not time:
        return jsonify({"booked_room_ids": []})
    conn = get_db()
    rows = conn.execute(
        "SELECT data FROM orders WHERE status NOT IN ('cancelled','payment_failed','expired')"
    ).fetchall()
    conn.close()
    booked = []
    for r in rows:
        o = r["data"]
        if o.get("type") != "booking":
            continue
        b = o.get("booking") or {}
        if b.get("date") == date and b.get("time") == time and b.get("roomId"):
            booked.append(b.get("roomId"))
    return jsonify({"booked_room_ids": booked})



# ── SCHEDULE & SETTINGS ────────────────────────────────────────────────
@app.route("/api/settings/cafe", methods=["GET"])
def get_cafe_settings():
    conn = get_db()
    row = conn.execute("SELECT data FROM settings WHERE key='cafe_status'").fetchone()
    conn.close()
    if not row:
        return jsonify(
            {"isOpen": True, "hours": {i: "08:00-23:00" for i in ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]}})
    return jsonify(row["data"])


@app.route("/api/settings/cafe", methods=["PUT"])
@require_owner
def update_cafe_settings():
    body = request.get_json()
    conn = get_db()
    conn.execute("""
        INSERT INTO settings (key, data) VALUES ('cafe_status', %s)
        ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data
    """, (json.dumps(body),))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


# ── ADMIN ORDER EDITOR & LEDGER RECALCULATION ─────────────────────────
@app.route("/api/orders/<order_id>/items", methods=["PUT"])
@require_owner
def edit_order_items(order_id):
    body = request.get_json()
    new_items = body.get("items", [])
    new_total = body.get("newTotal", 0)
    conn = get_db()

    row = conn.execute("SELECT data FROM orders WHERE id=%s", (order_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Not found"}), 404

    old_order = row["data"]
    old_total = old_order.get("total", 0)

    # Safely recalculate 2% fee difference (Hardcoded to avoid cross-file errors)
    old_fee = round(old_total * 0.02)
    new_fee = round(new_total * 0.02)
    fee_diff = new_fee - old_fee

    # Update Order Data
    old_order["items"] = new_items
    old_order["total"] = new_total
    old_order["fee"] = new_fee

    conn.execute("UPDATE orders SET data=%s WHERE id=%s", (json.dumps(old_order), order_id))

    # Adjust Platform Ledger if fee changed
    if fee_diff != 0:
        conn.execute("""
            UPDATE ledger
            SET accrued = accrued + %s, balance = balance + %s
            WHERE id = (SELECT id FROM ledger LIMIT 1)
        """, (fee_diff, fee_diff))

    conn.commit()
    conn.close()
    return jsonify({"ok": True, "newTotal": new_total})
init_db()
if __name__ == "__main__":
    from payments import payments

    app.register_blueprint(payments)
    app.run(port=5000)
    PRINTER_TOKEN = os.environ["PRINTER_TOKEN"]  # one long random secret


    def check_printer(req):
        return req.headers.get("Authorization", "").removeprefix("Bearer ") == PRINTER_TOKEN


    @app.route("/api/print-jobs/claim", methods=["POST"])
    def claim_jobs():
        if not check_printer(request): return jsonify(error="no"), 401
        conn = get_db()
        rows = conn.execute("""
            UPDATE print_jobs SET status='claimed', attempts=attempts+1
            WHERE id IN (SELECT id FROM print_jobs WHERE status='queued'
                         ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 5)
            RETURNING id, payload
        """).fetchall()
        conn.commit();
        conn.close()
        return jsonify(jobs=[dict(r) for r in rows])


    @app.route("/api/print-jobs/<job_id>/done", methods=["POST"])
    def job_done(job_id):
        if not check_printer(request): return jsonify(error="no"), 401
        ok = request.get_json().get("printed", False)
        conn = get_db()
        conn.execute("UPDATE print_jobs SET status=%s WHERE id=%s",
                     ("printed" if ok else "failed", job_id))
        conn.commit();
        conn.close()
        return jsonify(ok=True)