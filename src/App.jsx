import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ───────────────────────── ASPAN Coffee & Kitchen ─────────────────────────
   Guest site + Admin panel in one app.
   Shared persistent storage: menu + orders are visible to everyone
   who opens this artifact (that's what makes guest → kitchen work).
   Admin PIN: 1234
──────────────────────────────────────────────────────────────────────────── */

const MENU_KEY = "aspan-menu-v1";
const ORDERS_KEY = "aspan-orders-v1";
const ADMIN_PIN = "1234";

const P = {
  ink: "#16202B", ink2: "#0E1620", bone: "#F7F4ED", card: "#FFFFFF",
  line: "#E6E0D2", teal: "#15A39A", tealD: "#0B7B74", saff: "#E9A13B",
  red: "#C7514A", green: "#5E8C4A", txt: "#1E232B", sub: "#6F7884",
};

const FONT_DISPLAY = "'Unbounded','Arial Black',sans-serif";
const FONT_BODY = "'Manrope',system-ui,-apple-system,sans-serif";

const CATS = [
  { id: "coffee", en: "Coffee", ru: "Кофе", tint: "#F0E4D0" },
  { id: "drinks", en: "Tea & drinks", ru: "Чай и напитки", tint: "#DEF0EB" },
  { id: "breakfast", en: "Breakfast", ru: "Завтраки", tint: "#FCEFD8" },
  { id: "mains", en: "Mains", ru: "Основные блюда", tint: "#E8EDDF" },
  { id: "desserts", en: "Desserts", ru: "Десерты", tint: "#F8E4E0" },
];

const TAGS = {
  hit: { en: "Hit", ru: "Хит", bg: "#FBEFD9", fg: "#8A5A12" },
  new: { en: "New", ru: "Новинка", bg: "#DFF2F0", fg: "#0B6B65" },
  veg: { en: "Veg", ru: "Вег", bg: "#E9F1DF", fg: "#3F6B2A" },
  spicy: { en: "Spicy", ru: "Острое", bg: "#FAE5E3", fg: "#933A34" },
};

const STATUS = {
  new: { en: "New", ru: "Новый", bg: "#E6F1FB", fg: "#185FA5" },
  cooking: { en: "In the kitchen", ru: "Готовится", bg: "#FBEFD9", fg: "#8A5A12" },
  ready: { en: "Ready", ru: "Готов", bg: "#E9F1DF", fg: "#3F6B2A" },
  done: { en: "Completed", ru: "Завершён", bg: "#EEEDEA", fg: "#6F7884" },
  cancelled: { en: "Cancelled", ru: "Отменён", bg: "#FAE5E3", fg: "#933A34" },
};

const SEED = [
  { id: "c1", cat: "coffee", emoji: "☕", price: 900, tags: [], available: true,
    name: { en: "Espresso", ru: "Эспрессо" },
    desc: { en: "Double shot, medium roast from a Karaganda roastery.", ru: "Двойной шот, средняя обжарка от карагандинского обжарщика." } },
  { id: "c2", cat: "coffee", emoji: "☕", price: 1400, tags: [], available: true,
    name: { en: "Cappuccino", ru: "Капучино" },
    desc: { en: "Classic 250 ml with dense milk foam.", ru: "Классика 250 мл с плотной молочной пеной." } },
  { id: "c3", cat: "coffee", emoji: "🥛", price: 1500, tags: ["hit"], available: true,
    name: { en: "Flat white", ru: "Флэт уайт" },
    desc: { en: "Two shots, thin layer of velvety milk, 180 ml.", ru: "Два шота, тонкий слой бархатного молока, 180 мл." } },
  { id: "c4", cat: "coffee", emoji: "🍮", price: 1900, tags: ["hit"], available: true,
    name: { en: "Raf “Salted caramel”", ru: "Раф «Солёная карамель»" },
    desc: { en: "Cream-based raf with house caramel and sea salt.", ru: "Раф на сливках с домашней карамелью и морской солью." } },
  { id: "c5", cat: "coffee", emoji: "🍵", price: 1800, tags: ["new"], available: true,
    name: { en: "Matcha latte", ru: "Матча латте" },
    desc: { en: "Ceremonial matcha, your choice of milk.", ru: "Церемониальная матча, молоко на выбор." } },
  { id: "d1", cat: "drinks", emoji: "🍊", price: 2200, tags: ["hit"], available: true,
    name: { en: "Sea buckthorn tea", ru: "Облепиховый чай" },
    desc: { en: "Sea buckthorn, orange, honey. Teapot 600 ml.", ru: "Облепиха, апельсин, мёд. Чайник 600 мл." } },
  { id: "d2", cat: "drinks", emoji: "🫖", price: 1900, tags: [], available: true,
    name: { en: "Tashkent tea", ru: "Ташкентский чай" },
    desc: { en: "Green tea, lemon, mint, honey. Teapot 600 ml.", ru: "Зелёный чай, лимон, мята, мёд. Чайник 600 мл." } },
  { id: "d3", cat: "drinks", emoji: "🫐", price: 1200, tags: ["veg"], available: true,
    name: { en: "Berry morse", ru: "Ягодный морс" },
    desc: { en: "Cranberry and black currant, lightly sweetened.", ru: "Клюква и чёрная смородина, слегка подслащён." } },
  { id: "d4", cat: "drinks", emoji: "🍋", price: 1500, tags: ["new"], available: true,
    name: { en: "Raspberry lemonade", ru: "Малиновый лимонад" },
    desc: { en: "House lemonade with raspberry and lime, 400 ml.", ru: "Домашний лимонад с малиной и лаймом, 400 мл." } },
  { id: "b1", cat: "breakfast", emoji: "🥞", price: 2400, tags: ["hit", "veg"], available: true,
    name: { en: "Syrniki with sour cream", ru: "Сырники со сметаной" },
    desc: { en: "Three cottage-cheese pancakes, sour cream, berry jam.", ru: "Три сырника, сметана, ягодный джем." } },
  { id: "b2", cat: "breakfast", emoji: "🍳", price: 2600, tags: [], available: true,
    name: { en: "Omelet with suluguni", ru: "Омлет с сулугуни" },
    desc: { en: "Fluffy three-egg omelet, suluguni, cherry tomatoes, toast.", ru: "Пышный омлет из трёх яиц, сулугуни, черри, тост." } },
  { id: "b3", cat: "breakfast", emoji: "🥣", price: 2300, tags: ["veg", "new"], available: true,
    name: { en: "Granola bowl", ru: "Гранола боул" },
    desc: { en: "House granola, Greek yogurt, seasonal fruit, honey.", ru: "Домашняя гранола, греческий йогурт, сезонные фрукты, мёд." } },
  { id: "m1", cat: "mains", emoji: "🥟", price: 2800, tags: ["hit"], available: true,
    name: { en: "Manty with beef (5 pcs)", ru: "Манты с говядиной (5 шт)" },
    desc: { en: "Hand-made, steamed, served with sour cream and tomato sauce.", ru: "Ручная лепка, на пару, со сметаной и томатным соусом." } },
  { id: "m2", cat: "mains", emoji: "🍲", price: 3900, tags: [], available: true,
    name: { en: "Kuyrdak in a pan", ru: "Куырдак на сковороде" },
    desc: { en: "Beef, potatoes and onion fried the traditional way.", ru: "Говядина, картофель и лук, обжаренные по-традиционному." } },
  { id: "m3", cat: "mains", emoji: "🥗", price: 3200, tags: [], available: true,
    name: { en: "Caesar with chicken", ru: "Цезарь с курицей" },
    desc: { en: "Romaine, grilled chicken, parmesan, house dressing.", ru: "Романо, курица гриль, пармезан, фирменный соус." } },
  { id: "m4", cat: "mains", emoji: "🍝", price: 3400, tags: ["veg"], available: true,
    name: { en: "Fettuccine with mushrooms", ru: "Феттучини с грибами" },
    desc: { en: "Cream sauce, champignons and porcini, parmesan.", ru: "Сливочный соус, шампиньоны и белые грибы, пармезан." } },
  { id: "s1", cat: "desserts", emoji: "🍯", price: 1900, tags: ["hit"], available: true,
    name: { en: "Medovik", ru: "Медовик" },
    desc: { en: "Honey layers with smetana cream, made in-house.", ru: "Медовые коржи со сметанным кремом, собственное производство." } },
  { id: "s2", cat: "desserts", emoji: "🍰", price: 2200, tags: ["new"], available: true,
    name: { en: "Kurt cheesecake", ru: "Чизкейк с куртом" },
    desc: { en: "New York base with a salty kurt accent. Our signature.", ru: "База Нью-Йорк с солоноватым акцентом курта. Наша фишка." } },
  { id: "s3", cat: "desserts", emoji: "🥐", price: 1400, tags: ["veg"], available: true,
    name: { en: "Baursaks with condensed milk", ru: "Баурсаки со сгущёнкой" },
    desc: { en: "Eight warm baursaks, condensed milk on the side.", ru: "Восемь тёплых баурсаков, сгущёнка отдельно." } },
  { id: "s4", cat: "desserts", emoji: "🎂", price: 1800, tags: [], available: true,
    name: { en: "Napoleon", ru: "Наполеон" },
    desc: { en: "Forty thin layers, custard cream, a day of rest.", ru: "Сорок тонких коржей, заварной крем, сутки пропитки." } },
];

const T = {
  en: {
    menu: "Menu", about: "About", contacts: "Contacts", cart: "Cart",
    tagline: "Steppe calm. City pace.",
    heroText: "Specialty coffee, breakfasts all day and a kitchen that remembers where it comes from. Two minutes from Khan Shatyr.",
    seeMenu: "Open the menu", today: "Open today", until: "until",
    search: "Search the menu…", all: "All", soldOut: "Sold out", add: "Add",
    cartEmpty: "Your cart is empty", cartEmptyHint: "Add something from the menu — it will appear here.",
    total: "Total", checkout: "Checkout", back: "Back",
    orderType: "Where do we serve it?", atTable: "To my table", pickup: "Pickup",
    tableNo: "Table number", yourName: "Your name", phone: "Phone",
    comment: "Comment (optional)", commentPh: "Allergies, no sugar, extra hot…",
    placeOrder: "Place order", needTable: "Enter your table number (it is on the QR stand).",
    needContacts: "Enter your name and phone so we can call when it is ready.",
    placed: "Order accepted!", placedTable: "We are already on it — we will bring it to table",
    placedPickup: "We will call you when it is ready to pick up.",
    orderNo: "Order", statusNow: "Current status", refresh: "Refresh",
    newOrder: "New order", aboutTitle: "A cafe about the steppe, made urban",
    aboutText: "Aspan means “sky” in Kazakh. We opened in 2024 with a simple idea: specialty coffee culture plus the dishes we grew up with. Beans are roasted for us in Karaganda, baursaks are fried every morning, and the kurt cheesecake has become the thing people cross the city for.",
    addressT: "Address", hoursT: "Hours", phoneT: "Phone",
    address: "Turan ave 37, Astana (Khan Shatyr area)", hours: "Mon–Sun · 08:00–23:00",
    staff: "Staff portal", madeNote: "Demo cafe website · menu and orders are shared demo data",
    activeOrder: "Your order", items: "items",
    footAbout: "Coffee, kitchen and desserts in the heart of Astana. Breakfasts all day, lunches, takeaway.",
  },
  ru: {
    menu: "Меню", about: "О нас", contacts: "Контакты", cart: "Корзина",
    tagline: "Степное спокойствие. Городской ритм.",
    heroText: "Спешелти-кофе, завтраки весь день и кухня, которая помнит свои корни. Две минуты от Хан Шатыра.",
    seeMenu: "Открыть меню", today: "Сегодня открыто", until: "до",
    search: "Поиск по меню…", all: "Все", soldOut: "Стоп-лист", add: "Добавить",
    cartEmpty: "Корзина пуста", cartEmptyHint: "Добавьте что-нибудь из меню — оно появится здесь.",
    total: "Итого", checkout: "Оформить заказ", back: "Назад",
    orderType: "Куда подать?", atTable: "За мой столик", pickup: "С собой",
    tableNo: "Номер столика", yourName: "Ваше имя", phone: "Телефон",
    comment: "Комментарий (необязательно)", commentPh: "Аллергии, без сахара, погорячее…",
    placeOrder: "Отправить заказ", needTable: "Укажите номер столика (он на QR-подставке).",
    needContacts: "Укажите имя и телефон, чтобы мы позвонили, когда будет готово.",
    placed: "Заказ принят!", placedTable: "Уже готовим — принесём к столику",
    placedPickup: "Позвоним, когда заказ можно будет забрать.",
    orderNo: "Заказ", statusNow: "Текущий статус", refresh: "Обновить",
    newOrder: "Новый заказ", aboutTitle: "Кафе о степи на городской лад",
    aboutText: "Аспан — по-казахски «небо». Мы открылись в 2024 году с простой идеей: культура спешелти-кофе плюс блюда, на которых мы выросли. Зерно для нас жарят в Караганде, баурсаки жарим каждое утро, а за чизкейком с куртом приезжают через весь город.",
    addressT: "Адрес", hoursT: "Часы работы", phoneT: "Телефон",
    address: "пр. Туран 37, Астана (район Хан Шатыра)", hours: "Пн–Вс · 08:00–23:00",
    staff: "Для персонала", madeNote: "Демо-сайт кафе · меню и заказы — общие демо-данные",
    activeOrder: "Ваш заказ", items: "поз.",
    footAbout: "Кофе, кухня и десерты в центре Астаны. Завтраки весь день, обеды, навынос.",
  },
};

const fmt = (n) => n.toLocaleString("ru-RU") + " ₸";
const timeOf = (ts) => new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
const dateOf = (ts) => new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();

async function sGet(key) {
  try { const r = await window.storage.get(key, true); return r && r.value ? JSON.parse(r.value) : null; }
  catch (e) { return null; }
}
async function sSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val), true); return true; }
  catch (e) { return false; }
}

