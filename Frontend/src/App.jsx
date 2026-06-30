'use client'
import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ───────────────────────── ASPAN Coffee & Kitchen ─────────────────────────
   Guest site + Admin panel in one app.
   Shared persistent storage: menu + orders are visible to everyone
   who opens this artifact (that's what makes guest → kitchen work).
   Admin PIN: 1234
──────────────────────────────────────────────────────────────────────────── */

const MENU_KEY = "aspan-menu-v1";
const ORDERS_KEY = "aspan-orders-v1";
const IMAGES_KEY = "aspan-images-v1";
const KASPI_KEY = "aspan-kaspi-qr-v1";
const ADMIN_PIN = "1234";

const P = {
  ink: "#16202B", ink2: "#0E1620", bone: "#F7F4ED", card: "#FFFFFF",
  line: "#E6E0D2", teal: "#15A39A", tealD: "#0B7B74", saff: "#E9A13B",
  red: "#C7514A", green: "#5E8C4A", txt: "#1E232B", sub: "#6F7884",
};

const FONT_DISPLAY = "'Unbounded','Arial Black',sans-serif";
const FONT_BODY = "'Manrope',system-ui,-apple-system,sans-serif";

const CATS = [
  { id: "coffee", en: "Coffee", ru: "Кофе", kz: "Кофе", tint: "#F0E4D0" },
  { id: "drinks", en: "Tea & drinks", ru: "Чай и напитки", kz: "Шай мен сусындар", tint: "#DEF0EB" },
  { id: "breakfast", en: "Breakfast", ru: "Завтраки", kz: "Таңғы ас", tint: "#FCEFD8" },
  { id: "mains", en: "Mains", ru: "Основные блюда", kz: "Негізгі тағамдар", tint: "#E8EDDF" },
  { id: "desserts", en: "Desserts", ru: "Десерты", kz: "Десерттер", tint: "#F8E4E0" },
];

const TAGS = {
  hit: { en: "Hit", ru: "Хит", kz: "Хит", bg: "#FBEFD9", fg: "#8A5A12" },
  new: { en: "New", ru: "Новинка", kz: "Жаңа", bg: "#DFF2F0", fg: "#0B6B65" },
  veg: { en: "Veg", ru: "Вег", kz: "Вег", bg: "#E9F1DF", fg: "#3F6B2A" },
  spicy: { en: "Spicy", ru: "Острое", kz: "Ащы", bg: "#FAE5E3", fg: "#933A34" },
};

const STATUS = {
  pending: { en: "Pending confirmation", ru: "Ожидает подтверждения", kz: "Растауды күтуде", bg: "#E6E0D2", fg: "#16202B" },
  awaiting_confirmation: { en: "Awaiting payment", ru: "Ожидает оплаты", kz: "Төлемді күтуде", bg: "#FBEFD9", fg: "#8A5A12" },
  new: { en: "New", ru: "Новый", kz: "Жаңа", bg: "#E6F1FB", fg: "#185FA5" },
  cooking: { en: "In the kitchen", ru: "Готовится", kz: "Дайындалуда", bg: "#FBEFD9", fg: "#8A5A12" },
  ready: { en: "Ready", ru: "Готов", kz: "Дайын", bg: "#E9F1DF", fg: "#3F6B2A" },
  done: { en: "Completed", ru: "Завершён", kz: "Аяқталды", bg: "#EEEDEA", fg: "#6F7884" },
  cancelled: { en: "Cancelled", ru: "Отменён", kz: "Болдырылмады", bg: "#FAE5E3", fg: "#933A34" },
};

const SEED = [
  { id: "c1", cat: "coffee", emoji: "☕", price: 900, tags: [], available: true,
    name: { en: "Espresso", ru: "Эспрессо", kz: "Эспрессо" },
    desc: { en: "Double shot, medium roast from a Karaganda roastery.", ru: "Двойной шот, средняя обжарка от карагандинского обжарщика.", kz: "Қос шот, Қарағанды қуыру орнынан орташа қуырылған." } },
  { id: "c2", cat: "coffee", emoji: "☕", price: 1400, tags: [], available: true,
    name: { en: "Cappuccino", ru: "Капучино", kz: "Капучино" },
    desc: { en: "Classic 250 ml with dense milk foam.", ru: "Классика 250 мл с плотной молочной пеной.", kz: "Классикалық 250 мл, қою сүт көбігімен." } },
  { id: "c3", cat: "coffee", emoji: "🥛", price: 1500, tags: ["hit"], available: true,
    name: { en: "Flat white", ru: "Флэт уайт", kz: "Флэт уайт" },
    desc: { en: "Two shots, thin layer of velvety milk, 180 ml.", ru: "Два шота, тонкий слой бархатного молока, 180 мл.", kz: "Екі шот, барқыт сүттің жұқа қабаты, 180 мл." } },
  { id: "c4", cat: "coffee", emoji: "🍮", price: 1900, tags: ["hit"], available: true,
    name: { en: "Raf “Salted caramel”", ru: "Раф «Солёная карамель»", kz: "Раф «Тұзды карамель»" },
    desc: { en: "Cream-based raf with house caramel and sea salt.", ru: "Раф на сливках с домашней карамелью и морской солью.", kz: "Кілегейлі раф, үй карамелі мен теңіз тұзымен." } },
  { id: "c5", cat: "coffee", emoji: "🍵", price: 1800, tags: ["new"], available: true,
    name: { en: "Matcha latte", ru: "Матча латте", kz: "Матча латте" },
    desc: { en: "Ceremonial matcha, your choice of milk.", ru: "Церемониальная матча, молоко на выбор.", kz: "Салтанатты матча, сүт таңдауыңызша." } },
  { id: "d1", cat: "drinks", emoji: "🍊", price: 2200, tags: ["hit"], available: true,
    name: { en: "Sea buckthorn tea", ru: "Облепиховый чай", kz: "Шырғанақ шайы" },
    desc: { en: "Sea buckthorn, orange, honey. Teapot 600 ml.", ru: "Облепиха, апельсин, мёд. Чайник 600 мл.", kz: "Шырғанақ, апельсин, бал. Шәйнек 600 мл." } },
  { id: "d2", cat: "drinks", emoji: "🫖", price: 1900, tags: [], available: true,
    name: { en: "Tashkent tea", ru: "Ташкентский чай", kz: "Ташкент шайы" },
    desc: { en: "Green tea, lemon, mint, honey. Teapot 600 ml.", ru: "Зелёный чай, лимон, мята, мёд. Чайник 600 мл.", kz: "Жасыл шай, лимон, жалбыз, бал. Шәйнек 600 мл." } },
  { id: "d3", cat: "drinks", emoji: "🫐", price: 1200, tags: ["veg"], available: true,
    name: { en: "Berry morse", ru: "Ягодный морс", kz: "Жидек морсы" },
    desc: { en: "Cranberry and black currant, lightly sweetened.", ru: "Клюква и чёрная смородина, слегка подслащён.", kz: "Мүкжидек пен қара қарақат, аздап тәтті." } },
  { id: "d4", cat: "drinks", emoji: "🍋", price: 1500, tags: ["new"], available: true,
    name: { en: "Raspberry lemonade", ru: "Малиновый лимонад", kz: "Таңқурай лимонады" },
    desc: { en: "House lemonade with raspberry and lime, 400 ml.", ru: "Домашний лимонад с малиной и лаймом, 400 мл.", kz: "Таңқурай мен лаймнан үй лимонады, 400 мл." } },
  { id: "b1", cat: "breakfast", emoji: "🥞", price: 2400, tags: ["hit", "veg"], available: true,
    name: { en: "Syrniki with sour cream", ru: "Сырники со сметаной", kz: "Сырник қаймақпен" },
    desc: { en: "Three cottage-cheese pancakes, sour cream, berry jam.", ru: "Три сырника, сметана, ягодный джем.", kz: "Үш сырник, қаймақ, жидек джемі." } },
  { id: "b2", cat: "breakfast", emoji: "🍳", price: 2600, tags: [], available: true,
    name: { en: "Omelet with suluguni", ru: "Омлет с сулугуни", kz: "Сулугунимен омлет" },
    desc: { en: "Fluffy three-egg omelet, suluguni, cherry tomatoes, toast.", ru: "Пышный омлет из трёх яиц, сулугуни, черри, тост.", kz: "Үш жұмыртқадан көпсіген омлет, сулугуни, черри, тост." } },
  { id: "b3", cat: "breakfast", emoji: "🥣", price: 2300, tags: ["veg", "new"], available: true,
    name: { en: "Granola bowl", ru: "Гранола боул", kz: "Гранола боул" },
    desc: { en: "House granola, Greek yogurt, seasonal fruit, honey.", ru: "Домашняя гранола, греческий йогурт, сезонные фрукты, мёд.", kz: "Үй граноласы, грек йогурты, маусымдық жемістер, бал." } },
  { id: "m1", cat: "mains", emoji: "🥟", price: 2800, tags: ["hit"], available: true,
    name: { en: "Manty with beef (5 pcs)", ru: "Манты с говядиной (5 шт)", kz: "Сиыр етті манты (5 дана)" },
    desc: { en: "Hand-made, steamed, served with sour cream and tomato sauce.", ru: "Ручная лепка, на пару, со сметаной и томатным соусом.", kz: "Қолдан жасалған, буда пісірілген, қаймақ пен томат соусымен." } },
  { id: "m2", cat: "mains", emoji: "🍲", price: 3900, tags: [], available: true,
    name: { en: "Kuyrdak in a pan", ru: "Куырдак на сковороде", kz: "Қуырдақ табада" },
    desc: { en: "Beef, potatoes and onion fried the traditional way.", ru: "Говядина, картофель и лук, обжаренные по-традиционному.", kz: "Сиыр еті, картоп пен пияз, дәстүрлі түрде қуырылған." } },
  { id: "m3", cat: "mains", emoji: "🥗", price: 3200, tags: [], available: true,
    name: { en: "Caesar with chicken", ru: "Цезарь с курицей", kz: "Тауық етімен Цезарь" },
    desc: { en: "Romaine, grilled chicken, parmesan, house dressing.", ru: "Романо, курица гриль, пармезан, фирменный соус.", kz: "Романо, грильде тауық, пармезан, фирмалық соус." } },
  { id: "m4", cat: "mains", emoji: "🍝", price: 3400, tags: ["veg"], available: true,
    name: { en: "Fettuccine with mushrooms", ru: "Феттучини с грибами", kz: "Саңырауқұлақпен феттучини" },
    desc: { en: "Cream sauce, champignons and porcini, parmesan.", ru: "Сливочный соус, шампиньоны и белые грибы, пармезан.", kz: "Кілегейлі соус, шампиньон мен ақ саңырауқұлақ, пармезан." } },
  { id: "s1", cat: "desserts", emoji: "🍯", price: 1900, tags: ["hit"], available: true,
    name: { en: "Medovik", ru: "Медовик", kz: "Медовик" },
    desc: { en: "Honey layers with smetana cream, made in-house.", ru: "Медовые коржи со сметанным кремом, собственное производство.", kz: "Бал коржтары қаймақ кремімен, өз өндірісіміз." } },
  { id: "s2", cat: "desserts", emoji: "🍰", price: 2200, tags: ["new"], available: true,
    name: { en: "Kurt cheesecake", ru: "Чизкейк с куртом", kz: "Құртты чизкейк" },
    desc: { en: "New York base with a salty kurt accent. Our signature.", ru: "База Нью-Йорк с солоноватым акцентом курта. Наша фишка.", kz: "Нью-Йорк негізі, тұздау құрт екпінімен. Біздің ерекшелігіміз." } },
  { id: "s3", cat: "desserts", emoji: "🥐", price: 1400, tags: ["veg"], available: true,
    name: { en: "Baursaks with condensed milk", ru: "Баурсаки со сгущёнкой", kz: "Бауырсақ қоюланған сүтпен" },
    desc: { en: "Eight warm baursaks, condensed milk on the side.", ru: "Восемь тёплых баурсаков, сгущёнка отдельно.", kz: "Сегіз жылы бауырсақ, қоюланған сүт бөлек." } },
  { id: "s4", cat: "desserts", emoji: "🎂", price: 1800, tags: [], available: true,
    name: { en: "Napoleon", ru: "Наполеон", kz: "Наполеон" },
    desc: { en: "Forty thin layers, custard cream, a day of rest.", ru: "Сорок тонких коржей, заварной крем, сутки пропитки.", kz: "Қырық жұқа корж, кремді крем, тәулік сіңіру." } },
];

const ROOMS = [
  { id: "r1", name: { en: "Steppe Hall", ru: "Зал «Дала»", kz: "«Дала» залы" }, capacity: 10, emoji: "🪟" },
  { id: "r2", name: { en: "Family Room", ru: "Семейная комната", kz: "Отбасылық бөлме" }, capacity: 6, emoji: "🛋️" },
  { id: "r3", name: { en: "Banquet Hall", ru: "Банкетный зал", kz: "Банкет залы" }, capacity: 20, emoji: "🎉" },
  { id: "r4", name: { en: "VIP Cabinet", ru: "VIP-кабинет", kz: "VIP-кабинет" }, capacity: 8, emoji: "👑" },
];

const TIME_SLOTS = ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

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
    delivery: "Delivery", atTableShort: "To table",
    gpsOptional: "I'm here now — attach GPS (optional)", locating: "Locating…",
    gpsBtn: "My location", open2gis: "Open 2GIS",
    gisHint: "Find your spot in 2GIS, then type the address above — or paste a 2GIS share link below.",
    gisLinkLabel: "2GIS location link (optional)",
    gpsAttached: "Precise location attached", courierCall: "The courier will call this number before arrival.",
    addrText: "Delivery address", addrPh: "Street, building, apartment, entrance, floor — e.g. Turan 37, apt 12, entrance 2, floor 4",
    needLoc: "Please type your delivery address so the courier can find you.",
    placedDelivery: "The courier is on the way. We will call before arrival.",
    openMap: "Open in 2GIS", openMapG: "Google",
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
    payBtn: "Pay", payTitle: "Payment via Kaspi", payAmount: "Order total",
    kaspiScan: "Scan this QR in the Kaspi app", kaspiNoQr: "The cafe's Kaspi QR will appear here",
    kaspiStep1: "Open Kaspi → Payments → Scan QR", kaspiStep2: "Transfer the exact order total",
    kaspiStep3: "Then tap “I paid” below", iPaid: "I paid", kaspiNote: "Pay directly to the cafe via Kaspi",
    cancelPay: "Cancel", awaitingNote: "Waiting for the cafe to confirm your Kaspi payment. The kitchen starts once confirmed.",
    book: "Book a room", bookRoom: "Reserve a private room", rooms: "Rooms", upTo: "Up to",
    people: "guests", pickRoom: "Choose a room", whenVisit: "When are you coming?",
    date: "Date", time: "Time", guests: "Guests", next: "Next", chooseTime: "Pick a time slot",
    yourPhone: "Your phone", phoneNote: "We'll call to confirm the details of your reservation.",
    needPhone: "Please enter a valid phone number.",
    preOrderTitle: "Pre-order food in advance?",
    preOrderNote: "Dishes like plov and quyrdaq take 2–3 hours to cook. Order ahead so nothing keeps you waiting when you arrive!",
    goToMenu: "Choose dishes", skipFood: "Just book the room",
    bookingFor: "Reservation", roomOnly: "Room only — no food pre-ordered",
    booked: "Booked", tooSmall: "Too small", checking: "checking…",
    bookingPay: "To confirm the reservation, pay a deposit / the pre-order total via Kaspi.",
    confirmBooking: "Confirm reservation",
    bookNoPay: "Book now (Pay at cafe)",
    placeOrderFinal: "Place order (Pay at cafe)",
    addrConfirmNote: "Please double-check your address above. If anything looks wrong, edit it before sending.",
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
    delivery: "Доставка", atTableShort: "За столик",
    gpsOptional: "Я сейчас здесь — прикрепить GPS (необязательно)", locating: "Определяем…",
    gpsBtn: "Моя геолокация", open2gis: "Открыть 2ГИС",
    gisHint: "Найдите место в 2ГИС и впишите адрес выше — или вставьте ссылку из 2ГИС ниже.",
    gisLinkLabel: "Ссылка из 2ГИС (необязательно)",
    gpsAttached: "Точная геолокация прикреплена", courierCall: "Курьер позвонит по этому номеру перед прибытием.",
    addrText: "Адрес доставки", addrPh: "Улица, дом, квартира, подъезд, этаж — напр.: Туран 37, кв. 12, подъезд 2, этаж 4",
    needLoc: "Укажите адрес доставки, чтобы курьер вас нашёл.",
    placedDelivery: "Курьер уже в пути. Позвоним перед прибытием.",
    openMap: "Открыть в 2ГИС", openMapG: "Google",
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
    payBtn: "Оплатить", payTitle: "Оплата через Kaspi", payAmount: "Сумма заказа",
    kaspiScan: "Отсканируйте QR в приложении Kaspi", kaspiNoQr: "Здесь появится Kaspi QR кафе",
    kaspiStep1: "Откройте Kaspi → Платежи → Сканировать QR", kaspiStep2: "Переведите точную сумму заказа",
    kaspiStep3: "Затем нажмите «Я оплатил» ниже", iPaid: "Я оплатил", kaspiNote: "Оплата напрямую кафе через Kaspi",
    cancelPay: "Отмена", awaitingNote: "Ждём, пока кафе подтвердит вашу оплату в Kaspi. Готовка начнётся после подтверждения.",
    book: "Бронь зала", bookRoom: "Забронировать отдельный зал", rooms: "Залы", upTo: "До",
    people: "человек", pickRoom: "Выберите зал", whenVisit: "Когда придёте?",
    date: "Дата", time: "Время", guests: "Гостей", next: "Далее", chooseTime: "Выберите время",
    yourPhone: "Ваш телефон", phoneNote: "Мы позвоним, чтобы уточнить детали брони.",
    needPhone: "Введите корректный номер телефона.",
    preOrderTitle: "Желаете заказать еду заранее?",
    preOrderNote: "Такие блюда, как плов и куырдак, готовятся 2–3 часа. Закажите заранее, чтобы не ждать по приезде!",
    goToMenu: "Выбрать блюда", skipFood: "Пропустить и только забронировать",
    bookingFor: "Бронь", roomOnly: "Только зал — еда не заказана заранее",
    booked: "Занято", tooSmall: "Мало мест", checking: "проверяем…",
    bookingPay: "Чтобы подтвердить бронь, оплатите депозит / сумму предзаказа через Kaspi.",
    confirmBooking: "Подтвердить бронь",
    bookNoPay: "Забронировать (Оплата в кафе)",
    placeOrderFinal: "Отправить заказ (Оплата в кафе)",
    addrConfirmNote: "Пожалуйста, ещё раз проверьте адрес выше. Если что-то неверно — исправьте перед отправкой.",
  },
  kz: {
    menu: "Мәзір", about: "Біз туралы", contacts: "Байланыс", cart: "Себет",
    tagline: "Дала тыныштығы. Қала ырғағы.",
    heroText: "Спешелти кофе, күні бойы таңғы астар және өз тамырын ұмытпайтын ас үй. Хан Шатырдан екі минут.",
    seeMenu: "Мәзірді ашу", today: "Бүгін ашық", until: "дейін",
    search: "Мәзірден іздеу…", all: "Барлығы", soldOut: "Аяқталды", add: "Қосу",
    cartEmpty: "Себет бос", cartEmptyHint: "Мәзірден бірдеңе қосыңыз — ол осында пайда болады.",
    total: "Жиыны", checkout: "Тапсырыс беру", back: "Артқа",
    orderType: "Қайда береміз?", atTable: "Үстеліме", pickup: "Өзіммен",
    delivery: "Жеткізу", atTableShort: "Үстелге",
    gpsOptional: "Мен қазір осындамын — GPS қосу (міндетті емес)", locating: "Анықтап жатырмыз…",
    gpsBtn: "Геолокациям", open2gis: "2ГИС ашу",
    gisHint: "2ГИС-тен орныңызды тауып, мекенжайды жоғарыда жазыңыз — немесе төменге 2ГИС сілтемесін қойыңыз.",
    gisLinkLabel: "2ГИС сілтемесі (міндетті емес)",
    gpsAttached: "Нақты геолокация тіркелді", courierCall: "Курьер келер алдында осы нөмірге қоңырау шалады.",
    addrText: "Жеткізу мекенжайы", addrPh: "Көше, үй, пәтер, кіреберіс, қабат — мыс.: Тұран 37, пәтер 12, кіреберіс 2, қабат 4",
    needLoc: "Курьер таба алуы үшін жеткізу мекенжайын жазыңыз.",
    placedDelivery: "Курьер жолда. Келер алдында қоңырау шаламыз.",
    openMap: "2ГИС-те ашу", openMapG: "Google",
    tableNo: "Үстел нөмірі", yourName: "Атыңыз", phone: "Телефон",
    comment: "Түсініктеме (міндетті емес)", commentPh: "Аллергия, қантсыз, ыстығырақ…",
    placeOrder: "Тапсырысты жіберу", needTable: "Үстел нөмірін көрсетіңіз (ол QR тұғырында).",
    needContacts: "Дайын болғанда қоңырау шалуымыз үшін атыңыз бен телефоныңызды көрсетіңіз.",
    placed: "Тапсырыс қабылданды!", placedTable: "Дайындап жатырмыз — үстелге әкелеміз",
    placedPickup: "Алуға дайын болғанда қоңырау шаламыз.",
    orderNo: "Тапсырыс", statusNow: "Ағымдағы күй", refresh: "Жаңарту",
    newOrder: "Жаңа тапсырыс", aboutTitle: "Дала туралы қалалық кафе",
    aboutText: "Аспан — «көк аспан» дегенді білдіреді. Біз 2024 жылы қарапайым оймен ашылдық: спешелти кофе мәдениеті және өзіміз өскен тағамдар. Дәнді бізге Қарағандыда қуырады, бауырсақты әр таңда пісіреміз, ал құртты чизкейк үшін бүкіл қаланы аралап келеді.",
    addressT: "Мекенжай", hoursT: "Жұмыс уақыты", phoneT: "Телефон",
    address: "Тұран даңғ. 37, Астана (Хан Шатыр ауданы)", hours: "Дс–Жс · 08:00–23:00",
    staff: "Қызметкерлерге", madeNote: "Демо кафе сайты · мәзір мен тапсырыстар — ортақ демо деректер",
    activeOrder: "Сіздің тапсырысыңыз", items: "поз.",
    footAbout: "Астана орталығындағы кофе, ас үй және десерттер. Күні бойы таңғы ас, түскі ас, өзіңмен алып кету.",
    payBtn: "Төлеу", payTitle: "Kaspi арқылы төлем", payAmount: "Тапсырыс сомасы",
    kaspiScan: "Kaspi қолданбасында осы QR-ды сканерлеңіз", kaspiNoQr: "Мұнда кафенің Kaspi QR-ы шығады",
    kaspiStep1: "Kaspi → Төлемдер → QR сканерлеу", kaspiStep2: "Тапсырыстың нақты сомасын аударыңыз",
    kaspiStep3: "Содан кейін төменнен «Төледім» басыңыз", iPaid: "Төледім", kaspiNote: "Kaspi арқылы тікелей кафеге төлем",
    cancelPay: "Болдырмау", awaitingNote: "Кафе Kaspi төлеміңізді растағанша күтудеміз. Растағаннан кейін дайындау басталады.",
    book: "Зал брондау", bookRoom: "Жеке зал брондау", rooms: "Залдар", upTo: "Дейін",
    people: "адам", pickRoom: "Зал таңдаңыз", whenVisit: "Қашан келесіз?",
    date: "Күні", time: "Уақыты", guests: "Қонақтар", next: "Әрі қарай", chooseTime: "Уақытты таңдаңыз",
    yourPhone: "Телефоныңыз", phoneNote: "Бронь мәліметтерін нақтылау үшін қоңырау шаламыз.",
    needPhone: "Дұрыс телефон нөмірін енгізіңіз.",
    preOrderTitle: "Тағамды алдын ала тапсырасыз ба?",
    preOrderNote: "Палау мен қуырдақ сияқты тағамдар 2–3 сағат дайындалады. Келгенде күтпеу үшін алдын ала тапсырыс беріңіз!",
    goToMenu: "Тағам таңдау", skipFood: "Тек залды брондау",
    bookingFor: "Бронь", roomOnly: "Тек зал — тағам алдын ала тапсырылмаған",
    booked: "Бос емес", tooSmall: "Орын аз", checking: "тексерудеміз…",
    bookingPay: "Бронды растау үшін Kaspi арқылы депозит / алдын ала тапсырыс сомасын төлеңіз.",
    confirmBooking: "Бронды растау",
    bookNoPay: "Брондау (Кафеде төлеу)",
    placeOrderFinal: "Тапсырысты жіберу (Кафеде төлеу)",
    addrConfirmNote: "Жоғарыдағы мекенжайды тағы тексеріңіз. Қате болса — жіберу алдында түзетіңіз.",
  },
};

