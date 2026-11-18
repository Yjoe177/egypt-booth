(function () {
  "use strict";
  const { $, $$, Sfx, toggleFullscreen, hieroglyphs, cartoucheHTML, esc, shuffle } = EG;

  // stars
  const stars = $("#stars");
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("i");
    s.style.left = Math.random() * 100 + "%"; s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = -Math.random() * 3 + "s";
    const z = Math.random() < 0.15 ? 3 : 2; s.style.width = s.style.height = z + "px";
    stars.appendChild(s);
  }

  // facts ticker
  const FACTS = shuffle([
    "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid. 🚀",
    "The Great Pyramid was the tallest building on Earth for about 3,800 years. 🔺",
    "The pyramid builders were paid workers, not slaves, and they got daily rations of bread and beer. 🍞",
    "The first recorded workers' strike in history happened in Egypt around 1157 BC: the royal tomb builders weren't paid on time. ✊",
    "Ancient Egyptians did a pregnancy test with wheat and barley seeds, and a 1963 study found it partly worked! 🌾",
    "When a family cat died in ancient Egypt, people shaved their eyebrows to mourn it. 🐈",
    "Egyptians played a board game called Senet more than 5,000 years ago. 🎲",
    "Koshary, Egypt's national dish = rice + lentils + pasta + chickpeas + tomato sauce + crispy onions. In ONE bowl. 🍲",
    "During mummification the brain was pulled out through the nose and thrown away. The heart stayed: they thought it held your mind. 🧠",
    "Hieroglyphs were cracked in 1822 thanks to the Rosetta Stone, which has the same text in 3 scripts. 📜",
    "The ancient Egyptian calendar already had 365 days. 📅",
    "Tutankhamun's tomb was found in 1922, almost untouched, with more than 5,000 objects inside. 👑",
    "Most of Egypt's 100+ million people live along the Nile, on roughly 5% of the country's land. 🌊",
    "'Inshallah' means 'God willing'. In Egypt it can also mean 'yes', 'maybe', 'later' and 'absolutely not'. 😄",
    "Egyptians call everybody 'Habibi' (my dear): friends, strangers, taxi drivers, the cat… ❤️",
    "Ancient Egyptian doctors had specialists for eyes, teeth and stomachs. 🩺",
  ]);
  let fi = 0, turn = 0;
  const factEl = $("#fact"), labelEl = document.querySelector(".ticker-label");
  function liveLine() {
    const s = EG.Stats.get();
    const parts = [];
    if (s.hearts) parts.push(`⚖️ ${s.hearts} hearts weighed${s.eaten ? `, 🐊 Ammit ate ${s.eaten}` : ""}`);
    if (s.deals || s.walkouts) {
      const best = EG.Store.get("eg_haggle_board", []).filter((r) => r.d === EG.today()).sort((a, b) => b.pct - a.pct)[0];
      parts.push(`🛍️ ${s.deals || 0} deals${best ? `, best haggler: ${best.name} (−${best.pct}%)` : ""}`);
    }
    if (s.mummies) parts.push(`🧻 ${s.mummies} mummies made`);
    if (s.streetPlayers) parts.push(`🚦 ${s.crossings || 0} streets crossed, ${s.bumps || 0} bumps`);
    return parts.length ? parts.join("  ·  ") : null;
  }
  const showFact = () => {
    factEl.classList.add("out");
    setTimeout(() => {
      const live = turn++ % 3 === 2 ? liveLine() : null;
      if (live) { labelEl.textContent = "📊 TODAY AT THE BOOTH"; factEl.textContent = live; }
      else { labelEl.textContent = "🤓 DID YOU KNOW?"; factEl.textContent = FACTS[fi++ % FACTS.length]; }
      factEl.classList.remove("out");
    }, 500);
  };
  showFact(); setInterval(showFact, 9000);

  // cards: keyboard 1-4, arrows + enter, sounds
  const cards = $$(".card");
  let sel = -1;
  const mark = (i) => { sel = i; cards.forEach((c, j) => c.classList.toggle("sel", j === i)); };
  const go = (card) => { Sfx.whoosh(); card.style.transform = "scale(1.12)"; setTimeout(() => (location.href = card.getAttribute("href")), 260); };
  cards.forEach((c, i) => {
    c.addEventListener("mouseenter", () => { Sfx.hover(); mark(i); });
    c.addEventListener("click", (e) => { e.preventDefault(); go(c); });
  });

  // mute + fullscreen
  const muteBtn = $("#muteBtn");
  const paint = () => (muteBtn.textContent = Sfx.muted ? "🔇" : "🔊");
  paint();
  muteBtn.onclick = () => { Sfx.toggle(); paint(); };
  $("#fsBtn").onclick = toggleFullscreen;

  // hieroglyph name modal
  const modal = $("#nameModal"), input = $("#nameInput"), out = $("#nameOut"), legend = $("#nameLegend");
  const openModal = () => { modal.hidden = false; input.value = ""; render(); setTimeout(() => input.focus(), 50); Sfx.pop(); };
  const closeModal = () => { modal.hidden = true; };
  function render() {
    const v = input.value.trim();
    if (!v) { out.innerHTML = '<span style="opacity:.5;font-weight:700">Your royal cartouche appears here ✨</span>'; legend.innerHTML = ""; return; }
    const h = hieroglyphs(v);
    out.innerHTML = cartoucheHTML(v);
    legend.innerHTML = h.parts.map(([l, n]) => `<span><i>${hieroglyphs(l).glyphs}</i>${esc(l.toUpperCase())} = ${esc(n)}</span>`).join("");
  }
  input.addEventListener("input", () => { Sfx.tick(); render(); });
  $("#nameBtn").onclick = openModal;
  $("#nameClose").onclick = closeModal;
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

  addEventListener("keydown", (e) => {
    if (!modal.hidden) { if (e.key === "Escape") closeModal(); return; }
    const k = e.key.toLowerCase();
    if (["1", "2", "3", "4"].includes(k)) go(cards[+k - 1]);
    else if (k === "arrowright" || k === "arrowdown") { mark((sel + 1) % cards.length); Sfx.hover(); }
    else if (k === "arrowleft" || k === "arrowup") { mark((sel - 1 + cards.length) % cards.length); Sfx.hover(); }
    else if (k === "enter" && sel >= 0) go(cards[sel]);
    else if (k === "m") { Sfx.toggle(); paint(); }
    else if (k === "f") toggleFullscreen();
    else if (k === "n") { e.preventDefault(); openModal(); }
  });
})();