/* ── small shared pieces ─────────────────────────────────────────────── */

const Ornament = ({ color = P.teal, w = 46 }) => (
  <svg width={w} height={w / 2} viewBox="0 0 64 32" fill="none" aria-hidden="true">
    <path d="M32 30 V13 M32 13 C32 5 23 3 18 7.5 C13 12 15.5 19.5 21 19.5 C25.5 19.5 26.5 14 23 12.8 M32 13 C32 5 41 3 46 7.5 C51 12 48.5 19.5 43 19.5 C38.5 19.5 37.5 14 41 12.8"
      stroke={color} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

const Pill = ({ bg, fg, children }) => (
  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color: fg }}>{children}</span>
);

const StatusPill = ({ s, lang }) => {
  const st = STATUS[s] || STATUS.new;
  return <Pill bg={st.bg} fg={st.fg}>{st[lang]}</Pill>;
};

const QtyControl = ({ qty, onMinus, onPlus, dark }) => (
  <div className="flex items-center gap-2">
    <button onClick={onMinus} aria-label="minus" className="w-8 h-8 rounded-full font-bold text-lg leading-none"
      style={{ background: dark ? "rgba(255,255,255,.12)" : P.bone, color: dark ? "#fff" : P.txt }}>−</button>
    <span className="w-6 text-center font-extrabold">{qty}</span>
    <button onClick={onPlus} aria-label="plus" className="w-8 h-8 rounded-full font-bold text-lg leading-none"
      style={{ background: P.teal, color: "#fff" }}>+</button>
  </div>
);

