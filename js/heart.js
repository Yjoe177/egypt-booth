(function () {
  "use strict";
  const { $, Sfx, pick, shuffle, clamp, sleep, esc, cartoucheHTML, showClosure, mountGamebar, Confetti } = EG;

  mountGamebar("⚖️ Weighing of the Heart");

  // ---------- question pool: [text, weight 1-3] ----------
  const POOL = [
    ["Have you ever said “I'm on my way!” while still in bed?", 2, "你有没有躺在床上还说“我在路上了”？"],
    ["Have you ever eaten food from the shared fridge that wasn't yours?", 3, "你有没有偷吃过共用冰箱里别人的食物？"],
    ["Have you ever pretended to know the lyrics and just mumbled?", 1, "你有没有假装会唱歌词，其实只是在哼哼？"],
    ["Have you ever laughed at a joke you didn't understand?", 1, "你有没有听不懂笑话却跟着笑？"],
    ["Have you ever left someone on “seen” on purpose?", 2, "你有没有故意“已读不回”？"],
    ["Have you ever typed “hahaha” with a totally straight face?", 1, "你有没有面无表情地打出“哈哈哈”？"],
    ["Have you ever blamed a bad smell on someone else?", 3, "你有没有把难闻的味道赖到别人身上？"],
    ["Have you ever started an assignment the night before the deadline?", 2, "你有没有在截止日期前一晚才开始写作业？"],
    ["Have you ever pretended to be on the phone to avoid someone?", 2, "你有没有假装打电话来躲开某人？"],
    ["Have you ever re-gifted a present you got?", 2, "你有没有把收到的礼物再转送给别人？"],
    ["Have you ever worn gym clothes all day… and never went to the gym?", 1, "你有没有穿了一整天运动服……却根本没去健身房？"],
    ["Have you ever googled yourself?", 1, "你有没有在网上搜索过自己的名字？"],
    ["Have you ever said “just one fry” and took five?", 2, "你有没有说“就吃一根薯条”，结果拿了五根？"],
    ["Have you ever waved back at someone who was waving at someone else?", 1, "你有没有对别人挥手，结果人家是在跟别人打招呼？"],
    ["Have you ever cheated in a board game?", 3, "你有没有在桌游里作弊？"],
    ["Have you ever fallen asleep in a lecture?", 2, "你有没有在课堂上睡着过？"],
    ["Have you ever watched the next episode WITHOUT your friend?", 3, "你有没有背着朋友偷偷看了下一集？"],
    ["Have you ever said “my phone died” when it didn't?", 3, "你有没有骗人说“我手机没电了”？"],
    ["Have you ever pushed a door that clearly said PULL?", 1, "你有没有推过一扇明明写着“拉”的门？"],
    ["Have you ever pretended to type something important when the teacher walked by?", 2, "老师走过来时，你有没有假装在打很重要的东西？"],
    ["Have you ever said “5 more minutes” and slept 2 more hours?", 2, "你有没有说“再睡五分钟”，结果多睡了两个小时？"],
    ["Have you ever ignored a call and then texted “what's up?”", 2, "你有没有不接电话，然后发消息问“怎么了？”"],
    ["Have you ever taken the last slice of pizza without asking?", 3, "你有没有没问别人就拿走了最后一块披萨？"],
    ["Have you ever won an argument… in the shower… days later?", 1, "你有没有几天后在洗澡时才“赢”了一场争论？"],
    ["Have you ever accidentally liked a very old photo while stalking someone?", 3, "你有没有在偷看别人主页时不小心点赞了很久以前的照片？"],
    ["Have you ever blamed the Wi-Fi to escape a video call?", 3, "你有没有用“网不好”当借口逃避视频通话？"],
    ["Have you ever clicked “I have read the terms and conditions”?", 2, "你有没有勾选过“我已阅读条款和条件”？"],
    ["Have you ever said “I'm fine” when you were very much NOT fine?", 1, "你有没有明明很不好，却说“我没事”？"],
    ["Have you ever eaten something that fell on the floor (5-second rule)?", 1, "你有没有吃过掉在地上的东西（五秒规则）？"],
    ["Have you ever told your mom you ate, when you didn't?", 2, "你有没有骗妈妈说你已经吃过饭了？"],
    ["Have you ever copied a friend's homework “just to check”?", 3, "你有没有“只是参考一下”抄了朋友的作业？"],
    ["Have you ever pretended you didn't see someone in the street?", 2, "你有没有在街上假装没看见某人？"],
  ];
  const N_Q = 7;

  const YES_LINES = {
    3: ["Ooh. A BIG one. Thoth needs a second papyrus. 📜📜", "Ammit just put on a bib. 🍽️", "Anubis gasped. Gods don't gasp. He gasped. 😱", "The scale made a sound. Scales don't make sounds."],
    2: ["Writing it down… in CAPITAL LETTERS.", "The heart gets heavier… 💀", "Anubis is disappointed, but not surprised.", "Ammit's stomach is growling. 🐊"],
    1: ["A tiny sin. Like a sesame seed. Still counts!", "Hmm, small… but the gods see EVERYTHING.", "Even the feather judged you a little. 🪶", "Noted. Lightly. With a small pencil."],
  };
  const NO_LINES = ["The feather believes you. For now. 🪶", "A pure soul… or a very skilled liar? 🤨", "Hmm. Suspicious… but okay.", "Your friends are making faces. Just saying. 👀", "Light as a feather! (allegedly)", "Anubis squints at you… and lets it go."];

  const TRIVIA = [
    ["How did ancient Egyptians remove the brain during mummification?", ["Through the nose 👃", "Through the ear 👂", "They kept it 🧠"], 0, "With a hook, through the nose. Then they threw it away!", "古埃及人制作木乃伊时，怎样取出大脑？", ["从鼻子", "从耳朵", "保留大脑"]],
    ["Which animal was sacred and pampered in ancient Egypt?", ["Cats 🐈", "Hamsters 🐹", "Penguins 🐧"], 0, "Cats! Hurting one was a serious crime.", "在古埃及，哪种动物被视为神圣、备受宠爱？", ["猫", "仓鼠", "企鹅"]],
    ["What did pyramid builders get as part of their pay?", ["Bread & beer 🍞", "Gold coins 🪙", "Camels 🐪"], 0, "Bread and beer, every day. Not slaves: paid workers!", "建造金字塔的工人拿什么当工资？", ["面包和啤酒", "金币", "骆驼"]],
    ["What finally helped scholars read hieroglyphs in 1822?", ["The Rosetta Stone 🪨", "A talking Sphinx 🦁", "Google Translate 📱"], 0, "The Rosetta Stone had the same text in 3 scripts.", "1822年，是什么帮助学者读懂了象形文字？", ["罗塞塔石碑", "会说话的狮身人面像", "谷歌翻译"]],
    ["What is Egypt's famous dish of rice, lentils & pasta?", ["Koshary 🍲", "Pizza 🍕", "Sushi 🍣"], 0, "Koshary! With tomato sauce and crispy onions.", "埃及著名的米饭、扁豆和意面混合料理叫什么？", ["库沙丽", "披萨", "寿司"]],
    ["Which river is the lifeline of Egypt?", ["The Nile 🌊", "The Amazon 🐊", "The Thames 🇬🇧"], 0, "The Nile: almost every Egyptian lives near it.", "哪条河是埃及的生命线？", ["尼罗河", "亚马逊河", "泰晤士河"]],
    ["Which board game did Egyptians play 5,000 years ago?", ["Senet 🎲", "Monopoly 💸", "UNO 🃏"], 0, "Senet! Even Tutankhamun was buried with one.", "5000年前埃及人玩什么棋盘游戏？", ["塞尼特棋", "大富翁", "UNO"]],
    ["Whose tomb was found almost untouched in 1922?", ["Tutankhamun 👑", "Cleopatra 🐍", "Napoleon 🎩"], 0, "King Tut, with more than 5,000 treasures inside.", "1922年，谁的陵墓几乎完好无损地被发现？", ["图坦卡蒙", "埃及艳后", "拿破仑"]],
    ["Which organ did Egyptians think held your mind?", ["The heart ❤️", "The brain 🧠", "The stomach 🍔"], 0, "The heart! That's why it's on this scale right now.", "古埃及人认为哪个器官承载着人的思想？", ["心脏", "大脑", "胃"]],
  ];

  const JOBS = {
    vip: ["Official taste-tester of heavenly koshary 🍲", "Captain of the gods' private felucca ⛵", "Head of the Afterlife Cat Café 🐈"],
    pure: ["Pyramid tour guide (forever, but with good tips) 🔺", "Professional Nile sunset watcher 🌅", "Assistant to the Sphinx (mostly holding its nose) 🦁"],
    meh: ["Cairo traffic officer, 500-year contract 🚦", "Nile mosquito (a cute one) 🦟", "Papyrus delivery boy 📜", "Pharaoh's personal DJ (only plays 1 song) 🎧"],
    bad: ["Ammit's dinner 🍽️", "Ammit's toothpick 🦷", "Background extra in Ammit's stomach 🎬"],
    spicy: ["Sent back to Earth for a re-try 🔄", "Ammit's hot sauce supplier 🌶️"],
  };

  // ---------- state ----------
  let qs = [], idx = 0, W = 0, MAXW = 1, answers = [], liarChecks = 0, liesCaught = 0, busy = false, name = "";
  let evPlan = {}, doubleNext = false, speedNext = false, speedTimer = null, bribed = null, quiz = { right: 0, wrong: 0 }, eventsSeen = [], evtKeys = null;
  let angle = 0, angVel = 0, angTarget = 0, wobble = 0, rafId = null;

  const el = {
    intro: $("#intro"), game: $("#game"), start: $("#startBtn"), nameIn: $("#playerName"), namePrev: $("#namePreview"),
    qcard: $("#qcard"), qnum: $("#qnum"), qtext: $("#qtext"), yes: $("#yesBtn"), no: $("#noBtn"), answers: $("#answers"),
    liar: $("#liar"), liarBtn: $("#liarBtn"), truthBtn: $("#truthBtn"), thoth: $("#thoth"), thothText: $("#thothText"), evt: $("#evt"),
    qzh: $("#qzh"), progress: $("#progress"), beam: $("#beam"), panL: $("#panL"), panR: $("#panR"), heartInner: $("#heartInner"), heartPath: $("#heartPath"),
    heartMouth: $("#heartMouth"), sweat: $("#sweat"), ammit: $("#ammit"), ammitSay: $("#ammitSay"), weightLabel: $("#weightLabel"),
    verdict: $("#verdict"), rays: $("#rays"), scaleWrap: $("#scaleWrap"), heartG: $("#heartG"), feather: $("#feather"), cat: $("#cat"), kFeather: $("#kFeather"),
  };

  // ---------- intro ----------
  el.nameIn.addEventListener("input", () => {
    const v = el.nameIn.value.trim();
    el.namePrev.innerHTML = v ? cartoucheHTML(v) : "";
    if (v) Sfx.tick();
  });
  el.nameIn.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); start(); } });
  el.start.onclick = start;

  function showIntro() {
    el.game.classList.remove("active"); el.intro.classList.add("active");
    el.nameIn.value = ""; el.namePrev.innerHTML = "";
    el.rays.classList.remove("on");
    clearInterval(speedTimer);
    setTimeout(() => el.nameIn.focus(), 60);
  }

  function start() {
    if (el.game.classList.contains("active")) return;
    Sfx.unlock(); Sfx.pop();
    name = el.nameIn.value.trim();
    qs = shuffle(POOL).slice(0, N_Q);
    MAXW = qs.reduce((s, q) => s + q[1], 0);
    idx = 0; W = 0; answers = []; liarChecks = 0; liesCaught = 0; busy = false;
    doubleNext = false; speedNext = false; bribed = null; quiz = { right: 0, wrong: 0 }; eventsSeen = []; evtKeys = null;
    // plan 2-3 surprise events between questions
    const evs = shuffle(["bastet", "bribe", "quiz", "friend", "speed", "sneeze", "quiz"]).filter((v, i, a) => a.indexOf(v) === i);
    evPlan = { 1: evs[0], 3: evs[1] };
    if (Math.random() < 0.6) evPlan[5] = evs[2];
    angle = -14; angVel = 0; wobble = 0;
    el.intro.classList.remove("active"); el.game.classList.add("active");
    el.verdict.hidden = true; el.liar.hidden = true; el.evt.hidden = true; el.answers.hidden = false;
    el.ammit.className = "ammit"; el.ammit.style.removeProperty("transform"); el.ammit.style.setProperty("--rise", "85%");
    el.ammitSay.classList.remove("on");
    el.heartG.style.transition = ""; el.heartG.style.opacity = 1;
    el.heartG.setAttribute("transform", "translate(0,118)");
    el.feather.style.transform = ""; el.feather.classList.remove("gone"); el.kFeather.hidden = true; el.cat.hidden = true;
    el.scaleWrap.classList.add("heart-pulse");
    el.progress.innerHTML = qs.map(() => "<i></i>").join("");
    say(name ? `"Welcome, ${esc(name)}. Your heart is on the scale. Answer honestly…"` : `"Your heart is on the scale. Answer honestly…"`);
    updateHeart();
    Sfx.startBeat(92);
    if (!rafId) loop();
    setTimeout(showQuestion, 600);
  }

  // ---------- scale physics ----------
  function loop() {
    const k = 0.035, damp = 0.88;
    const target = angTarget + (wobble ? Math.sin(performance.now() / 140) * wobble : 0);
    angVel = (angVel + (target - angle) * k) * damp;
    angle += angVel;
    const a = (angle * Math.PI) / 180, L = 220;
    el.beam.setAttribute("transform", `rotate(${-angle} 300 91)`);
    el.panL.setAttribute("transform", `translate(${300 - L * Math.cos(a)} ${91 + L * Math.sin(a)})`);
    el.panR.setAttribute("transform", `translate(${300 + L * Math.cos(a)} ${91 - L * Math.sin(a)})`);
    if (!el.kFeather.hidden) placeOn(el.kFeather, el.feather, -0.1);
    if (!el.cat.hidden && el.cat.dataset.on) placeOn(el.cat, el.cat.dataset.on === "L" ? el.heartG : el.feather, -0.5);
    rafId = requestAnimationFrame(loop);
  }
  function placeOn(node, target, dy) {
    const r = target.getBoundingClientRect(); const n = node.getBoundingClientRect();
    node.style.left = r.left + r.width / 2 - n.width / 2 + "px";
    node.style.top = r.top + r.height * (0.5 + dy) - n.height / 2 + "px";
  }
  const ratio = () => clamp(W / MAXW, 0, 1.2);
  function updateHeart() {
    W = Math.max(0, W);
    const r = ratio();
    angTarget = clamp((r - 0.42) * 48, -16, 16);
    const hs = 1 + Math.min(r, 1) * 0.55;
    el.heartInner.style.setProperty("--hs", hs);
    el.heartInner.style.transform = `scale(${hs})`;
    el.heartPath.style.filter = `brightness(${1 - Math.min(r, 1) * 0.5}) hue-rotate(${-Math.min(r, 1) * 25}deg) saturate(${1 + r * 0.4})`;
    el.heartMouth.setAttribute("d", r < 0.25 ? "M-9,10 Q0,18 9,10" : r < 0.5 ? "M-9,12 L9,12" : "M-9,16 Q0,6 9,16");
    el.sweat.style.opacity = r > 0.35 ? 1 : 0;
    el.weightLabel.textContent = `Heart: ${W % 1 ? W.toFixed(1) : W} deben`;
    el.ammit.style.setProperty("--rise", `${clamp(85 - r * 110, 10, 85)}%`);
    el.ammit.classList.toggle("hungry", r >= 0.45);
  }

  function say(t) { el.thothText.innerHTML = t; el.thoth.classList.remove("say"); void el.thoth.offsetWidth; el.thoth.classList.add("say"); }
  function ammitSays(t, ms = 1600) { el.ammitSay.textContent = t; el.ammitSay.classList.add("on"); clearTimeout(ammitSays.t); ammitSays.t = setTimeout(() => el.ammitSay.classList.remove("on"), ms); }

  // ---------- questions ----------
  function showQuestion() {
    const [text, , zh] = qs[idx];
    el.qnum.textContent = `Confession ${idx + 1} of ${N_Q}${doubleNext ? " · 🍲 COUNTS DOUBLE!" : ""}`;
    el.qtext.textContent = text;
    el.qzh.textContent = zh || "";
    el.qcard.classList.remove("enter", "speed"); void el.qcard.offsetWidth; el.qcard.classList.add("enter");
    [...el.progress.children].forEach((p, i) => p.classList.toggle("cur", i === idx));
    el.answers.hidden = false; el.liar.hidden = true; el.evt.hidden = true;
    el.yes.disabled = el.no.disabled = false;
    busy = false;
    Sfx.whoosh();
    if (speedNext) {
      speedNext = false;
      el.qcard.classList.add("speed");
      const bar = document.createElement("div"); bar.className = "speedbar"; el.qcard.appendChild(bar);
      const SPD = 8; let left = SPD; const t0 = performance.now();
      el.qnum.textContent = `⚡ SPEED ROUND · ${SPD} seconds!`;
      clearInterval(speedTimer);
      speedTimer = setInterval(() => {
        const e = (performance.now() - t0) / 1000;
        bar.style.transform = `scaleX(${Math.max(0, 1 - e / SPD)})`;
        if (Math.ceil(SPD - e) !== left) { left = Math.ceil(SPD - e); if (left > 0) Sfx.beep(left <= 2); el.qnum.textContent = `⚡ SPEED ROUND · ${Math.max(0, left)}…`; }
        if (e >= SPD) { clearInterval(speedTimer); if (!busy) { say(`"TOO SLOW! Ammit counts silence as a YES. 😋"`); answer(true, true); } }
      }, 50);
    }
  }
  function clearSpeed() { clearInterval(speedTimer); const b = el.qcard.querySelector(".speedbar"); if (b) b.remove(); el.qcard.classList.remove("speed"); }

  async function answer(isYes, timeout) {
    if (busy || !el.game.classList.contains("active") || !el.liar.hidden || !el.evt.hidden) return;
    busy = true;
    clearSpeed();
    el.yes.disabled = el.no.disabled = true;
    const [text, w0] = qs[idx];
    const mult = doubleNext ? 2 : 1;
    const w = w0 * mult;
    if (doubleNext) { doubleNext = false; setTimeout(restoreFeather, 1400); }
    const dot = el.progress.children[idx];
    answers.push({ text, w, yes: isYes, lie: false });
    if (isYes) {
      W += w; Sfx.thud(); setTimeout(() => Sfx.tone(140 - w0 * 20, 0.4, { type: "sine", vol: 0.4, slide: 60 }), 120);
      dot.classList.add("yes"); dot.textContent = timeout ? "⏰" : "😬";
      if (!timeout) say(`"${pick(YES_LINES[w0])}${mult > 1 ? " …and it counts DOUBLE! 🍲" : ""}"`);
      if (w >= 3) ammitSays(pick(["yum! 😋", "nom nom", "more please!", "mmm, guilt"]));
      angVel -= 2.5;
    } else {
      Sfx.ding();
      dot.classList.add("no"); dot.textContent = "😇";
      say(`"${pick(NO_LINES)}"`);
      angVel += 1.5;
    }
    updateHeart();
    await sleep(2600);
    if (!isYes && idx > 0 && liarChecks < 2 && Math.random() < 0.38) { liarChecks++; return liarCheck(); }
    next();
  }

  function liarCheck() {
    el.answers.hidden = true; el.liar.hidden = false;
    Sfx.beep(true); setTimeout(() => Sfx.beep(false), 180); setTimeout(() => Sfx.beep(true), 360);
    say(`"Hmm… Anubis's ears are twitching. 🐺"`);
    busy = false;
  }
  async function liarVerdict(isLie) {
    if (busy || el.liar.hidden) return;
    busy = true;
    el.liar.hidden = true; el.answers.hidden = false;
    const a = answers[answers.length - 1];
    const dot = el.progress.children[idx];
    if (isLie) {
      W += a.w * 1.5; a.lie = true; liesCaught++;
      dot.classList.remove("no"); dot.classList.add("yes"); dot.textContent = "🤥";
      Sfx.buzz(); setTimeout(() => Sfx.thud(), 250);
      say(`"The crowd has spoken! <b>Lying to a god = DOUBLE sin.</b> 😱"`);
      ammitSays("LIAR! 😋🍴");
      angVel -= 4;
    } else {
      Sfx.coin();
      say(`"Anubis apologizes. Awkward silence in the afterlife… 🦗"`);
    }
    updateHeart();
    await sleep(2600);
    next();
  }

  function next() {
    const e = evPlan[idx];
    if (e) { evPlan[idx] = null; return runEvent(e); }
    idx++;
    if (idx >= N_Q) judgment(); else showQuestion();
  }

  // ---------- live events between confessions ----------
  function eventPanel(who, title, text, opts) {
    el.answers.hidden = true; el.liar.hidden = true;
    el.evt.classList.remove("result");
    const [tEn, tZh] = String(title).split("|");
    el.evt.innerHTML = `<div class="evt-who">${who}</div><div class="evt-title">${tEn}</div>${tZh ? `<div class="evt-zh zh">${tZh}</div>` : ""}<div class="evt-text">${text}</div>
      <div class="evt-opts">${opts.map((o, i) => `<button class="btn ${o.c || ""}" data-i="${i}"><span class="two">${o.t}${o.z ? `<span class="zh">${o.z}</span>` : ""}</span> <span class="key">${i + 1}</span></button>`).join("")}</div>`;
    el.evt.hidden = false;
    el.qcard.classList.remove("enter"); void el.qcard.offsetWidth; el.qcard.classList.add("enter");
    Sfx.fanfare();
    return new Promise((res) => {
      const choose = (i) => { if (evtKeys !== choose) return; evtKeys = null; Sfx.click(); res(i); };
      evtKeys = choose;
      el.evt.querySelectorAll("button").forEach((b) => (b.onclick = () => choose(+b.dataset.i)));
    });
  }
  async function eventResult(text, ms = 3600) {
    el.evt.classList.add("result");
    el.evt.querySelector(".evt-text").innerHTML = text;
    updateHeart();
    await sleep(ms);
  }
  function setQ(label, title, zh) { el.qnum.textContent = label; el.qtext.textContent = title; el.qzh.textContent = zh || ""; }

  async function runEvent(k) {
    busy = true; eventsSeen.push(k);
    if (k === "bastet") {
      setQ("✨ Divine interruption", "Bastet the cat goddess has arrived!", "猫女神巴斯特来了！");
      say(`"Oh no. Not the cat. She does whatever she wants. 🐈"`);
      await eventPanel("🐈 Bastet, goddess of cats", "A CAT JUMPED ON THE SCALE!|一只猫跳上了天平！", "Bastet is choosing a side… cats are unpredictable.", [{ t: "🐾 Pet the cat", z: "摸摸猫", c: "blue" }, { t: "🙏 Please, kitty!", z: "求求你，小猫！", c: "green" }]);
      const likes = Math.random() < 0.6;
      el.cat.hidden = false; el.cat.style.left = "-15vw"; el.cat.style.top = "40vh"; delete el.cat.dataset.on;
      Sfx.tone(700, 0.25, { type: "sine", vol: 0.2, slide: 1100 }); // meow-ish
      setTimeout(() => Sfx.tone(900, 0.35, { type: "sine", vol: 0.2, slide: 600 }), 250);
      await sleep(80);
      el.cat.dataset.on = likes ? "R" : "L";
      await sleep(700);
      if (likes) { W -= 2; angVel += 4; await eventResult("😻 Bastet sat on the <b>feather</b> side! She likes you. <b>−2 deben</b>"); }
      else { W += 2; angVel -= 4; await eventResult("🙀 Bastet sat on your <b>heart</b>! She finds you suspicious. <b>+2 deben</b>"); }
      el.cat.dataset.on = ""; el.cat.style.left = "110vw";
      setTimeout(() => (el.cat.hidden = true), 900);
    } else if (k === "bribe") {
      setQ("🤫 A secret offer", "Anubis is… hungry?", "阿努比斯……饿了？");
      say(`"Psst… Anubis hasn't eaten in 3,000 years."`);
      const c = await eventPanel("🐺 Anubis whispers", "BRIBE THE GOD?|贿赂神明？", "Offer Anubis a hot bowl of koshary to erase one of your sins?<br><span class='zh'>送阿努比斯一碗库沙丽，抹掉一项罪？</span>", [{ t: "🍲 Offer koshary", z: "送库沙丽", c: "" }, { t: "🙅 No, I'm honest", z: "不，我很诚实", c: "green" }]);
      if (c === 0) {
        if (Math.random() < 0.5) { bribed = true; W -= 3; Sfx.coin(); await eventResult("😋 Anubis ate the koshary… and erased a sin. <b>−3 deben.</b> (This never happened. 🤫)"); }
        else { bribed = false; W += 3; Sfx.buzz(); ammitSays("BRIBERY! 😱"); await eventResult("😡 BRIBING A GOD?! Anubis is offended (and still hungry). <b>+3 deben!</b>"); }
      } else { W -= 1; Sfx.ding(); await eventResult("😇 Honesty! Ma'at is impressed. <b>−1 deben.</b>"); }
    } else if (k === "quiz") {
      const [q, opts, right, fact, qz, oz] = pick(TRIVIA.filter((t) => !eventsSeen.includes(t[0])));
      eventsSeen.push(q);
      setQ("📜 Thoth's pop quiz", "Answer correctly to erase a sin!", "答对可以抹掉一项罪！");
      say(`"Thoth, god of wisdom, has a question for you…"`);
      const order = shuffle([0, 1, 2]);
      const c = await eventPanel("📜 Thoth, god of wisdom", "POP QUIZ!|知识问答！", `${q}<br><span class='zh'>${qz}</span>`, order.map((i) => ({ t: opts[i], z: oz[i], c: "blue" })));
      if (order[c] === right) { quiz.right++; W -= 2; Sfx.ding(); Confetti.burst(50); await eventResult(`✅ CORRECT! 答对了！ ${fact} <b>−2 deben</b>`, 4500); }
      else { quiz.wrong++; W += 1; Sfx.buzz(); await eventResult(`❌ Wrong! 答错了！ ${fact} <b>+1 deben</b>`, 4500); }
    } else if (k === "friend") {
      setQ("👥 Witness time", "The gods call a witness!", "众神传唤证人！");
      say(`"A FRIEND must testify. Choose wisely, friend…"`);
      const c = await eventPanel("👥 Witness testimony", "FRIEND, TESTIFY!|朋友，请作证！", `One friend must answer: is ${name ? esc(name) : "this person"} a good person?<br><span class='zh'>请一位朋友回答：这个人是好人吗？</span>`, [{ t: "😇 An angel", z: "天使", c: "green" }, { t: "😈 Little devil", z: "小恶魔", c: "red" }, { t: "🤷 We just met", z: "刚认识", c: "ghost" }]);
      if (c === 0) { W -= 1; Sfx.ding(); await eventResult("😇 The friend vouches for you! <b>−1 deben.</b> (Buy them a coffee later.)"); }
      else if (c === 1) { W += 2; Sfx.buzz(); ammitSays("BETRAYAL! 😋"); await eventResult("😈 BETRAYED by your own friend! <b>+2 deben.</b> Classic."); }
      else { Sfx.meh(); await eventResult("🤷 \"We just met.\" …Anubis respects the honesty. Nothing changes."); }
    } else if (k === "speed") {
      setQ("🐊 Uh oh…", "Ammit is getting impatient!", "阿米特等不及了！");
      say(`"Ammit is HUNGRY. She wants answers. FAST."`);
      await eventPanel("🐊 Ammit the Devourer", "⚡ SPEED ROUND!|快速回答！", "Next confession: only <b>8 seconds</b> to answer. No answer = GUILTY!<br><span class='zh'>下一题只有8秒！不回答 = 有罪！</span>", [{ t: "😰 I'm ready!", z: "我准备好了！", c: "red" }]);
      speedNext = true;
      await eventResult("Get ready… 3… 2… 1…", 1200);
    } else if (k === "sneeze") {
      setQ("🤧 Achoo!", "Ma'at sneezed!", "玛阿特打了个喷嚏！");
      say(`"Bless you, Ma'at! …wait, where did the feather go?!"`);
      el.feather.classList.add("gone"); el.kFeather.hidden = false; Sfx.whoosh();
      await eventPanel("🪶 Ma'at, goddess of truth", "THE FEATHER FLEW AWAY!|羽毛飞走了！", "For the next confession, the feather is replaced by… a <b>bowl of koshary</b>. Your answer counts <b>DOUBLE!</b><br><span class='zh'>下一题算双倍！</span>", [{ t: "🍲 Oh no", z: "糟糕", c: "" }]);
      doubleNext = true;
    }
    el.evt.hidden = true;
    idx++;
    if (idx >= N_Q) judgment(); else showQuestion();
  }
  function restoreFeather() { el.kFeather.hidden = true; el.feather.classList.remove("gone"); }

  // ---------- judgment ----------
  async function judgment() {
    busy = true;
    Sfx.stopBeat(); clearSpeed(); restoreFeather();
    el.answers.hidden = true; el.liar.hidden = true; el.evt.hidden = true;
    [...el.progress.children].forEach((p) => p.classList.remove("cur"));
    setQ("The gods have heard enough", "THE WEIGHING BEGINS…", "称重开始……");
    el.qcard.classList.remove("enter"); void el.qcard.offsetWidth; el.qcard.classList.add("enter");
    say(`"Silence in the hall! 🤫"`);
    Sfx.drumroll(2.6);
    const finalTarget = angTarget;
    wobble = 16; angTarget = 0;
    await sleep(1300); wobble = 9;
    await sleep(900); wobble = 3;
    await sleep(500); wobble = 0; angTarget = finalTarget; angVel += finalTarget > 0 ? 3 : -3;
    await sleep(900);

    const r = ratio();
    const sins = answers.filter((a) => a.yes || a.lie);
    const heaviest = sins.slice().sort((x, y) => y.w - x.w)[0];
    const heavyTxt = heaviest ? esc(heaviest.text.replace(/^Have you ever /, "").replace(/\?$/, "")) : "";
    const deben = W % 1 ? W.toFixed(1) : W;
    const allNo = sins.length === 0;
    const stats = [
      { v: `${sins.length}/${N_Q}`, k: "Sins confessed" },
      { v: `${deben}`, k: "Heart weight (deben)" },
      { v: liesCaught, k: "Lies caught" },
    ];
    if (quiz.right + quiz.wrong) stats.push({ v: `${quiz.right}/${quiz.right + quiz.wrong}`, k: "Thoth's quiz" });
    const passport = (verdictTxt, cls, jobKey) => `
      <div class="passport">
        ${name ? cartoucheHTML(name) : '<span style="font-size:54px">🪪</span>'}
        <div>
          <div class="pp-title">AFTERLIFE PASSPORT ${name ? "· " + esc(name) : ""}</div>
          <div class="pp-line">❤️ Heart weight: ${deben} deben <span style="opacity:.6">(1 deben ≈ 91 g, a real ancient unit!)</span></div>
          <div class="pp-line">💀 Heaviest sin: ${heaviest ? heavyTxt : "none… suspicious 🤨"}</div>
          ${bribed === true ? '<div class="pp-line">🍲 Note: bribed Anubis with koshary 🤫</div>' : bribed === false ? '<div class="pp-line">🍲 Note: tried to bribe a god (failed) 😬</div>' : ""}
          <div class="pp-job">💼 Afterlife job: ${pick(JOBS[jobKey])}</div>
        </div>
        <span class="stamp ${cls}">${verdictTxt}</span>
      </div>`;

    el.scaleWrap.classList.remove("heart-pulse");
    if (allNo && liesCaught === 0) {
      // suspiciously perfect
      showBig("TOO PERFECT?! 🤨", "Anubis is checking twice…");
      say(`"Zero sins. ZERO. Anubis has been doing this for 5,000 years and has never seen this."`);
      wobble = 6; await sleep(1600); wobble = 0;
      await sleep(1200);
      finish({ mood: "meh", emoji: "😇", phrase: { ar: "والله؟!", en: "Wallahi?!", tr: "Really?! (Swear to God?!)", zh: "真的吗？！", gloss: "<b>Wallahi</b> = \"I swear\" / \"really?!\" Egyptians say it 50 times a day" }, headline: `Zero sins?! Either you are a <b>saint</b>… or the <b>best liar in 5,000 years</b>. The gods let you in, but Anubis will be <i>watching you</i>. 👀`, stats, extra: passport("ALLEGEDLY PURE", "meh", "pure") });
    } else if (r < 0.15) {
      el.rays.classList.add("on");
      showBig("PURE GOLD! 👑", "VIP entrance to paradise");
      say(`"Open the golden gates! A VIP is coming!"`);
      Confetti.burst(160, { emojis: ["🌾", "👑", "✨"] });
      await sleep(2600);
      finish({ mood: "win", emoji: "👑", headline: `Your heart is basically a feather! <b>VIP access to Aaru</b>, the Egyptian paradise: your own pyramid, unlimited koshary, and a felucca with Wi-Fi. ⛵📶`, stats, extra: passport("VIP", "good", "vip") });
    } else if (r < 0.3) {
      el.rays.classList.add("on");
      showBig("PURE HEART! ✨", "Lighter than a feather");
      say(`"Welcome to Aaru, the Field of Reeds! 🌾"`);
      el.feather.style.transition = "transform 2s"; el.feather.style.transform = "translate(0,40px) rotate(20deg)";
      await sleep(2600);
      finish({ mood: "win", emoji: "🌾", headline: `Your heart is lighter than a feather! Welcome to <b>Aaru</b>, the Egyptian paradise: eternal sunshine, endless bread, and… free Wi-Fi. 📶`, stats, extra: passport("APPROVED", "good", "pure") });
    } else if (r < 0.6) {
      showBig("HMMMMM… 🤔", "Osiris is thinking");
      say(`"Osiris is checking your file… it's a long file."`);
      Sfx.meh();
      await sleep(2600);
      const fate = pick([
        "Osiris lets you into the afterlife… <b>but first: 1,000 years stuck in Cairo traffic.</b> 🚗🚕🚌 Honk honk.",
        "You may enter the afterlife… <b>after you sort ALL the papyrus in the Library of Alexandria.</b> 📜📜📜",
        "Osiris sends you back as a <b>Nile mosquito</b> for 100 years. A cute one. With a tiny hat. 🦟🎩",
      ]);
      finish({ mood: "meh", emoji: "🤷", headline: fate, stats, extra: passport("PENDING", "meh", "meh") });
    } else if (r < 0.9) {
      await eatenSequence(false);
      finish({ mood: "lose", emoji: "🐊", headline: `<b>Ammit ate your heart.</b> She says it tasted like ${heaviest ? "<i>“" + heavyTxt + "”</i>" : "pure guilt"}… with a little bit of garlic. 🧄`, stats, extra: passport("DEVOURED", "bad", "bad"), phrase: pick(EG.PHRASES.lose) });
    } else {
      await eatenSequence(true);
      finish({ mood: "lose", emoji: "🌶️", phrase: { ar: "حراق!", en: "7arraa'!", tr: "SPICY! (too hot to handle)", zh: "太辣了！", gloss: "<b>7arraa'</b> = burning hot, spicy · the 7 is the letter ح" }, headline: `So many sins that your heart was <b>TOO SPICY</b> 🌶️. Ammit took one bite and spat it out! The gods are sending you <b>back to Earth to try again</b>. Maybe… eat less of your roommate's food?`, stats, extra: passport("RETURNED", "bad", "spicy") });
    }
  }
  async function eatenSequence(spit) {
    say(`"Oh no. Oh NO. Ammit is coming! 🐊"`);
    ammitSays("MY TURN!! 😋", 2500);
    el.ammit.classList.remove("hungry"); el.ammit.classList.add("lunge");
    el.ammit.style.transform = `translate(18vw, -38vh) scale(1.5) rotate(-6deg)`;
    Sfx.whoosh();
    await sleep(550);
    el.ammit.classList.add("chomp"); Sfx.chomp(); setTimeout(() => Sfx.chomp(), 450);
    el.heartG.style.transition = "opacity .2s"; el.heartG.style.opacity = 0;
    document.body.classList.add("shake"); setTimeout(() => document.body.classList.remove("shake"), 1000);
    showBig("CHOMP! 😋", "Ammit ate your heart");
    await sleep(1600);
    if (spit) {
      ammitSays("🌶️🔥 TOO SPICY!! 🤮", 2500);
      Sfx.boing(); Sfx.tone(300, 0.6, { type: "sawtooth", vol: 0.15, slide: 120, lp: 900 });
      el.heartG.style.opacity = 1;
      showBig("PTUI! 🤮", "Too spicy, even for Ammit!");
      el.ammit.style.transform = `translate(0, 10%) rotate(14deg)`;
    }
    await sleep(1400);
  }
  function showBig(t, s) { el.verdict.innerHTML = `<div class="big">${t}<small>${s}</small></div>`; el.verdict.hidden = false; }
  function finish(o) {
    el.verdict.hidden = true;
    EG.Stats.bump("hearts");
    if (o.mood === "lose") EG.Stats.bump("eaten"); else if (o.mood === "win") EG.Stats.bump("pure");
    showClosure(Object.assign(o, { onReplay: showIntro }));
  }

  // ---------- input ----------
  el.yes.onclick = () => answer(true);
  el.no.onclick = () => answer(false);
  el.liarBtn.onclick = () => liarVerdict(true);
  el.truthBtn.onclick = () => liarVerdict(false);
  addEventListener("keydown", (e) => {
    if (e.target && e.target.tagName === "INPUT") return;
    if (!el.game.classList.contains("active")) { if (e.key === "Enter") start(); return; }
    const k = e.key.toLowerCase();
    if (!el.evt.hidden) { if (evtKeys && /^[1-3]$/.test(k)) { const b = el.evt.querySelector(`button[data-i="${+k - 1}"]`); if (b) b.click(); } return; }
    if (!el.liar.hidden) { if (k === "l") liarVerdict(true); else if (k === "t") liarVerdict(false); return; }
    if (k === "y" || k === "arrowleft") answer(true);
    else if (k === "n" || k === "arrowright") answer(false);
  });

  // test hook
  window.__heart = { force(plan) { evPlan = plan; } };
  showIntro();
})();
