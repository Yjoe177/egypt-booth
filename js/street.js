(function () {
  "use strict";
  const { $, Sfx, pick, rand, clamp, sleep, esc, showClosure, mountGamebar, toast, Confetti } = EG;

  mountGamebar("🚦 Cross a Cairo Street");
  const Q = new URLSearchParams(location.search);
  const GAME_TIME = +Q.get("t") || 60;

  // =========================================================
  //  WORLD GEOMETRY
  // =========================================================
  const cv = $("#world"), ctx = cv.getContext("2d");
  const ROWS = 9; // 0 start sidewalk, 1-3 lanes →, 4 median, 5-7 lanes ←, 8 goal sidewalk
  const LANE_ROWS = [1, 2, 3, 5, 6, 7];
  let W = 0, H = 0, DPR = 1, rh = 50, vs = 50, TOP = 100, bg = null;
  const rowY = (r) => H - rh * (r + 0.5);
  const isLane = (r) => LANE_ROWS.includes(r);
  function resize() {
    DPR = Math.min(2, devicePixelRatio || 1);
    W = innerWidth; H = innerHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    TOP = H * (H > W ? 0.13 : 0.17); rh = (H - TOP) / ROWS;
    vs = Math.min(rh, W / 11); // vehicle/person size: narrow phones get smaller cars
    buildBg();
  }

  // =========================================================
  //  STREETS (levels)
  // =========================================================
  const STREETS = [
    { name: "Zamalek side street", ar: "الزمالك", speed: [0.08, 0.12], gap: [2.6, 4.8], mix: { taxi: 4, car: 3, bike: 2, tuktuk: 2, breadbike: 1, donkey: 1 } },
    { name: "Tahrir Square", ar: "ميدان التحرير", speed: [0.11, 0.16], gap: [2.2, 4.0], mix: { taxi: 3, microbus: 3, tuktuk: 2, car: 2, motor: 2, breadbike: 1, donkey: 1 } },
    { name: "Ramses Square", ar: "ميدان رمسيس", speed: [0.14, 0.2], gap: [1.9, 3.4], mix: { microbus: 4, bus: 2, taxi: 2, motor: 2, tuktuk: 2, donkey: 1, breadbike: 1 } },
    { name: "26th of July St. · rush hour", ar: "٢٦ يوليو", speed: [0.17, 0.24], gap: [1.6, 3.0], mix: { microbus: 4, bus: 2, taxi: 3, motor: 3, car: 2, breadbike: 1 } },
    { name: "Ring Road · Iftar o'clock 🌙", ar: "الدائري", speed: [0.2, 0.27], gap: [1.4, 2.6], mix: { microbus: 4, taxi: 3, car: 3, motor: 3, bus: 1, breadbike: 1 } },
    { name: "Salah Salem · after the match ⚽", ar: "صلاح سالم", speed: [0.22, 0.3], gap: [1.3, 2.4], mix: { microbus: 3, taxi: 3, car: 3, motor: 4, bus: 1, breadbike: 1 } },
  ];

  // =========================================================
  //  VEHICLES
  // =========================================================
  const VEH = {
    car: { len: 1.6, mult: 1, shouts: ["BEEP!", "Yalla!", "Move, habibi!"] },
    taxi: { len: 1.7, mult: 1.05, shouts: ["Taxi? Taxi?", "BEEP BEEP!", "Ya basha!"] },
    microbus: { len: 2.5, mult: 1.1, shouts: ["Tahrir! Tahrir!", "Ramses! Ramses!", "One more seat!", "BEEEP!"] },
    bus: { len: 3.8, mult: 0.85, shouts: ["HOOOONK!", "Ataba! Ataba!"] },
    tuktuk: { len: 1.25, mult: 0.95, shouts: ["Toot toot!", "Ya 3am!", "🎵 Mahraganat 🎵"] },
    motor: { len: 1.3, mult: 1.25, shouts: ["Vroom!", "Delivery!", "Yalla!"] },
    donkey: { len: 2.3, mult: 0.7, shouts: ["Hee-haw!", "Watermelon! Batikh!"] },
    breadbike: { len: 1.4, mult: 0.72, collect: true, shouts: ["3eish! 3eish! 🍞", "Fresh bread!"] },
    bike: { len: 1.2, mult: 0.78, shouts: ["Ding ding!"] },
    wedding: { len: 1.9, mult: 1.2, shouts: ["🎉 Mabrouk!", "Lulululu! 🎶", "HONK HONK HONK!"] },
    goats: { len: 2.4, mult: 0.45, shouts: ["Meeeh!", "Baaa!"] },
  };
  const HAND_SHOUTS = ["Etfaddal! (go ahead)", "OK OK, ya basha!", "Respect the hand ✋", "Wallahi, go!"];

  // =========================================================
  //  STATE
  // =========================================================
  let state = "attract"; // attract | countdown | play | over
  let mode = "key"; // key | cam
  let lanes = [];
  let level = 0, speedBoost = 1;
  let G = null; // round stats
  let P = null; // player
  let pickups = [];
  let ev = null, evTimer = 8, lastEv = "";
  let rain = [];
  let lastHonk = 0;
  const keys = {};

  function streetDef() {
    if (level < STREETS.length) return STREETS[level];
    return STREETS[STREETS.length - 1];
  }

  function makeLanes() {
    const s = streetDef();
    const extra = level >= STREETS.length ? 1 + (level - STREETS.length + 1) * 0.08 : 1;
    lanes = LANE_ROWS.map((row) => ({
      row, dir: row < 4 ? 1 : -1, hold: null,
      base: rand(s.speed[0], s.speed[1]) * extra,
      cars: [], spawnT: rand(0, 1), slow: 1, slowTarget: 1, boost: 1, boostT: 0, forceType: null, forceN: 0, handShouted: false,
    }));
    // warm up so the road is busy from the first second
    for (let i = 0; i < 260; i++) updateTraffic(1 / 20);
  }

  function pickType() {
    const mix = streetDef().mix;
    let tot = 0; for (const k in mix) tot += mix[k];
    let r = Math.random() * tot;
    for (const k in mix) { r -= mix[k]; if (r <= 0) return k; }
    return "car";
  }

  function spawnCar(L, type) {
    const def = VEH[type];
    const len = def.len * vs;
    const last = L.cars[L.cars.length - 1];
    if (last) {
      const room = L.dir > 0 ? last.x : W - (last.x + last.len);
      if (room < vs * 1.6) return false;
    }
    L.cars.push({
      type, len, x: L.dir > 0 ? -len : W, v: 0, mult: def.mult * rand(0.95, 1.05), stopT: 0,
      color: pick(["#c0392b", "#2b56a6", "#7f8c8d", "#27ae60", "#8e44ad", "#d35400", "#2c3e50", "#ecf0f1"]),
      shout: null, shoutT: 0, nm: 0, nmDone: false, flag: false, seed: Math.random(),
    });
    return true;
  }

  // =========================================================
  //  TRAFFIC UPDATE
  // =========================================================
  function globalMult() {
    let m = speedBoost;
    if (ev && ev.mult != null) m *= ev.mult;
    return m;
  }
  function updateTraffic(dt) {
    const s = streetDef();
    const gm = globalMult();
    for (const L of lanes) {
      L.slow += (L.slowTarget - L.slow) * Math.min(1, dt * 5);
      if (L.boostT > 0) { L.boostT -= dt; if (L.boostT <= 0) L.boost = 1; }
      // spawn
      L.spawnT -= dt;
      if (L.spawnT <= 0) {
        const t = L.forceN > 0 ? L.forceType : pickType();
        if (spawnCar(L, t)) {
          if (L.forceN > 0) { L.forceN--; L.spawnT = 0.15; }
          else L.spawnT = rand(s.gap[0], s.gap[1]) / Math.sqrt(gm || 0.3);
        } else L.spawnT = 0.25;
      }
      // move: front car first, followers can't pass
      const laneV = L.base * W * L.slow * L.boost * gm;
      let ahead = null;
      for (const c of L.cars) {
        if (c.stopT > 0) c.stopT -= dt;
        let v = c.stopT > 0 ? 0 : laneV * c.mult;
        if (L.hold != null) {
          // drivers brake BEFORE the person with the raised hand; cars already past keep going
          const front = L.dir > 0 ? c.x + c.len : c.x;
          const dist = (L.hold - L.dir * vs * 0.8 - front) * L.dir;
          if (dist > -vs * 0.15) v = Math.min(v, Math.max(0, dist) * 3);
        }
        if (ahead) {
          const gap = L.dir > 0 ? ahead.x - (c.x + c.len) : c.x - (ahead.x + ahead.len);
          const safe = vs * 0.35;
          if (gap < safe + vs * 0.6) v = Math.min(v, ahead.v * clamp((gap - safe) / (vs * 0.6), 0, 1.2));
          if (gap < safe) { c.x = L.dir > 0 ? ahead.x - safe - c.len : ahead.x + ahead.len + safe; }
        }
        c.v = v;
        c.x += v * L.dir * dt;
        if (c.shoutT > 0) c.shoutT -= dt;
        ahead = c;
      }
      L.cars = L.cars.filter((c) => (L.dir > 0 ? c.x < W + 20 : c.x + c.len > -20));
    }
  }

  function honk(c) {
    const now = performance.now();
    if (now - lastHonk < 600) return;
    lastHonk = now;
    Sfx.honk(c && c.type === "bus" ? 0.6 : c && c.type === "tuktuk" ? 1.6 : rand(0.8, 1.2));
  }
  function shout(c, txt) { c.shout = txt || pick(VEH[c.type].shouts); c.shoutT = 1.6; }

  // =========================================================
  //  PLAYER
  // =========================================================
  function newPlayer() {
    return { x: W / 2, r: 0, from: 0, hopT: 1, stun: 0, inv: 0, hand: false, wasHand: false, power: 100, tired: false, safe: 0, face: 1, maxRowThisCross: 0, walk: 0 };
  }
  function hop(d) {
    if (state !== "play" || !P || P.stun > 0 || P.hopT < 1) return;
    const nr = clamp(P.r + d, 0, ROWS - 1);
    if (nr === P.r) return;
    P.from = P.r; P.r = nr; P.hopT = 0; P.hopDur = ev && ev.k === "mom" ? 0.5 : 0.2;
    G.hops++;
    Sfx.tone(d > 0 ? 520 : 380, 0.08, { type: "square", vol: 0.06, slide: d > 0 ? 760 : 300 });
    if (nr === 4 || nr === 0) P.safe = nr;
    if (d > 0 && nr > P.maxRowThisCross) {
      P.maxRowThisCross = nr;
      if (isLane(nr) || nr === 4) addScore(10, null);
    }
    if (nr === ROWS - 1) crossed();
  }
  function addScore(n, label, cls, x, y) {
    G.score += n;
    if (label) popup(label, x, y, cls);
  }

  async function crossed() {
    G.crossings++;
    const bonus = 100 + level * 25;
    addScore(bonus, `🍲 KOSHARY! +${bonus}`, "gold", P.x, rowY(8) - rh);
    Sfx.fanfare();
    Confetti.burst(90, { x: P.x, y: rowY(8), emojis: ["🍲", "🎉", "🚦"] });
    renderBowls();
    P.inv = 99; // safe during transition
    await sleep(900);
    if (state !== "play") return;
    level++;
    const s = streetDef();
    showEvent(`➡️ ${s.name}`, `${s.ar} · faster, crazier, louder!`, 2200);
    makeLanes();
    buildBg();
    P.r = 0; P.from = 0; P.hopT = 1; P.safe = 0; P.maxRowThisCross = 0; P.inv = 1.2;
    Sfx.whoosh();
  }

  function hit(c) {
    G.hits++;
    P.stun = 1.1; P.inv = 2.6;
    Sfx.thud(); honk(c);
    shout(c, pick(["Ya habibi, LOOK!", "Mish shayef?! (can't you see?!)", "Ya 3am!!", "WATCH OUT!"]));
    popup(pick(["MA3LESH! 🤕", "OUCH! 💥", "BONK! 😵", "YA LAHWY! 😱"]), P.x, rowY(P.r) - rh * 0.8, "bad");
    document.body.classList.add("shake"); setTimeout(() => document.body.classList.remove("shake"), 500);
    G.score = Math.max(0, G.score - 15);
    setTimeout(() => {
      if (!P || state !== "play") return;
      P.from = P.r; P.r = P.safe; P.hopT = 0.3; Sfx.boing();
      if (P.r === 0) P.maxRowThisCross = 0;
    }, 700);
  }

  // =========================================================
  //  PICKUPS & EVENTS
  // =========================================================
  const SNACKS = [
    { e: "🧆", n: "Ta'ameya", p: 20 }, { e: "🥙", n: "Ful sandwich", p: 20 }, { e: "🍬", n: "Candy", p: 10 },
    { e: "🥭", n: "Mango", p: 15 }, { e: "⭐", n: "STAR", p: 50 }, { e: "🍵", n: "Shai", p: 15, power: true },
  ];
  let pickT = 4;
  function spawnPickup(row) {
    const s = Math.random() < 0.1 ? SNACKS[4] : pick(SNACKS);
    pickups.push({ row: row || pick(LANE_ROWS.concat([4])), x: rand(W * 0.08, W * 0.92), ...s, t: 9, bob: Math.random() * 6 });
  }

  const EVENTS = {
    police: { t: 4.5, start() { whistle(); return ["👮 TRAFFIC POLICEMAN!", "He blew his whistle… EVERYONE STOPS! GO GO GO!"]; } },
    wedding: { t: 7, start() { const L = pick(lanes); L.forceType = "wedding"; L.forceN = 3; L.boost = 1.7; L.boostT = 7; L.spawnT = 0; Sfx.setTempo(190); this.lane = L; return ["💒 WEDDING ZAFFA!", "A wedding convoy is speeding through! Lulululu! 🎶"]; }, end() { Sfx.setTempo(118); } },
    football: { t: 6, mult: 1.45, start() { lanes.forEach((L) => L.cars.forEach((c) => (c.flag = true))); return ["⚽ THE MATCH JUST ENDED!", "Ahly fans are celebrating… everybody drives 50% faster!"]; } },
    rain: { t: 7, mult: 0.55, start() { rain = []; for (let i = 0; i < 160; i++) rain.push({ x: rand(0, W), y: rand(0, H), v: rand(600, 900) }); return ["🌧️ IT'S RAINING IN CAIRO?!", "It rains twice a year. Nobody knows how to drive. Everyone slows down!"]; }, end() { rain = []; } },
    goats: { t: 3, start() { const L = pick(lanes); L.forceType = "goats"; L.forceN = 1; L.spawnT = 0; return ["🐐 GOAT CROSSING!", "A shepherd is walking his goats through traffic. A normal Tuesday."]; } },
    snacks: { t: 3, start() { for (let i = 0; i < 6; i++) spawnPickup(); Sfx.coin(); return ["🥙 THE FUL CART TIPPED OVER!", "Free street food all over the road! Grab it!"]; } },
    microbus: { t: 4, start() { const all = lanes.flatMap((L) => L.cars.filter((c) => c.x > W * 0.15 && c.x + c.len < W * 0.85)); const c = all.find((k) => k.type === "microbus") || all[0]; if (c) { c.stopT = 4; shout(c, "TAHRIR! TAHRIR! ONE SEAT!"); c.shoutT = 4; } return ["🚐 MICROBUS STOP!", "A microbus stopped in the MIDDLE of the road for a passenger. Traffic jam!"]; } },
    mom: { t: 6, start() { if (P) popup("📱 \"Yes mama… I ate… yes…\"", P.x, rowY(P.r) - rh * 1.2, "gold"); Sfx.tone(1320, 0.12, { type: "square", vol: 0.08 }); Sfx.tone(1320, 0.12, { type: "square", vol: 0.08, when: 0.25 }); return ["📱 MOM IS CALLING!", "You HAVE to answer. You walk slowly while she asks if you ate. 🐢"]; } },
    tea: { t: 2, start() { if (P) { P.power = 100; P.tired = false; } Sfx.ding(); return ["☕ SHAI BREAK!", "A kind uncle gave you tea. Hand power fully recharged! ✋"]; } },
  };
  function whistle() { for (let i = 0; i < 6; i++) Sfx.tone(i % 2 ? 2600 : 3000, 0.08, { type: "sine", vol: 0.18, when: i * 0.09 }); Sfx.tone(2800, 0.5, { type: "sine", vol: 0.15, when: 0.6 }); }
  function startEvent() {
    let k; const ks = Object.keys(EVENTS);
    do { k = pick(ks); } while (k === lastEv);
    lastEv = k;
    const E = EVENTS[k];
    const [t, s] = E.start.call(E);
    ev = { k, t: E.t, mult: E.mult != null ? E.mult : null, E };
    G && G.events.push(k);
    showEvent(t, s, 2600);
  }
  function endEvent() { if (ev && ev.E.end) ev.E.end.call(ev.E); ev = null; }

  let evHideT = null;
  function showEvent(t, s, ms) {
    const e = $("#event");
    e.innerHTML = `<b>${t}</b><span>${s}</span>`;
    e.hidden = false; e.style.animation = "none"; void e.offsetWidth; e.style.animation = "";
    clearTimeout(evHideT); evHideT = setTimeout(() => (e.hidden = true), ms);
  }
  function popup(text, x, y, cls) {
    const p = document.createElement("div");
    p.className = "pop " + (cls || "");
    p.textContent = text;
    p.style.left = clamp(x == null ? W / 2 : x, 80, W - 80) + "px"; p.style.top = (y == null ? H / 2 : y) + "px";
    $("#popups").appendChild(p);
    setTimeout(() => p.remove(), 1300);
  }

  // =========================================================
  //  GAME LOOP
  // =========================================================
  let lastT = performance.now();
  function frame(now) {
    const rawDt = Math.min(0.5, (now - lastT) / 1000);
    const dt = Math.min(0.05, rawDt);
    lastT = now;
    if (!document.hidden) {
      if (mode === "cam") Pose.update(now);
      step(dt, now, rawDt);
      draw(now);
    }
    requestAnimationFrame(frame);
  }

  function step(dt, now, rawDt) {
    if (state === "play") {
      G.time -= rawDt || dt; // wall-clock, even if the frame rate drops
      // events
      if (ev) { ev.t -= dt; if (ev.t <= 0) endEvent(); }
      else { evTimer -= dt; if (evTimer <= 0) { startEvent(); evTimer = rand(8, 12); } }
      pickT -= dt; if (pickT <= 0) { spawnPickup(); pickT = rand(4, 7); }
      updatePlayer(dt, now);
      if (G.time <= 10 && Math.ceil(G.time) !== G.lastBeep) { G.lastBeep = Math.ceil(G.time); if (G.time > 0) Sfx.beep(G.time < 4); }
      if (G.time <= 0) return gameOver();
      updateHud();
    } else if (state === "attract") {
      evTimer -= dt;
    }
    // hand effect: drivers in your lane and the next one stop in front of you
    {
      const police = ev && ev.k === "police";
      for (const L of lanes) {
        const affected = P && state === "play" && (police || (P.hand && (L.row === P.r || L.row === P.r + 1)));
        L.hold = affected ? P.x : police ? W / 2 : null;
        if (affected && !L.handShouted) {
          L.handShouted = true;
          const near = L.cars.reduce((b, c) => (!b || Math.abs(c.x + c.len / 2 - P.x) < Math.abs(b.x + b.len / 2 - P.x) ? c : b), null);
          if (near) shout(near, pick(HAND_SHOUTS));
        }
        if (!affected) L.handShouted = false;
      }
    }
    updateTraffic(dt);
    pickups.forEach((p) => (p.t -= dt));
    pickups = pickups.filter((p) => p.t > 0);
    rain.forEach((d) => { d.y += d.v * dt; d.x -= d.v * 0.15 * dt; if (d.y > H) { d.y = -10; d.x = rand(0, W * 1.1); } });
    // ambient honks
    if (Math.random() < dt * 0.6) {
      const L = pick(lanes); const c = L && pick(L.cars);
      if (c && c.x > 0 && c.x < W - c.len) { shout(c); if (state === "play") honk(c); }
    }
  }

  function updatePlayer(dt, now) {
    if (P.hopT < 1) P.hopT = Math.min(1, P.hopT + dt / (P.hopDur || 0.2));
    const momSlow = ev && ev.k === "mom" ? 0.45 : 1;
    if (P.stun > 0) P.stun -= dt;
    if (P.inv > 0 && P.inv < 50) P.inv -= dt;
    // horizontal movement
    if (P.stun <= 0) {
      if (mode === "key") {
        const dir = (keys.ArrowRight || keys.d ? 1 : 0) - (keys.ArrowLeft || keys.a ? 1 : 0);
        if (dir) { P.x += dir * W * 0.42 * dt * momSlow; P.face = dir; P.walk += dt * 10; }
      } else if (Pose.ctrl) {
        const tx = Pose.ctrl.x * W;
        const dx = tx - P.x;
        P.x += dx * Math.min(1, dt * 8 * momSlow);
        if (Math.abs(dx) > 4) { P.face = Math.sign(dx); P.walk += dt * 10; }
      }
    }
    P.x = clamp(P.x, vs * 0.4, W - vs * 0.4);
    // hand
    const wantHand = (mode === "key" ? !!(keys.h || keys.H || keys.Shift || keys.Enter) : Pose.ctrl && Pose.ctrl.hand) && P.stun <= 0;
    if (P.tired && P.power > 30) P.tired = false;
    P.hand = wantHand && !P.tired && P.power > 0;
    if (P.hand) { P.power -= 38 * dt; if (P.power <= 0) { P.power = 0; P.tired = true; popup("😮‍💨 Arm tired!", P.x, rowY(P.r) - rh, "bad"); } }
    else P.power = Math.min(100, P.power + 16 * dt);
    if (P.hand && !P.wasHand) { G.handUses++; Sfx.tone(660, 0.12, { type: "triangle", vol: 0.15 }); }
    P.wasHand = P.hand;

    // collisions
    const row = P.hopT < 0.5 ? P.from : P.r;
    const pw = vs * 0.22;
    if (isLane(row) && P.inv <= 0) {
      const L = lanes.find((l) => l.row === row);
      for (const c of L.cars) {
        const a = c.x + c.len * 0.1, b = c.x + c.len * 0.9;
        if (P.x + pw > a && P.x - pw < b) {
          if (VEH[c.type].collect) {
            G.bread++; addScore(40, "🍞 CAUGHT THE BREAD! +40", "gold", P.x, rowY(row) - rh); Sfx.coin();
            L.cars.splice(L.cars.indexOf(c), 1);
          } else hit(c);
          break;
        }
        // near miss flag: car is about to reach you
        const gap = L.dir > 0 ? (P.x - pw) - b : a - (P.x + pw);
        if (gap > 0 && gap < vs * 0.35 && c.v > 10 && !c.nm) c.nm = now;
      }
    }
    // near miss award: you left the row just in time
    for (const L of lanes) {
      for (const c of L.cars) {
        if (c.nm && !c.nmDone) {
          if (now - c.nm > 900) c.nmDone = true;
          else if (row !== L.row && G.lastHitAt < c.nm) { c.nmDone = true; G.nearMiss++; addScore(5, "😱 CLOSE ONE! +5", "good", P.x, rowY(P.r) - rh); }
        }
      }
    }
    if (P.stun > 0) G.lastHitAt = now;
    // pickups
    for (const p of pickups) {
      if (p.row === row && Math.abs(p.x - P.x) < vs * 0.6) {
        p.t = 0; G.snacks++;
        addScore(p.p, `${p.e} ${p.n}! +${p.p}`, "good", p.x, rowY(row) - rh * 0.6);
        if (p.power) { P.power = 100; P.tired = false; }
        Sfx.coin();
      }
    }
  }

  // =========================================================
  //  DRAWING
  // =========================================================
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }

  function buildBg() {
    if (!W) return;
    bg = document.createElement("canvas");
    bg.width = W * DPR; bg.height = H * DPR;
    const b = bg.getContext("2d");
    b.setTransform(DPR, 0, 0, DPR, 0, 0);
    // sky
    const night = level >= 4;
    const sky = b.createLinearGradient(0, 0, 0, TOP + rh);
    if (night) { sky.addColorStop(0, "#0b1530"); sky.addColorStop(1, "#3b3561"); }
    else { sky.addColorStop(0, "#f3a65a"); sky.addColorStop(0.6, "#f7c98a"); sky.addColorStop(1, "#f9e0b4"); }
    b.fillStyle = sky; b.fillRect(0, 0, W, TOP + rh);
    if (night) { b.fillStyle = "#fff6cf"; b.beginPath(); b.arc(W * 0.82, TOP * 0.35, TOP * 0.16, 0, 7); b.fill(); b.fillStyle = "#0b1530"; b.beginPath(); b.arc(W * 0.82 + TOP * 0.07, TOP * 0.31, TOP * 0.15, 0, 7); b.fill(); }
    else { b.fillStyle = "rgba(255,240,180,.9)"; b.beginPath(); b.arc(W * 0.82, TOP * 0.5, TOP * 0.22, 0, 7); b.fill(); }
    // skyline
    const base = TOP + rh * 0.55;
    let x = -10, i = 0;
    const rnd = mulberry(7 + level);
    while (x < W) {
      const bw = 40 + rnd() * 70, bh = TOP * (0.35 + rnd() * 0.55);
      b.fillStyle = night ? ["#1d2240", "#262b4f", "#1a1e38"][i % 3] : ["#c98b5a", "#b97c4f", "#d9a272", "#a96f45"][i % 4];
      b.fillRect(x, base - bh, bw, bh);
      // windows
      b.fillStyle = night ? "rgba(255,220,120,.75)" : "rgba(60,40,30,.35)";
      for (let wy = base - bh + 8; wy < base - 10; wy += 14) for (let wx = x + 6; wx < x + bw - 8; wx += 12) if (rnd() < (night ? 0.45 : 0.8)) b.fillRect(wx, wy, 6, 7);
      // satellite dish
      if (rnd() < 0.6) { b.fillStyle = night ? "#3a4170" : "#eee"; b.beginPath(); b.ellipse(x + bw * 0.7, base - bh - 6, 8, 5, -0.5, 0, 7); b.fill(); }
      // laundry line
      if (rnd() < 0.3) { b.strokeStyle = "#555"; b.beginPath(); b.moveTo(x + 4, base - bh * 0.5); b.lineTo(x + bw - 4, base - bh * 0.5); b.stroke(); ["#e74c3c", "#3498db", "#f1c40f"].forEach((c, k) => { b.fillStyle = c; b.fillRect(x + 10 + k * 14, base - bh * 0.5, 9, 12); }); }
      x += bw + 4; i++;
    }
    // minaret + dome + Cairo Tower
    b.fillStyle = night ? "#2d3360" : "#9c6a40";
    const mx = W * 0.2; b.fillRect(mx, base - TOP * 1.0, 12, TOP); b.beginPath(); b.moveTo(mx - 4, base - TOP * 1.0); b.lineTo(mx + 6, base - TOP * 1.18); b.lineTo(mx + 16, base - TOP * 1.0); b.fill();
    b.fillRect(mx - 5, base - TOP * 0.8, 22, 6);
    b.beginPath(); b.arc(mx + 60, base - TOP * 0.45, TOP * 0.22, Math.PI, 0); b.fill(); b.fillRect(mx + 60 - TOP * 0.22, base - TOP * 0.45, TOP * 0.44, TOP * 0.45);
    const tx = W * 0.62; b.fillRect(tx - 5, base - TOP * 1.1, 10, TOP * 1.1);
    b.beginPath(); b.moveTo(tx - 16, base - TOP * 1.1); b.quadraticCurveTo(tx, base - TOP * 1.32, tx + 16, base - TOP * 1.1); b.fill();
    b.fillRect(tx - 1.5, base - TOP * 1.42, 3, TOP * 0.2);
    // rows
    for (let r = 0; r < ROWS; r++) {
      const y = H - rh * (r + 1);
      if (r === 0 || r === 8) {
        b.fillStyle = r === 8 ? "#d8c7a3" : "#cdb994"; b.fillRect(0, y, W, rh);
        b.strokeStyle = "rgba(0,0,0,.12)"; b.lineWidth = 1;
        for (let tx2 = 0; tx2 < W; tx2 += rh * 0.7) { b.beginPath(); b.moveTo(tx2, y); b.lineTo(tx2, y + rh); b.stroke(); }
        b.beginPath(); b.moveTo(0, y + rh / 2); b.lineTo(W, y + rh / 2); b.stroke();
        // curb
        b.fillStyle = "#e9e3d3"; b.fillRect(0, r === 8 ? y + rh - 5 : y, W, 5);
        b.fillStyle = "#2b2b2b"; for (let cx = 0; cx < W; cx += 40) b.fillRect(cx, r === 8 ? y + rh - 5 : y, 20, 5);
      } else if (r === 4) {
        b.fillStyle = "#6d8b3c"; b.fillRect(0, y, W, rh);
        b.fillStyle = "#e9e3d3"; b.fillRect(0, y, W, 4); b.fillRect(0, y + rh - 4, W, 4);
        b.fillStyle = "#e3b23c"; for (let cx = 0; cx < W; cx += 30) { b.fillRect(cx, y, 15, 4); b.fillRect(cx + 15, y + rh - 4, 15, 4); }
      } else {
        b.fillStyle = r % 2 ? "#3a3d44" : "#363940"; b.fillRect(0, y, W, rh);
        // cracks / patches (Cairo roads have character)
        b.fillStyle = "rgba(0,0,0,.18)";
        for (let k = 0; k < 4; k++) { b.beginPath(); b.ellipse(rnd() * W, y + rnd() * rh, 10 + rnd() * 30, 4 + rnd() * 6, 0, 0, 7); b.fill(); }
        if (r !== 3 && r !== 7) { b.strokeStyle = "rgba(255,255,255,.55)"; b.setLineDash([rh * 0.6, rh * 0.5]); b.lineWidth = 3; b.beginPath(); b.moveTo(0, y); b.lineTo(W, y); b.stroke(); b.setLineDash([]); }
        // direction arrows
        b.fillStyle = "rgba(255,255,255,.08)"; b.font = `${rh * 0.5}px sans-serif`; b.textAlign = "center"; b.textBaseline = "middle";
        for (let ax = W * 0.15; ax < W; ax += W * 0.35) b.fillText(r < 4 ? "➜" : "⬅", ax, y + rh / 2);
      }
    }
    // goal: koshary shop
    const gy = H - rh * 9;
    const kx = W > 700 ? W * 0.74 : W * 0.5; b.fillStyle = "#7a2e10"; const kw = Math.min(260, W * 0.62); rr2(b, kx - kw / 2, gy - rh * 0.65, kw, rh * 0.75, 10); b.fill();
    b.fillStyle = "#f6d77e"; b.font = `${Math.min(rh * 0.45, 30, W / 16)}px Lalezar, Impact, sans-serif`; b.textAlign = "center"; b.textBaseline = "middle";
    b.fillText("🍲 كشري KOSHARY 🍲", kx, gy - rh * 0.27);
    // start kiosk
    b.font = `${rh * 0.6}px serif`; b.fillText("🏪", W * 0.08, H - rh * 0.5); b.fillText("🌳", W * 0.93, H - rh * 0.5);
    // median palms
    for (let px = W * 0.06; px < W; px += W * 0.18) b.fillText("🌴", px, H - rh * 4.55);
    // goal decorations
    b.fillText("🛺", W * 0.1, H - rh * 8.5); b.fillText("🍉", W * 0.88, H - rh * 8.5);
  }
  function rr2(b, x, y, w, h, r) { b.beginPath(); b.roundRect ? b.roundRect(x, y, w, h, r) : b.rect(x, y, w, h); }
  function mulberry(a) { return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function wheel(x, y, r) { ctx.fillStyle = "#1b1b1b"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.fillStyle = "#9aa0a6"; ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, 7); ctx.fill(); }
  function head(x, y, r, c) { ctx.fillStyle = c || "#8b5a3c"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  function windowRow(x, y, w, h, n, heads) {
    const gw = w / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = "#8fc3df"; rr(x + i * gw + 2, y, gw - 4, h, 3); ctx.fill();
      if (heads && (i * 7 + heads) % 3 !== 0) head(x + i * gw + gw / 2, y + h * 0.65, h * 0.28, ["#8b5a3c", "#5c3a22", "#c68a5e"][i % 3]);
    }
  }

  function drawVehicle(c, L, now) {
    const h = vs * 0.78, w = c.len, y = rowY(L.row) - h / 2 - rh * 0.02;
    ctx.save();
    ctx.translate(c.x, y);
    if (L.dir < 0) { ctx.translate(w, 0); ctx.scale(-1, 1); }
    const bob = Math.sin(now / 90 + c.seed * 10) * (c.v > 5 ? 1 : 0);
    ctx.translate(0, bob);
    // shadow
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(w / 2, h * 0.98, w * 0.48, h * 0.1, 0, 0, 7); ctx.fill();
    const t = c.type;
    if (t === "car" || t === "taxi" || t === "wedding") {
      const col = t === "taxi" ? "#f4f4f0" : t === "wedding" ? "#ffffff" : c.color;
      ctx.fillStyle = col; rr(w * 0.02, h * 0.42, w * 0.96, h * 0.4, h * 0.12); ctx.fill();
      rr(w * 0.22, h * 0.12, w * 0.5, h * 0.36, h * 0.14); ctx.fill();
      ctx.fillStyle = "#8fc3df"; rr(w * 0.27, h * 0.17, w * 0.18, h * 0.25, 3); ctx.fill(); rr(w * 0.49, h * 0.17, w * 0.19, h * 0.25, 3); ctx.fill();
      head(w * 0.58, h * 0.32, h * 0.09);
      if (t === "taxi") { for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? "#111" : "#f4f4f0"; ctx.fillRect(w * 0.06 + i * w * 0.074, h * 0.54, w * 0.074, h * 0.08); } ctx.fillStyle = "#111"; ctx.fillRect(w * 0.42, h * 0.04, w * 0.12, h * 0.08); }
      if (t === "wedding") { ctx.fillStyle = "#ff6fa5"; ctx.font = `${h * 0.3}px serif`; ctx.fillText("💐", w * 0.78, h * 0.5); ctx.fillText("🎀", w * 0.05, h * 0.5); ctx.strokeStyle = "#ff6fa5"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * 0.22, h * 0.14); ctx.quadraticCurveTo(w * 0.5, h * 0.4, w * 0.72, h * 0.14); ctx.stroke(); }
      ctx.fillStyle = "#ffe08a"; ctx.fillRect(w * 0.93, h * 0.5, w * 0.05, h * 0.08);
      ctx.fillStyle = "#c0392b"; ctx.fillRect(w * 0.02, h * 0.5, w * 0.03, h * 0.08);
      wheel(w * 0.22, h * 0.82, h * 0.14); wheel(w * 0.78, h * 0.82, h * 0.14);
    } else if (t === "microbus") {
      ctx.fillStyle = "#f2f0ea"; rr(0, h * 0.08, w, h * 0.74, h * 0.16); ctx.fill();
      ctx.fillStyle = "#2b56a6"; ctx.fillRect(0, h * 0.56, w, h * 0.08);
      windowRow(w * 0.06, h * 0.16, w * 0.72, h * 0.28, 5, 3);
      ctx.fillStyle = "#8fc3df"; rr(w * 0.82, h * 0.16, w * 0.15, h * 0.3, 4); ctx.fill();
      // guy hanging out the door
      ctx.strokeStyle = "#8b5a3c"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w * 0.45, h * 0.5); ctx.lineTo(w * 0.42, h * 0.02); ctx.stroke(); head(w * 0.42, -h * 0.02, h * 0.08);
      ctx.fillStyle = "#6b4a2b"; ctx.fillRect(w * 0.15, h * 0.0, w * 0.5, h * 0.08);
      wheel(w * 0.18, h * 0.82, h * 0.14); wheel(w * 0.82, h * 0.82, h * 0.14);
    } else if (t === "bus") {
      ctx.fillStyle = "#d63c2f"; rr(0, h * 0.02, w, h * 0.8, h * 0.12); ctx.fill();
      ctx.fillStyle = "#f3e3c3"; ctx.fillRect(0, h * 0.5, w, h * 0.1);
      windowRow(w * 0.04, h * 0.1, w * 0.86, h * 0.32, 8, 5);
      ctx.fillStyle = "#8fc3df"; rr(w * 0.92, h * 0.1, w * 0.06, h * 0.4, 3); ctx.fill();
      wheel(w * 0.14, h * 0.82, h * 0.15); wheel(w * 0.3, h * 0.82, h * 0.15); wheel(w * 0.84, h * 0.82, h * 0.15);
    } else if (t === "tuktuk") {
      ctx.fillStyle = "#d63031"; rr(w * 0.05, h * 0.2, w * 0.85, h * 0.6, h * 0.25); ctx.fill();
      ctx.fillStyle = "#111"; rr(w * 0.05, h * 0.12, w * 0.85, h * 0.12, 6); ctx.fill();
      ctx.fillStyle = "#8fc3df"; rr(w * 0.55, h * 0.28, w * 0.3, h * 0.24, 4); ctx.fill();
      head(w * 0.66, h * 0.42, h * 0.1);
      ctx.fillStyle = "#f1c40f"; ctx.font = `${h * 0.22}px sans-serif`; ctx.fillText("♪", w * 0.2, h * 0.5);
      wheel(w * 0.2, h * 0.82, h * 0.13); wheel(w * 0.82, h * 0.84, h * 0.11);
    } else if (t === "motor" || t === "bike" || t === "breadbike") {
      const moto = t === "motor";
      wheel(w * 0.2, h * 0.8, h * (moto ? 0.15 : 0.14)); wheel(w * 0.8, h * 0.8, h * (moto ? 0.15 : 0.14));
      if (moto) {
        ctx.fillStyle = "#c0392b"; rr(w * 0.18, h * 0.56, w * 0.6, h * 0.17, h * 0.08); ctx.fill();
        ctx.fillStyle = "#222"; rr(w * 0.2, h * 0.5, w * 0.42, h * 0.08, 4); ctx.fill();
        ctx.strokeStyle = "#555"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(w * 0.8, h * 0.8); ctx.lineTo(w * 0.72, h * 0.42); ctx.lineTo(w * 0.64, h * 0.4); ctx.stroke();
        ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(w * 0.8, h * 0.52, h * 0.05, 0, 7); ctx.fill();
      } else {
        ctx.strokeStyle = "#2b56a6"; ctx.lineWidth = 3.5; ctx.lineJoin = "round";
        ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.8); ctx.lineTo(w * 0.4, h * 0.55); ctx.lineTo(w * 0.5, h * 0.8); ctx.closePath();
        ctx.moveTo(w * 0.4, h * 0.55); ctx.lineTo(w * 0.7, h * 0.55); ctx.lineTo(w * 0.5, h * 0.8);
        ctx.moveTo(w * 0.7, h * 0.55); ctx.lineTo(w * 0.8, h * 0.8); ctx.moveTo(w * 0.7, h * 0.55); ctx.lineTo(w * 0.68, h * 0.4); ctx.stroke();
      }
      const riders = moto ? 3 : 1;
      for (let i = 0; i < riders; i++) {
        const rx = w * (0.5 - i * 0.15);
        const ry = moto ? h * 0.2 : h * 0.18;
        ctx.fillStyle = ["#e3b23c", "#27ae60", "#8e44ad"][i]; rr(rx - h * 0.09, ry, h * 0.18, h * 0.32, 5); ctx.fill();
        ctx.strokeStyle = "#24324f"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(rx, ry + h * 0.3); ctx.lineTo(rx + h * 0.1, h * 0.7); ctx.stroke();
        head(rx, ry - h * 0.06, h * 0.09, ["#8b5a3c", "#c68a5e", "#5c3a22"][i]);
      }
      if (t === "breadbike") {
        ctx.fillStyle = "#c8a165"; rr(w * 0.15, -h * 0.08, w * 0.7, h * 0.1, 4); ctx.fill();
        ctx.fillStyle = "#e6b56b"; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(w * (0.22 + i * 0.11), -h * 0.12, h * 0.07, h * 0.04, 0, 0, 7); ctx.fill(); }
        ctx.strokeStyle = "rgba(255,215,80," + (0.5 + 0.5 * Math.sin(now / 150)) + ")"; ctx.lineWidth = 3; rr(-4, -h * 0.25, w + 8, h * 1.2, 12); ctx.stroke();
      }
    } else if (t === "donkey") {
      // cart
      ctx.fillStyle = "#8a5a2b"; ctx.fillRect(0, h * 0.42, w * 0.55, h * 0.26);
      ctx.fillStyle = "#2e7d32"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(w * (0.08 + i * 0.12), h * 0.36, h * 0.09, h * 0.07, 0, 0, 7); ctx.fill(); }
      wheel(w * 0.27, h * 0.78, h * 0.16);
      ctx.strokeStyle = "#6b4a2b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(w * 0.55, h * 0.5); ctx.lineTo(w * 0.66, h * 0.5); ctx.stroke();
      // donkey
      ctx.fillStyle = "#8d8d8d"; rr(w * 0.64, h * 0.38, w * 0.26, h * 0.26, h * 0.12); ctx.fill();
      const lg = Math.sin(now / 120 + c.seed) * h * 0.06;
      ctx.strokeStyle = "#7a7a7a"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(w * 0.68, h * 0.6); ctx.lineTo(w * 0.68 + lg, h * 0.9); ctx.moveTo(w * 0.86, h * 0.6); ctx.lineTo(w * 0.86 - lg, h * 0.9); ctx.stroke();
      ctx.fillStyle = "#8d8d8d"; rr(w * 0.86, h * 0.18, w * 0.12, h * 0.3, h * 0.06); ctx.fill();
      ctx.fillStyle = "#6f6f6f"; ctx.fillRect(w * 0.87, h * 0.0, w * 0.025, h * 0.2); ctx.fillRect(w * 0.92, h * 0.02, w * 0.025, h * 0.2);
      head(w * 0.6, h * 0.3, h * 0.09);
    } else if (t === "goats") {
      for (let i = 0; i < 3; i++) {
        const gx = w * (0.08 + i * 0.28), lg = Math.sin(now / 100 + i) * h * 0.05;
        ctx.fillStyle = "#f2efe6"; rr(gx, h * 0.42, w * 0.2, h * 0.22, h * 0.1); ctx.fill();
        ctx.strokeStyle = "#d8d2c2"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(gx + w * 0.04, h * 0.62); ctx.lineTo(gx + w * 0.04 + lg, h * 0.86); ctx.moveTo(gx + w * 0.16, h * 0.62); ctx.lineTo(gx + w * 0.16 - lg, h * 0.86); ctx.stroke();
        ctx.fillStyle = "#f2efe6"; ctx.beginPath(); ctx.arc(gx + w * 0.21, h * 0.38, h * 0.09, 0, 7); ctx.fill();
        ctx.strokeStyle = "#7a5a3a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx + w * 0.2, h * 0.3); ctx.lineTo(gx + w * 0.17, h * 0.2); ctx.stroke();
      }
      ctx.strokeStyle = "#6b4a2b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w * 0.04, h * 0.1); ctx.lineTo(-w * 0.02, h * 0.85); ctx.stroke();
      ctx.fillStyle = "#7b5e3b"; rr(-w * 0.12, h * 0.3, h * 0.2, h * 0.4, 6); ctx.fill(); head(-w * 0.08, h * 0.22, h * 0.09);
    }
    if (c.flag) { ctx.fillStyle = "#c0392b"; ctx.fillRect(w * 0.3, -h * 0.35, h * 0.3, h * 0.2); ctx.fillStyle = "#fff"; ctx.fillRect(w * 0.3, -h * 0.25, h * 0.3, h * 0.05); ctx.strokeStyle = "#333"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * 0.3, -h * 0.35); ctx.lineTo(w * 0.3, h * 0.1); ctx.stroke(); }
    if (c.stopT > 0) { ctx.fillStyle = "#e74c3c"; ctx.fillRect(w * 0.0, h * 0.5, w * 0.04, h * 0.1); }
    ctx.restore();
    // shout bubble (not mirrored)
    if (c.shout && c.shoutT > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, c.shoutT * 2);
      ctx.font = `bold ${Math.max(12, vs * 0.26)}px Cairo, sans-serif`;
      const tw = ctx.measureText(c.shout).width + 16, bx = clamp(c.x + c.len / 2 - tw / 2, 4, W - tw - 4), by = y - rh * 0.42;
      ctx.fillStyle = "#fff"; rr(bx, by, tw, rh * 0.36, 10); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx + tw / 2 - 6, by + rh * 0.35); ctx.lineTo(bx + tw / 2 + 6, by + rh * 0.35); ctx.lineTo(bx + tw / 2, by + rh * 0.47); ctx.fill();
      ctx.fillStyle = "#111"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(c.shout, bx + 8, by + rh * 0.18);
      ctx.restore();
    }
  }

  function drawPlayer(now) {
    if (!P) return;
    const e = P.hopT < 1 ? P.hopT : 1;
    const y0 = rowY(P.from), y1 = rowY(P.r);
    const yy = y0 + (y1 - y0) * e - Math.sin(e * Math.PI) * rh * 0.45;
    const s = Math.min(rh, vs * 1.15) * 0.9;
    ctx.save();
    ctx.translate(P.x, yy + s * 0.39);
    if (P.inv > 0 && P.inv < 50 && P.stun <= 0 && Math.floor(now / 100) % 2) ctx.globalAlpha = 0.4;
    ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.3, s * 0.08, 0, 0, 7); ctx.fill();
    if (P.stun > 0) ctx.rotate(Math.sin(now / 60) * 0.5);
    const sw = Math.sin(P.walk) * s * 0.08;
    // legs
    ctx.strokeStyle = "#24324f"; ctx.lineWidth = s * 0.1; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-s * 0.08, -s * 0.35); ctx.lineTo(-s * 0.1 + sw, -s * 0.02); ctx.moveTo(s * 0.08, -s * 0.35); ctx.lineTo(s * 0.1 - sw, -s * 0.02); ctx.stroke();
    // body
    ctx.fillStyle = "#16a085"; rr(-s * 0.17, -s * 0.72, s * 0.34, s * 0.4, s * 0.1); ctx.fill();
    ctx.fillStyle = "#e3b23c"; ctx.font = `${s * 0.18}px Lalezar, sans-serif`; ctx.textAlign = "center"; ctx.fillText("EG", 0, -s * 0.45);
    // arms
    ctx.strokeStyle = "#c68a5e"; ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.moveTo(-s * 0.16, -s * 0.66); ctx.lineTo(-s * 0.26, -s * 0.4 - sw);
    if (P.hand) { ctx.moveTo(s * 0.16, -s * 0.66); ctx.lineTo(s * 0.3, -s * 1.05); } else { ctx.moveTo(s * 0.16, -s * 0.66); ctx.lineTo(s * 0.26, -s * 0.4 + sw); }
    ctx.stroke();
    if (P.hand) { ctx.font = `${s * 0.32}px serif`; ctx.fillText("✋", s * 0.34, -s * 1.05); ctx.strokeStyle = "rgba(46,204,113,.6)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(s * 0.32, -s * 1.15, s * 0.28 + Math.sin(now / 80) * 4, 0, 7); ctx.stroke(); }
    // head
    head(0, -s * 0.85, s * 0.15, "#c68a5e");
    ctx.fillStyle = "#2a1a10"; ctx.beginPath(); ctx.arc(0, -s * 0.9, s * 0.15, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(P.face * s * 0.06, -s * 0.85, s * 0.025, 0, 7); ctx.fill();
    if (P.stun > 0) { ctx.font = `${s * 0.25}px serif`; for (let i = 0; i < 3; i++) { const a = now / 200 + i * 2.1; ctx.fillText("⭐", Math.cos(a) * s * 0.3, -s * 1.1 + Math.sin(a) * s * 0.1); } }
    ctx.restore();
  }

  function draw(now) {
    if (!bg) return;
    ctx.drawImage(bg, 0, 0, W, H);
    // policeman on the median during the police event
    if (ev && ev.k === "police") { ctx.font = `${rh * 0.9}px serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("👮", W * 0.5, rowY(4)); ctx.fillText("✋", W * 0.5 + rh * 0.5, rowY(4) - rh * 0.4 + Math.sin(now / 100) * 4); }
    // pickups
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (const p of pickups) {
      const a = p.t < 2 ? (Math.floor(now / 120) % 2 ? 0.3 : 1) : 1;
      ctx.globalAlpha = a; ctx.font = `${vs * 0.55}px serif`;
      ctx.fillText(p.e, p.x, rowY(p.row) + Math.sin(now / 200 + p.bob) * 4);
      ctx.globalAlpha = 1;
    }
    // vehicles: draw back rows first
    for (let i = lanes.length - 1; i >= 0; i--) for (const c of lanes[i].cars) drawVehicle(c, lanes[i], now);
    drawPlayer(now);
    // rain
    if (rain.length) { ctx.strokeStyle = "rgba(180,210,255,.6)"; ctx.lineWidth = 2; ctx.beginPath(); for (const d of rain) { ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - 4, d.y + 14); } ctx.stroke(); ctx.fillStyle = "rgba(40,60,90,.15)"; ctx.fillRect(0, 0, W, H); }
    // night tint for later streets
    if (level >= 4) { ctx.fillStyle = "rgba(10,20,60,.18)"; ctx.fillRect(0, TOP, W, H - TOP); }
  }

  // =========================================================
  //  HUD
  // =========================================================
  const hud = { time: $("#hTime"), score: $("#hScore"), street: $("#hStreet"), power: $("#hPower"), hand: $(".h-hand"), tbox: $(".h-time"), bowls: $("#hBowls"), hint: $("#hHint") };
  function updateHud() {
    hud.time.textContent = Math.max(0, Math.ceil(G.time));
    hud.tbox.classList.toggle("urgent", G.time <= 10);
    hud.score.textContent = G.score;
    hud.street.textContent = streetDef().name;
    hud.power.style.width = P.power + "%";
    hud.power.style.background = P.tired ? "#e74c3c" : "";
    hud.hand.classList.toggle("active", P.hand);
  }
  function renderBowls() { hud.bowls.textContent = "🍲".repeat(Math.min(G.crossings, 8)) + (G.crossings > 8 ? ` ×${G.crossings}` : ""); }

  // =========================================================
  //  CAMERA / POSE
  // =========================================================
  const Pose = {
    lm: null, ctrl: null, ready: false, landmarker: null, video: $("#video"), skel: $("#skel"), lastVT: -1,
    baseX: 0.5, baseY: null, armed: true, both: 0, fake: Q.has("fake"), jumps: 0,
    async init() {
      if (this.fake) { window.__fake = window.__fake || { cx: 0.5, sy: 0.45, sw: 0.22, handL: false, handR: false, both: false }; this.ready = true; return true; }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: false });
      this.video.srcObject = stream; await this.video.play();
      const tryLoad = async (bundleUrl, wasmUrl, modelUrl, delegate) => {
        const vision = await import(bundleUrl);
        const fs = await vision.FilesetResolver.forVisionTasks(wasmUrl);
        return vision.PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: modelUrl, delegate }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      };
      const local = (p) => new URL(p, location.href).href;
      const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/";
      const attempts = [
        [local("vendor/mediapipe/vision_bundle.mjs"), local("vendor/mediapipe/wasm"), local("vendor/mediapipe/pose_landmarker_lite.task"), "GPU"],
        [local("vendor/mediapipe/vision_bundle.mjs"), local("vendor/mediapipe/wasm"), local("vendor/mediapipe/pose_landmarker_lite.task"), "CPU"],
        [CDN + "vision_bundle.mjs", CDN + "wasm", "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task", "GPU"],
      ];
      let lastErr;
      for (const a of attempts) { try { this.landmarker = await tryLoad(...a); break; } catch (e) { lastErr = e; console.warn("pose load failed", a[3], e); } }
      if (!this.landmarker) throw lastErr || new Error("no pose model");
      this.ready = true;
      return true;
    },
    stop() { const s = this.video.srcObject; if (s) s.getTracks().forEach((t) => t.stop()); this.video.srcObject = null; this.ready = false; },
    update(now) {
      if (!this.ready) return;
      let lm = null;
      if (this.fake) {
        const f = window.__fake;
        const ls = { x: f.cx + f.sw / 2, y: f.sy, visibility: 1 }, rs = { x: f.cx - f.sw / 2, y: f.sy, visibility: 1 };
        const nose = { x: f.cx, y: f.sy - f.sw * 0.8, visibility: 1 };
        const wl = { x: ls.x + 0.03, y: f.handL || f.both ? nose.y - 0.12 : f.sy + 0.25, visibility: 1 };
        const wr = { x: rs.x - 0.03, y: f.handR || f.both ? nose.y - 0.12 : f.sy + 0.25, visibility: 1 };
        lm = []; lm[0] = nose; lm[11] = ls; lm[12] = rs; lm[15] = wl; lm[16] = wr; lm[13] = { x: (ls.x + wl.x) / 2, y: (ls.y + wl.y) / 2, visibility: 1 }; lm[14] = { x: (rs.x + wr.x) / 2, y: (rs.y + wr.y) / 2, visibility: 1 };
      } else {
        const v = this.video;
        if (v.readyState < 2 || v.currentTime === this.lastVT) { this.drawSkel(); return; }
        this.lastVT = v.currentTime;
        try { const r = this.landmarker.detectForVideo(v, now); lm = r.landmarks && r.landmarks[0]; } catch (e) { lm = null; }
      }
      this.lm = lm;
      this.process(lm);
      this.drawSkel();
    },
    process(lm) {
      const st = $("#camStatus");
      if (!lm || !lm[11] || !lm[12] || lm[11].visibility < 0.4 || lm[12].visibility < 0.4) { this.ctrl = this.ctrl ? { ...this.ctrl, hand: false } : null; this.both = 0; st.textContent = "👀 Can't see you, step into the frame!"; return; }
      const mx = (p) => 1 - p.x; // mirror
      const sw = Math.abs(lm[11].x - lm[12].x) || 0.2;
      const cx = (mx(lm[11]) + mx(lm[12])) / 2, sy = (lm[11].y + lm[12].y) / 2;
      const noseY = lm[0] ? lm[0].y : sy - sw;
      const up = (w) => lm[w] && lm[w].visibility > 0.4 && lm[w].y < noseY - sw * 0.15;
      const uL = up(15), uR = up(16);
      // baseline height (slow EMA, frozen while jumping)
      if (this.baseY == null) this.baseY = sy;
      const rise = (this.baseY - sy) / sw;
      let jump = false;
      if (this.armed && rise > 0.32) { jump = true; this.armed = false; this.jumps++; }
      if (!this.armed && rise < 0.12) this.armed = true;
      if (this.armed) this.baseY += (sy - this.baseY) * 0.06;
      const x = clamp(0.5 + (cx - this.baseX) * 2.6, 0.02, 0.98);
      this.ctrl = { x, hand: uL || uR, both: uL && uR, jump };
      st.textContent = jump ? "🦘 JUMP!" : uL && uR ? "🙌 Both hands!" : uL || uR ? "✋ Hand up: traffic stops!" : "🚶 Lean / step to move, JUMP to go forward";
      if (jump && state === "play") hop(1);
    },
    calibrateCenter() { const lm = this.lm; if (lm && lm[11] && lm[12]) { this.baseX = ((1 - lm[11].x) + (1 - lm[12].x)) / 2; this.baseY = (lm[11].y + lm[12].y) / 2; } },
    drawSkel() {
      const c = this.skel, v = this.video;
      const w = c.clientWidth, h = c.clientHeight; if (!w) return;
      if (c.width !== w) { c.width = w; c.height = h; }
      const x = c.getContext("2d"); x.clearRect(0, 0, w, h);
      if (this.fake) { x.fillStyle = "#223"; x.fillRect(0, 0, w, h); }
      const lm = this.lm; if (!lm) return;
      const P2 = (i) => lm[i] && [lm[i].x * w, lm[i].y * h];
      x.strokeStyle = "#f6d77e"; x.lineWidth = 4; x.lineCap = "round";
      [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16]].forEach(([a, b]) => { const p = P2(a), q = P2(b); if (p && q) { x.beginPath(); x.moveTo(...p); x.lineTo(...q); x.stroke(); } });
      x.fillStyle = "#e74c3c"; [0, 15, 16].forEach((i) => { const p = P2(i); if (p) { x.beginPath(); x.arc(p[0], p[1], 7, 0, 7); x.fill(); } });
    },
  };

  // =========================================================
  //  FLOW
  // =========================================================
  const ov = { intro: $("#intro"), loading: $("#loading"), calib: $("#calib"), cd: $("#countdown"), cdNum: $("#cdNum"), camBox: $("#camBox"), hud: $("#hud") };

  function showIntro() {
    state = "attract"; endEvent(); P = null; pickups = [];
    level = 0; speedBoost = 1; makeLanes(); buildBg();
    ov.intro.hidden = false; ov.loading.hidden = true; ov.calib.hidden = true; ov.hud.hidden = true; ov.cd.hidden = true;
    ov.camBox.hidden = mode !== "cam"; ov.camBox.classList.remove("big");
    Sfx.stopBeat();
    showTouch(false);
  }

  async function chooseCam() {
    if (ov.intro.hidden) return;
    Sfx.unlock(); Sfx.click();
    ov.intro.hidden = true; ov.loading.hidden = false;
    $("#loadMsg").textContent = "Loading the AI traffic police… 👮";
    let cancelled = false;
    $("#loadCancel").onclick = () => { cancelled = true; Pose.stop(); ov.loading.hidden = true; chooseKey(); };
    try {
      if (!Pose.ready) await Pose.init();
      if (cancelled) return;
      mode = "cam";
      ov.loading.hidden = true;
      calibrate();
    } catch (e) {
      if (cancelled) return;
      console.warn(e);
      ov.loading.hidden = true;
      toast("📷 Camera not available, switching to keyboard mode!", 3200);
      chooseKey();
    }
  }

  function calibrate() {
    ov.calib.hidden = false; ov.camBox.hidden = false; ov.camBox.classList.add("big");
    const arc = $("#calibArc"), txt = $("#calibState");
    let held = 0, last = performance.now();
    $("#calibKey").onclick = () => { clearInterval(t); ov.calib.hidden = true; ov.camBox.classList.remove("big"); Pose.stop(); mode = "key"; ov.camBox.hidden = true; chooseKey(); };
    const t = setInterval(() => {
      const now = performance.now(), dt = (now - last) / 1000; last = now;
      const c = Pose.ctrl;
      if (Pose.lm && c && c.both) { held += dt; txt.textContent = "Hold it… 🙌"; }
      else { held = Math.max(0, held - dt * 2); txt.textContent = Pose.lm ? "I see you! Now raise BOTH hands 🙌" : "Looking for you… step back a little 👀"; }
      arc.style.strokeDashoffset = 276.5 * (1 - Math.min(1, held / 1.0));
      if (held >= 1.0) {
        clearInterval(t);
        Pose.calibrateCenter();
        Sfx.ding();
        ov.calib.hidden = true; ov.camBox.classList.remove("big");
        countdown();
      }
    }, 50);
  }

  function chooseKey() {
    if (state !== "attract") return;
    Sfx.unlock(); Sfx.click();
    mode = "key"; ov.intro.hidden = true; ov.camBox.hidden = true;
    countdown();
  }

  async function countdown() {
    state = "countdown";
    level = 0; speedBoost = 1; endEvent(); makeLanes(); buildBg();
    P = newPlayer(); pickups = []; rain = [];
    G = { time: GAME_TIME, score: 0, crossings: 0, hits: 0, nearMiss: 0, handUses: 0, snacks: 0, bread: 0, hops: 0, events: [], lastHitAt: -1e9, lastBeep: 99 };
    hud.hint.textContent = mode === "cam" ? "Raise your hand ✋" : isTouch ? "Hold the ✋ button" : "Hold H to raise your hand";
    showTouch(true);
    ov.hud.hidden = false; renderBowls(); updateHud();
    ov.cd.hidden = false;
    for (const n of ["3", "2", "1"]) { ov.cdNum.innerHTML = n; restart(ov.cdNum); Sfx.doum(0, 0.7); Sfx.beep(false); await sleep(800); }
    ov.cdNum.innerHTML = "YALLA!<small>cross the street!</small>"; restart(ov.cdNum); Sfx.beep(true); honk();
    await sleep(600);
    ov.cd.hidden = true;
    evTimer = rand(6, 9); pickT = 2;
    showEvent(`📍 ${streetDef().name}`, "Reach the koshary shop on the other side! 🍲", 2000);
    state = "play";
    Sfx.startBeat(118);
  }
  function restart(n) { n.style.animation = "none"; void n.offsetWidth; n.style.animation = ""; }

  function gameOver() {
    if (state !== "play") return;
    state = "over";
    endEvent();
    showTouch(false);
    Sfx.stopBeat();
    honk(); setTimeout(() => honk(), 250);
    showEvent("⏰ TIME!", "Let's see how Cairo treated you…", 1600);
    const g = G;
    const jumps = Pose.jumps;
    EG.Stats.bump("streetPlayers"); EG.Stats.bump("crossings", g.crossings); EG.Stats.bump("bumps", g.hits);
    setTimeout(() => {
      ov.hud.hidden = true;
      const titles = [
        [g.crossings >= 5, "King of Ramses Square 👑", "You crossed like a true Cairene. Microbus drivers now raise THEIR hand for YOU.", "win"],
        [g.crossings >= 3, "Microbus Whisperer 🚐", "The traffic respects you. Your grandmother would be proud (and terrified).", "win"],
        [g.crossings === 2, "Certified Cairo Pedestrian 🚶", "Two streets! You walk like you own the road. In Cairo, that's the secret.", "win"],
        [g.crossings === 1, "Brave Tourist 🧳", "One street crossed! Most tourists are still standing on the sidewalk from 2019.", "meh"],
        [g.crossings === 0 && g.hits === 0, "The Statue 🗿", "You stood on the sidewalk waiting for the traffic to stop. It never stops. Never.", "lose"],
        [true, "The Bowling Pin 🎳", "Zero streets, many bumps. The cars said ma3lesh… you said ouch.", "lose"],
      ];
      const [, title, line, md] = titles.find((t) => t[0]);
      const badges = [];
      if (g.hits === 0 && g.crossings > 0) badges.push("🛡️ <b>Untouchable</b>: zero hits!");
      if (g.handUses >= 5) badges.push(`👮 <b>Traffic Policeman Jr.</b>: ${g.handUses} hand stops`);
      if (g.nearMiss >= 3) badges.push(`😱 <b>Daredevil</b>: ${g.nearMiss} close calls`);
      if (g.hits >= 4) badges.push(`🧲 <b>Car Magnet</b>: ${g.hits} bumps`);
      if (g.snacks >= 3) badges.push(`🥙 <b>Street Food Hunter</b>: ${g.snacks} snacks`);
      if (g.bread > 0) badges.push(`🍞 <b>Bread Catcher</b>: ×${g.bread}`);
      if (g.events.includes("wedding")) badges.push("💒 <b>Wedding Crasher</b>");
      if (g.events.includes("rain")) badges.push("🌧️ <b>Survived Cairo Rain</b>");
      if (g.events.includes("mom")) badges.push("📱 <b>Good Child</b>: answered mom mid-traffic");
      if (mode === "cam" && jumps >= 15) badges.push(`🦘 <b>Kangaroo</b>: ${jumps} jumps`);
      if (level >= 4) badges.push("🌙 <b>Night Walker</b>: reached the Ring Road");
      showClosure({
        mood: md,
        emoji: md === "win" ? "🚦" : md === "meh" ? "🚶" : "🚗",
        headline: `<b>${title}</b><br>${line}`,
        stats: [{ v: g.crossings, k: "Streets crossed" }, { v: g.score, k: "Score" }, { v: g.hits, k: "Times bumped" }],
        extra: badges.length ? `<div class="badges">${badges.map((b) => `<span class="badge">${b}</span>`).join("")}</div>` : "",
        signoff: pick(["Real Cairo tip: walk at a steady speed, never run, never stop. The drivers will do the math. 🧮", "Shokran! Next time you're in Cairo, you're ready. (You're not ready.) 😄", "Ma'a salama! Remember: in Cairo, the horn is a language. Beep = hello. Beeeeep = hello, but angry."]),
        onReplay: () => { showIntro(); if (mode === "cam" && Pose.ready) { ov.intro.hidden = true; calibrate(); } else if (mode === "key") { ov.intro.hidden = true; chooseKey(); } },
      });
    }, 1700);
  }

  // =========================================================
  //  TOUCH (phones / tablets)
  // =========================================================
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (isTouch) document.body.classList.add("is-touch");
  const touchEl = $("#touch");
  function showTouch(on) { touchEl.hidden = !(on && isTouch && mode === "key"); }
  touchEl.querySelectorAll("button").forEach((b) => {
    const k = b.dataset.k;
    const map = { left: "ArrowLeft", right: "ArrowRight", hand: "h" };
    const down = (e) => {
      e.preventDefault(); Sfx.unlock(); b.classList.add("on");
      try { b.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
      if (k === "up") hop(1); else keys[map[k]] = true;
    };
    const up = () => { b.classList.remove("on"); if (map[k]) keys[map[k]] = false; };
    b.addEventListener("pointerdown", down);
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((t) => b.addEventListener(t, up));
    b.addEventListener("contextmenu", (e) => e.preventDefault());
  });
  // swipe on the road: up = forward, down = back
  let sw = null;
  cv.addEventListener("touchstart", (e) => { const t = e.changedTouches[0]; sw = { x: t.clientX, y: t.clientY, t: performance.now() }; }, { passive: true });
  cv.addEventListener("touchend", (e) => {
    if (!sw || state !== "play") return;
    const t = e.changedTouches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
    if (Math.abs(dy) > 30 && Math.abs(dy) > Math.abs(dx)) hop(dy < 0 ? 1 : -1);
    else if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && performance.now() - sw.t < 300) hop(1); // quick tap = step forward
    sw = null;
  }, { passive: true });

  // =========================================================
  //  INPUT
  // =========================================================
  $("#modeCam").onclick = chooseCam;
  $("#modeKey").onclick = chooseKey;
  addEventListener("keydown", (e) => {
    if (document.querySelector(".closure")) return;
    keys[e.key] = true; keys[e.key.toLowerCase()] = true;
    if (state === "attract" && !ov.intro.hidden) {
      if (e.key.toLowerCase() === "c") chooseCam();
      else if (e.key.toLowerCase() === "k") chooseKey();
      return;
    }
    if (state !== "play") return;
    if (["ArrowUp", "w", "W", " "].includes(e.key)) { e.preventDefault(); hop(1); }
    else if (["ArrowDown", "s", "S"].includes(e.key)) { e.preventDefault(); hop(-1); }
    if (e.key.startsWith("Arrow")) e.preventDefault();
  });
  addEventListener("keyup", (e) => { keys[e.key] = false; keys[e.key.toLowerCase()] = false; });
  addEventListener("blur", () => { for (const k in keys) keys[k] = false; });
  addEventListener("resize", () => { const fx = P ? P.x / W : 0.5; resize(); if (P) P.x = fx * W; });

  resize();
  showIntro();
  requestAnimationFrame(frame);
  // debug handle for testing
  window.__street = { get G() { return G; }, get P() { return P; }, get lanes() { return lanes; }, get state() { return state; }, startEvent: (k) => { lastEv = ""; const E = EVENTS[k]; if (E) { if (ev) endEvent(); const [t, s] = E.start.call(E); ev = { k, t: E.t, mult: E.mult != null ? E.mult : null, E }; showEvent(t, s, 2600); } }, Pose };
})();
