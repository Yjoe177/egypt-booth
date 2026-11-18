# 🇪🇬 Egypt Booth: Guide for You & Your Helper

## Start the booth (30 seconds)
1. Double-click **`START_BOOTH.bat`**. A black window opens (keep it open), then the browser opens the dashboard.
2. Press **F** (or the ⛶ button) for fullscreen.
3. Turn the laptop volume **up**. The games have music, drums, honks and a talking shopkeeper.
4. The first time you open the Mummy race and the Street game, the browser asks for the **microphone** / **camera**. Click **Allow**.

> Use **Chrome or Edge**. Everything works offline (fonts and the body-tracking AI are stored in the `vendor` folder).
> Don't open `index.html` by double-clicking. The camera and microphone only work through `START_BOOTH.bat`.

## Dashboard keys
| Key | Action |
|---|---|
| **1 2 3 4** | open a game |
| **N** | "Your name in hieroglyphs" (great 10-second demo for people passing by) |
| **M** | sound on/off · **F** fullscreen |

Every game: **Esc** or 🏠 returns to the dashboard. On the end screen, **R** plays again and **H** goes home. It also returns to the dashboard by itself after 60 s.

---

## 1 · ⚖️ Weighing of the Heart (1 min, 1 player)
- The visitor types their name (optional; it becomes their hieroglyph cartouche) and presses **Enter**.
- 7 funny confessions: **Y** = guilty, **N** = innocent.
- 🚨 **Lie detector**: sometimes the crowd decides: **L** = liar, **T** = true.
- **Surprise events** between questions (keys **1/2/3**): Bastet the cat jumps on the scale, Thoth's pop quiz (real Egypt facts), bribe Anubis with koshary, a friend testifies, Ammit's 5-second speed round, Ma'at sneezes (double points).
- **7 endings**: VIP paradise, Pure heart, "Allegedly pure" (too perfect!), 3 different in-between fates, eaten by Ammit, or "too spicy, even Ammit spat it out".
- 💡 Host tip: read the confessions out loud and make the friends react.

## 2 · 🛍️ Haggle in the Bazaar (1.5 min, 1 player)
- A random shopkeeper: **Uncle Sayed** (dramatic), **Hagga Fatma** (strict grandma, loves compliments) or **Mido** (Instagram hustler).
- Type a number, then **Enter** to make an offer. Tactics: **G** "Ghali awi!" (too expensive) · **C** compliment · **W** walk away · **D** accept his price.
- **Live events**: phone call (offer fast!), rival tourist (price goes UP in 9 s), tea time (+15 s), the cat breaks a vase, power cut ("darkness discount"), a bundle offer (**Y/N**).
- The ending reveals the item's *real* cost 🤫, a rank, sometimes a free gift, and a **daily leaderboard**.
- 💡 Host tip: real Egyptian advice: start at about a quarter of his price, stay polite, walk away once.

## 3 · 🧻 Mummy Wrap Race (team game, your helper runs it)
- Needs **2 rolls of toilet paper** per race (bring plenty, about 20+ rolls) and 4 players (2 teams × wrapper + mummy).
- Pick team names (🎲 = random funny names), time (45/60/90 s) and keep **😈 Pharaoh's curses ON**.
- **Space** starts it. During the race: **P** pause · **S** stop early.
- **Curses** pop up mid-race: one hand only, eyes closed, FREEZE, dancing mummies, camel noises, one leg…
- **Mummy parade + crowd vote**: press **1** then **2**. The crowd screams for each team and the microphone measures it. No mic? Use the "Team wins" buttons.
- Winner screen: royal mummy names, **C** camera on, **Space** photo, 💾 save, **Enter** finish.
- 💡 Run it every ~30 min as a "show" to pull a crowd. Have a trash bag ready!

## 4 · 🚦 Cross a Cairo Street (1 min, 1 player)
- **C** = body mode (camera): stand about **2 m** from the laptop so your head, shoulders and hands are visible. Raise **both hands** to start.
  - Step/lean **left-right** to move · **JUMP** to go forward · **raise one hand** to make the cars stop (the Cairo way ✋).
- **K** = keyboard mode: ← → move · ↑ / Space forward · ↓ back · hold **H** to raise your hand.
- 6 streets that get crazier (Zamalek, Tahrir, Ramses Square, rush hour, Ring Road at iftar, after the match) plus random events (traffic policeman, wedding zaffa, football fans, rain, goats, microbus stop, free ful sandwiches, tea break, mom calling).
- The ending gives a title (from "The Statue 🗿" to "King of Ramses Square 👑") and badges.
- 💡 Body mode is the crowd magnet: people jumping in front of a laptop draw an audience. The camera needs good light, so don't stand with a bright window behind the player.

---

## Troubleshooting
| Problem | Fix |
|---|---|
| No sound | Click anywhere once (browsers block sound until the first click), check **M** and the laptop volume. |
| Camera/mic not working | Make sure you started with `START_BOOTH.bat`; click the 🔒 in the address bar → allow Camera & Microphone; reload. |
| Body mode doesn't react | Step back so shoulders AND hands are visible; more light; or switch to keyboard (**K**). |
| "Python not found" | Install Python from python.org (tick **Add to PATH**), then run the .bat again. |
| Leaderboard/stats reset? | They reset automatically each day. To wipe them, clear the browser's site data for localhost:8080. |

Shokran & good luck! 🐪