/* ── guest: dish card ────────────────────────────────────────────────── */

function DishCard({ item, lang, qty, onPlus, onMinus, t }) {
  const cat = CATS.find((c) => c.id === item.cat);
  const off = !item.available;
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: P.card, border: `1px solid ${P.line}`, opacity: off ? 0.55 : 1 }}>
      <div className="relative flex items-center justify-center" style={{ background: cat?.tint || P.bone, height: 120 }}>
        <span style={{ fontSize: 52, filter: off ? "grayscale(1)" : "none" }} aria-hidden="true">{item.emoji}</span>
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {(item.tags || []).map((tg) => TAGS[tg] && <Pill key={tg} bg={TAGS[tg].bg} fg={TAGS[tg].fg}>{TAGS[tg][lang]}</Pill>)}
        </div>
        {off && <div className="absolute bottom-2 right-2"><Pill bg="#2b2b2b" fg="#fff">{t("soldOut")}</Pill></div>}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="font-extrabold leading-snug" style={{ color: P.txt }}>{item.name[lang]}</div>
        <div className="text-xs mt-1 flex-1" style={{ color: P.sub }}>{item.desc[lang]}</div>
        <div className="flex items-center justify-between mt-3">
          <div className="font-extrabold" style={{ color: P.txt }}>{fmt(item.price)}</div>
          {off ? (
            <span className="text-xs font-bold" style={{ color: P.sub }}>—</span>
          ) : qty > 0 ? (
            <QtyControl qty={qty} onMinus={onMinus} onPlus={onPlus} />
          ) : (
            <button onClick={onPlus} className="text-sm font-bold px-3 py-1.5 rounded-full"
              style={{ background: P.ink, color: "#fff" }}>{t("add")} +</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── guest: cart drawer (cart → checkout → confirmation) ─────────────── */

function CartDrawer({ open, onClose, cart, menu, lang, t, setQty, placeOrder, lastOrder, orders, refreshOrders, resetAfterOrder }) {
  const [step, setStep] = useState("cart");
  const [type, setType] = useState("table");
  const [table, setTable] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);

  const entries = Object.entries(cart).map(([id, q]) => ({ item: menu.find((m) => m.id === id), q })).filter((e) => e.item);
  const total = entries.reduce((s, e) => s + e.item.price * e.q, 0);
  const live = lastOrder ? orders.find((o) => o.id === lastOrder.id) || lastOrder : null;

  useEffect(() => { if (open && lastOrder && step === "done") { const tm = setInterval(refreshOrders, 10000); return () => clearInterval(tm); } }, [open, step, lastOrder, refreshOrders]);
  useEffect(() => { if (open && step !== "done") setStep(entries.length ? step : "cart"); }, [open]);

  const submit = async () => {
    setErr("");
    if (type === "table" && !table.trim()) return setErr(t("needTable"));
    if (type === "pickup" && (!name.trim() || !phone.trim())) return setErr(t("needContacts"));
    setSending(true);
    await placeOrder({
      type, table: table.trim(), name: name.trim(), phone: phone.trim(), comment: comment.trim(),
      items: entries.map((e) => ({ id: e.item.id, name: e.item.name, price: e.item.price, qty: e.q })),
      total,
    });
    setSending(false);
    setStep("done");
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label={t("cart")}>
      <div className="absolute inset-0" style={{ background: "rgba(14,22,32,.55)" }} onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[420px] flex flex-col" style={{ background: P.bone }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${P.line}` }}>
          <div className="font-extrabold text-lg" style={{ fontFamily: FONT_DISPLAY, color: P.txt }}>
            {step === "done" ? t("placed") : step === "checkout" ? t("checkout") : t("cart")}
          </div>
          <button onClick={onClose} aria-label="close" className="w-9 h-9 rounded-full font-bold" style={{ background: P.card, border: `1px solid ${P.line}` }}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "cart" && (entries.length === 0 ? (
            <div className="text-center mt-16">
              <div style={{ fontSize: 44 }}>🧺</div>
              <div className="font-extrabold mt-2" style={{ color: P.txt }}>{t("cartEmpty")}</div>
              <div className="text-sm mt-1" style={{ color: P.sub }}>{t("cartEmptyHint")}</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.map(({ item, q }) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: P.card, border: `1px solid ${P.line}` }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ background: CATS.find((c) => c.id === item.cat)?.tint }}>{item.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: P.txt }}>{item.name[lang]}</div>
                    <div className="text-xs" style={{ color: P.sub }}>{fmt(item.price)}</div>
                  </div>
                  <QtyControl qty={q} onMinus={() => setQty(item.id, q - 1)} onPlus={() => setQty(item.id, q + 1)} />
                </div>
              ))}
            </div>
          ))}

          {step === "checkout" && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: P.txt }}>{t("orderType")}</div>
                <div className="grid grid-cols-2 gap-2">
                  {[["table", "🍽 " + t("atTable")], ["pickup", "🥡 " + t("pickup")]].map(([v, label]) => (
                    <button key={v} onClick={() => setType(v)} className="rounded-xl py-3 font-bold text-sm"
                      style={{ background: type === v ? P.ink : P.card, color: type === v ? "#fff" : P.txt, border: `1px solid ${type === v ? P.ink : P.line}` }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {type === "table" ? (
                <Field label={t("tableNo")} value={table} onChange={setTable} ph="12" />
              ) : (
                <>
                  <Field label={t("yourName")} value={name} onChange={setName} ph="Aza" />
                  <Field label={t("phone")} value={phone} onChange={setPhone} ph="+7 7__ ___ __ __" />
                </>
              )}
              <Field label={t("comment")} value={comment} onChange={setComment} ph={t("commentPh")} area />
              {err && <div className="text-sm font-bold rounded-lg px-3 py-2" style={{ background: "#FAE5E3", color: "#933A34" }}>{err}</div>}
              <div className="rounded-xl p-3 text-sm" style={{ background: P.card, border: `1px solid ${P.line}` }}>
                {entries.map(({ item, q }) => (
                  <div key={item.id} className="flex justify-between py-0.5">
                    <span style={{ color: P.sub }}>{item.name[lang]} × {q}</span>
                    <span className="font-bold" style={{ color: P.txt }}>{fmt(item.price * q)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "done" && live && (
            <div className="text-center mt-8">
              <div style={{ fontSize: 52 }}>✅</div>
              <div className="font-extrabold text-xl mt-2" style={{ fontFamily: FONT_DISPLAY, color: P.txt }}>
                {t("orderNo")} №{live.num}
              </div>
              <div className="text-sm mt-2" style={{ color: P.sub }}>
                {live.type === "table" ? `${t("placedTable")} №${live.table}.` : t("placedPickup")}
              </div>
              <div className="mt-5 rounded-xl p-4 inline-flex flex-col items-center gap-2" style={{ background: P.card, border: `1px solid ${P.line}` }}>
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: P.sub }}>{t("statusNow")}</div>
                <StatusPill s={live.status} lang={lang} />
                <button onClick={refreshOrders} className="text-xs font-bold mt-1 px-3 py-1.5 rounded-full" style={{ background: P.bone, border: `1px solid ${P.line}`, color: P.txt }}>
                  ↻ {t("refresh")}
                </button>
              </div>
              <div className="mt-6">
                <button onClick={() => { resetAfterOrder(); setStep("cart"); setTable(""); setComment(""); }}
                  className="font-bold text-sm px-4 py-2 rounded-full" style={{ background: P.ink, color: "#fff" }}>
                  {t("newOrder")}
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== "done" && entries.length > 0 && (
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${P.line}`, background: P.card }}>
            <div className="flex justify-between font-extrabold mb-3" style={{ color: P.txt }}>
              <span>{t("total")}</span><span>{fmt(total)}</span>
            </div>
            {step === "cart" ? (
              <button onClick={() => setStep("checkout")} className="w-full py-3 rounded-xl font-extrabold" style={{ background: P.teal, color: "#fff" }}>
                {t("checkout")} →
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setStep("cart")} className="px-4 py-3 rounded-xl font-bold" style={{ background: P.bone, border: `1px solid ${P.line}`, color: P.txt }}>
                  ← {t("back")}
                </button>
                <button disabled={sending} onClick={submit} className="flex-1 py-3 rounded-xl font-extrabold" style={{ background: P.teal, color: "#fff", opacity: sending ? 0.6 : 1 }}>
                  {sending ? "…" : t("placeOrder")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, ph, area }) {
  const cls = "w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none";
  const st = { background: P.card, border: `1px solid ${P.line}`, color: P.txt };
  return (
    <label className="block">
      <div className="text-sm font-bold mb-1.5" style={{ color: P.txt }}>{label}</div>
      {area ? (
        <textarea rows={2} className={cls} style={st} placeholder={ph} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className={cls} style={st} placeholder={ph} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

/* ── guest site ──────────────────────────────────────────────────────── */

function GuestSite({ lang, setLang, t, menu, cart, setQty, openCart, cartCount, cartTotal, goAdmin, lastOrder, orders }) {
  const [activeCat, setActiveCat] = useState("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => menu.filter((m) => {
    if (activeCat !== "all" && m.cat !== activeCat) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      return m.name.en.toLowerCase().includes(s) || m.name.ru.toLowerCase().includes(s);
    }
    return true;
  }), [menu, activeCat, q]);

  const live = lastOrder ? orders.find((o) => o.id === lastOrder.id) : null;
  const featured = menu.find((m) => m.id === "s2") || menu[0];

  return (
    <div style={{ background: P.bone, minHeight: "100vh", color: P.txt }}>
      {/* header */}
      <header className="sticky top-0 z-40" style={{ background: "rgba(247,244,237,.92)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${P.line}` }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="#top" className="flex items-center gap-2 no-underline" style={{ color: P.txt }}>
            <Ornament w={34} />
            <span className="font-extrabold tracking-wide" style={{ fontFamily: FONT_DISPLAY, fontSize: 15 }}>ASPAN</span>
          </a>
          <nav className="hidden sm:flex items-center gap-4 ml-4 text-sm font-bold">
            <a href="#menu" style={{ color: P.sub }} className="no-underline hover:opacity-70">{t("menu")}</a>
            <a href="#about" style={{ color: P.sub }} className="no-underline hover:opacity-70">{t("about")}</a>
            <a href="#contacts" style={{ color: P.sub }} className="no-underline hover:opacity-70">{t("contacts")}</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setLang(lang === "en" ? "ru" : "en")} className="text-xs font-extrabold px-3 py-1.5 rounded-full"
              style={{ background: P.card, border: `1px solid ${P.line}` }}>
              {lang === "en" ? "RU" : "EN"}
            </button>
            <button onClick={openCart} className="flex items-center gap-2 text-sm font-extrabold px-4 py-2 rounded-full" style={{ background: P.ink, color: "#fff" }}>
              🧺 {cartCount > 0 ? fmt(cartTotal) : t("cart")}
              {cartCount > 0 && <span className="text-xs px-1.5 rounded-full" style={{ background: P.teal }}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* hero */}
      <section id="top" style={{ background: P.ink }}>
        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 grid sm:grid-cols-5 gap-8 items-center">
          <div className="sm:col-span-3">
            <div className="flex items-center gap-2 mb-4">
              <Ornament color={P.saff} w={40} />
              <span className="text-xs font-extrabold tracking-widest uppercase" style={{ color: P.saff }}>Astana · Coffee & Kitchen</span>
            </div>
            <h1 className="leading-tight" style={{ fontFamily: FONT_DISPLAY, color: "#fff", fontSize: "clamp(26px,5vw,44px)", fontWeight: 700 }}>
              {t("tagline")}
            </h1>
            <p className="mt-4 max-w-md" style={{ color: "rgba(255,255,255,.72)", fontSize: 15 }}>{t("heroText")}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#menu" className="no-underline font-extrabold text-sm px-5 py-3 rounded-full" style={{ background: P.teal, color: "#fff" }}>
                {t("seeMenu")} ↓
              </a>
              <span className="text-xs font-bold px-3 py-2 rounded-full" style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.85)" }}>
                ● {t("today")} {t("until")} 23:00
              </span>
            </div>
          </div>
          <div className="sm:col-span-2">
            {featured && (
              <div className="rounded-2xl p-5" style={{ background: P.ink2, border: "1px solid rgba(255,255,255,.1)" }}>
                <div className="text-xs font-extrabold tracking-widest uppercase mb-3" style={{ color: P.saff }}>
                  {lang === "en" ? "Dish of the day" : "Блюдо дня"}
                </div>
                <div className="rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,255,255,.06)", height: 110 }}>
                  <span style={{ fontSize: 56 }}>{featured.emoji}</span>
                </div>
                <div className="font-extrabold" style={{ color: "#fff" }}>{featured.name[lang]}</div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,.6)" }}>{featured.desc[lang]}</div>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-extrabold" style={{ color: P.saff }}>{fmt(featured.price)}</span>
                  <button onClick={() => setQty(featured.id, (cart[featured.id] || 0) + 1)} className="text-sm font-bold px-4 py-2 rounded-full" style={{ background: P.teal, color: "#fff" }}>
                    {t("add")} +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* menu */}
      <section id="menu" className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 700 }}>{t("menu")}</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search")}
            className="rounded-full px-4 py-2 text-sm outline-none w-full sm:w-64"
            style={{ background: P.card, border: `1px solid ${P.line}` }} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          {[{ id: "all", en: t("all"), ru: t("all") }, ...CATS].map((c) => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} className="whitespace-nowrap text-sm font-bold px-4 py-2 rounded-full"
              style={{ background: activeCat === c.id ? P.ink : P.card, color: activeCat === c.id ? "#fff" : P.txt, border: `1px solid ${activeCat === c.id ? P.ink : P.line}` }}>
              {c[lang] || c.en}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <DishCard key={item.id} item={item} lang={lang} t={t}
              qty={cart[item.id] || 0}
              onPlus={() => setQty(item.id, (cart[item.id] || 0) + 1)}
              onMinus={() => setQty(item.id, (cart[item.id] || 0) - 1)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: P.sub }}>🔍 {lang === "en" ? "Nothing found" : "Ничего не найдено"}</div>
          )}
        </div>
      </section>

      {/* about */}
      <section id="about" style={{ background: P.card, borderTop: `1px solid ${P.line}`, borderBottom: `1px solid ${P.line}` }}>
        <div className="max-w-5xl mx-auto px-4 py-12 grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <Ornament w={44} />
            <h2 className="mt-3" style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 700 }}>{t("aboutTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: P.sub }}>{t("aboutText")}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[["☕", "12 000+", lang === "en" ? "cups a month" : "чашек в месяц"],
              ["🥐", "08:00", lang === "en" ? "fresh bakes daily" : "свежая выпечка"],
              ["⭐", "4.9", lang === "en" ? "2GIS rating" : "рейтинг в 2ГИС"]].map(([e, n, l]) => (
              <div key={l} className="rounded-2xl p-4" style={{ background: P.bone, border: `1px solid ${P.line}` }}>
                <div style={{ fontSize: 26 }}>{e}</div>
                <div className="font-extrabold mt-1" style={{ fontFamily: FONT_DISPLAY, fontSize: 16 }}>{n}</div>
                <div className="text-xs mt-1" style={{ color: P.sub }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* contacts / footer */}
      <footer id="contacts" style={{ background: P.ink }}>
        <div className="max-w-5xl mx-auto px-4 py-10 grid sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <Ornament color={P.saff} w={34} />
              <span className="font-extrabold" style={{ fontFamily: FONT_DISPLAY, color: "#fff" }}>ASPAN</span>
            </div>
            <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,.55)" }}>{t("footAbout")}</p>
          </div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,.8)" }}>
            <div className="font-extrabold mb-2" style={{ color: "#fff" }}>{t("contacts")}</div>
            <div className="mb-1">📍 {t("address")}</div>
            <div className="mb-1">🕗 {t("hours")}</div>
            <div>📞 +7 (707) 000 11 22</div>
          </div>
          <div className="text-sm">
            <div className="font-extrabold mb-2" style={{ color: "#fff" }}>{lang === "en" ? "For the team" : "Команде"}</div>
            <button onClick={goAdmin} className="font-bold text-sm px-4 py-2 rounded-full" style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.2)" }}>
              🔐 {t("staff")} →
            </button>
            <div className="text-xs mt-4" style={{ color: "rgba(255,255,255,.4)" }}>{t("madeNote")}</div>
          </div>
        </div>
      </footer>

      {/* active order pill */}
      {live && live.status !== "done" && live.status !== "cancelled" && (
        <button onClick={openCart} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg font-bold text-sm"
          style={{ background: P.ink, color: "#fff" }}>
          {t("activeOrder")} №{live.num} · <StatusPill s={live.status} lang={lang} />
        </button>
      )}
    </div>
  );
}