const API = "https://aspan-cafe-backend.onrender.com";;

const fmt = (n) => n.toLocaleString("ru-RU") + " ₸";
const timeOf = (ts) => new Date(ts).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
const dateOf = (ts) => new Date(ts).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
const isToday = (ts) => new Date(ts).toDateString() === new Date().toDateString();

// language cycle: Russian → Kazakh → English → Russian …
const LANGS = ["ru", "kz", "en"];
const nextLang = (l) => LANGS[(LANGS.indexOf(l) + 1) % LANGS.length] || "ru";
const langCode = (l) => ({ ru: "РУС", kz: "ҚАЗ", en: "ENG" }[l] || "РУС");
// pick a localized string from {en,ru,kz}; Kazakh falls back to Russian, then English
const pickL = (obj, lang) => (obj && (obj[lang] || obj.ru || obj.en)) || "";
// inline 3-language helper for one-off labels
const L3 = (lang, en, ru, kz) => (lang === "en" ? en : lang === "kz" ? (kz || ru) : ru);

async function apiGetMenu() {
  try { const r = await fetch(`${API}/api/menu`); return await r.json(); }
  catch (e) { return null; }
}
async function apiSaveMenu(items) {
  try { await fetch(`${API}/api/menu`, { method: "POST", headers: authHeaders(), body: JSON.stringify(items) }); return true; }
  catch (e) { return false; }
}
async function apiGetOrders() {
  try { const r = await fetch(`${API}/api/orders`); return await r.json(); }
  catch (e) { return []; }
}
async function apiPlaceOrder(order) {
  try { await fetch(`${API}/api/orders`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) }); return true; }
  catch (e) { return false; }
}
async function apiUpdateStatus(id, status) {
  try { await fetch(`${API}/api/orders/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ status }) }); return true; }
  catch (e) { return false; }
}
async function apiConfirmPayment(id) {
  try { const r = await fetch(`${API}/api/orders/${id}/confirm-payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); return await r.json(); }
  catch (e) { return null; }
}
async function apiGetLedger() {
  try { const r = await fetch(`${API}/api/ledger`); return await r.json(); }
  catch (e) { return null; }
}
async function apiSettleLedger(note) {
  try { const r = await fetch(`${API}/api/ledger/settle`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) }); return await r.json(); }
  catch (e) { return null; }
}
async function apiCheckAvailability(date, time) {
  try { const r = await fetch(`${API}/api/bookings/availability?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`); const d = await r.json(); return d.booked_room_ids || []; }
  catch (e) { return []; }
}

