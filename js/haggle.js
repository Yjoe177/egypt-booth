(function () {
  "use strict";
  const { $, $$, Sfx, Voice, Store, pick, rand, clamp, sleep, esc, showClosure, mountGamebar, PHRASES } = EG;

  mountGamebar("🛍️ Haggle with Uncle Sayed", { voice: true });

  const ITEMS = [
    { n: "Mini Golden Pyramid (made of REAL plastic)", e: "🔺", c: 30 },
    { n: "Papyrus painting of Queen Cleopatra", e: "📜", c: 40 },
    { n: "Lucky Scarab Beetle (luck not guaranteed)", e: "🪲", c: 25 },
    { n: "King Tut's Golden Mask (travel size)", e: "👑", c: 60 },
    { n: "Camel plush toy that says “Habibi”", e: "🐪", c: 35 },
    { n: "Brass magic lamp (genie sold separately)", e: "🪔", c: 45 },
    { n: "Bottle of 100% genuine Nile water", e: "🧴", c: 10 },
    { n: "Ramadan lantern (Fanoos) with lights", e: "🏮", c: 50 },
    { n: "Egyptian tea set for 6 people", e: "🫖", c: 80 },
    { n: "Ancient vase (ancient = last Tuesday)", e: "🏺", c: 55 },
  ];

  const L = {
    greet: [
      "Ahlan ya habibi! Welcome, welcome! You have good eyes: this is the best {item} in all of Egypt!",
      "Ya marhaba! Come in, come in! For you, my friend, I make a SPECIAL price!",
      "Welcome to my shop! Sit, sit! You want tea? First, look at this beautiful {item}!",
    ],
    open: ["Special price, only for you: <b>{ask} pounds</b>. Because I like your face.", "Normally 5,000… but for you? Only <b>{ask} pounds</b>! Good price, wallahi!", "This one? <b>{ask} pounds</b>. Very cheap! Almost free! I'm losing money!"],
    counter: [
      "{offer}?! Ya habibi, at this price my children eat AIR! OK… for you: <b>{ask}</b>.",
      "Wallahi I lose money! My grandmother made this with her own hands! <b>{ask}</b>, final price!",
      "You are breaking my heart… 💔 <b>{ask}</b>. And I give you tea for free!",
      "Hmm… you bargain like an Egyptian! OK, <b>{ask}</b>, but don't tell anyone.",
      "Ya basha, the camel outside is watching. Don't embarrass me. <b>{ask}</b>.",
      "{offer}? Hahaha, funny! You are a comedian! Seriously: <b>{ask}</b>.",
      "My cousin sells this for double! DOUBLE! But for you… <b>{ask}</b>.",
    ],
    insult: [
      "{offer}?!?! For {offer} I give you… the BAG. Empty bag.",
      "WHAT?! {offer}?! Even the PHOTO of this costs more!",
      "Habibi, are you trying to give me a heart attack?! 😱",
      "{offer}?! You want to rob me in my own shop?! In front of my tea?!",
      "Ya salam… {offer}. My great-grandfather is turning in his pyramid.",
    ],
    backwards: ["You go BACKWARDS?! Habibi, haggling goes UP for you, DOWN for me! Not both down!", "Lower than before?! Are you haggling or doing math homework?!"],
    same: ["You said this already! I'm old, not deaf!", "Same number again? Habibi, the number is tired."],
    number: ["Habibi, give me a NUMBER! I don't accept smiles… OK maybe smiles. But mostly numbers.", "Numbers, my friend, numbers! Like 1, 2, 3… preferably big ones."],
    zero: ["Free?! FREE?! Habibi, this is a shop, not a charity!", "Zero pounds? I respect the confidence. No."],
    accept: ["Ahhh… OK OK OK! Mabrouk! You win! Take it before I change my mind! 😭", "Deal! Ya habibi, you are a dangerous person. 🤝", "Fine! FINE! Take it! My wife will kill me tonight… 😩"],
    overpay: ["SOLD!!! Mabrouk! …you know you could pay less? Too late! Hahaha!", "YES! Deal! Wonderful! (he is trying very hard not to laugh)"],
    ghali: ["Ghali?! GHALI?! This is handmade! By hand! With HANDS! …OK, <b>{ask}</b>.", "Ghali awi? Ya habibi, look at the quality! …fine, fine: <b>{ask}</b>.", "Too expensive?! You're killing me… <b>{ask}</b>. Happy now?"],
    ghaliSpam: ["You said ‘ghali’ already! My ears are tired. Give me a NUMBER.", "Ghali, ghali, ghali… you sound like my wife at the market!"],
    compliment: ["Ahh, thank you, thank you! You have taste! For people with taste… better prices come. 😊", "You like my shop? My grandfather opened it in 1952! You are family now! ❤️"],
    compliment2: ["Hehe, you're too kind… OK, maybe a little better price. A little."],
    complimentSpam: ["Thank you… but compliments don't pay my rent, habibi.", "Yes yes, I'm beautiful, the shop is beautiful… NUMBER please."],
    chase: ["WAIT WAIT WAIT! Habibi come back! OK OK, <b>{ask}</b>! Last price! Final! Finished!", "Where are you going?! Come, come! Sit, drink tea… <b>{ask}</b>, only for you!", "Ya habibi don't go! My heart! OK: <b>{ask}</b>. Final final price!"],
    letGo: ["Ma'a salama, habibi… 👋 (he really let you go 😶)", "OK bye bye! Ma'a salama! …(he went back to his tea)"],
    kicked: ["YALLA! OUT! OUT of my shop!! …… OK wait, come back. <b>{ask}</b>. FINAL final price. 😤"],
    closed: ["THAT'S IT! Shop is CLOSED! I go home to my wife! Yalla, ma'a salama! 😤"],
    hurry: ["Habibi, my tea is getting cold… decide! ☕", "Yalla yalla, other customers are waiting! (there are no other customers)"],
    idle: ["Hello? Habibi? You still there? The price is <b>{ask}</b>… for now.", "You're thinking? Good, good. Think about <b>{ask}</b>. Beautiful number."],
  };

  // ---------- shopkeepers ----------
  const SELLERS = {
    sayed: {
      key: "sayed", name: "Uncle Sayed", short: "Sayed", sign: "عم سيد · UNCLE SAYED · SOUVENIRS", robe: ["#5f8fc7", "#3a6aa6"], skin: "#c68a5e",
      pitch: 0.75, rate: 1.08, drain: 1, drop: 1, gapAccept: 0.12, openMult: 1, compMult: 1, lines: {},
    },
    fatma: {
      key: "fatma", name: "Hagga Fatma", short: "Fatma", sign: "الحاجة فاطمة · HAGGA FATMA · SINCE 1975", robe: ["#2e9e5b", "#1d6b3d"], skin: "#d4a07a",
      pitch: 1.4, rate: 1.0, drain: 1.3, drop: 0.85, gapAccept: 0.1, openMult: 0.9, compMult: 2,
      lines: {
        greet: ["Ahlan ya habibi! Come, sit! You look hungry. Did you eat? …Never mind, look at this beautiful {item}!", "Welcome, welcome! I've been in this shop since 1975. I know EVERY trick. Don't even try. 👵"],
        open: ["For you, my child: <b>{ask} pounds</b>. Don't make that face.", "<b>{ask}</b>. In my day this cost 5 piasters… but today, <b>{ask}</b>."],
        counter: ["{offer}?! Ya ibni, you want to make an old woman cry? <b>{ask}</b>.", "You remind me of my grandson… he also has no money. <b>{ask}</b>, final.", "Tsk tsk tsk… <b>{ask}</b>. And wear a jacket, it's cold outside!", "{offer}… my knees hurt just hearing this price. <b>{ask}</b>."],
        insult: ["{offer}?! Shame on you! I will call your mother!", "Ya salam! {offer}?! Even my cat would say no to that! 🐈", "{offer}?! In 50 years nobody insulted me like this. NOBODY."],
        compliment: ["Ya habibi, you are SO polite! Not like young people today. A better price for you! 😊", "You like my shop? My late husband built these shelves himself! You are a good child. ❤️"],
        compliment2: ["Ahh, you're sweet like basbousa. OK, a little more discount. A LITTLE."],
        complimentSpam: ["Yes yes, I know I'm wonderful. Now: a NUMBER, my child."],
        accept: ["Fine, fine! Take it, my child. But eat something, you're too thin! 🍲", "OK! Mabrouk! Come visit me again, and bring your mother."],
        chase: ["Wait, wait my child! Come back! An old woman can't run! <b>{ask}</b>!", "Ya ibni! Don't leave me! OK… <b>{ask}</b>, and I'll pray for you!"],
        kicked: ["YALLA! Out! …… OK come back. I'm not angry. Just disappointed. <b>{ask}</b>. 😤"],
        closed: ["That's it! I'm closing and going to watch my TV series! Ma'a salama! 📺"],
        letGo: ["Ma'a salama, my child… (she went back to her knitting 🧶)"],
        hurry: ["Hurry up, my child, my series starts in 10 minutes! 📺"],
      },
    },
    mido: {
      key: "mido", name: "Mido", short: "Mido", sign: "ميدو · MIDO · BEST PRICE ON INSTAGRAM", robe: ["#e3b23c", "#b9861c"], skin: "#b97a50",
      pitch: 1.1, rate: 1.25, drain: 0.8, drop: 1.15, gapAccept: 0.18, openMult: 1.25, compMult: 1,
      lines: {
        greet: ["Yooo bro! Welcome! Best shop in Khan el-Khalili, check my Instagram! 📱", "Habibi! Bro! Come in! You want a selfie with the {item}? Free! Buying it… not free. 😎"],
        open: ["For you bro? <b>{ask}</b>. Influencer price. 💯", "<b>{ask}</b> pounds, bro. Trust me, I have 12K followers."],
        counter: ["{offer}?! Bro… BRO. Come on. <b>{ask}</b>. 😩", "Wallahi bro, my boss will fire me. My boss is my dad. <b>{ask}</b>.", "OK ok ok… <b>{ask}</b>, and I tag you in my story! 📸", "Bro, that's crazy. Fine: <b>{ask}</b>. Don't tell my dad."],
        insult: ["{offer}?! Bro, is that a price or your phone battery? 😂", "BRO. {offer}?! I'm calling the police. The FASHION police.", "{offer}? Bro I'll give you my WiFi password for that, not the {item}."],
        compliment: ["Bro you're too kind! Follow me on Instagram and I give you a better price! 😎", "Thanks bro! You have good energy! Good energy = good price."],
        compliment2: ["Ayyy bro! OK, OK, small discount for the vibes. ✌️"],
        complimentSpam: ["Bro I know I'm cool. Give me a number now. 😎"],
        accept: ["DEAL bro! Let's take a selfie! 🤳", "OK fine, deal! You're a legend bro. 💯"],
        chase: ["BRO WAIT! Come back! OK ok, <b>{ask}</b>! Don't leave a bad review! ⭐⭐⭐⭐⭐", "BRO! Where you going?! <b>{ask}</b>, final final, I swear!"],
        kicked: ["Bro… that's it, OUT! …… jk jk come back. <b>{ask}</b>. 😅"],
        closed: ["Bro I'm closing, I have football with the boys. Yalla bye! ⚽"],
        letGo: ["OK bye bro! Follow me on Instagram though! 📱"],
        hurry: ["Bro hurry, my phone is at 2%! 🔋"],
      },
    },
  };
  const LL = (k) => (S && S.seller.lines[k]) || L[k];

  // ---------- state ----------
  let S = null;
  const Q = new URLSearchParams(location.search);
  const el = {
    intro: $("#intro"), game: $("#game"), start: $("#startBtn"), name: $("#playerName"), board: $("#boardList"),
    bubble: $("#bubble"), bubbleText: $("#bubbleText"), sayed: $("#sayed"), mouth: $("#mouth"), browL: $("#browL"), browR: $("#browR"),
    item: $("#itemName"), emoji: $("#itemEmoji"), ask: $("#askPrice"), saved: $("#savedPct"), hist: $("#history"),
    form: $("#offerForm"), offer: $("#offerIn"), offerBox: $(".offer-box"), time: $("#timeLeft"), tea: $(".tea"), liquid: $("#teaLiquid"),
    moodFace: $("#moodFace"), pat: $("#patBar"), final: $("#final"), finalText: $("#finalText"), finalYes: $("#finalYes"), finalNo: $("#finalNo"),
  };

  const ROBE_STOPS = $$("#galab stop");
  const SKIN = $$('#sayed [fill="#c68a5e"]');
  const HAND_STROKES = $$('#arm path').filter((n) => n.getAttribute("stroke") === "#c68a5e");
  function dressUp(sel) {
    el.sayed.dataset.look = sel.key;
    ROBE_STOPS[0].setAttribute("stop-color", sel.robe[0]); ROBE_STOPS[1].setAttribute("stop-color", sel.robe[1]);
    SKIN.forEach((n) => n.setAttribute("fill", sel.skin));
    HAND_STROKES.forEach((n) => n.setAttribute("stroke", sel.skin));
    $("#arm path").setAttribute("stroke", sel.robe[0]);
    $("#shopSign").textContent = sel.sign;
    $("#wantLbl").textContent = `${sel.short} wants`; $("#patLbl").textContent = `${sel.short}'s patience`;
    const t = document.querySelector(".gamebar .title"); if (t) t.textContent = `🛍️ Haggle with ${sel.name}`;
  }

  const MOODS = {
    happy: { m: "M136,206 Q160,228 184,206", bl: "M112,118 Q130,108 148,118", br: "M172,118 Q190,108 208,118", p: 0 },
    sly: { m: "M140,212 Q166,220 186,202", bl: "M112,110 Q130,98 148,110", br: "M172,122 L208,118", p: 4 },
    shocked: { m: "M146,212 Q160,192 174,212 Q160,234 146,212", bl: "M112,102 Q130,88 148,102", br: "M172,102 Q190,88 208,102", p: 0 },
    angry: { m: "M138,218 Q160,202 182,218", bl: "M112,108 L148,124", br: "M172,124 L208,108", p: 0 },
    sad: { m: "M138,220 Q160,206 182,220", bl: "M112,124 L148,110", br: "M172,110 L208,124", p: 0 },
    cry: { m: "M136,222 Q160,200 184,222", bl: "M112,126 L148,108", br: "M172,108 L208,126", p: 0 },
    laugh: { m: "M130,204 Q160,244 190,204 Z", bl: "M112,108 Q130,96 148,108", br: "M172,108 Q190,96 208,108", p: 0 },
  };
  function mood(name) {
    const m = MOODS[name] || MOODS.happy;
    el.sayed.setAttribute("class", "sayed mood-" + name + (el.sayed.classList.contains("talking") ? " talking" : ""));
    el.mouth.setAttribute("d", m.m); el.browL.setAttribute("d", m.bl); el.browR.setAttribute("d", m.br);
    $$(".pupil", el.sayed).forEach((p) => (p.style.transform = `translateX(${m.p}px)`));
  }
  // blink
  setInterval(() => { el.sayed.classList.add("blink"); setTimeout(() => el.sayed.classList.remove("blink"), 140); }, 3800);

  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const nice = (x) => (x >= 200 ? Math.round(x / 10) * 10 : Math.round(x / 5) * 5);
  const fill = (t) => t.replace(/\{ask\}/g, fmt(S.ask)).replace(/\{offer\}/g, fmt(S.lastTyped || 0)).replace(/\{item\}/g, S.item.n.split(" (")[0].toLowerCase());

  let talkT = null;
  function say(lines, md) {
    const t = fill(Array.isArray(lines) ? pick(lines) : lines);
    el.bubbleText.innerHTML = t;
    el.bubble.classList.remove("pop"); void el.bubble.offsetWidth; el.bubble.classList.add("pop");
    if (md) mood(md);
    el.sayed.classList.add("talking");
    clearTimeout(talkT);
    talkT = setTimeout(() => el.sayed.classList.remove("talking"), clamp(t.length * 45, 900, 4000));
    Voice.say(t.replace(/<[^>]+>/g, "").replace(/…/g, ", "), { pitch: S ? S.seller.pitch : 0.75, rate: S ? S.seller.rate : 1.08 });
    S && (S.lastAction = performance.now(), S.idleSaid = false);
  }

  // ---------- leaderboard ----------
  const today = EG.today;
  const loadBoard = () => Store.get("eg_haggle_board", []).filter((r) => r.d === today()).sort((a, b) => b.pct - a.pct);
  function renderBoard() {
    const b = loadBoard().slice(0, 6);
    el.board.innerHTML = b.length
      ? b.map((r) => `<li><span class="who">${esc(r.name)}<span class="what">${esc(r.item)} · paid ${fmt(r.paid)} EGP</span></span><span class="pct">-${r.pct}%</span></li>`).join("")
      : `<div class="empty">Nobody yet… be the first legend! 👑</div>`;
  }
  function saveBoard(rec) {
    const all = Store.get("eg_haggle_board", []).filter((r) => r.d === today());
    all.push(rec); all.sort((a, b) => b.pct - a.pct);
    Store.set("eg_haggle_board", all.slice(0, 50));
    return all.findIndex((r) => r === rec || (r.t === rec.t)) + 1;
  }

  // ---------- intro ----------
  function showIntro() {
    stopTimers();
    el.game.classList.remove("active"); el.intro.classList.add("active"); el.final.hidden = true;
    el.name.value = ""; renderBoard();
    setTimeout(() => el.name.focus(), 60);
  }
  el.start.onclick = start;
  el.name.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); start(); } });

  // ---------- game ----------
  let tick = null;
  function stopTimers() { clearInterval(tick); tick = null; Sfx.stopBeat(); Voice.stop(); }

  function start() {
    if (el.game.classList.contains("active")) return;
    Sfx.unlock(); Sfx.pop();
    const item = pick(ITEMS);
    const seller = SELLERS[Q.get("seller")] || pick(Object.values(SELLERS));
    const open = nice(item.c * rand(9, 14) * seller.openMult);
    const total = +Q.get("t") || 150;
    const evKinds = EG.shuffle(["phone", "rival", "tea", "cat", "bundle", "blackout"]);
    const forced = Q.get("ev");
    S = {
      seller, total, evAt: forced ? { [total - 4]: forced } : { [total - 28]: evKinds[0], [total - 68]: evKinds[1], [total - 105]: evKinds[2] }, ev: null, rival: 0, phone: 0, bundle: null, gift: null,
      name: el.name.value.trim() || "Mystery Haggler", item, open, ask: open, floor: nice(item.c * rand(1.15, 1.5)),
      patience: 100, lastOffer: 0, lastTyped: 0, rounds: 0, boost: 0, ghali: 0, lastGhaliRound: -5, compliments: 0, walks: 0, kicks: 0,
      timeLeft: total, over: false, busy: false, hist: [], lastAction: performance.now(), idleSaid: false, hurried: false,
    };
    el.intro.classList.remove("active"); el.game.classList.add("active");
    el.item.textContent = item.n; el.emoji.textContent = item.e;
    el.hist.innerHTML = ""; el.final.hidden = true;
    $$(".tactics .btn").forEach((b) => b.classList.remove("used"));
    dressUp(seller);
    hideEvent();
    updateHud(true);
    mood("happy");
    say(LL("greet"), "happy");
    setTimeout(() => { if (S && !S.over && S.rounds === 0 && !S.busy) say(LL("open"), "sly"); }, 2600);
    addHist(`Start: ${fmt(S.ask)}`, true);
    el.offer.value = ""; el.offer.disabled = false; setTimeout(() => el.offer.focus(), 50);
    Sfx.startBeat(100);
    tick = setInterval(onTick, 1000);
  }

  function onTick() {
    if (!S || S.over) return;
    if (S.busy) return;
    S.timeLeft--;
    if (S.phone > 0 && --S.phone === 0) { say(S.seller.key === "fatma" ? "Sorry my child, that was my sister. She talks a LOT. Where were we?" : S.seller.key === "mido" ? "Sorry bro, that was my girlfriend. Where were we?" : "Sorry habibi, my wife. She wants tomatoes. Where were we?", "happy"); hideEvent(); }
    if (S.rival > 0) {
      S.rival--;
      const c = $("#hevent .hc"); if (c) c.textContent = S.rival + "s";
      if (S.rival === 0) { S.ask = Math.min(S.open, nice(S.ask * 1.12)); addHist(`⬆️ ${fmt(S.ask)}`, true); Sfx.buzz(); say(["You see?! The other customer wants it! Price is now <b>{ask}</b>! 📈", "Too slow, habibi! Demand is HIGH! <b>{ask}</b> now!"], "sly"); hideEvent(); }
    }
    if (S.evAt[S.timeLeft] && !S.ev) startHEvent(S.evAt[S.timeLeft]);
    updateHud();
    if (S.timeLeft === 20 && !S.hurried) { S.hurried = true; say(LL("hurry"), "sly"); Sfx.setTempo(140); }
    if (S.timeLeft <= 10 && S.timeLeft > 0) Sfx.tick();
    if (S.timeLeft <= 0) return timeUp();
    if (performance.now() - S.lastAction > 25000 && !S.idleSaid) { say(LL("idle"), "sly"); S.idleSaid = true; }
  }

  function updateHud(first) {
    const prev = el.ask.textContent;
    el.ask.textContent = fmt(S.ask);
    if (!first && prev !== el.ask.textContent) { el.ask.classList.remove("drop"); void el.ask.offsetWidth; el.ask.classList.add("drop"); }
    el.saved.textContent = Math.round(((S.open - S.ask) / S.open) * 100) + "%";
    el.time.textContent = Math.max(0, S.timeLeft);
    el.liquid.style.height = Math.min(100, (S.timeLeft / S.total) * 100) + "%";
    el.tea.classList.toggle("urgent", S.timeLeft <= 15);
    const p = clamp(S.patience, 0, 100);
    el.pat.style.width = Math.max(4, p) + "%";
    el.pat.style.backgroundPosition = `${100 - p}% 0`;
    el.moodFace.textContent = p > 75 ? "😊" : p > 50 ? "🙂" : p > 30 ? "😐" : p > 12 ? "😠" : "🤬";
  }
  function addHist(html, sayed) {
    const s = document.createElement("span");
    s.className = sayed ? "" : "you"; s.innerHTML = html;
    el.hist.appendChild(s);
    while (el.hist.children.length > 8) el.hist.firstChild.remove();
  }
  function setAsk(v) {
    const nv = Math.max(S.floor, nice(v));
    if (nv < S.ask) { Sfx.coin(); addHist(`<s>${fmt(nv)}</s>`, true); }
    S.ask = Math.min(S.ask, nv);
  }

  // ---------- actions ----------
  function offer(raw) {
    if (!S || S.over || S.busy) return;
    const o = parseInt(String(raw).replace(/[^0-9]/g, ""), 10);
    el.offer.value = "";
    if (isNaN(o)) { say(LL("number"), "shocked"); shakeBox(); return; }
    S.lastTyped = o;
    if (o <= 0) { say(LL("zero"), "shocked"); shakeBox(); S.patience -= 10; return afterAction(); }
    addHist(`You: ${fmt(o)}`);
    if (o >= S.ask) return deal(o, o > S.ask ? "overpay" : "accept");
    if (S.lastOffer && o < S.lastOffer) { S.patience -= 15; Sfx.buzz(); say(LL("backwards"), "angry"); return afterAction(); }
    if (o === S.lastOffer) { S.patience -= 8; say(LL("same"), "angry"); return afterAction(); }
    S.lastOffer = o; S.rounds++;
    if (S.rival > 0) { S.rival = 0; hideEvent(); EG.toast("🧳 The other tourist got bored and left. Phew!", 2200); }
    const ga = S.seller.gapAccept + (S.phone > 0 ? 0.2 : 0);
    if (o >= S.floor) {
      const gap = (S.ask - o) / S.ask;
      // he only gives in when the gap is small, or the customer has been stubborn for a while
      if (gap < ga || (S.phone > 0 && Math.random() < 0.5) || (S.rounds >= 4 && gap < 0.3 && Math.random() < 0.5) || (S.rounds >= 6 && gap < 0.45 && Math.random() < 0.5)) return deal(o, "accept");
      const na = nice(S.ask - (S.ask - o) * rand(0.32, 0.48));
      if (na - o < 10) return deal(o, "accept");
      setAsk(Math.max(na, o + 5)); S.patience -= 4;
      say(LL("counter"), pick(["sad", "sly"]));
    } else if (o >= S.floor * 0.45) {
      setAsk(S.ask - (S.ask - S.floor) * (0.2 + S.boost + rand(0, 0.08)) * S.seller.drop);
      S.patience -= 7 * S.seller.drain;
      say(LL("counter"), pick(["sad", "sly", "shocked"]));
      Sfx.tone(200, 0.2, { type: "triangle", vol: 0.2 });
    } else {
      S.patience -= 22 * S.seller.drain; // insults never lower the price
      Sfx.boing();
      say(LL("insult"), "shocked");
    }
    afterAction();
  }

  function tactic(t) {
    if (!S || S.over || S.busy) return;
    Sfx.click();
    if (t === "ghali") {
      if (S.ghali < 2 && S.rounds + S.ghali > S.lastGhaliRound) {
        S.ghali++; S.lastGhaliRound = S.rounds + S.ghali;
        setAsk(S.ask - (S.ask - S.floor) * rand(0.12, 0.2));
        S.patience -= 5;
        say(LL("ghali"), "shocked");
      } else { S.patience -= 12; say(LL("ghaliSpam"), "angry"); }
      addHist("You: 😱 Ghali!");
    } else if (t === "compliment") {
      S.compliments++;
      if (S.compliments === 1) { S.boost += 0.1 * S.seller.compMult; S.patience = Math.min(100, S.patience + 20 * S.seller.compMult); say(LL("compliment"), "laugh"); Sfx.ding(); }
      else if (S.compliments === 2) { S.boost += 0.05; S.patience = Math.min(100, S.patience + 6); setAsk(S.ask * 0.97); say(LL("compliment2"), "happy"); }
      else { S.patience -= 6; say(LL("complimentSpam"), "sly"); }
      addHist("You: 😍");
    } else if (t === "walk") {
      return walkAway();
    } else if (t === "deal") {
      return deal(S.ask, "accept");
    }
    afterAction();
  }

  async function walkAway() {
    S.busy = true; S.walks++;
    addHist("You: 🚶 bye!");
    el.offer.disabled = true;
    say(["…", "Wait… where are you going? 😳"], "shocked");
    if (S.rival > 0) { S.rival = 0; hideEvent(); }
    Sfx.tone(300, 0.6, { type: "triangle", vol: 0.15, slide: 150 });
    el.sayed.style.transition = "transform .6s"; el.sayed.style.transform = "translateX(-6%) scale(.97)";
    await sleep(1600);
    el.sayed.style.transform = "";
    if (S.over) return;
    const chance = S.walks === 1 ? 0.8 : S.walks === 2 ? 0.45 : 0.1;
    if (S.ask > S.floor * 1.1 && Math.random() < chance) {
      setAsk(S.ask - (S.ask - S.floor) * rand(0.22, 0.36));
      say(LL("chase"), "cry");
      Sfx.whoosh();
      S.busy = false; el.offer.disabled = false; el.offer.focus();
      afterAction();
    } else {
      say(LL("letGo"), "happy");
      await sleep(2200);
      lose("walk");
    }
  }

  function afterAction() {
    updateHud();
    if (S.patience <= 0 && !S.over) {
      S.kicks++;
      if (S.kicks === 1) {
        S.patience = 45; setAsk(S.ask * 0.95);
        say(LL("kicked"), "angry"); Sfx.buzz();
        document.body.classList.add("shake"); setTimeout(() => document.body.classList.remove("shake"), 600);
        updateHud();
      } else {
        S.busy = true; say(LL("closed"), "angry"); Sfx.buzz();
        setTimeout(() => lose("closed"), 2400);
      }
    }
    if (!S.busy) el.offer.focus();
  }

  function shakeBox() { el.offerBox.classList.remove("shake"); void el.offerBox.offsetWidth; el.offerBox.classList.add("shake"); }

  function timeUp() {
    S.busy = true; Sfx.stopBeat();
    el.offer.disabled = true;
    say("Tea is finished! ☕ Last price: <b>{ask}</b>. Yes or no?", "sly");
    el.finalText.innerHTML = `${S.seller.name}'s last price: <b>${fmt(S.ask)} EGP</b><br>(he started at ${fmt(S.open)})`;
    el.final.hidden = false;
    setTimeout(() => el.finalYes.focus(), 50);
  }
  el.finalYes.onclick = () => { if (S && !S.over) { el.final.hidden = true; deal(S.ask, "accept"); } };
  el.finalNo.onclick = () => { if (S && !S.over) { el.final.hidden = true; lose("walk"); } };

  // ---------- live events ----------
  const hev = $("#hevent");
  function hideEvent() { hev.hidden = true; hev.innerHTML = ""; if (S) S.ev = null; }
  function showHEvent(title, text, extra) { hev.innerHTML = `<div class="ht">${title}</div><div class="hx">${text}</div>${extra || ""}`; hev.hidden = false; Sfx.fanfare(); }
  function startHEvent(k) {
    if (S.over || S.busy) return;
    S.ev = k;
    const sh = S.seller.short;
    if (k === "phone") {
      S.phone = 7;
      showHEvent("📱 RING RING!", `${sh}'s phone is ringing! While they're distracted, <b>make an offer NOW</b>, they might just say yes!`);
      say(S.seller.key === "mido" ? "Aloo? Yes babe… no babe… the blue one babe… 📱" : S.seller.key === "fatma" ? "Aloo? Yes sister… what?! Her daughter got engaged?! Tell me EVERYTHING… 📞" : "Aiwa habibti… yes… tomatoes… 2 kilos… and cucumbers? Yes yes… 📞", "happy");
    } else if (k === "rival") {
      S.rival = 9;
      showHEvent("🧳 ANOTHER TOURIST WALKS IN!", "“Ooh, I'll pay full price for that!” Make an offer fast or the price goes UP!", '<div class="hc">9s</div>');
      say(["Oh! A new customer! He likes the {item} too… 😏", "You hear that? Someone else wants it! Hurry, habibi!"], "sly");
    } else if (k === "tea") {
      S.patience = Math.min(100, S.patience + 30); S.timeLeft += 15;
      showHEvent("🫖 TEA TIME!", "The tea boy arrives with fresh mint tea! <b>+15 seconds</b> and everyone is in a better mood. ☕");
      say(["Shai! Sugar? 3 spoons? 5? Egyptians say 5! 😄", "Ahh, tea! Now we can negotiate like civilized people."], "laugh");
      Sfx.ding(); setTimeout(() => { if (S && S.ev === "tea") hideEvent(); }, 3200);
    } else if (k === "cat") {
      S.patience -= 12; setAsk(S.ask * 0.94);
      showHEvent("🐈 CRASH!", "The shop cat knocked a vase off the shelf! It's broken… and someone is very sad.");
      say(S.seller.key === "mido" ? "BRO! The cat! That was for my TikTok! 😭 …OK whatever, <b>{ask}</b>, I'm too sad to argue." : "Ya ganna'! The cat! …ma3lesh. The cat is the real boss here. I'm too sad to argue: <b>{ask}</b>. 😔", "sad");
      Sfx.noise(0.4, { vol: 0.5, f: 3000, q: 0.5 }); Sfx.tone(1800, 0.15, { type: "triangle", vol: 0.1, when: 0.05 });
      setTimeout(() => { if (S && S.ev === "cat") hideEvent(); }, 3500);
      afterAction();
    } else if (k === "bundle") {
      S.busy = true; el.offer.disabled = true;
      const other = pick(ITEMS.filter((i) => i !== S.item));
      const otherOpen = nice(other.c * rand(9, 13) * S.seller.openMult);
      const price = nice(S.ask * 1.3);
      S.bundle = { other, otherOpen, price };
      showHEvent("🎁 SPECIAL BUNDLE OFFER!", `Take the <b>${esc(S.item.n.split(" (")[0])}</b> ${S.item.e} AND a <b>${esc(other.n.split(" (")[0])}</b> ${other.e} together for only <b>${fmt(price)} EGP</b>?`,
        '<div class="hb"><button class="btn green" id="bYes">🎁 Take both <span class="key">Y</span></button><button class="btn red" id="bNo">🙅 Just one <span class="key">N</span></button></div>');
      say(["Habibi, wait! I have an IDEA! 💡 Two for the price of… almost two!", "Listen, listen… what if you take TWO? Special combo! 🎁"], "sly");
      $("#bYes").onclick = () => bundleChoice(true);
      $("#bNo").onclick = () => bundleChoice(false);
    } else if (k === "blackout") {
      S.busy = true; el.offer.disabled = true;
      const b = $("#blackout"); b.hidden = false;
      Sfx.thud(); Sfx.stopBeat();
      say("Don't worry! It happens every day! …while it's dark, a special <b>darkness discount</b>! 🕯️", "laugh");
      setTimeout(() => {
        b.hidden = true;
        if (!S || S.over) return;
        setAsk(S.ask * 0.92); S.busy = false; el.offer.disabled = false; el.offer.focus();
        Sfx.startBeat(S.hurried ? 140 : 100); S.ev = null; updateHud();
      }, 3000);
    }
  }
  function bundleChoice(yes) {
    if (!S || !S.bundle || S.over || !S.busy) return;
    hideEvent();
    S.busy = false; el.offer.disabled = false;
    if (yes) { S.bundle.taken = true; deal(S.bundle.price, "bundle"); }
    else { S.bundle = null; say(["OK OK, just asking! No problem! 😅", "Your loss, habibi! Back to business: <b>{ask}</b>."], "happy"); el.offer.focus(); }
  }

  // ---------- endings ----------
  function tier(p) {
    if (p >= 88) return { t: "Sayed is crying in the back room 😭", title: "GRANDMASTER HAGGLER", m: "win" };
    if (p >= 80) return { t: "Khan el-Khalili Legend 👑", title: "LEGEND", m: "win" };
    if (p >= 65) return { t: "Cairo Local 🇪🇬", title: "CAIRO LOCAL", m: "win" };
    if (p >= 40) return { t: "Smart Traveler 🧭", title: "SMART TRAVELER", m: "meh" };
    return { t: "Tourist Level 🧳 (Sayed is buying a new car with your money)", title: "TOURIST", m: "lose" };
  }

  async function deal(paid, kind) {
    if (S.over) return;
    S.over = true; S.busy = true;
    stopTimersSoft();
    el.offer.disabled = true;
    hideEvent();
    const bundle = kind === "bundle" && S.bundle;
    const openAll = bundle ? S.open + S.bundle.otherOpen : S.open;
    const costAll = bundle ? S.item.c + S.bundle.other.c : S.item.c;
    S.ask = paid; updateHud();
    const pct = Math.round(((openAll - paid) / openAll) * 100);
    const tr = Object.assign({}, tier(pct));
    const sn = S.seller.short;
    tr.t = tr.t.replace("Sayed", sn);
    if (S.compliments >= 1 && pct >= 45 && Math.random() < 0.6) {
      S.gift = pick([
        { e: "🔖", n: "a bookmark with your name in hieroglyphs", c: true },
        { e: "🧲", n: "a camel fridge magnet" },
        { e: "🧿", n: "a lucky keychain" },
        { e: "🍬", n: "a handful of Egyptian candy" },
      ]);
    }
    if (bundle) say(["TWO items! You're my favorite customer! 🎁😂", "Mabrouk! Double happiness! (and double profit, shhh)"], "laugh");
    else if (kind === "overpay") say(LL("overpay"), "laugh");
    else if (pct >= 80) say(LL("accept"), "cry");
    else if (pct >= 60) say(LL("accept"), "sad");
    else say(["Mabrouk! Excellent deal! For ME! Hahaha! 😂", "Deal! Mabrouk ya habibi! (he is laughing all the way to the bank 🏦)"], "laugh");
    Sfx.coin(); setTimeout(() => Sfx.coin(), 150);
    const rec = { name: S.name, item: bundle ? "Bundle: 2 items" : S.item.n.split(" (")[0], paid, pct, d: today(), t: Date.now() };
    const rank = saveBoard(rec);
    EG.Stats.bump("deals");
    await sleep(2800);
    Voice.stop();
    const profit = paid - costAll;
    const itemName = esc(S.item.n.split(" (")[0]);
    let headline = `You bought the <b>${itemName}</b> for <b>${fmt(paid)} EGP</b>. ${esc(S.seller.name)} started at ${fmt(S.open)}!`;
    if (bundle) headline = `BUNDLE BOSS! 🎁 You walked out with the <b>${itemName}</b> AND the <b>${esc(S.bundle.other.n.split(" (")[0])}</b> for <b>${fmt(paid)} EGP</b>. Good deal? …${pct >= 60 ? "Actually, YES!" : "Let's just say " + esc(sn) + " is VERY happy. 😏"}`;
    else if (kind === "overpay") headline = `You paid <b>MORE</b> than ${esc(sn)} asked for?! 🤯 ${esc(sn)} will tell this story at every family dinner for the next 20 years.`;
    else if (S.rounds === 0 && pct < 15) headline = `You didn't even haggle!!! 😱 ${esc(sn)} is doing a happy dance in the back room. 💃 In Egypt, that's almost illegal!`;
    const giftHtml = S.gift ? `<div class="gift">🎁 ${esc(sn)} loved your compliments and gave you a FREE gift: ${S.gift.e} ${S.gift.n}!${S.gift.c && S.name !== "Mystery Haggler" ? EG.cartoucheHTML(S.name) : ""}</div>` : "";
    showClosure({
      mood: tr.m,
      emoji: S.item.e,
      phrase: tr.m === "lose" ? { ar: "يا خسارة!", en: "Ya Khosara!", tr: "What a loss! (your wallet is crying)", gloss: "<b>Khosara</b> = loss / what a pity" } : undefined,
      headline,
      stats: [
        { v: `${pct}%`, k: "Discount" },
        { v: fmt(paid), k: "You paid (EGP)" },
        { v: tr.title, k: "Your rank" },
      ],
      extra: `<div class="receipt">
        <div class="t">🧾 ${esc(S.seller.name.toUpperCase())} SOUVENIRS</div>
        First price ........ ${fmt(openAll)} EGP<br>
        You paid ........... ${fmt(paid)} EGP<br>
        Real cost (shhh 🤫) . ${fmt(costAll)} EGP<br>
        ${esc(sn)}'s profit ..... ${profit > 0 ? fmt(profit) + " EGP 😏" : "NOTHING 😭"}<br>
        <div class="rank">${tr.t}${rank > 0 && rank <= 10 ? ` · #${rank} today!` : ""}</div>
      </div>${giftHtml}`,
      onReplay: showIntro,
    });
  }
  function stopTimersSoft() { clearInterval(tick); tick = null; Sfx.stopBeat(); }

  async function lose(why) {
    if (S.over) return;
    S.over = true; stopTimersSoft(); Voice.stop();
    EG.Stats.bump("walkouts");
    const heads = {
      walk: "No deal! You walked out with nothing but memories… and the smell of incense. 🌫️",
      closed: `${esc(S.seller.name)} closed the shop and went home. You made someone leave their OWN shop. Impressive… kind of. 😅`,
    };
    showClosure({
      mood: "lose", emoji: why === "closed" ? "🔒" : "🚶",
      headline: heads[why] || heads.walk,
      stats: [{ v: fmt(S.open), k: "His first price" }, { v: fmt(S.ask), k: "His last price" }, { v: fmt(S.item.c), k: "Real cost 🤫" }],
      signoff: "Pro tip: in Egypt, walking away works… but only once or twice! 😉",
      onReplay: showIntro,
    });
  }

  // ---------- input ----------
  el.form.addEventListener("submit", (e) => { e.preventDefault(); offer(el.offer.value); });
  el.offer.addEventListener("input", () => { const v = el.offer.value.replace(/[^0-9]/g, ""); if (v !== el.offer.value) el.offer.value = v; Sfx.tick(); });
  el.offer.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    const map = { g: "ghali", c: "compliment", w: "walk", d: "deal" };
    if (map[k] && !e.ctrlKey && !e.metaKey) { e.preventDefault(); tactic(map[k]); }
  });
  $$(".tactics .btn").forEach((b) => b.addEventListener("click", () => { tactic(b.dataset.t); }));
  addEventListener("keydown", (e) => {
    if (S && S.bundle && !S.bundle.taken && S.busy && !hev.hidden) {
      if (e.key.toLowerCase() === "y") { e.preventDefault(); bundleChoice(true); } else if (e.key.toLowerCase() === "n") { e.preventDefault(); bundleChoice(false); }
      return;
    }
    if (!el.final.hidden) {
      if (e.key === "Enter") { e.preventDefault(); el.finalYes.click(); }
      else if (e.key.toLowerCase() === "n") el.finalNo.click();
      return;
    }
    if (e.target && e.target.tagName === "INPUT") return;
    if (!el.game.classList.contains("active")) { if (e.key === "Enter") start(); return; }
    const k = e.key.toLowerCase();
    const map = { g: "ghali", c: "compliment", w: "walk", d: "deal" };
    if (map[k]) tactic(map[k]);
    else if (/^[0-9]$/.test(k) && !el.offer.disabled) { el.offer.focus(); }
  });

  window.__haggle = { get S() { return S; }, ev: (k) => startHEvent(k) };
  showIntro();
})();
