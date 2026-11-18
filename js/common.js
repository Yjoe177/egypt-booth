/* ===== Egypt Booth — shared engine: storage, sound, confetti, hieroglyphs, closure ===== */
(function () {
  "use strict";

  // ---------- storage (safe) ----------
  const Store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };

  const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time
  const Stats = {
    get() { return Store.get("eg_stats_" + today(), {}); },
    bump(k, n = 1) { if (!n) return; const s = this.get(); s[k] = (s[k] || 0) + n; Store.set("eg_stats_" + today(), s); },
  };
  const rand = (a, b) => a + Math.random() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- sound (all synthesized, no files) ----------
  const Sfx = (() => {
    let ctx = null, master = null;
    let muted = Store.get("eg_muted", false);
    function ac() {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ctx = new C();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 0.55;
        const comp = ctx.createDynamicsCompressor();
        master.connect(comp); comp.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function tone(freq, dur, o = {}) {
      const c = ac(); if (!c || muted) return;
      const t = c.currentTime + (o.when || 0);
      const osc = c.createOscillator(), g = c.createGain();
      osc.type = o.type || "sine";
      osc.frequency.setValueAtTime(freq, t);
      if (o.slide) osc.frequency.exponentialRampToValueAtTime(o.slide, t + dur);
      if (o.detune) osc.detune.value = o.detune;
      const vol = o.vol == null ? 0.25 : o.vol;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.006));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      let node = osc;
      if (o.lp) { const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = o.lp; osc.connect(f); node = f; }
      node.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur + 0.05);
    }
    function noise(dur, o = {}) {
      const c = ac(); if (!c || muted) return;
      const t = c.currentTime + (o.when || 0);
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const b = c.createBuffer(1, len, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const s = c.createBufferSource(); s.buffer = b;
      const f = c.createBiquadFilter(); f.type = o.ftype || "bandpass"; f.frequency.setValueAtTime(o.f || 2000, t); f.Q.value = o.q || 1;
      if (o.fslide) f.frequency.exponentialRampToValueAtTime(o.fslide, t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(o.vol == null ? 0.3 : o.vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t); s.stop(t + dur + 0.02);
    }
    // Hijaz scale on D — the "Egyptian sound"
    const HIJAZ = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33, 622.25, 739.99, 783.99, 880];
    const doum = (w = 0, v = 0.7) => { tone(120, 0.32, { vol: v, when: w, slide: 50 }); noise(0.05, { vol: 0.15, when: w, f: 300, q: 0.7 }); };
    const tak = (w = 0, v = 0.3) => { noise(0.07, { vol: v, when: w, f: 3800, q: 2.5 }); tone(820, 0.04, { vol: v * 0.3, when: w, type: "triangle" }); };
    const ka = (w = 0, v = 0.15) => { noise(0.04, { vol: v, when: w, f: 5200, q: 3 }); };

    // drum loop (maqsum: D T . T D . T .)
    let beatTimer = null, beatStep = 0, bpm = 110, nextTime = 0;
    const MAQSUM = ["D", "T", "k", "T", "D", "k", "T", "k"];
    function scheduleBeat() {
      const c = ac(); if (!c) return;
      while (nextTime < c.currentTime + 0.15) {
        const s = MAQSUM[beatStep % MAQSUM.length];
        const w = Math.max(0, nextTime - c.currentTime);
        if (s === "D") doum(w, 0.55); else if (s === "T") tak(w, 0.28); else ka(w, 0.1);
        beatStep++;
        nextTime += 60 / bpm / 2;
      }
    }
    function startBeat(b = 110) { const c = ac(); if (!c) return; bpm = b; stopBeat(); beatStep = 0; nextTime = c.currentTime + 0.05; beatTimer = setInterval(scheduleBeat, 40); }
    function setTempo(b) { bpm = b; }
    function stopBeat() { if (beatTimer) clearInterval(beatTimer); beatTimer = null; }

    function arp(notes, step, o = {}) { notes.forEach((n, i) => tone(n, o.dur || 0.22, { type: o.type || "triangle", vol: o.vol || 0.22, when: i * step + (o.when || 0) })); }

    return {
      unlock: ac,
      get muted() { return muted; },
      setMuted(m) { muted = m; Store.set("eg_muted", m); if (master) master.gain.value = m ? 0 : 0.55; if (m) stopBeat(); },
      toggle() { this.setMuted(!muted); return muted; },
      tone, noise, doum, tak, startBeat, stopBeat, setTempo, HIJAZ,
      click() { tone(900, 0.05, { type: "square", vol: 0.06 }); },
      hover() { tone(1400, 0.03, { type: "sine", vol: 0.04 }); },
      pop() { tone(500, 0.12, { type: "sine", vol: 0.25, slide: 1200 }); },
      tick() { tone(1500, 0.04, { type: "square", vol: 0.08 }); },
      beep(hi) { tone(hi ? 1320 : 880, 0.15, { type: "square", vol: 0.12 }); },
      coin() { tone(988, 0.08, { type: "square", vol: 0.1 }); tone(1319, 0.25, { type: "square", vol: 0.1, when: 0.08 }); },
      ding() { arp([HIJAZ[4], HIJAZ[7]], 0.09, { type: "sine", vol: 0.25, dur: 0.35 }); },
      buzz() { tone(110, 0.35, { type: "sawtooth", vol: 0.15, lp: 900 }); tone(116, 0.35, { type: "sawtooth", vol: 0.15, lp: 900 }); },
      whoosh() { noise(0.45, { vol: 0.25, f: 400, fslide: 3000, q: 1.5 }); },
      thud() { tone(90, 0.35, { vol: 0.7, slide: 40 }); noise(0.12, { vol: 0.3, f: 200, q: 0.8 }); },
      boing() { tone(220, 0.45, { type: "sine", vol: 0.3, slide: 660 }); tone(660, 0.3, { type: "sine", vol: 0.15, slide: 200, when: 0.2 }); },
      chomp() { noise(0.12, { vol: 0.6, f: 600, q: 0.8 }); tone(160, 0.2, { type: "square", vol: 0.25, slide: 60, lp: 800 }); noise(0.12, { vol: 0.5, f: 500, q: 0.8, when: 0.2 }); tone(140, 0.2, { type: "square", vol: 0.2, slide: 50, lp: 800, when: 0.2 }); },
      honk(p = 1) { const f = 400 * p; tone(f, 0.28, { type: "square", vol: 0.09, lp: 2200 }); tone(f * 1.26, 0.28, { type: "square", vol: 0.08, lp: 2200 }); },
      drumroll(dur = 2) { for (let t = 0; t < dur; t += 0.05) tak(t, 0.08 + (t / dur) * 0.25); doum(dur, 0.8); },
      win() {
        const H = HIJAZ;
        arp([H[0], H[2], H[3], H[4], H[5], H[4], H[7]], 0.11, { type: "triangle", vol: 0.22 });
        tone(H[7], 0.9, { type: "triangle", vol: 0.2, when: 0.77 }); tone(H[4], 0.9, { type: "sine", vol: 0.14, when: 0.77 }); tone(H[0] / 2, 0.9, { type: "sine", vol: 0.2, when: 0.77 });
        doum(0.77, 0.6);
        // zaghrouta-ish trill
        for (let i = 0; i < 14; i++) tone(i % 2 ? 1180 : 1320, 0.07, { type: "sine", vol: 0.06, when: 1.2 + i * 0.07 });
      },
      lose() { [392, 370, 349, 330].forEach((f, i) => tone(f, i === 3 ? 0.9 : 0.35, { type: "sawtooth", vol: 0.12, lp: 1200, when: i * 0.38, slide: i === 3 ? 280 : null })); },
      meh() { tone(330, 0.3, { type: "triangle", vol: 0.2 }); tone(294, 0.5, { type: "triangle", vol: 0.2, when: 0.3 }); },
      fanfare() { const H = HIJAZ; arp([H[0], H[4], H[7], H[4], H[7]], 0.12, { type: "square", vol: 0.08, dur: 0.18 }); tone(H[7], 0.6, { type: "square", vol: 0.08, when: 0.6 }); },
    };
  })();

  // ---------- speech (optional voice) ----------
  const Voice = {
    enabled: Store.get("eg_voice", true),
    voice: null,
    init() {
      if (!("speechSynthesis" in window)) { this.enabled = false; return; }
      const choose = () => {
        const vs = speechSynthesis.getVoices();
        this.voice = vs.find((v) => /en-(GB|US)/i.test(v.lang) && /male|david|george|guy|mark|ryan/i.test(v.name)) || vs.find((v) => /^en/i.test(v.lang)) || null;
      };
      choose(); speechSynthesis.onvoiceschanged = choose;
    },
    say(text, o = {}) {
      if (!this.enabled || Sfx.muted || !("speechSynthesis" in window)) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, ""));
        if (this.voice) u.voice = this.voice;
        u.rate = o.rate || 1.05; u.pitch = o.pitch || 0.8; u.volume = 1;
        speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    },
    stop() { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } },
    toggle() { this.enabled = !this.enabled; Store.set("eg_voice", this.enabled); if (!this.enabled) this.stop(); return this.enabled; },
  };

  // ---------- confetti ----------
  const Confetti = (() => {
    let cv, cx, parts = [], raf = null;
    const COLORS = ["#e3b23c", "#f6d77e", "#2b56a6", "#22a6b3", "#c4622d", "#ffffff", "#c0392b"];
    function ensure() {
      if (cv) return;
      cv = document.createElement("canvas"); cv.id = "confetti"; document.body.appendChild(cv);
      cx = cv.getContext("2d");
      const rs = () => { cv.width = innerWidth; cv.height = innerHeight; };
      rs(); addEventListener("resize", rs);
    }
    function burst(n = 160, o = {}) {
      ensure();
      const emojis = o.emojis || ["🐪", "🔺", "☀️", "🌴"];
      for (let i = 0; i < n; i++) {
        const fromSide = i % 2 ? 1 : 0;
        parts.push({
          x: o.x != null ? o.x : (fromSide ? cv.width + 10 : -10),
          y: o.y != null ? o.y : cv.height * rand(0.3, 0.8),
          vx: o.x != null ? rand(-9, 9) : (fromSide ? -1 : 1) * rand(6, 17),
          vy: rand(-19, -6),
          r: rand(0, Math.PI * 2), vr: rand(-0.3, 0.3),
          w: rand(8, 15), h: rand(5, 10),
          c: pick(COLORS), shape: Math.random() < 0.12 ? "e" : Math.random() < 0.3 ? "tri" : "rect",
          e: pick(emojis), life: 0,
        });
      }
      if (!raf) loop();
    }
    function loop() {
      cx.clearRect(0, 0, cv.width, cv.height);
      parts.forEach((p) => {
        p.vy += 0.38; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
        if (p.shape === "e") { cx.font = "26px serif"; cx.fillText(p.e, -13, 9); }
        else { cx.fillStyle = p.c; if (p.shape === "tri") { cx.beginPath(); cx.moveTo(0, -p.w / 1.4); cx.lineTo(p.w / 1.4, p.w / 1.6); cx.lineTo(-p.w / 1.4, p.w / 1.6); cx.fill(); } else { cx.scale(1, Math.cos(p.life * 0.2)); cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); } }
        cx.restore();
      });
      parts = parts.filter((p) => p.y < cv.height + 60);
      if (parts.length) raf = requestAnimationFrame(loop); else { raf = null; cx.clearRect(0, 0, cv.width, cv.height); }
    }
    return { burst };
  })();

  // ---------- hieroglyph names ----------
  const H = (cp) => String.fromCodePoint(cp);
  const GLYPH = {
    a: H(0x1313f), b: H(0x130c0), c: H(0x133a1), d: H(0x130a7), e: H(0x131cb), f: H(0x13191), g: H(0x133bc),
    h: H(0x13254), i: H(0x131cb), j: H(0x13193), k: H(0x133a1), l: H(0x130ed), m: H(0x13153), n: H(0x13216),
    o: H(0x13171), p: H(0x132aa), q: H(0x1320e), r: H(0x1308b), s: H(0x132f4), t: H(0x133cf), u: H(0x13171),
    v: H(0x13191), w: H(0x13171), x: H(0x133a1) + H(0x132f4), y: H(0x131cc), z: H(0x13283),
    sh: H(0x13219), ch: H(0x13219), kh: H(0x1340d), th: H(0x133cf) + H(0x13254),
  };
  const GLYPH_NAMES = { a: "vulture", b: "foot", c: "basket", d: "hand", e: "reed", f: "viper", g: "jar stand", h: "courtyard", i: "reed", j: "cobra", k: "basket", l: "lion", m: "owl", n: "water", o: "quail chick", p: "stool", q: "hill", r: "mouth", s: "folded cloth", t: "bread", u: "quail chick", v: "viper", w: "quail chick", x: "basket + cloth", y: "two reeds", z: "door bolt", sh: "pool", ch: "pool", kh: "placenta", th: "bread + courtyard" };
  function hieroglyphs(name) {
    const s = String(name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
    let out = "", parts = [];
    for (let i = 0; i < s.length; i++) {
      const two = s.slice(i, i + 2);
      if (GLYPH[two] && (two === "sh" || two === "ch" || two === "kh" || two === "th")) { out += GLYPH[two]; parts.push([two, GLYPH_NAMES[two]]); i++; continue; }
      // skip doubled letters (Egyptian scribes didn't write them twice)
      if (i > 0 && s[i] === s[i - 1]) continue;
      out += GLYPH[s[i]]; parts.push([s[i], GLYPH_NAMES[s[i]]]);
    }
    return { glyphs: out, parts };
  }
  function cartoucheHTML(name, size) {
    const g = hieroglyphs(name).glyphs || H(0x13080);
    return `<span class="cartouche" style="${size ? "font-size:" + size + "px" : ""}" title="${esc(name)}">${g}</span>`;
  }

  // ---------- phrases ----------
  const PHRASES = {
    win: [
      { ar: "مبروك يا حبيبي!", en: "Mabrouk ya Habibi!", tr: "Congratulations, my dear!", zh: "恭喜你，亲爱的！", gloss: "<b>Mabrouk</b> = congrats · <b>Habibi</b> = my dear (Egyptians call EVERYONE habibi)" },
      { ar: "عاش يا بطل!", en: "3ash ya Batal!", tr: "Long live the champion!", zh: "冠军万岁！", gloss: "<b>3ash</b> = he lived (= well done!) · <b>Batal</b> = hero · the 3 is the letter ع" },
      { ar: "يا سلام!", en: "Ya Salaaam!", tr: "Oh WOW! (say it slowly, like a proud auntie)", zh: "哇！太棒了！", gloss: "<b>Ya Salam</b> = the Egyptian WOW" },
      { ar: "جامد جداً!", en: "Gamed Gedan!", tr: "Super solid! (= awesome!)", zh: "超级厉害！", gloss: "<b>Gamed</b> = solid, tough = cool · <b>Gedan</b> = very" },
    ],
    meh: [
      { ar: "نص نص", en: "Noss Noss", tr: "Half-half. So-so. The camel shrugs.", zh: "一般般～", gloss: "<b>Noss</b> = half · Egyptians use it for EVERYTHING that is 'meh'" },
      { ar: "مش بطال", en: "Mesh Battal", tr: "Not bad! (high praise from an Egyptian dad)", zh: "还不错！", gloss: "<b>Mesh</b> = not · <b>Battal</b> = bad" },
    ],
    lose: [
      { ar: "معلش يا حبيبي", en: "Ma3lesh ya Habibi", tr: "Never mind, my dear… it happens to the best of us.", zh: "没关系，亲爱的～", gloss: "<b>Ma3lesh</b> = never mind — the most useful word in Egypt" },
      { ar: "حظ أوفر المرة الجاية", en: "Hazz Awfar!", tr: "Better luck next time!", zh: "下次好运！", gloss: "<b>Hazz</b> = luck · <b>Awfar</b> = more plentiful" },
      { ar: "يا خسارة!", en: "Ya Khosara!", tr: "What a loss! (said with maximum drama)", zh: "太可惜了！", gloss: "<b>Khosara</b> = loss / a pity" },
    ],
  };
  const SIGNOFFS = [
    "Shokran! Now tell 3 friends about this booth, or a mummy visits you tonight. 🧟",
    "Ma'a Salama! (Go with safety… and sunscreen.) ☀️",
    "Yalla bye! The pyramids took 20 years — you only took a minute. Proud of you.",
    "Shokran ya Habibi! Come visit Egypt — we have 7,000 years of history and a LOT of traffic.",
    "Ma'a Salama! Don't forget to drink water. An Egyptian mother would want you to know that.",
    "Yalla! Tell your friends: the Egyptian booth is the best booth. Say it louder. LOUDER.",
    "Shokran! You are now 0.5% Egyptian. Collect 200 more games for citizenship. 🇪🇬",
  ];

  // ---------- closure screen ----------
  let closureEl = null, closureTimer = null, closureKey = null;
  function closeClosure() {
    if (closureEl) closureEl.remove();
    closureEl = null;
    clearInterval(closureTimer);
    if (closureKey) removeEventListener("keydown", closureKey, true);
    closureKey = null;
  }
  function showClosure(o) {
    closeClosure();
    const mood = o.mood || "win";
    const ph = o.phrase || pick(PHRASES[mood]);
    const el = document.createElement("div");
    el.className = "closure mood-" + mood;
    el.innerHTML = `
      <div class="closure-card" role="dialog" aria-live="polite">
        <div class="closure-emoji">${o.emoji || (mood === "win" ? "🏆" : mood === "lose" ? "😅" : "🐪")}</div>
        <h1 class="closure-ar">${ph.ar}</h1>
        <h2 class="closure-title">${ph.en}</h2>
        <div class="closure-trans">${ph.tr}</div>
        ${ph.zh ? `<div class="closure-zh">${ph.zh}</div>` : ""}
        ${o.headline ? `<div class="closure-sub">${o.headline}</div>` : ""}
        ${o.stats && o.stats.length ? `<div class="closure-stats">${o.stats.map((s) => `<div class="stat"><b>${s.v}</b><span>${s.k}</span></div>`).join("")}</div>` : ""}
        ${o.extra ? `<div class="closure-extra">${o.extra}</div>` : ""}
        <div class="closure-signoff">${o.signoff || pick(SIGNOFFS)}</div>
        <div class="closure-gloss">📖 ${ph.gloss}</div>
        <div class="closure-actions">
          <button class="btn green" data-act="replay">🔁 Play again <span class="zh-sm">再玩一次</span> <span class="key">R</span></button>
          <button class="btn blue" data-act="home">🏠 Other games <span class="zh-sm">其他游戏</span> <span class="key">H</span></button>
        </div>
        <div class="closure-auto">Back to the main screen in <span class="cd">180</span>s</div>
      </div>
      <div class="camel-walk"><span>🐪</span><span style="animation-delay:.3s">🐪</span><span style="animation-delay:.15s">🐫</span></div>`;
    document.body.appendChild(el);
    closureEl = el;
    if (mood === "win") { Sfx.win(); Confetti.burst(200); setTimeout(() => Confetti.burst(120), 900); }
    else if (mood === "lose") Sfx.lose(); else { Sfx.meh(); Confetti.burst(60, { emojis: ["🐪"] }); }
    const replay = () => { Sfx.click(); closeClosure(); if (o.onReplay) o.onReplay(); };
    const home = () => { Sfx.click(); closeClosure(); goHome(); };
    el.querySelector('[data-act="replay"]').onclick = replay;
    el.querySelector('[data-act="home"]').onclick = home;
    let left = o.autoHome || 180;
    const cd = el.querySelector(".cd");
    closureTimer = setInterval(() => { left--; cd.textContent = left; if (left <= 0) home(); }, 1000);
    closureKey = (e) => {
      if (e.target && e.target.tagName === "INPUT") return;
      const k = e.key.toLowerCase();
      if (k === "r") { e.preventDefault(); e.stopPropagation(); replay(); }
      else if (k === "h" || k === "escape") { e.preventDefault(); e.stopPropagation(); home(); }
      else e.stopPropagation();
    };
    addEventListener("keydown", closureKey, true);
    setTimeout(() => { const b = el.querySelector('[data-act="replay"]'); if (b) b.focus(); }, 50);
    return el;
  }

  function goHome() { Voice.stop(); Sfx.stopBeat(); location.href = "index.html"; }

  function toast(msg, ms = 1800) {
    const t = document.createElement("div"); t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), ms);
  }

  // ---------- game top bar ----------
  function mountGamebar(title, opts = {}) {
    const bar = document.createElement("div");
    bar.className = "gamebar";
    bar.innerHTML = `
      <button class="iconbtn" data-b="home" title="Back to all games (Esc)" aria-label="Home">🏠</button>
      <div class="title">${title}</div>
      <div class="bar-right">
        ${opts.voice ? `<button class="iconbtn" data-b="voice" title="Voice on/off (V)" aria-label="Voice">🗣️</button>` : ""}
        <button class="iconbtn" data-b="mute" title="Sound on/off (M)" aria-label="Sound">🔊</button>
        <button class="iconbtn" data-b="fs" title="Fullscreen (F)" aria-label="Fullscreen">⛶</button>
      </div>`;
    document.body.appendChild(bar);
    const muteB = bar.querySelector('[data-b="mute"]'), voiceB = bar.querySelector('[data-b="voice"]');
    const paint = () => { muteB.textContent = Sfx.muted ? "🔇" : "🔊"; if (voiceB) voiceB.style.opacity = Voice.enabled ? 1 : 0.4; };
    paint();
    bar.querySelector('[data-b="home"]').onclick = () => { if (!opts.confirmHome || opts.confirmHome()) goHome(); };
    muteB.onclick = () => { Sfx.toggle(); if (Sfx.muted) Voice.stop(); paint(); };
    if (voiceB) voiceB.onclick = () => { Voice.toggle(); paint(); toast(Voice.enabled ? "🗣️ Voice ON" : "🤐 Voice OFF"); };
    bar.querySelector('[data-b="fs"]').onclick = toggleFullscreen;
    addEventListener("keydown", (e) => {
      if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
      if (closureEl) return;
      const k = e.key.toLowerCase();
      if (k === "m") { Sfx.toggle(); paint(); }
      else if (k === "f") toggleFullscreen();
      else if (k === "v" && voiceB) { Voice.toggle(); paint(); }
      else if (k === "escape" && opts.escHome !== false) goHome();
    });
    return bar;
  }

  function toggleFullscreen() {
    try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) { /* ignore */ }
  }

  // unlock audio on first interaction
  const unlock = () => { Sfx.unlock(); removeEventListener("pointerdown", unlock); removeEventListener("keydown", unlock); };
  addEventListener("pointerdown", unlock); addEventListener("keydown", unlock);
  Voice.init();

  window.EG = { Store, Stats, today, Sfx, Voice, Confetti, rand, randi, pick, shuffle, clamp, $, $$, esc, sleep, hieroglyphs, cartoucheHTML, PHRASES, SIGNOFFS, showClosure, closeClosure, goHome, toast, mountGamebar, toggleFullscreen };
})();