async function apiLogin(username, password) {
  try {
    const r = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    localStorage.setItem("aspan-token", data.token);
    return data.token;
  } catch (e) { return null; }
}

function authHeaders() {
  const t = localStorage.getItem("aspan-token");
  return t
    ? { "Authorization": `Bearer ${t}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}
async function apiGetCafeStatus() {
  try { const r = await fetch(`${API}/api/settings/cafe`); return await r.json(); }
  catch (e) { return { isOpen: true }; }
}

async function apiUpdateCafeStatus(data) {
  try { await fetch(`${API}/api/settings/cafe`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) }); return true; }
  catch (e) { return false; }
}

async function apiEditOrderItems(id, items, newTotal) {
  try { const r = await fetch(`${API}/api/orders/${id}/items`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ items, newTotal }) }); return await r.json(); }
  catch (e) { return null; }
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

function DishCard({ item, lang, qty, onPlus, onMinus, t, image }) {
  const cat = CATS.find((c) => c.id === item.cat);
  const off = !item.available;
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: P.card, border: `1px solid ${P.line}`, opacity: off ? 0.55 : 1 }}>
      <div className="relative flex items-center justify-center" style={{ background: cat?.tint || P.bone, height: 160, overflow: "hidden" }}>
        {image ? (
          <img src={image} alt={pickL(item.name, lang)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: off ? "grayscale(1)" : "none" }} />
        ) : (
          <span style={{ fontSize: 52, filter: off ? "grayscale(1)" : "none" }} aria-hidden="true">{item.emoji}</span>
        )}
        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
          {(item.tags || []).map((tg) => TAGS[tg] && <Pill key={tg} bg={TAGS[tg].bg} fg={TAGS[tg].fg}>{TAGS[tg][lang]}</Pill>)}
        </div>
        {off && <div className="absolute bottom-2 right-2"><Pill bg="#2b2b2b" fg="#fff">{t("soldOut")}</Pill></div>}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <div className="font-extrabold leading-snug" style={{ color: P.txt }}>{pickL(item.name, lang)}</div>
        <div className="text-xs mt-1 flex-1" style={{ color: P.sub }}>{pickL(item.desc, lang)}</div>
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

/* ── delivery: geocoding + map link helpers (free, no API key) ───────── */

// Reverse geocoding (coordinates → readable address) via OpenStreetMap Nominatim.
// Best-effort: used only to pre-fill the address when GPS succeeds on a phone.
async function reverseGeocode(lat, lng, lang) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${lang}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const d = await r.json();
    return d && d.display_name ? d.display_name : "";
  } catch (e) { return ""; }
}

// Deep links so the courier/admin can open the exact point in their map app.
function mapLinks(lat, lng) {
  return {
    gis: `https://2gis.kz/geo/${lng},${lat}`,
    google: `https://maps.google.com/?q=${lat},${lng}`,
  };
}

/* ── guest: cart drawer (cart → checkout → confirmation) ─────────────── */

