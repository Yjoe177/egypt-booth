# 🇪🇬 Egypt Booth: Ahlan wa Sahlan!

**▶ Play now: https://yjoe177.github.io/egypt-booth/**

Four funny, interactive Egyptian games made for an international cultural day booth. They work on laptops, tablets and phones.

| Game | What happens |
|---|---|
| ⚖️ **Weighing of the Heart** | Confess your sins to the gods. Bastet the cat, Thoth's quiz, bribing Anubis with koshary… Too heavy? Ammit eats your heart. 7 endings + your name in hieroglyphs. |
| 🛍️ **Haggle in the Bazaar** | Bargain with Uncle Sayed, Hagga Fatma or Mido in Khan el-Khalili. Phone calls, rival tourists, power cuts and a daily leaderboard. |
| 🧻 **Mummy Wrap Race** | Team game: toilet paper, 60 seconds and pharaoh curses. The crowd votes with their voice (microphone). Mummy photo booth. |
| 🚦 **Cross a Cairo Street** | Jump, dodge and raise your hand to stop Cairo traffic. Body control with the camera, keyboard, or touch buttons on phones. |

## Run it at the booth (offline)
Download the repo and double-click **`START_BOOTH.bat`** (needs Python). See **[BOOTH_GUIDE.md](BOOTH_GUIDE.md)** for all controls and host tips.

## How it's built
Plain HTML, CSS and JavaScript, with no build step. All sounds are generated live (Web Audio). Body tracking uses Google's [MediaPipe](https://developers.google.com/mediapipe) pose model (Apache 2.0), and the fonts are Cairo, Lalezar and Noto Sans Egyptian Hieroglyphs (SIL Open Font License). Both are stored in `vendor/` so the games work offline.

Made with ❤️ for Egypt.