/* ── admin: pieces ───────────────────────────────────────────────────── */

function PinGate({ onOk, lang, goSite }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const tryIn = () => { if (pin === ADMIN_PIN) onOk(); else { setErr(true); setPin(""); } };
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: P.ink }}>
      <div className="w-full max-w-xs rounded-2xl p-6 text-center" style={{ background: P.ink2, border: "1px solid rgba(255,255,255,.1)" }}>
        <Ornament color={P.saff} w={44} />
        <div className="font-extrabold mt-2" style={{ fontFamily: FONT_DISPLAY, color: "#fff" }}>ASPAN · Staff</div>
        <div className="text-xs mt-1 mb-4" style={{ color: "rgba(255,255,255,.5)" }}>
          {lang === "en" ? "Enter staff PIN (demo: 1234)" : "Введите PIN персонала (демо: 1234)"}
        </div>
        <input type="password" inputMode="numeric" value={pin}
          onChange={(e) => { setPin(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && tryIn()}
          className="w-full text-center text-2xl tracking-widest rounded-xl px-3 py-3 outline-none font-extrabold"
          style={{ background: "rgba(255,255,255,.08)", color: "#fff", border: `1px solid ${err ? P.red : "rgba(255,255,255,.15)"}` }}
          placeholder="••••" />
        {err && <div className="text-xs font-bold mt-2" style={{ color: "#F09595" }}>{lang === "en" ? "Wrong PIN" : "Неверный PIN"}</div>}
        <button onClick={tryIn} className="w-full mt-4 py-3 rounded-xl font-extrabold" style={{ background: P.teal, color: "#fff" }}>
          {lang === "en" ? "Sign in" : "Войти"}
        </button>
        <button onClick={goSite} className="mt-3 text-xs font-bold" style={{ color: "rgba(255,255,255,.5)" }}>
          ← {lang === "en" ? "Back to the site" : "Назад на сайт"}
        </button>
      </div>
    </div>
  );
}

