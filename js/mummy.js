(function () {
  "use strict";
  const { $, $$, Sfx, pick, rand, clamp, sleep, esc, showClosure, mountGamebar, Confetti, toast } = EG;

  mountGamebar("🧻 Mummy Wrap Race", { escHome: true });

  // ---------- decor ----------
  (function decor() {
    let g = "";
    for (let i = 0; i < 700; i++) g += String.fromCodePoint(0x13000 + Math.floor(Math.random() * 0x42f));
    $("#hieroWall").textContent = g;
    const st = $("#streamers");
    for (let i = 0; i < 14; i++) {
      const s = document.createElement("i");
      s.style.left = rand(0, 98) + "vw"; s.style.animationDuration = rand(7, 14) + "s"; s.style.animationDelay = -rand(0, 14) + "s";
      s.style.transform = `rotate(${rand(-20, 20)}deg)`;
      st.appendChild(s);
    }
  })();

  const NAMES = ["Team Tutankhamun", "The Pharaohs", "Cleopatra's Cats", "The Sphinx Squad", "Nile Crocodiles", "Pyramid Schemers", "Koshary Kings", "The Mummy Daddies", "Anubis Angels", "Rolling Scrolls", "Toilet Paper Pharaohs", "The Unwrapped", "Desert Burritos", "Team Ramses", "The Camel Crew", "Papyrus Panthers"];
  const COMMENT = [
    "🎙️ {A} is wrapping like a professional burrito chef! 🌯",
    "🎙️ {B}'s mummy is starting to look like a giant cotton bud!",
    "🎙️ Remember: mummies DON'T laugh! Stay serious! 😐",
    "🎙️ Pharaoh Ramses is watching… and he is NOT impressed. 👀",
    "🎙️ Wrap the legs! Mummies don't need knees!",
    "🎙️ The paper is ripping! Ma3lesh! Keep going!",
    "🎙️ Is that a mummy or a snowman?! ☃️",
    "🎙️ In ancient Egypt this took 70 days. You get 60 seconds. 😅",
    "🎙️ Crowd! Make some NOISE! 📣",
    "🎙️ {A} vs {B}: the battle of the century… BC!",
    "🎙️ Don't forget the head! (leave the nose free, we need them alive)",
    "🎙️ Fun fact: a real mummy used HUNDREDS of meters of linen! 🧵",
    "🎙️ {B} is going round and round… like Cairo traffic! 🚗",
    "🎙️ Somewhere, a pharaoh is crying tears of joy. 😭",
  ];

  const CURSES = [
    { t: "🦩 ONE HAND ONLY!", s: "Wrappers: use only ONE hand for 10 seconds!" },
    { t: "🙈 EYES CLOSED!", s: "Wrappers: close your eyes! Mummies: guide them with your voice!" },
    { t: "💃 DANCING MUMMIES!", s: "Mummies must DANCE while being wrapped! 🎶" },
    { t: "🐫 CAMEL NOISES!", s: "Everyone makes camel noises for 10 seconds. Yes, the crowd too!" },
    { t: "🧊 FREEZE!", s: "NOBODY MOVES! The pharaoh is watching… 👀", freeze: 5 },
    { t: "🌀 SPIN!", s: "Mummies: spin around 3 times! Wrappers: keep wrapping!" },
    { t: "👑 PHARAOH POSE!", s: "Mummies: cross your arms on your chest like a real pharaoh! Hold it!" },
    { t: "🐢 SLOW MOTION!", s: "Everybody moves in sloooow mooootion for 10 seconds!" },
    { t: "📣 YALLA YALLA!", s: "Wrappers: shout “YALLA!” every time you go around the mummy!" },
    { t: "🦶 ONE LEG!", s: "Mummies: stand on ONE leg like a flamingo! 🦩" },
  ];
  const PREFIX = ["Ramses", "Tut", "Nefer", "Amenhotep", "Khufu", "Cleo", "Hatshep", "Akhenaten", "Seti", "Thutmose"];
  const SUFFIX = ["the Fluffy", "the Wobbly", "the Crunchy", "the Magnificent", "the Unwrapped", "the Sneezy", "the Burrito", "the Toilet-Papered", "the Slightly Damp", "the Very Itchy", "the Ticklish"];
  const LOSER_AWARDS = ["🌯 The Burrito Award", "☃️ Best Snowman", "🎨 Most Creative Use of Paper", "🦖 Scariest Mummy", "🧶 Best Knitting Technique", "🌪️ Most Chaotic Wrapping"];
  let cursesOn = true;
  const el = {
    setup: $("#setup"), race: $("#race"), judge: $("#judge"), winner: $("#winner"),
    teamA: $("#teamA"), teamB: $("#teamB"), go: $("#goBtn"),
    nameA: $("#nameA"), nameB: $("#nameB"), ring: $("#ring"), clock: $("#clockNum"), comm: $("#commentary"),
    pause: $("#pauseBtn"), stop: $("#stopBtn"), cd: $("#countdown"), cdNum: $("#cdNum"), big: $("#bigmsg"),
    mNameA: $("#mNameA"), mNameB: $("#mNameB"), fillA: $("#fillA"), fillB: $("#fillB"), peakA: $("#peakA"), peakB: $("#peakB"),
    scoreA: $("#scoreA"), scoreB: $("#scoreB"), cheerA: $("#cheerA"), cheerB: $("#cheerB"), colA: $("#colA"), colB: $("#colB"),
    banner: $("#cheerBanner"), micMsg: $("#micMsg"), winA: $("#winA"), winB: $("#winB"), winTie: $("#winTie"),
    winTitle: $("#winTitle"), winSub: $("#winSub"), cam: $("#cam"), shot: $("#shot"), camBtn: $("#camBtn"), snapBtn: $("#snapBtn"),
    saveBtn: $("#saveBtn"), finishBtn: $("#finishBtn"), snapCount: $("#snapCount"), flash: $("#flash"), camOff: $("#camOff"), fdBot: $("#fdBot"),
  };

  let G = null; // game state
  let raceTimer = null;

  function show(id) { ["setup", "race", "judge", "winner"].forEach((s) => el[s].classList.toggle("active", s === id)); }

  // ---------- setup ----------
  function randName(not) { let n; do { n = pick(NAMES); } while (n === not); return n; }
  function showSetup() {
    stopRace(); stopCam(); stopMic();
    show("setup");
    el.teamA.value = randName(); el.teamB.value = randName(el.teamA.value);
  }
  $$(".dice").forEach((b) => (b.onclick = () => { const i = $("#" + b.dataset.for); i.value = randName(i.value); Sfx.pop(); }));
  let dur = 60;
  $$(".chip").forEach((c) => (c.onclick = () => { $$(".chip").forEach((x) => x.classList.remove("on")); c.classList.add("on"); dur = +c.dataset.s; Sfx.click(); }));
  el.go.onclick = startRace;
  $("#curseChip").onclick = () => { cursesOn = !cursesOn; $("#curseChip").classList.toggle("on", cursesOn); $("#curseChip").textContent = `😈 Pharaoh's curses: ${cursesOn ? "ON" : "OFF"}`; Sfx.click(); };
  [el.teamA, el.teamB].forEach((i) => i.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); startRace(); } }));

  // ---------- race ----------
  async function startRace() {
    if (G && G.phase !== "setup" && G.phase !== "done") return;
    Sfx.unlock();
    G = {
      phase: "countdown",
      A: el.teamA.value.trim() || "Team 1", B: el.teamB.value.trim() || "Team 2",
      dur, left: dur, paused: false, scores: { A: null, B: null }, measuring: false, winner: null, lastComment: -1,
      curseAt: {}, cursesDone: [], curse: null, names: { A: `${pick(PREFIX)} ${pick(SUFFIX)}`, B: `${pick(PREFIX)} ${pick(SUFFIX)}` },
    };
    if (G.names.A === G.names.B) G.names.B = `${pick(PREFIX)} the Second`;
    if (cursesOn) {
      const order = EG.shuffle(CURSES);
      [0.22, 0.48, 0.74].forEach((f, i) => { const at = Math.round(dur * (1 - f)); if (at > 9) G.curseAt[at] = order[i]; });
    }
    hideCurse();
    if (G.A === G.B) G.B += " 2";
    el.nameA.textContent = el.mNameA.textContent = G.A;
    el.nameB.textContent = el.mNameB.textContent = G.B;
    el.winA.textContent = `${G.A} wins`; el.winB.textContent = `${G.B} wins`;
    document.activeElement && document.activeElement.blur();
    show("race");
    el.race.classList.remove("urgent", "paused");
    setClock();
    el.comm.textContent = "🎙️ Wrappers ready? Mummies, stand still like a statue!";
    // countdown
    el.cd.hidden = false;
    for (const n of ["3", "2", "1"]) {
      el.cdNum.textContent = n; restart(el.cdNum); Sfx.doum(0, 0.8); Sfx.beep(false);
      await sleep(900);
    }
    el.cdNum.textContent = "YALLA!"; restart(el.cdNum); Sfx.beep(true); Sfx.doum(0, 0.9); Sfx.tak(0.1); Sfx.tak(0.2);
    await sleep(700);
    el.cd.hidden = true;
    G.phase = "race";
    Sfx.startBeat(110);
    comment();
    raceTimer = setInterval(tick, 1000);
  }
  function restart(node) { node.style.animation = "none"; void node.offsetWidth; node.style.animation = ""; }
  function setClock() {
    el.clock.textContent = G.left;
    el.ring.style.strokeDashoffset = (603.2 * (1 - G.left / G.dur)).toFixed(1);
  }
  function comment() {
    let i; do { i = Math.floor(Math.random() * COMMENT.length); } while (i === G.lastComment);
    G.lastComment = i;
    el.comm.textContent = COMMENT[i].replace("{A}", G.A).replace("{B}", G.B);
    el.comm.classList.remove("pop"); void el.comm.offsetWidth; el.comm.classList.add("pop");
  }
  function tick() {
    if (!G || G.phase !== "race" || G.paused) return;
    G.left--;
    setClock();
    Sfx.setTempo(110 + (1 - G.left / G.dur) * 90);
    if (G.curseAt[G.left]) showCurse(G.curseAt[G.left]);
    if (G.curse) {
      G.curse.left--;
      const c = G.curse;
      const bar = $("#curse .cbar"); if (bar) bar.style.transform = `scaleX(${Math.max(0, c.left / c.total)})`;
      const fz = $("#curse .cfreeze"); if (fz) fz.textContent = c.left > 0 ? c.left : "GO!";
      if (c.left <= 0) { setTimeout(hideCurse, c.freeze ? 600 : 0); G.curse = null; }
    }
    if (G.left <= 10 && G.left > 0) {
      el.race.classList.add("urgent"); Sfx.beep(G.left <= 3);
      if (G.left === 10) { el.comm.textContent = "🎙️ 10 SECONDS!!! WRAP FASTER!!! 🔥"; el.comm.classList.remove("pop"); void el.comm.offsetWidth; el.comm.classList.add("pop"); }
    } else if (G.left > 10 && (G.dur - G.left) % 7 === 0 && !G.curse) comment();
    if (G.left <= 0) endRace();
  }
  function showCurse(c) {
    const total = c.freeze || 9;
    G.curse = { ...c, left: total, total };
    G.cursesDone.push(c.t);
    const box = $("#curse");
    box.innerHTML = `<div class="cw">😈 THE PHARAOH'S CURSE 😈</div><div class="ct">${c.t}</div><div class="cs">${c.s}</div>${c.freeze ? `<div class="cfreeze">${total}</div>` : '<div class="cbar"></div>'}`;
    box.hidden = false; box.style.animation = "none"; void box.offsetWidth; box.style.animation = "";
    Sfx.tone(110, 0.6, { type: "sawtooth", vol: 0.2, lp: 700, slide: 70 }); Sfx.tone(233, 0.6, { type: "sawtooth", vol: 0.12, lp: 900, when: 0.05 });
    Sfx.drumroll(0.6);
    el.comm.textContent = "🎙️ " + pick(["Uh oh… the pharaoh is bored!", "A CURSE! The ancient gods want entertainment!", "Ha! Good luck with that one!"]);
  }
  function hideCurse() { const b = $("#curse"); if (b) { b.hidden = true; b.innerHTML = ""; } if (G) G.curse = null; }
  function togglePause() {
    if (!G || G.phase !== "race") return;
    G.paused = !G.paused;
    el.race.classList.toggle("paused", G.paused);
    el.pause.innerHTML = G.paused ? '▶ Resume <span class="key">P</span>' : '⏸ Pause <span class="key">P</span>';
    if (G.paused) Sfx.stopBeat(); else Sfx.startBeat(110 + (1 - G.left / G.dur) * 90);
  }
  function stopRace() { clearInterval(raceTimer); raceTimer = null; Sfx.stopBeat(); }
  el.pause.onclick = togglePause;
  el.stop.onclick = () => { if (G && G.phase === "race") endRace(); };

  async function endRace() {
    if (G.phase !== "race") return;
    G.phase = "stopping";
    stopRace();
    hideCurse();
    el.race.classList.remove("urgent");
    // horn
    [0, 0.35, 0.7].forEach((w) => Sfx.tone(220, 0.3, { type: "sawtooth", vol: 0.18, lp: 1400, when: w }));
    Sfx.tone(165, 0.9, { type: "sawtooth", vol: 0.2, lp: 1200, when: 1.05 });
    bigMsg("⏰ STOP!", "HANDS OFF THE PAPER! 🙌");
    await sleep(2400);
    el.big.hidden = true;
    G.phase = "judge";
    show("judge");
    resetMeters();
  }
  function bigMsg(t, s) { el.big.innerHTML = `<div>${t}<small>${s}</small></div>`; el.big.hidden = false; }

  // ---------- judging with the microphone ----------
  let mic = null; // { ctx, an, stream, buf }
  function resetMeters() {
    ["A", "B"].forEach((k) => { el["fill" + k].style.height = "0%"; el["peak" + k].style.bottom = "0%"; el["score" + k].textContent = "–"; el["col" + k].classList.remove("live", "won"); el["cheer" + k].disabled = false; });
    el.banner.hidden = true;
    el.micMsg.textContent = "";
  }
  async function getMic() {
    if (mic) return mic;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const an = ctx.createAnalyser(); an.fftSize = 1024;
      src.connect(an);
      mic = { ctx, an, stream, buf: new Float32Array(an.fftSize) };
      return mic;
    } catch (e) {
      el.micMsg.textContent = "🎤 No microphone available. Judge, pick the winner with the buttons →";
      el.cheerA.disabled = el.cheerB.disabled = true;
      return null;
    }
  }
  function stopMic() { if (mic) { mic.stream.getTracks().forEach((t) => t.stop()); mic.ctx.close(); mic = null; } }
  function level(m) {
    m.an.getFloatTimeDomainData(m.buf);
    let s = 0; for (let i = 0; i < m.buf.length; i++) s += m.buf[i] * m.buf[i];
    const db = 20 * Math.log10(Math.sqrt(s / m.buf.length) + 1e-8);
    return clamp(((db + 55) / 47) * 100, 0, 100);
  }
  async function cheer(k) {
    if (!G || G.phase !== "judge" || G.measuring) return;
    const m = await getMic();
    if (!m) return;
    if (m.ctx.state === "suspended") await m.ctx.resume();
    G.measuring = true;
    const name = G[k];
    el["col" + k].classList.add("live"); el["col" + k].classList.remove("won");
    el.banner.hidden = false;
    for (const n of ["3", "2", "1"]) { el.banner.innerHTML = `${n}<small>Get ready to cheer for ${esc(name)}!</small>`; restart(el.banner); Sfx.beep(false); await sleep(800); }
    el.banner.innerHTML = `📣 MAKE NOISE!!!<small>for ${esc(name)}</small>`; restart(el.banner); Sfx.beep(true);
    const samples = []; let peak = 0; const t0 = performance.now(); let smooth = 0;
    await new Promise((res) => {
      (function frame() {
        const lv = level(m); samples.push(lv); peak = Math.max(peak, lv);
        smooth = smooth * 0.6 + lv * 0.4;
        el["fill" + k].style.height = smooth + "%"; el["peak" + k].style.bottom = peak + "%";
        const left = 5 - (performance.now() - t0) / 1000;
        if (left > 0) { if (left < 4.2) el.banner.innerHTML = `📣 LOUDER!!!<small>${Math.ceil(left)}…</small>`; requestAnimationFrame(frame); } else res();
      })();
    });
    samples.sort((a, b) => b - a);
    const top = samples.slice(0, Math.max(1, Math.floor(samples.length * 0.3)));
    const score = Math.round(top.reduce((s, v) => s + v, 0) / top.length);
    G.scores[k] = score;
    el["score" + k].textContent = score + " 🔊";
    el["fill" + k].style.height = score + "%";
    el["col" + k].classList.remove("live");
    el.banner.innerHTML = `${score}<small>${score >= 80 ? "🔥 FOOTBALL DERBY LEVEL!" : score >= 60 ? "🎉 Egyptian wedding level!" : score >= 40 ? "🚗 Cairo traffic level!" : score >= 20 ? "🐪 Market chatter…" : "😴 Sleepy camel… louder next time!"}</small>`;
    restart(el.banner); Sfx.ding();
    await sleep(1800);
    el.banner.hidden = true;
    G.measuring = false;
    if (G.scores.A != null && G.scores.B != null) {
      const d = G.scores.A - G.scores.B;
      if (Math.abs(d) < 3) { el.banner.hidden = false; el.banner.innerHTML = `IT'S A TIE?! 😱<small>Cheer again, or the judge decides!</small>`; restart(el.banner); Sfx.boing(); setTimeout(() => (el.banner.hidden = true), 2500); }
      else declare(d > 0 ? "A" : "B");
    }
  }
  el.cheerA.onclick = () => cheer("A");
  el.cheerB.onclick = () => cheer("B");
  el.winA.onclick = () => G && G.phase === "judge" && !G.measuring && declare("A");
  el.winB.onclick = () => G && G.phase === "judge" && !G.measuring && declare("B");
  el.winTie.onclick = () => G && G.phase === "judge" && !G.measuring && declare("tie");

  async function declare(w) {
    if (G.phase !== "judge") return;
    G.phase = "winner"; G.winner = w;
    if (w !== "tie") el["col" + w].classList.add("won");
    Sfx.drumroll(1.2);
    await sleep(1300);
    stopMic();
    show("winner");
    const wn = w === "tie" ? `${G.A} & ${G.B}` : G[w];
    el.winTitle.textContent = w === "tie" ? "IT'S A TIE! 🤝" : `${wn} WINS!`;
    el.winSub.textContent = w === "tie" ? "Two perfect mummies! The pharaoh can't choose!" : "Your mummy will be preserved for 5,000 years! 🏺";
    el.fdBot.textContent = `${w === "tie" ? "Double mummy" : wn} · Egyptian Booth · ${new Date().getFullYear()}`;
    const poss = (n) => esc(n) + (/s$/i.test(n) ? "'" : "'s");
    $("#royal").innerHTML = `<span>🧟 ${poss(G.A)} mummy is now known as <b>${esc(G.names.A)}</b></span><span>🧟‍♀️ ${poss(G.B)} mummy is now known as <b>${esc(G.names.B)}</b></span>`;
    if (w !== "tie") el.fdBot.textContent = `${G.names[w]} · ${wn} · ${new Date().getFullYear()}`;
    el.shot.hidden = true; el.cam.hidden = false; el.saveBtn.hidden = true; el.snapBtn.disabled = true; el.camOff.hidden = false;
    Sfx.fanfare(); Confetti.burst(220, { emojis: ["🧻", "🧟", "👑", "🏺"] });
  }

  // ---------- photo booth ----------
  let camStream = null;
  async function camOn() {
    if (camStream) return;
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      el.cam.srcObject = camStream; await el.cam.play();
      el.camOff.hidden = true; el.snapBtn.disabled = false; el.cam.hidden = false; el.shot.hidden = true; el.saveBtn.hidden = true;
      Sfx.pop();
    } catch (e) {
      toast("📷 Camera not available. Just take a photo with your phone! 📱", 3000);
    }
  }
  function stopCam() { if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; } el.cam.srcObject = null; }
  async function snap() {
    if (!camStream || el.snapBtn.disabled) return;
    el.snapBtn.disabled = true;
    el.cam.hidden = false; el.shot.hidden = true;
    el.snapCount.hidden = false;
    for (const n of ["3", "2", "1"]) { el.snapCount.textContent = n; restart(el.snapCount); Sfx.beep(false); await sleep(800); }
    el.snapCount.hidden = true;
    Sfx.noise(0.15, { vol: 0.5, f: 4000, q: 0.5 }); // shutter
    el.flash.classList.remove("go"); void el.flash.offsetWidth; el.flash.classList.add("go");
    const v = el.cam, c = el.shot, W = 1280, H = 960;
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    // cover-crop the video into 4:3, mirrored
    const vw = v.videoWidth || 1280, vh = v.videoHeight || 720;
    const s = Math.max(W / vw, H / vh), dw = vw * s, dh = vh * s;
    x.save(); x.translate(W, 0); x.scale(-1, 1); x.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh); x.restore();
    // sepia-ish ancient tint
    x.fillStyle = "rgba(160,110,40,.18)"; x.fillRect(0, 0, W, H);
    // frame bars
    x.fillStyle = "rgba(16,35,74,.9)"; x.fillRect(0, 0, W, 90); x.fillRect(0, H - 90, W, 90);
    x.strokeStyle = "#e3b23c"; x.lineWidth = 24; x.strokeRect(12, 12, W - 24, H - 24);
    x.fillStyle = "#f6d77e"; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = '58px "Hiero", "Segoe UI Historic", serif'; x.fillText("𓂀 𓋹 𓆣", W / 2 - 330, 50); x.fillText("𓆣 𓋹 𓂀", W / 2 + 330, 50);
    x.font = '54px "Lalezar", Impact, sans-serif'; x.fillText("CERTIFIED MUMMY", W / 2, 52);
    x.font = '44px "Lalezar", Impact, sans-serif'; x.fillText(el.fdBot.textContent, W / 2, H - 46);
    el.shot.hidden = false; el.cam.hidden = true; el.saveBtn.hidden = false;
    el.snapBtn.disabled = false; el.snapBtn.innerHTML = '📸 Again <span class="key">Space</span>';
  }
  function save() {
    try {
      const a = document.createElement("a");
      a.href = el.shot.toDataURL("image/png");
      a.download = `certified-mummy-${Date.now()}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      toast("💾 Saved to the Downloads folder!");
    } catch (e) { toast("Could not save, take a phone photo instead 📱"); }
  }
  el.camBtn.onclick = camOn; el.snapBtn.onclick = snap; el.saveBtn.onclick = save;
  el.finishBtn.onclick = finish;

  function finish() {
    if (!G || G.phase !== "winner") return;
    G.phase = "done";
    stopCam();
    EG.Stats.bump("mummies", 2);
    const poss = (n) => esc(n) + (/s$/i.test(n) ? "'" : "'s");
    const w = G.winner, W = w === "tie" ? null : G[w], L = w === "tie" ? null : G[w === "A" ? "B" : "A"];
    const anyMic = G.scores.A != null || G.scores.B != null;
    const sc = (k) => (G.scores[k] == null ? "–" : G.scores[k] + " 🔊");
    const loserAward = pick(LOSER_AWARDS);
    const awards = w === "tie"
      ? `<div class="awards"><span>🏆 ${esc(G.A)}: Best Mummy (shared)</span><span>🏆 ${esc(G.B)}: Best Mummy (shared)</span></div>`
      : `<div class="awards"><span>🏆 ${esc(W)}: <b>Best Mummy</b></span><span>${loserAward.split(" ")[0]} ${esc(L)}: <b>${loserAward.split(" ").slice(1).join(" ")}</b></span></div>`;
    const curseLine = G.cursesDone.length ? `<div style="margin-top:8px;font-weight:700">😈 Curses survived: ${G.cursesDone.map(esc).join(" · ")}</div>` : "";
    showClosure({
      mood: "win",
      emoji: "🧟",
      headline: w === "tie"
        ? `A TIE! <b>${esc(G.A)}</b> and <b>${esc(G.B)}</b> both made museum-quality mummies. 🏛️ The British Museum is already asking to borrow them… 😏`
        : `🏆 <b>${esc(W)}</b> wins! All hail <b>${esc(G.names[w])}</b>, officially certified for 5,000 years of rest.<br>😈 <b>${esc(L)}</b>: ma3lesh… the curse of the pharaoh is now on you. (It's mostly harmless. Mostly.)`,
      stats: anyMic
        ? [{ v: G.dur + "s", k: "Race time" }, { v: sc("A"), k: G.A.slice(0, 18) }, { v: sc("B"), k: G.B.slice(0, 18) }]
        : [{ v: G.dur + "s", k: "Race time" }, { v: "⚖️", k: "Judge's choice" }, { v: G.cursesDone.length, k: "Curses survived" }],
      extra: awards + curseLine,
      signoff: "Shokran to our brave mummies! Please recycle the paper… the pharaohs care about the planet. 🌍",
      onReplay: showSetup,
    });
  }

  // ---------- keys ----------
  addEventListener("keydown", (e) => {
    if (e.target && e.target.tagName === "INPUT") return;
    const k = e.key.toLowerCase();
    if (el.setup.classList.contains("active")) { if (k === " " || k === "enter") { e.preventDefault(); startRace(); } return; }
    if (el.race.classList.contains("active")) { if (k === "p" || k === " ") { e.preventDefault(); togglePause(); } else if (k === "s") el.stop.click(); return; }
    if (el.judge.classList.contains("active")) { if (k === "1") cheer("A"); else if (k === "2") cheer("B"); return; }
    if (el.winner.classList.contains("active")) { if (k === "c") camOn(); else if (k === " ") { e.preventDefault(); snap(); } else if (k === "enter") { e.preventDefault(); finish(); } }
  });

  window.__mummy = { get G() { return G; } };
  showSetup();
})();