function CartDrawer({ open, onClose, cart, menu, lang, t, setQty, placeOrder, lastOrder, orders, refreshOrders, resetAfterOrder, booking, clearBooking }) {
  const [step, setStep] = useState("cart");
  const [type, setType] = useState("table");
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = React.useRef(null);
  const [table, setTable] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [sending, setSending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [location, setLocation] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locErr, setLocErr] = useState("");
  const [address, setAddress] = useState("");

  const getLocation = () => {
    setLocErr("");
    setLocLoading(true);
    if (!navigator.geolocation) {
      setLocErr(lang === "en" ? "Geolocation not supported by your browser." : "Геолокация не поддерживается вашим браузером.");
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setLocLoading(false);
        const addr = await reverseGeocode(latitude, longitude, lang);
        if (addr) setAddress(addr);
      },
      () => {
        setLocErr(lang === "en"
          ? "Couldn't detect location automatically — no problem, just type your address below."
          : "Не удалось определить автоматически — ничего страшного, просто впишите адрес ниже.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const entries = Object.entries(cart).map(([id, q]) => ({ item: menu.find((m) => m.id === id), q })).filter((e) => e.item);
  const total = entries.reduce((s, e) => s + e.item.price * e.q, 0);
  const live = lastOrder ? orders.find((o) => o.id === lastOrder.id) || lastOrder : null;

  useEffect(() => {
  window.onTurnstileVerified = (token) => setCaptchaToken(token);
  }, []);
  useEffect(() => { if (open && lastOrder && step === "done") { const tm = setInterval(refreshOrders, 10000); return () => clearInterval(tm); } }, [open, step, lastOrder, refreshOrders]);
  useEffect(() => {
    if (open && step !== "done") setStep(booking ? "checkout" : (entries.length ? step : "cart"));
  }, [open]);

  // Every order — booking or regular — is placed as a normal order, paid at the cafe.
  // No payment gateway, no awaiting_confirmation step. Kitchen sees it immediately.
  const submitOrder = async () => {
    setErr("");
    if (!captchaToken) {
      setErr(lang === "en" ? "Please complete the security check." : "Пройдите проверку безопасности.");
      return;
    }

    if (!booking) {
      if (type === "table" && !table.trim()) return setErr(t("needTable"));
      if (type === "pickup" && (!name.trim() || !phone.trim())) return setErr(t("needContacts"));
      if (type === "delivery") {
        if (!name.trim() || !phone.trim()) return setErr(t("needContacts"));
        if (!address.trim()) return setErr(t("needLoc"));
      }
    }
    setSending(true);
    const links = location ? mapLinks(location.lat, location.lng) : null;

    if (booking) {
      await placeOrder({
        type: "booking",
        phone: booking.phone,
        comment: comment.trim(),
        booking: booking,
        items: entries.map((e) => ({ id: e.item.id, name: e.item.name, price: e.item.price, qty: e.q })),
        total,
        status: "new",
        paymentMethod: "at_table",
        captcha: captchaToken,
      });
      if (clearBooking) clearBooking();
    } else {
      await placeOrder({
        type, table: table.trim(), name: name.trim(), phone: phone.trim(), comment: comment.trim(),
        address: address.trim(),
        lat: location ? location.lat : null,
        lng: location ? location.lng : null,
        mapLink: links ? links.gis : null,
        mapLinkGoogle: links ? links.google : null,
        items: entries.map((e) => ({ id: e.item.id, name: e.item.name, price: e.item.price, qty: e.q })),
        total,
        status: "new",
        paymentMethod: "at_table",
        captcha: captchaToken,
      });
    }
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
                    <div className="font-bold text-sm truncate" style={{ color: P.txt }}>{pickL(item.name, lang)}</div>
                    <div className="text-xs" style={{ color: P.sub }}>{fmt(item.price)}</div>
                  </div>
                  <QtyControl qty={q} onMinus={() => setQty(item.id, q - 1)} onPlus={() => setQty(item.id, q + 1)} />
                </div>
              ))}
            </div>
          ))}

          {step === "checkout" && (
            <div className="flex flex-col gap-4">
              {booking && (
                <div className="rounded-2xl p-4" style={{ background: "#FBEFD9", border: `1px solid ${P.saff}` }}>
                  <div className="font-extrabold mb-1" style={{ color: "#8A5A12" }}>🚪 {t("bookingFor")}</div>
                  <div className="font-bold" style={{ color: P.txt }}>{pickL(booking.roomName, lang)} · 👥 {t("upTo")} {booking.capacity}</div>
                  <div className="text-sm mt-1" style={{ color: P.sub }}>📅 {booking.date} · 🕒 {booking.time}{booking.guests ? ` · 👥 ${booking.guests}` : ""}</div>
                  <div className="text-sm" style={{ color: P.sub }}>📞 {booking.phone}</div>
                  <div className="text-xs mt-2" style={{ color: "#8A5A12" }}>{entries.length === 0 ? t("roomOnly") : ""}</div>
                </div>
              )}
              {!booking && (
              <div>
                <div className="text-sm font-bold mb-2" style={{ color: P.txt }}>{t("orderType")}</div>
                <div className="grid grid-cols-3 gap-2">
                  {[["table", "🍽", t("atTableShort")], ["pickup", "🥡", t("pickup")], ["delivery", "🚗", t("delivery")]].map(([v, icon, label]) => (
                    <button key={v} onClick={() => setType(v)} className="rounded-xl py-3 px-1 font-bold text-xs flex flex-col items-center gap-1"
                      style={{ background: type === v ? P.ink : P.card, color: type === v ? "#fff" : P.txt, border: `1px solid ${type === v ? P.ink : P.line}` }}>
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              )}
              {!booking && type === "table" && (
                <Field label={t("tableNo")} value={table} onChange={setTable} ph="12" />
              )}
              {!booking && (type === "pickup" || type === "delivery") && (
                <>
                  <Field label={t("yourName")} value={name} onChange={setName} ph="Aza" />
                  <label className="block">
                    <div className="text-sm font-bold mb-1.5" style={{ color: P.txt }}>{t("phone")}</div>
                    <PhoneInput value={phone} onChange={setPhone} lang={lang} />
                  </label>
                </>
              )}
              {!booking && type === "delivery" && (
                <div className="flex flex-col gap-2">
                  <Field label={t("addrText")} value={address} onChange={setAddress} ph={t("addrPh")} area />

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={getLocation} disabled={locLoading}
                      className="py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      style={{ background: P.card, color: P.tealD, border: `1px solid ${P.teal}`, opacity: locLoading ? 0.6 : 1 }}>
                      📍 {locLoading ? t("locating") : t("gpsBtn")}
                    </button>
                    <a href={location ? `https://2gis.kz/geo/${location.lng},${location.lat}` : "https://2gis.kz/astana"}
                      target="_blank" rel="noreferrer"
                      className="no-underline py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                      style={{ background: "#1BA05A", color: "#fff" }}>
                      🗺 {t("open2gis")}
                    </a>
                  </div>

                  {location && (
                    <div className="text-xs font-bold rounded-lg px-3 py-2 flex items-center justify-between gap-2" style={{ background: "#E9F1DF", color: "#3F6B2A" }}>
                      <span>✓ {t("gpsAttached")} · {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                      <button type="button" onClick={() => setLocation(null)} aria-label="remove" style={{ color: "#933A34", fontWeight: 800 }}>✕</button>
                    </div>
                  )}
                  {locErr && <div className="text-xs rounded-lg px-3 py-2" style={{ background: "#FBEFD9", color: "#8A5A12" }}>{locErr}</div>}
                  <div className="text-xs rounded-lg px-3 py-2" style={{ background: "#FBEFD9", color: "#8A5A12" }}>
                    ⚠️ {t("addrConfirmNote")}
                  </div>
                  <div className="text-xs" style={{ color: P.sub }}>📞 {t("courierCall")}</div>
                </div>
              )}
              <Field label={t("comment")} value={comment} onChange={setComment} ph={t("commentPh")} area />
              {/* Turnstile invisible widget */}
              <div
              className="cf-turnstile"
              data-sitekey="YOUR_SITE_KEY_FROM_CLOUDFLARE"
              data-callback="onTurnstileSuccess"
              data-theme="light"
              />
              <div
               ref={turnstileRef}
               className="cf-turnstile"
               data-sitekey="YOUR_SITE_KEY_FROM_CLOUDFLARE"
               data-callback="onTurnstileVerified"
               data-theme="light"
               />
              {err && <div className="text-sm font-bold rounded-lg px-3 py-2" style={{ background: "#FAE5E3", color: "#933A34" }}>{err}</div>}
              <div className="rounded-xl p-3 text-sm" style={{ background: P.card, border: `1px solid ${P.line}` }}>
                {entries.map(({ item, q }) => (
                  <div key={item.id} className="flex justify-between py-0.5">
                    <span style={{ color: P.sub }}>{pickL(item.name, lang)} × {q}</span>
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
                {live.type === "booking" ? `🚪 ${live.booking ? pickL(live.booking.roomName, lang) : ""} · ${live.booking ? live.booking.date : ""} ${live.booking ? live.booking.time : ""}`
                  : live.type === "table" ? `${t("placedTable")} №${live.table}.`
                  : live.type === "delivery" ? t("placedDelivery")
                  : t("placedPickup")}
              </div>
              {live.type === "delivery" && live.address && (
                <div className="text-xs mt-2 rounded-lg px-3 py-2 inline-block" style={{ background: P.bone, color: P.txt }}>
                  📍 {live.address}
                </div>
              )}
              <div className="mt-5 rounded-xl p-4 inline-flex flex-col items-center gap-2" style={{ background: P.card, border: `1px solid ${P.line}` }}>
                <div className="text-xs font-bold uppercase tracking-wide" style={{ color: P.sub }}>{t("statusNow")}</div>
                <StatusPill s={live.status} lang={lang} />
                <button onClick={refreshOrders} className="text-xs font-bold mt-1 px-3 py-1.5 rounded-full" style={{ background: P.bone, border: `1px solid ${P.line}`, color: P.txt }}>
                  ↻ {t("refresh")}
                </button>
              </div>
              <div className="mt-6">
                <button onClick={() => { resetAfterOrder(); setStep("cart"); setTable(""); setComment(""); setAddress(""); setLocation(null); setLocErr(""); }}
                  className="font-bold text-sm px-4 py-2 rounded-full" style={{ background: P.ink, color: "#fff" }}>
                  {t("newOrder")}
                </button>
              </div>
            </div>
          )}
        </div>

        {step !== "done" && (entries.length > 0 || (booking && step === "checkout")) && (
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${P.line}`, background: P.card }}>
            {total > 0 && (
              <div className="flex justify-between font-extrabold mb-3" style={{ color: P.txt }}>
                <span>{t("total")}</span><span>{fmt(total)}</span>
              </div>
            )}
            {step === "cart" ? (
              <button onClick={() => setStep("checkout")} className="w-full py-3 rounded-xl font-extrabold" style={{ background: P.teal, color: "#fff" }}>
                {t("checkout")} →
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                {(!booking || entries.length > 0) && (
                  <button onClick={() => setStep("cart")} className="w-full py-2.5 rounded-xl font-bold" style={{ background: P.bone, border: `1px solid ${P.line}`, color: P.txt }}>
                    ← {t("back")}
                  </button>
                )}
                <button disabled={sending} onClick={submitOrder}
                  className="w-full py-3 rounded-xl font-extrabold flex items-center justify-center gap-2"
                  style={{ background: P.teal, color: "#fff", opacity: sending ? 0.6 : 1 }}>
                  {sending ? "…" : <><span>📋</span><span>{booking ? t("bookNoPay") : t("placeOrderFinal")}</span></>}
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

// Phone field with a fixed "+7 (" prefix shown outside the editable area,
// so the customer only ever types the digits inside the brackets onward.
function PhoneInput({ value, onChange, lang }) {
  // value is stored WITHOUT the leading "+7", e.g. "(701) 234-56-78"
  return (
    <div style={{ position: "relative" }}>
      <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${P.line}`, background: P.card }}>
        <span className="font-bold text-lg pl-4 pr-1 select-none" style={{ color: P.sub }}>+7</span>
        <input
          value={value}
          onChange={(e) => onChange(formatKzPhoneBody(e.target.value))}
          inputMode="tel"
          placeholder="(___) ___-__-__"
          className="flex-1 py-3 pr-10 text-lg font-bold tracking-wide outline-none"
          style={{ color: P.txt, background: "transparent", border: "none" }}
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", color: P.sub, fontWeight: 800,
            fontSize: 20, cursor: "pointer", lineHeight: 1
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Formats just the part AFTER "+7": "(7xx) xxx-xx-xx".
// Accepts raw digit input (typing one digit at a time, or pasting a full number) and re-formats every time.
function formatKzPhoneBody(input) {
  let d = input.replace(/\D/g, "");
  // Only strip a leading country-code digit when a FULL number was pasted at once
  // (11 digits starting with 7 or 8) — never when the person is just typing normally,
  // so typing "7" as the first digit inside the brackets works correctly.
  if (d.length === 11 && (d.startsWith("7") || d.startsWith("8"))) d = d.slice(1);
  d = d.slice(0, 10); // 10 digits after +7: xxx xxx xx xx
  let out = "";
  if (d.length > 0) out += "(" + d.slice(0, 3);
  if (d.length >= 3) out += ")";
  if (d.length > 3) out += " " + d.slice(3, 6);
  if (d.length > 6) out += "-" + d.slice(6, 8);
  if (d.length > 8) out += "-" + d.slice(8, 10);
  return out;
}
// Full E.164-ish number for storage/display: "+7" + body digits
const phoneFull = (body) => "+7" + body.replace(/\D/g, "");
const phoneBodyComplete = (body) => body.replace(/\D/g, "").length === 10;

/* ── room booking wizard ─────────────────────────────────────────────── */

function BookingWizard({ open, onClose, lang, t, onProceed }) {
  const STEPS = ["schedule", "rooms", "phone", "bridge"];
  const [bStep, setBStep] = useState("schedule"); // schedule | rooms | phone | bridge
  const [room, setRoom] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("");
  const [phoneBody, setPhoneBody] = useState(""); // digits after +7
  const [err, setErr] = useState("");
  const [bookedIds, setBookedIds] = useState([]);
  const [availLoading, setAvailLoading] = useState(false);

  useEffect(() => { if (open) { setBStep("schedule"); setRoom(null); setDate(""); setTime(""); setGuests(""); setPhoneBody(""); setErr(""); setBookedIds([]); } }, [open]);

  // fetch which rooms are taken for the chosen slot, whenever we land on the rooms step
  useEffect(() => {
    if (open && bStep === "rooms" && date && time) {
      setAvailLoading(true);
      apiCheckAvailability(date, time).then((ids) => { setBookedIds(ids); setAvailLoading(false); });
    }
  }, [open, bStep, date, time]);

  if (!open) return null;
  const today = new Date().toISOString().split("T")[0];

  const isUnavailable = (r) => bookedIds.includes(r.id) || (guests && Number(guests) > r.capacity);
  const booking = () => ({
    roomId: room.id, roomName: room.name, capacity: room.capacity,
    date, time, guests: guests || null, phone: phoneFull(phoneBody),
  });

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label={t("bookRoom")}>
      <div className="absolute inset-0" style={{ background: "rgba(14,22,32,.55)" }} onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] flex flex-col" style={{ background: P.bone }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${P.line}` }}>
          <div className="font-extrabold text-lg" style={{ fontFamily: FONT_DISPLAY, color: P.txt }}>🚪 {t("bookRoom")}</div>
          <button onClick={onClose} aria-label="close" className="w-9 h-9 rounded-full font-bold" style={{ background: P.card, border: `1px solid ${P.line}` }}>✕</button>
        </div>

        {/* progress */}
        <div className="flex gap-1.5 px-5 pt-4">
          {STEPS.map((s, i) => (
            <div key={s} className="h-1.5 flex-1 rounded-full" style={{ background: STEPS.indexOf(bStep) >= i ? P.teal : P.line }} />
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {bStep === "schedule" && (
            <>
              {/* 1. DATE INPUT */}
              <div className="mb-4">
                <div className="text-sm font-bold mb-1.5" style={{ color: P.txt }}>📅 {t("date")}</div>
                <input
                  type="date"
                  min={today}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none"
                  style={{ background: P.card, border: `1px solid ${P.line}`, color: P.txt }}
                />
              </div>

              {/* 2. TIME INPUT */}
              <div className="mb-4">
                <div className="text-sm font-bold mb-1.5" style={{ color: P.txt }}>🕒 {t("time")}</div>
                <div className="flex gap-2 items-center">
                  <select value={time.split(":")[0] || ""}
                    onChange={(e) => setTime(e.target.value + ":" + (time.split(":")[1] || "00"))}
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm font-bold outline-none appearance-none text-center"
                    style={{ background: P.card, border: `1px solid ${P.line}`, color: P.txt }}>
                    <option value="" disabled>{lang === "en" ? "Hour" : "Час"}</option>
                    {Array.from({ length: 16 }, (_, i) => String(i + 8).padStart(2, "0")).map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="font-extrabold text-lg" style={{ color: P.txt }}>:</span>
                  <select value={time.split(":")[1] || ""}
                    onChange={(e) => setTime((time.split(":")[0] || "08") + ":" + e.target.value)}
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm font-bold outline-none appearance-none text-center"
                    style={{ background: P.card, border: `1px solid ${P.line}`, color: P.txt }}>
                    <option value="" disabled>{lang === "en" ? "Min" : "Мин"}</option>
                    {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="text-xs mt-1.5" style={{ color: P.sub }}>
                  {lang === "en" ? "Working hours 08:00–23:00" : lang === "kz" ? "Жұмыс уақыты 08:00–23:00" : "Время работы 08:00–23:00"}
                </div>
              </div>

              {/* 3. GUESTS INPUT */}
              <label className="block">
                <div className="text-sm font-bold mb-1.5" style={{ color: P.txt }}>👥 {t("guests")}</div>
                <input inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder={t("guests")} className="w-full rounded-xl px-3 py-2.5 text-sm font-medium outline-none" style={{ background: P.card, border: `1px solid ${P.line}`, color: P.txt }} />
              </label>
            </>
          )}

          {bStep === "rooms" && (
            <>
              <div className="rounded-xl p-3 mb-4 text-sm font-bold flex items-center justify-between" style={{ background: P.card, border: `1px solid ${P.line}`, color: P.txt }}>
                <span>📅 {date} · 🕒 {time}{guests ? ` · 👥 ${guests}` : ""}</span>
                <button onClick={() => setBStep("schedule")} className="text-xs font-bold" style={{ color: P.teal }}>✎</button>
              </div>
              <div className="font-extrabold mb-3" style={{ color: P.txt }}>{t("pickRoom")}{availLoading ? ` · ${t("checking")}` : ""}</div>
              <div className="flex flex-col gap-3">
                {ROOMS.map((r) => {
                  const off = isUnavailable(r);
                  return (
                    <button key={r.id} disabled={off} onClick={() => { setRoom(r); setBStep("phone"); }}
                      className="flex items-center gap-3 rounded-2xl p-4 text-left" style={{ background: P.card, border: `1px solid ${room?.id === r.id ? P.teal : P.line}`, opacity: off ? 0.55 : 1, cursor: off ? "not-allowed" : "pointer" }}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: P.bone, filter: off ? "grayscale(1)" : "none" }}>{r.emoji}</div>
                      <div className="flex-1">
                        <div className="font-extrabold" style={{ color: P.txt }}>{pickL(r.name, lang)}</div>
                        <div className="text-sm font-bold mt-0.5" style={{ color: off ? P.sub : P.teal }}>👥 {t("upTo")} {r.capacity} {t("people")}</div>
                      </div>
                      {off
                        ? <Pill bg="#FAE5E3" fg="#933A34">{bookedIds.includes(r.id) ? t("booked") : t("tooSmall")}</Pill>
                        : <span style={{ color: P.sub }}>→</span>}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {bStep === "phone" && (
            <>
              <div className="font-extrabold mb-1" style={{ color: P.txt }}>{t("yourPhone")}</div>
              <div className="text-sm mb-4" style={{ color: P.sub }}>{t("phoneNote")}</div>
              <PhoneInput value={phoneBody} onChange={setPhoneBody} lang={lang} />
              {err && <div className="text-sm font-bold rounded-lg px-3 py-2 mt-3" style={{ background: "#FAE5E3", color: "#933A34" }}>{err}</div>}
            </>
          )}

          {bStep === "bridge" && (
            <div className="text-center mt-6">
              <div style={{ fontSize: 52 }}>🍽️</div>
              <div className="font-extrabold text-xl mt-3" style={{ fontFamily: FONT_DISPLAY, color: P.txt }}>{t("preOrderTitle")}</div>
              <div className="text-sm mt-3 rounded-xl px-4 py-3 text-left" style={{ background: "#FBEFD9", color: "#8A5A12" }}>💡 {t("preOrderNote")}</div>
              <div className="rounded-xl p-3 mt-4 text-sm text-left" style={{ background: P.card, border: `1px solid ${P.line}` }}>
                <div className="font-bold" style={{ color: P.txt }}>{room && pickL(room.name, lang)} · 👥 {t("upTo")} {room?.capacity}</div>
                <div className="text-xs mt-1" style={{ color: P.sub }}>📅 {date} · 🕒 {time} · 📞 +7{phoneBody}</div>
              </div>
              <button onClick={() => onProceed(booking(), true)}
                className="w-full mt-5 py-3 rounded-xl font-extrabold" style={{ background: P.teal, color: "#fff" }}>
                🍽️ {t("goToMenu")}
              </button>
              <button onClick={() => onProceed(booking(), false)}
                className="w-full mt-2 py-3 rounded-xl font-bold text-sm" style={{ background: P.card, border: `1px solid ${P.line}`, color: P.txt }}>
                {t("skipFood")}
              </button>
            </div>
          )}
        </div>

        {/* footer nav */}
        {bStep !== "bridge" && (
          <div className="px-5 py-4 flex gap-2" style={{ borderTop: `1px solid ${P.line}`, background: P.card }}>
            {bStep !== "schedule" && (
              <button onClick={() => setBStep(bStep === "phone" ? "rooms" : "schedule")} className="px-4 py-3 rounded-xl font-bold" style={{ background: P.bone, border: `1px solid ${P.line}`, color: P.txt }}>
                ← {t("back")}
              </button>
            )}
            {bStep === "schedule" && (
              <button disabled={!date || !time || time.length < 5} onClick={() => setBStep("rooms")} className="flex-1 py-3 rounded-xl font-extrabold"
                style={{ background: (!date || !time) ? P.line : P.teal, color: "#fff" }}>
                {t("next")} →
              </button>
            )}
            {bStep === "phone" && (
              <button onClick={() => { if (!phoneBodyComplete(phoneBody)) return setErr(t("needPhone")); setErr(""); setBStep("bridge"); }}
                className="flex-1 py-3 rounded-xl font-extrabold" style={{ background: P.teal, color: "#fff" }}>
                {t("next")} →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── guest site ──────────────────────────────────────────────────────── */

function GuestSite({ lang, setLang, t, menu, cart, setQty, openCart, cartCount, cartTotal, goAdmin, lastOrder, orders, images, openBooking, cafeInfo }) {
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
    {/* --- CLOSED BANNER --- */}
    {cafeInfo && !cafeInfo.isOpen && (
      <div className="fixed top-0 left-0 right-0 z-50 text-center py-3 font-extrabold text-sm" style={{ background: P.red, color: "#fff" }}>
        🔒 {lang === "ru" ? "Сейчас мы закрыты. Прием заказов временно приостановлен." : lang === "kz" ? "Қазір біз жабықмыз." : "We are currently closed."}
      </div>
    )}
    {/* --- END CLOSED BANNER --- */}

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
            <button onClick={() => setLang(nextLang(lang))} className="text-xs font-extrabold px-3 py-1.5 rounded-full"
              style={{ background: P.card, border: `1px solid ${P.line}` }}>
              🌐 {langCode(lang)}
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
              <button onClick={openBooking} className="font-extrabold text-sm px-5 py-3 rounded-full" style={{ background: P.saff, color: "#16202B" }}>
                🚪 {t("book")}
              </button>
              <span className="text-xs font-bold px-3 py-2 rounded-full" style={{ background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.85)" }}>
                ● {t("today")} {t("until")} 23:00
              </span>
            </div>
          </div>
          <div className="sm:col-span-2">
            {featured && (
              <div className="rounded-2xl p-5" style={{ background: P.ink2, border: "1px solid rgba(255,255,255,.1)" }}>
                <div className="text-xs font-extrabold tracking-widest uppercase mb-3" style={{ color: P.saff }}>
                  {L3(lang, "Dish of the day", "Блюдо дня", "Күннің тағамы")}
                </div>
                <div className="rounded-xl flex items-center justify-center mb-4 overflow-hidden" style={{ background: "rgba(255,255,255,.06)", height: 110 }}>
                  {images[featured.id] ? (
                    <img src={images[featured.id]} alt={pickL(featured.name, lang)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 56 }}>{featured.emoji}</span>
                  )}
                </div>
                <div className="font-extrabold" style={{ color: "#fff" }}>{pickL(featured.name, lang)}</div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,.6)" }}>{pickL(featured.desc, lang)}</div>
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
              image={images[item.id]}
              qty={cart[item.id] || 0}
              onPlus={() => setQty(item.id, (cart[item.id] || 0) + 1)}
              onMinus={() => setQty(item.id, (cart[item.id] || 0) - 1)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: P.sub }}>🔍 {L3(lang, "Nothing found", "Ничего не найдено", "Ештеңе табылмады")}</div>
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
            {[["☕", "12 000+", L3(lang, "cups a month", "чашек в месяц", "айына кесе")],
              ["🥐", "08:00", L3(lang, "fresh bakes daily", "свежая выпечка", "күн сайын жаңа нан")],
              ["⭐", "4.9", L3(lang, "2GIS rating", "рейтинг в 2ГИС", "2ГИС рейтингі")]].map(([e, n, l]) => (
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
            <div className="font-extrabold mb-2" style={{ color: "#fff" }}>{L3(lang, "For the team", "Команде", "Команда үшін")}</div>
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

      {/* cart nudge pill — appears when items added but no active order */}
      {cartCount > 0 && !live && (
        <button onClick={openCart} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-full font-bold text-sm"
          style={{ background: P.teal, color: "#fff", boxShadow: "0 4px 24px rgba(21,163,154,.45)" }}>
          <span style={{ fontSize: 18 }}>🧺</span>
          <span>{fmt(cartTotal)}</span>
          <span style={{ opacity: 0.85, fontWeight: 400 }}>·</span>
          <span style={{ opacity: 0.85, fontWeight: 400 }}>
            {lang === "en" ? "Tap to order →" : "Нажмите для заказа →"}
          </span>
        </button>
      )}
    </div>
  );
}

/* ── admin: pieces ───────────────────────────────────────────────────── */
function PinGate({ onOk, lang, goSite }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if already logged in from a previous session
  useEffect(() => {
    const existing = localStorage.getItem("aspan-token");
    if (existing) onOk();
  }, [onOk]);

  const tryIn = async () => {
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    setErr(false);
    const token = await apiLogin(username, password);
    setLoading(false);
    if (token) onOk();
    else { setErr(true); setPassword(""); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: P.ink }}>
      <div className="w-full max-w-xs rounded-2xl p-6 text-center" style={{ background: P.ink2, border: "1px solid rgba(255,255,255,.1)" }}>
        <Ornament color={P.saff} w={44} />
        <div className="font-extrabold mt-2" style={{ fontFamily: FONT_DISPLAY, color: "#fff" }}>ASPAN · Staff</div>
        <div className="text-xs mt-1 mb-4" style={{ color: "rgba(255,255,255,.5)" }}>
          {lang === "en" ? "Sign in to manage the café" : "Войдите для управления кафе"}
        </div>
        <input
          type="text"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && tryIn()}
          className="w-full text-center rounded-xl px-3 py-3 outline-none font-bold mb-2"
          style={{ background: "rgba(255,255,255,.08)", color: "#fff", border: `1px solid ${err ? P.red : "rgba(255,255,255,.15)"}` }}
          placeholder={lang === "en" ? "Username" : "Логин"}
          autoComplete="username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setErr(false); }}
          onKeyDown={(e) => e.key === "Enter" && tryIn()}
          className="w-full text-center rounded-xl px-3 py-3 outline-none font-bold"
          style={{ background: "rgba(255,255,255,.08)", color: "#fff", border: `1px solid ${err ? P.red : "rgba(255,255,255,.15)"}` }}
          placeholder="••••••"
          autoComplete="current-password"
        />
        {err && <div className="text-xs font-bold mt-2" style={{ color: "#F09595" }}>
          {lang === "en" ? "Wrong username or password" : "Неверный логин или пароль"}
        </div>}
        <button onClick={tryIn} disabled={loading} className="w-full mt-4 py-3 rounded-xl font-extrabold"
          style={{ background: P.teal, color: "#fff", opacity: loading ? 0.6 : 1 }}>
          {loading ? "…" : (lang === "en" ? "Sign in" : "Войти")}
        </button>
        <button onClick={goSite} className="mt-3 text-xs font-bold" style={{ color: "rgba(255,255,255,.5)" }}>
          ← {lang === "en" ? "Back to the site" : "Назад на сайт"}
        </button>
      </div>
    </div>
  );
}

function OrderCard({ o, lang, onStatus, onEditItems }) {
  const next = { new: ["cooking", lang === "en" ? "Start cooking" : "В работу"], cooking: ["ready", lang === "en" ? "Mark ready" : "Готов"], ready: ["done", lang === "en" ? "Complete" : "Завершить"] }[o.status];
  return (
    <div className="rounded-2xl p-4" style={{ background: P.card, border: `1px solid ${P.line}` }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="font-extrabold" style={{ fontFamily: FONT_DISPLAY, fontSize: 15 }}>№{o.num}</div>
        <StatusPill s={o.status} lang={lang} />
      </div>
      <div className="text-xs mt-1" style={{ color: P.sub }}>
        {dateOf(o.ts)} · {timeOf(o.ts)} · {
          o.type === "booking" ? `🚪 ${lang === "en" ? "Reservation" : "Бронь"}${o.phone ? " · " + o.phone : ""}`
          : o.type === "table" ? `🍽 ${lang === "en" ? "Table" : "Стол"} ${o.table}`
          : o.type === "delivery" ? `🚗 ${lang === "en" ? "Delivery" : "Доставка"}${o.name ? " · " + o.name : ""}${o.phone ? " · " + o.phone : ""}`
          : `🥡 ${lang === "en" ? "Pickup" : "С собой"}${o.name ? " · " + o.name : ""}${o.phone ? " · " + o.phone : ""}`
        }
      </div>
      {o.type === "booking" && o.booking && (
        <div className="mt-2 rounded-xl p-3 text-sm" style={{ background: "#FBEFD9", border: `1px solid ${P.saff}` }}>
          <div className="font-extrabold" style={{ color: "#8A5A12" }}>🚪 {pickL(o.booking.roomName, lang)} · 👥 {lang === "en" ? "up to" : "до"} {o.booking.capacity}</div>
          <div className="mt-1 font-bold" style={{ color: P.txt }}>📅 {o.booking.date} · 🕒 {o.booking.time}{o.booking.guests ? ` · 👥 ${o.booking.guests}` : ""}</div>
          <div style={{ color: P.txt }}>📞 {o.booking.phone}</div>
          {(!o.items || o.items.length === 0) && (
            <div className="text-xs mt-1" style={{ color: "#8A5A12" }}>{lang === "en" ? "Room only — no food pre-ordered" : "Только зал — еда не заказана заранее"}</div>
          )}
        </div>
      )}
      {o.type === "delivery" && (
        <div className="mt-2 rounded-xl p-3 text-sm" style={{ background: "#EAF4F2", border: `1px solid ${P.line}` }}>
          {o.address && <div className="font-bold" style={{ color: P.txt }}>📍 {o.address}</div>}
          {(o.lat != null && o.lng != null) ? (
            <div className="flex gap-2 mt-2 flex-wrap items-center">
              <a href={o.mapLink || `https://2gis.kz/geo/${o.lng},${o.lat}`} target="_blank" rel="noreferrer"
                className="no-underline text-xs font-extrabold px-3 py-1.5 rounded-full" style={{ background: "#1BA05A", color: "#fff" }}>
                🧭 {lang === "en" ? "Open in 2GIS" : "Открыть в 2ГИС"}
              </a>
              <a href={o.mapLinkGoogle || `https://maps.google.com/?q=${o.lat},${o.lng}`} target="_blank" rel="noreferrer"
                className="no-underline text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: P.bone, border: `1px solid ${P.line}`, color: P.txt }}>
                🗺 Google
              </a>
              <span className="text-xs px-2 py-1.5" style={{ color: P.sub }}>{o.lat.toFixed(5)}, {o.lng.toFixed(5)}</span>
            </div>
          ) : (
            <div className="text-xs mt-1" style={{ color: P.sub }}>{lang === "en" ? "Address only — call the customer" : "Только адрес — позвоните клиенту"}</div>
          )}
        </div>
      )}
      <div className="mt-3 text-sm rounded-xl p-3" style={{ background: P.bone }}>
        {o.items.map((it, i) => (
          <div key={i} className="flex justify-between py-0.5">
            <span style={{ color: P.txt }}>{pickL(it.name, lang)} <b>× {it.qty}</b></span>
            <span className="font-bold">{fmt(it.price * it.qty)}</span>
          </div>
        ))}
        {o.comment && <div className="text-xs mt-2 font-bold" style={{ color: P.tealD }}>💬 {o.comment}</div>}
      </div>
      {/* EDIT ITEMS BUTTON */}
      {(o.status === "new" || o.status === "cooking") && (
        <button onClick={onEditItems} className="text-xs font-bold px-3 py-2 rounded-full mb-3" style={{ background: P.bone, border: `1px solid ${P.line}`, color: P.txt }}>
          ✎ {lang === "en" ? "Edit items" : "Изменить состав"}
        </button>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="font-extrabold">{fmt(o.total)}{o.commissionFee ? <span className="text-xs ml-2" style={{ color: P.sub }}>({lang === "en" ? "fee" : "комиссия"} {fmt(o.commissionFee)})</span> : null}</div>
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
    name: { en: "", ru: "", kz: "" }, desc: { en: "", ru: "", kz: "" },
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setName = (l, v) => setF((p) => ({ ...p, name: { ...p.name, [l]: v } }));
  const setDesc = (l, v) => setF((p) => ({ ...p, desc: { ...p.desc, [l]: v } }));
  const toggleTag = (tg) => setF((p) => ({ ...p, tags: p.tags.includes(tg) ? p.tags.filter((x) => x !== tg) : [...p.tags, tg] }));
  const ok = f.name.en.trim() && f.name.ru.trim() && Number(f.price) > 0;
  const L = (en, ru, kz) => (lang === "en" ? en : lang === "kz" ? (kz || ru) : ru);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog">
      <div className="absolute inset-0" style={{ background: "rgba(14,22,32,.55)" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-5" style={{ background: P.bone }}>
        <div className="flex items-center justify-between mb-4">
          <div className="font-extrabold" style={{ fontFamily: FONT_DISPLAY }}>{initial ? L("Edit dish", "Редактировать блюдо") : L("New dish", "Новое блюдо")}</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full font-bold" style={{ background: P.card, border: `1px solid ${P.line}` }}>✕</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label={L("Name (EN)", "Название (EN)", "Атауы (EN)")} value={f.name.en} onChange={(v) => setName("en", v)} ph="Flat white" />
          <Field label={L("Name (RU)", "Название (RU)", "Название (RU)")} value={f.name.ru} onChange={(v) => setName("ru", v)} ph="Флэт уайт" />
          <Field label={L("Name (KZ)", "Название (KZ)", "Атауы (KZ)")} value={f.name.kz || ""} onChange={(v) => setName("kz", v)} ph="Флэт уайт" />
        </div>
        <Field label={L("Description (EN)", "Описание (EN)", "Сипаттама (EN)")} value={f.desc.en} onChange={(v) => setDesc("en", v)} area />
        <Field label={L("Description (RU)", "Описание (RU)", "Описание (RU)")} value={f.desc.ru} onChange={(v) => setDesc("ru", v)} area />
        <Field label={L("Description (KZ)", "Описание (KZ)", "Сипаттама (KZ)")} value={f.desc.kz || ""} onChange={(v) => setDesc("kz", v)} area />
        <div className="grid grid-cols-2 gap-3">
          <Field label={L("Price, ₸", "Цена, ₸", "Бағасы, ₸")} value={String(f.price)} onChange={(v) => set("price", Number(v.replace(/\D/g, "")) || 0)} ph="1500" />
          <Field label={L("Emoji (photo stand-in)", "Эмодзи (вместо фото)", "Эмодзи (фото орнына)")} value={f.emoji} onChange={(v) => set("emoji", v)} ph="☕" />
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
/* ── Admin: Order Item Editor Modal ──────────────────────────────────── */
function OrderItemEditor({ order, menu, lang, onClose, onSave }) {
  const L = (en, ru) => (lang === "en" ? en : ru);
  const [items, setItems] = useState(order.items.map(i => ({...i})));

  const updateQty = (idx, delta) => {
    setItems(prev => prev.map((it, i) => i === idx ? {...it, qty: Math.max(0, it.qty + delta)} : it).filter(it => it.qty > 0));
  };

  const addItem = (menuItem) => {
    const exists = items.find(i => i.id === menuItem.id);
    if (exists) {
      updateQty(items.indexOf(exists), 1);
    } else {
      setItems(prev => [...prev, { id: menuItem.id, name: menuItem.name, price: menuItem.price, qty: 1 }]);
    }
  };

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(14,22,32,.7)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: P.card }}>
        <div className="flex justify-between mb-4">
          <div className="font-extrabold" style={{ fontFamily: FONT_DISPLAY }}>{L("Edit Order", "Редактировать")} №{order.num}</div>
          <button onClick={onClose} className="w-9 h-9 rounded-full font-bold" style={{ background: P.bone, border: `1px solid ${P.line}` }}>✕</button>
        </div>

        <div className="flex flex-col gap-2 mb-4">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg" style={{ background: P.bone }}>
              <div className="flex-1 text-sm font-bold truncate">{pickL(it.name, lang)}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{color: P.sub}}>{fmt(it.price)}</span>
                <QtyControl qty={it.qty} onMinus={() => updateQty(idx, -1)} onPlus={() => updateQty(idx, 1)} />
              </div>
            </div>
          ))}
        </div>

        <div className="text-sm font-bold mb-2">{L("Add item", "Добавить позицию")}</div>
        <div className="grid grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto p-1" style={{ border: `1px solid ${P.line}`, borderRadius: 12 }}>
          {menu.filter(m => m.available).map(m => (
            <button key={m.id} onClick={() => addItem(m)} className="text-left text-xs p-2 rounded-lg flex gap-2" style={{ background: P.bone }}>
              <span>{m.emoji}</span>
              <span className="truncate">{pickL(m.name, lang)}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-between p-3 rounded-lg mb-4" style={{ background: P.bone }}>
          <span className="font-bold">{L("New Total", "Новый итог")}:</span>
          <span className="font-extrabold text-lg">{fmt(total)}</span>
        </div>

        <button onClick={() => { onSave(order.id, items, total); onClose(); }} className="w-full py-3 rounded-xl font-extrabold" style={{ background: P.teal, color: "#fff" }}>
          {L("Save Changes", "Сохранить")}
        </button>
      </div>
    </div>
  );
}
function AdminPanel({ lang, setLang, menu, saveMenu, orders, updateStatus, refreshOrders, goSite, images, saveImages, cafeInfo, saveCafeStatus }) {
  const [tab, setTab] = useState("orders");
  const [filter, setFilter] = useState("active");
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [superPin, setSuperPin] = useState("");
  const [isSuper, setIsSuper] = useState(false);
  const [settling, setSettling] = useState(false);
  const [editingOrderItems, setEditingOrderItems] = useState(null);

const handleSaveItems = async (id, items, total) => {
  await apiEditOrderItems(id, items, total);
  refreshOrders();
  loadLedger();
};
  const L = (en, ru) => (lang === "en" ? en : ru);

  const loadLedger = useCallback(async () => { const d = await apiGetLedger(); if (d) setLedger(d); }, []);

  useEffect(() => {
    if (tab === "orders") { refreshOrders(); const t = setInterval(refreshOrders, 10000); return () => clearInterval(t); }
    if (tab === "finance") { loadLedger(); }
  }, [tab, refreshOrders, loadLedger]);

  const settle = async () => {
    setSettling(true);
    await apiSettleLedger(`Payout ${new Date().toLocaleDateString("ru-RU")}`);
    await loadLedger();
    setSettling(false);
  };

  const shown = orders.filter((o) =>
    filter === "active" ? ["new", "cooking", "ready"].includes(o.status) :
    filter === "all" ? true : o.status === filter);

  const today = orders.filter((o) => isToday(o.ts) && o.status !== "cancelled");
  const revenue = today.reduce((s, o) => s + o.total, 0);
  const avg = today.length ? Math.round(revenue / today.length) : 0;
  const top = useMemo(() => {
    const m = {};
    orders.filter((o) => o.status !== "cancelled").forEach((o) => o.items.forEach((it) => {
      const k = pickL(it.name, lang) || "?";
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
            <button onClick={() => setLang(nextLang(lang))} className="text-xs font-extrabold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
              🌐 {langCode(lang)}
            </button>
            <button onClick={goSite} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
              ← {L("Site", "Сайт")}
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2">
          {[["orders", L("Orders", "Заказы")], ["menu", L("Menu", "Меню")], ["stats", L("Analytics", "Аналитика")], ["finance", L("Finance", "Финансы")], ["schedule", L("Schedule", "График")]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className="relative text-sm font-bold px-4 py-2 rounded-full"
              style={{ background: tab === id ? P.teal : "rgba(255,255,255,.08)", color: "#fff" }}>
              {label}
            </button>
            ))}
            <button
             onClick={() => { localStorage.removeItem("aspan-token"); window.location.reload(); }}
             className="text-xs font-bold px-3 py-1.5 rounded-full"
             style={{ background: "rgba(255,255,255,.12)", color: "#fff" }}>
  🚪         {L("Logout", "Выйти")}
            </button>
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
                {shown.map((o) => (
                  <OrderCard key={o.id} o={o} lang={lang} onStatus={updateStatus} onEditItems={() => setEditingOrderItems(o)} />
                ))}
                {editingOrderItems && (
                  <OrderItemEditor
                    order={editingOrderItems}
                    menu={menu}
                    lang={lang}
                    onClose={() => setEditingOrderItems(null)}
                    onSave={handleSaveItems}
                  />
                )}
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
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 cursor-pointer group"
                          style={{ background: c.tint }}
                          onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = (ev) => { const next = { ...images, [m.id]: ev.target.result }; saveImages(next); }; reader.readAsDataURL(file); }; inp.click(); }}>
                          {images[m.id] ? (
                            <img src={images[m.id]} alt={pickL(m.name, lang)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontSize: 24 }}>{m.emoji}</span>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,.45)" }}>
                            <span style={{ fontSize: 16 }}>📷</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm truncate">{pickL(m.name, lang)}</div>
                          <div className="text-xs" style={{ color: P.sub }}>{fmt(m.price)}{m.tags.length ? " · " + m.tags.map((tg) => TAGS[tg][lang]).join(", ") : ""}</div>
                          {images[m.id] && (
                            <button onClick={() => { const next = { ...images }; delete next[m.id]; saveImages(next); }}
                              className="text-xs mt-0.5" style={{ color: P.red }}>
                              {L("Remove photo", "Удалить фото")}
                            </button>
                          )}
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
              {Object.keys(STATUS).filter((s) => s !== "pending" && s !== "awaiting_confirmation").map((s) => (
                <div key={s} className="rounded-xl p-3 text-center" style={{ background: STATUS[s].bg }}>
                  <div className="font-extrabold text-lg" style={{ color: STATUS[s].fg }}>{orders.filter((o) => o.status === s).length}</div>
                  <div className="text-xs font-bold" style={{ color: STATUS[s].fg }}>{STATUS[s][lang]}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "finance" && (
          <>
            {/* commission balance — visible to the cafe. Still calculated as 2% of every NEW order, even though payment happens at the table. */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: P.ink, color: "#fff" }}>
              <div className="text-xs font-bold uppercase tracking-wide" style={{ color: "rgba(255,255,255,.6)" }}>
                {L("Current commission balance", "Текущий баланс комиссии")}
              </div>
              <div className="font-extrabold mt-2" style={{ fontFamily: FONT_DISPLAY, fontSize: 38 }}>
                {ledger ? fmt(ledger.balance) : "…"}
              </div>
              <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,.6)" }}>
                {L("Platform fee owed to us (2% of every order placed)", "Комиссия платформы к оплате (2% от каждого заказа)")}
              </div>
              {ledger && (
                <div className="flex gap-4 mt-4 text-xs" style={{ color: "rgba(255,255,255,.7)" }}>
                  <span>{L("Accrued", "Начислено")}: <b style={{ color: "#fff" }}>{fmt(ledger.accrued)}</b></span>
                  <span>{L("Paid out", "Выплачено")}: <b style={{ color: "#fff" }}>{fmt(ledger.paid)}</b></span>
                </div>
              )}
            </div>

            {/* super-admin: settle + history */}
            <div className="rounded-2xl p-5" style={{ background: P.card, border: `1px solid ${P.line}` }}>
              <div className="font-extrabold mb-3" style={{ fontFamily: FONT_DISPLAY, fontSize: 14 }}>{L("Platform owner (super-admin)", "Владелец платформы (супер-админ)")}</div>
              {!isSuper ? (
                <div className="flex gap-2 items-center">
                  <input type="password" inputMode="numeric" value={superPin} onChange={(e) => setSuperPin(e.target.value)}
                    placeholder={L("Super-admin PIN (demo: 9999)", "PIN супер-админа (демо: 9999)")}
                    className="flex-1 rounded-xl px-3 py-2.5 text-sm outline-none" style={{ background: P.bone, border: `1px solid ${P.line}`, color: P.txt }} />
                  <button onClick={() => { if (superPin === "9999") setIsSuper(true); else setSuperPin(""); }}
                    className="text-sm font-bold px-4 py-2.5 rounded-xl" style={{ background: P.ink, color: "#fff" }}>
                    {L("Unlock", "Открыть")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="rounded-xl p-3 mb-3 flex items-center justify-between" style={{ background: P.bone }}>
                    <div className="text-sm">
                      <div className="font-bold" style={{ color: P.txt }}>{L("When the cafe transfers the fee to you:", "Когда кафе переведёт комиссию вам:")}</div>
                      <div className="text-xs" style={{ color: P.sub }}>{L("Mark it paid — balance resets to 0 and a payout is logged.", "Отметьте как оплачено — баланс обнулится, выплата сохранится в истории.")}</div>
                    </div>
                  </div>
                  <button onClick={settle} disabled={settling || !ledger || ledger.balance <= 0}
                    className="w-full py-3 rounded-xl font-extrabold mb-4"
                    style={{ background: (!ledger || ledger.balance <= 0) ? P.line : P.saff, color: "#16202B", opacity: settling ? 0.6 : 1 }}>
                    {settling ? "…" : `${L("Reset balance / Mark as paid", "Сбросить баланс / Отметить как оплачено")} (${ledger ? fmt(ledger.balance) : "…"})`}
                  </button>

                  <div className="text-xs font-bold mb-2" style={{ color: P.sub }}>{L("History", "История")}</div>
                  <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                    {ledger && ledger.history.length === 0 && <div className="text-xs" style={{ color: P.sub }}>{L("No transactions yet.", "Операций пока нет.")}</div>}
                    {ledger && ledger.history.map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-xs rounded-lg px-3 py-2" style={{ background: P.bone }}>
                        <span style={{ color: P.sub }}>
                          {dateOf(h.ts)} {timeOf(h.ts)} · {h.type === "accrual" ? `➕ ${h.note || L("Commission", "Комиссия")}` : `💸 ${L("Payout", "Выплата")}`}
                        </span>
                        <span className="font-bold" style={{ color: h.type === "accrual" ? "#3F6B2A" : "#933A34" }}>
                          {h.type === "accrual" ? "+" : "−"}{fmt(h.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* --- SCHEDULE MANAGER TAB --- */}
        {tab === "schedule" && (
          <div className="rounded-2xl p-6" style={{ background: P.card, border: `1px solid ${P.line}` }}>
            <div className="flex justify-between items-center mb-6">
              <div className="font-extrabold" style={{ fontFamily: FONT_DISPLAY, fontSize: 18 }}>{L("Operating Hours", "Режим работы")}</div>
              <button
                onClick={() => saveCafeStatus({ ...cafeInfo, isOpen: !cafeInfo.isOpen })}
                className="px-6 py-2 rounded-full font-extrabold text-sm"
                style={{ background: cafeInfo.isOpen ? "#5E8C4A" : "#C7514A", color: "#fff" }}
              >
                {cafeInfo.isOpen ? "✓ Открыто" : "✕ Закрыто"}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map(day => (
                <div key={day} className="p-3 rounded-xl" style={{ background: P.bone }}>
                  <div className="text-xs font-bold mb-2 uppercase" style={{ color: P.sub }}>{day}</div>
                  <input
                    type="text"
                    value={cafeInfo.hours?.[day] || "08:00-23:00"}
                    onChange={(e) => saveCafeStatus({ ...cafeInfo, hours: { ...cafeInfo.hours, [day]: e.target.value } })}
                    className="w-full text-sm font-bold p-2 rounded-lg outline-none text-center"
                    style={{ background: P.card, border: `1px solid ${P.line}`, color: P.txt }}
                  />
                </div>
              ))}
            </div>
          </div>
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
  const [images, setImages] = useState({});
  const [cafeInfo, setCafeInfo] = useState({ isOpen: true, hours: {} });
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null); // set while a reservation is in progress

  const t = useCallback((k) => T[lang][k] || k, [lang]);

    useEffect(() => {
    (async () => {
      const m = await apiGetMenu();
      if (m && Array.isArray(m) && m.length) setMenu(m);
      else { setMenu(SEED); await apiSaveMenu(SEED); }
      const o = await apiGetOrders();
      setOrders(Array.isArray(o) ? o : []);
      try { const raw = localStorage.getItem(IMAGES_KEY); if (raw) setImages(JSON.parse(raw)); } catch (e) {}

      const status = await apiGetCafeStatus();
      if (status) setCafeInfo(status);
    })();
  }, []);

  const refreshOrders = useCallback(async () => {
    const o = await apiGetOrders();
    if (Array.isArray(o)) setOrders(o);
  }, []);

  const saveMenu = useCallback((next) => { setMenu(next); apiSaveMenu(next); }, []);

  const saveImages = useCallback((next) => {
    setImages(next);
    try { localStorage.setItem(IMAGES_KEY, JSON.stringify(next)); } catch (e) {}
  }, []);

  const saveCafeStatus = async (data) => {
    await apiUpdateCafeStatus(data);
    setCafeInfo(data);
  };

  const setQty = useCallback((id, q) => {
    setCart((p) => {
      const n = { ...p };
      if (q <= 0) delete n[id]; else n[id] = q;
      return n;
    });
  }, []);

  const placeOrder = useCallback(async (payload) => {
    const latest = await apiGetOrders() || [];
    const num = latest.reduce((mx, o) => Math.max(mx, o.num || 0), 100) + 1;
    const order = { id: "o" + Date.now() + Math.floor(Math.random() * 999), num, ts: Date.now(), status: payload.status || "new", ...payload };
    await apiPlaceOrder(order);
    setOrders((prev) => [order, ...prev]);
    setLastOrder(order);
    setCart({});
    return order; // ← return so CartDrawer can get the id
  }, []);

  const updateStatus = useCallback(async (id, status) => {
    await apiUpdateStatus(id, status);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  }, []);

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

      {view === "site" ? (
        <>
          <GuestSite lang={lang} setLang={setLang} t={t} menu={menu} cart={cart} setQty={setQty} cafeInfo={cafeInfo}
            openCart={() => setCartOpen(true)} cartCount={cartCount} cartTotal={cartTotal}
            goAdmin={() => setView("admin")} lastOrder={lastOrder} orders={orders} images={images}
            openBooking={() => setBookingOpen(true)} />
          <BookingWizard open={bookingOpen} onClose={() => setBookingOpen(false)} lang={lang} t={t}
            onProceed={(booking, wantsFood) => {
              setActiveBooking(booking);
              setBookingOpen(false);
              if (wantsFood) {
                // let them add dishes, then open the cart
                document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
              } else {
                setCartOpen(true); // room only → straight to order summary
              }
            }} />
          <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} menu={menu}
            lang={lang} t={t} setQty={setQty} placeOrder={placeOrder} lastOrder={lastOrder}
            orders={orders} refreshOrders={refreshOrders} resetAfterOrder={() => setLastOrder(lastOrder)}
            booking={activeBooking} clearBooking={() => setActiveBooking(null)} />
        </>
      ) : authed ? (
        <AdminPanel lang={lang} setLang={setLang} menu={menu} saveMenu={saveMenu} orders={orders} cafeInfo={cafeInfo} saveCafeStatus={saveCafeStatus}
          updateStatus={updateStatus} refreshOrders={refreshOrders} goSite={() => setView("site")}
          images={images} saveImages={saveImages} />
      ) : (
        <PinGate lang={lang} onOk={() => setAuthed(true)} goSite={() => setView("site")} />
      )}
    </div>
  );

}