function OrderCard({ o, lang, onStatus }) {
  const next = { new: ["cooking", lang === "en" ? "Start cooking" : "В работу"], cooking: ["ready", lang === "en" ? "Mark ready" : "Готов"], ready: ["done", lang === "en" ? "Complete" : "Завершить"] }[o.status];
  return (
    <div className="rounded-2xl p-4" style={{ background: P.card, border: `1px solid ${P.line}` }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-extrabold" style={{ fontFamily: FONT_DISPLAY, fontSize: 15 }}>№{o.num}</div>
        <StatusPill s={o.status} lang={lang} />
      </div>
      <div className="text-xs mt-1" style={{ color: P.sub }}>
        {dateOf(o.ts)} · {timeOf(o.ts)} · {o.type === "table" ? `🍽 ${lang === "en" ? "Table" : "Стол"} ${o.table}` : `🥡 ${lang === "en" ? "Pickup" : "С собой"}${o.name ? " · " + o.name : ""}${o.phone ? " · " + o.phone : ""}`}
      </div>
      <div className="mt-3 text-sm rounded-xl p-3" style={{ background: P.bone }}>
        {o.items.map((it, i) => (
          <div key={i} className="flex justify-between py-0.5">
            <span style={{ color: P.txt }}>{(it.name && it.name[lang]) || it.name?.en} <b>× {it.qty}</b></span>
            <span className="font-bold">{fmt(it.price * it.qty)}</span>
          </div>
        ))}
        {o.comment && <div className="text-xs mt-2 font-bold" style={{ color: P.tealD }}>💬 {o.comment}</div>}
      </div>
      <div className="flex items-center justify-between mt-3">
        <div className="font-extrabold">{fmt(o.total)}</div>
        <div className="flex gap-2">
          {(o.status === "new" || o.status === "cooking") && (
            <button onClick={() => onStatus(o.id, "cancelled")} className="text-xs font-bold px-3 py-2 rounded-full" style={{ background: "#FAE5E3", color: "#933A34" }}>
              ✕ {lang === "en" ? "Cancel" : "Отмена"}
            </button>
          )}
          {next && (
            <button onClick={() => onStatus(o.id, next[0])} className="text-xs font-extrabold px-4 py-2 rounded-full" style={{ background: P.teal, color: "#fff" }}>
              {next[1]} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemForm({ initial, onSave, onClose, lang }) {
  const [f, setF] = useState(initial || {
    id: "i" + Date.now(), cat: "coffee", emoji: "☕", price: 1000, tags: [], available: true,
    name: { en: "", ru: "" }, desc: { en: "", ru: "" },
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setName = (l, v) => setF((p) => ({ ...p, name: { ...p.name, [l]: v } }));
  const setDesc = (l, v) => setF((p) => ({ ...p, desc: { ...p.desc, [l]: v } }));
  const toggleTag = (tg) => setF((p) => ({ ...p, tags: p.tags.includes(tg) ? p.tags.filter((x) => x !== tg) : [...p.tags, tg] }));
  const ok = f.name.en.trim() && f.name.ru.trim() && Number(f.price) > 0;
  const L = (en, ru) => (lang === "en" ? en : ru);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog">
      <div className="absolute inset-0" style={{ background: "rgba(14,22,32,.55)" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5" style={{ background: P.bone }}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-extrabold" style={{ fontFamily: FONT_DISPLAY }}>{initial ? L("Edit dish", "Редактировать блюдо") : L("New dish", "Новое блюдо")}</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full font-bold" style={{ background: P.card, border: `1px solid ${P.line}` }}>✕</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label={L("Name (EN)", "Название (EN)")} value={f.name.en} onChange={(v) => setName("en", v)} ph="Flat white" />
          <Field label={L("Name (RU)", "Название (RU)")} value={f.name.ru} onChange={(v) => setName("ru", v)} ph="Флэт уайт" />
          <Field label={L("Description (EN)", "Описание (EN)")} value={f.desc.en} onChange={(v) => setDesc("en", v)} area />
          <Field label={L("Description (RU)", "Описание (RU)")} value={f.desc.ru} onChange={(v) => setDesc("ru", v)} area />
          <Field label={L("Price, ₸", "Цена, ₸")} value={String(f.price)} onChange={(v) => set("price", Number(v.replace(/\D/g, "")) || 0)} ph="1500" />
          <Field label={L("Emoji (photo stand-in)", "Эмодзи (вместо фото)")} value={f.emoji} onChange={(v) => set("emoji", v)} ph="☕" />
        </div>
        <div className="mt-3">
          <div className="text-sm font-bold mb-1.5">{L("Category", "Категория")}</div>
          <div className="flex gap-2 flex-wrap">
            {CATS.map((c) => (
              <button key={c.id} onClick={() => set("cat", c.id)} className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: f.cat === c.id ? P.ink : P.card, color: f.cat === c.id ? "#fff" : P.txt, border: `1px solid ${f.cat === c.id ? P.ink : P.line}` }}>
                {c[lang]}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-bold mb-1.5">{L("Badges", "Метки")}</div>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(TAGS).map((tg) => (
              <button key={tg} onClick={() => toggleTag(tg)} className="text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: f.tags.includes(tg) ? TAGS[tg].bg : P.card, color: f.tags.includes(tg) ? TAGS[tg].fg : P.sub, border: `1px solid ${P.line}` }}>
                {TAGS[tg][lang]}
              </button>
            ))}
          </div>
        </div>
        <button disabled={!ok} onClick={() => onSave(f)} className="w-full mt-5 py-3 rounded-xl font-extrabold"
          style={{ background: ok ? P.teal : P.line, color: ok ? "#fff" : P.sub }}>
          {L("Save", "Сохранить")}
        </button>
      </div>
    </div>
  );
}

/* ── admin panel ─────────────────────────────────────────────────────── */

function AdminPanel({ lang, setLang, menu, saveMenu, orders, updateStatus, refreshOrders, goSite }) {
  const [tab, setTab] = useState("orders");
  const [filter, setFilter] = useState("active");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const L = (en, ru) => (lang === "en" ? en : ru);

  useEffect(() => {
    if (tab === "orders") { refreshOrders(); const t = setInterval(refreshOrders, 10000); return () => clearInterval(t); }
  }, [tab, refreshOrders]);

  const shown = orders.filter((o) =>
    filter === "active" ? ["new", "cooking", "ready"].includes(o.status) :
    filter === "all" ? true : o.status === filter);

  const today = orders.filter((o) => isToday(o.ts) && o.status !== "cancelled");
  const revenue = today.reduce((s, o) => s + o.total, 0);
  const avg = today.length ? Math.round(revenue / today.length) : 0;
  const top = useMemo(() => {
    const m = {};
    orders.filter((o) => o.status !== "cancelled").forEach((o) => o.items.forEach((it) => {
      const k = (it.name && it.name[lang]) || it.name?.en || "?";
      m[k] = (m[k] || 0) + it.qty;
    }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [orders, lang]);
  const maxTop = top.length ? top[0][1] : 1;

  return (
    <div style={{ background: P.bone, minHeight: "100vh", color: P.txt }}>
      <header className="sticky top-0 z-40" style={{ background: P.ink }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Ornament color={P.saff} w={30} />
          <span className="font-extrabold text-sm" style={{ fontFamily: FONT_DISPLAY, color: "#fff" }}>ASPAN · {L("Admin", "Админка")}</span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setLang(lang === "en" ? "ru" : "en")} className="text-xs font-extrabold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
              {lang === "en" ? "RU" : "EN"}
            </button>
            <button onClick={goSite} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
              ← {L("Site", "Сайт")}
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2">
          {[["orders", L("Orders", "Заказы")], ["menu", L("Menu", "Меню")], ["stats", L("Analytics", "Аналитика")]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className="text-sm font-bold px-4 py-2 rounded-full"
              style={{ background: tab === id ? P.teal : "rgba(255,255,255,.08)", color: "#fff" }}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "orders" && (
          <>
            <div className="flex gap-2 flex-wrap mb-4 items-center">
              {[["active", L("Active", "Активные")], ["new", STATUS.new[lang]], ["cooking", STATUS.cooking[lang]], ["ready", STATUS.ready[lang]], ["done", STATUS.done[lang]], ["cancelled", STATUS.cancelled[lang]], ["all", L("All", "Все")]].map(([v, label]) => (
                <button key={v} onClick={() => setFilter(v)} className="text-xs font-bold px-3 py-1.5 rounded-full"
                  style={{ background: filter === v ? P.ink : P.card, color: filter === v ? "#fff" : P.txt, border: `1px solid ${filter === v ? P.ink : P.line}` }}>
                  {label}
                </button>
              ))}
              <button onClick={refreshOrders} className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: P.card, border: `1px solid ${P.line}` }}>
                ↻ {L("Refresh", "Обновить")}
              </button>
            </div>
            {shown.length === 0 ? (
              <div className="text-center py-16" style={{ color: P.sub }}>
                <div style={{ fontSize: 40 }}>🔔</div>
                <div className="font-bold mt-2">{L("No orders here yet", "Заказов пока нет")}</div>
                <div className="text-xs mt-1">{L("New orders from the site appear automatically.", "Новые заказы с сайта появятся автоматически.")}</div>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {shown.map((o) => <OrderCard key={o.id} o={o} lang={lang} onStatus={updateStatus} />)}
              </div>
            )}
          </>
        )}

        {tab === "menu" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold" style={{ color: P.sub }}>
                {menu.length} {L("dishes", "позиций")} · {menu.filter((m) => !m.available).length} {L("in stop list", "в стоп-листе")}
              </div>
              <button onClick={() => setAdding(true)} className="text-sm font-extrabold px-4 py-2 rounded-full" style={{ background: P.teal, color: "#fff" }}>
                + {L("Add dish", "Добавить блюдо")}
              </button>
            </div>
            {CATS.map((c) => {
              const items = menu.filter((m) => m.cat === c.id);
              if (!items.length) return null;
              return (
                <div key={c.id} className="mb-6">
                  <div className="font-extrabold mb-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 14 }}>{c[lang]}</div>
                  <div className="flex flex-col gap-2">
                    {items.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: P.card, border: `1px solid ${P.line}`, opacity: m.available ? 1 : 0.6 }}>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: c.tint }}>{m.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{m.name[lang]}</div>
                          <div className="text-xs" style={{ color: P.sub }}>{fmt(m.price)}{m.tags.length ? " · " + m.tags.map((tg) => TAGS[tg][lang]).join(", ") : ""}</div>
                        </div>
                        <button onClick={() => saveMenu(menu.map((x) => x.id === m.id ? { ...x, available: !x.available } : x))}
                          className="text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ background: m.available ? "#E9F1DF" : "#FAE5E3", color: m.available ? "#3F6B2A" : "#933A34" }}>
                          {m.available ? L("On menu", "В меню") : L("Stopped", "Стоп")}
                        </button>
                        <button onClick={() => setEditing(m)} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: P.bone, border: `1px solid ${P.line}` }}>
                          ✎
                        </button>
                        {confirmDel === m.id ? (
                          <button onClick={() => { saveMenu(menu.filter((x) => x.id !== m.id)); setConfirmDel(null); }}
                            className="text-xs font-extrabold px-3 py-1.5 rounded-full" style={{ background: P.red, color: "#fff" }}>
                            {L("Sure?", "Точно?")}
                          </button>
                        ) : (
                          <button onClick={() => { setConfirmDel(m.id); setTimeout(() => setConfirmDel(null), 2500); }}
                            className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#FAE5E3", color: "#933A34" }}>
                            🗑
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {tab === "stats" && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[[L("Orders today", "Заказов сегодня"), String(today.length)],
                [L("Revenue today", "Выручка сегодня"), fmt(revenue)],
                [L("Average check", "Средний чек"), fmt(avg)]].map(([label, val]) => (
                <div key={label} className="rounded-2xl p-4" style={{ background: P.card, border: `1px solid ${P.line}` }}>
                  <div className="text-xs font-bold" style={{ color: P.sub }}>{label}</div>
                  <div className="font-extrabold mt-1" style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(13px,2.5vw,18px)" }}>{val}</div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-5" style={{ background: P.card, border: `1px solid ${P.line}` }}>
              <div className="font-extrabold mb-4" style={{ fontFamily: FONT_DISPLAY, fontSize: 14 }}>{L("Top dishes (all time)", "Топ блюд (за всё время)")}</div>
              {top.length === 0 ? (
                <div className="text-sm" style={{ color: P.sub }}>{L("No completed orders yet.", "Завершённых заказов пока нет.")}</div>
              ) : top.map(([name, qty]) => (
                <div key={name} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold">{name}</span>
                    <span style={{ color: P.sub }}>× {qty}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: P.bone }}>
                    <div className="h-2 rounded-full" style={{ background: P.teal, width: `${Math.round((qty / maxTop) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
              {Object.keys(STATUS).map((s) => (
                <div key={s} className="rounded-xl p-3 text-center" style={{ background: STATUS[s].bg }}>
                  <div className="font-extrabold text-lg" style={{ color: STATUS[s].fg }}>{orders.filter((o) => o.status === s).length}</div>
                  <div className="text-xs font-bold" style={{ color: STATUS[s].fg }}>{STATUS[s][lang]}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {(adding || editing) && (
        <ItemForm lang={lang} initial={editing} onClose={() => { setAdding(false); setEditing(null); }}
          onSave={(f) => {
            if (editing) saveMenu(menu.map((x) => (x.id === f.id ? f : x)));
            else saveMenu([...menu, f]);
            setAdding(false); setEditing(null);
          }} />
      )}
    </div>
  );
}

/* ── root app ────────────────────────────────────────────────────────── */

export default function App() {
  const [lang, setLang] = useState("ru");
  const [view, setView] = useState("site");
  const [authed, setAuthed] = useState(false);
  const [menu, setMenu] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [storageOk, setStorageOk] = useState(true);

  const t = useCallback((k) => T[lang][k] || k, [lang]);

  useEffect(() => {
    (async () => {
      const m = await sGet(MENU_KEY);
      if (m && Array.isArray(m) && m.length) setMenu(m);
      else { setMenu(SEED); const ok = await sSet(MENU_KEY, SEED); setStorageOk(ok); }
      const o = await sGet(ORDERS_KEY);
      setOrders(Array.isArray(o) ? o : []);
    })();
  }, []);

  const refreshOrders = useCallback(async () => {
    const o = await sGet(ORDERS_KEY);
    if (Array.isArray(o)) setOrders(o);
  }, []);

  const saveMenu = useCallback((next) => { setMenu(next); sSet(MENU_KEY, next); }, []);

  const setQty = useCallback((id, q) => {
    setCart((p) => {
      const n = { ...p };
      if (q <= 0) delete n[id]; else n[id] = q;
      return n;
    });
  }, []);

  const placeOrder = useCallback(async (payload) => {
    const latest = (await sGet(ORDERS_KEY)) || [];
    const num = latest.reduce((mx, o) => Math.max(mx, o.num || 0), 100) + 1;
    const order = { id: "o" + Date.now() + Math.floor(Math.random() * 999), num, ts: Date.now(), status: "new", ...payload };
    const next = [order, ...latest];
    setOrders(next);
    const ok = await sSet(ORDERS_KEY, next);
    setStorageOk(ok);
    setLastOrder(order);
    setCart({});
    return order;
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    const latest = (await sGet(ORDERS_KEY)) || orders;
    const next = latest.map((o) => (o.id === id ? { ...o, status } : o));
    setOrders(next);
    sSet(ORDERS_KEY, next);
  }, [orders]);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartTotal = menu ? Object.entries(cart).reduce((s, [id, q]) => {
    const it = menu.find((m) => m.id === id); return s + (it ? it.price * q : 0);
  }, 0) : 0;

  if (!menu) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: P.bone }}>
        <div className="text-center">
          <Ornament w={56} />
          <div className="mt-3 font-extrabold" style={{ fontFamily: FONT_DISPLAY, color: P.txt }}>ASPAN</div>
          <div className="text-sm mt-1" style={{ color: P.sub }}>{lang === "en" ? "Setting the tables…" : "Накрываем столы…"}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_BODY }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;600;700&family=Manrope:wght@400;500;700;800&display=swap');
        * { box-sizing: border-box; }
        ::placeholder { color: #9aa2ad; }
        button { cursor: pointer; border: none; font-family: inherit; }
        a { color: inherit; }
      `}</style>

      {!storageOk && (
        <div className="text-center text-xs font-bold py-1.5" style={{ background: "#FBEFD9", color: "#8A5A12" }}>
          {lang === "en" ? "Storage is unavailable in this preview — data lives only in this session." : "Хранилище недоступно в этом превью — данные живут только в этой сессии."}
        </div>
      )}

      {view === "site" ? (
        <>
          <GuestSite lang={lang} setLang={setLang} t={t} menu={menu} cart={cart} setQty={setQty}
            openCart={() => setCartOpen(true)} cartCount={cartCount} cartTotal={cartTotal}
            goAdmin={() => setView("admin")} lastOrder={lastOrder} orders={orders} />
          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} menu={menu}
            lang={lang} t={t} setQty={setQty} placeOrder={placeOrder} lastOrder={lastOrder}
            orders={orders} refreshOrders={refreshOrders} resetAfterOrder={() => setLastOrder(lastOrder)} />
        </>
      ) : authed ? (
        <AdminPanel lang={lang} setLang={setLang} menu={menu} saveMenu={saveMenu} orders={orders}
          updateStatus={updateStatus} refreshOrders={refreshOrders} goSite={() => setView("site")} />
      ) : (
        <PinGate lang={lang} onOk={() => setAuthed(true)} goSite={() => setView("site")} />
      )}
    </div>
  );
}