<sup> AI generated</sup>

<div align="center">
  <img src="logo_small.png" alt="OMA Logo" width="120" style="margin-bottom: 20px;">

  # OMA
  ### **Oryx Migration Assistant**

  **The One-Click Migration Path: ZSA Oryx ➔ MoErgo Layout Editor**

[![Launch OMA App](https://img.shields.io/badge/Launch_OMA_Assistant-2563EB?style=for-the-badge&logo=rocket&logoColor=white)](https://moosylog.github.io/oma/)
  <br>
</div>

You’ve made the exciting choice to upgrade your ergonomic typing setup. Whether you are moving from a **Voyager** to a **Go60** or a **Moonlander** to a **Glove80**, getting a new keyboard is a thrill—but losing the custom layout you spent months perfecting isn't.

Instead of starting over in a new firmware ecosystem (ZMK), **OMA** acts as your personal assistant. We handle the heavy lifting of translating your ZSA Oryx code so that your layers, combos, and lighting feel right at home on your new MoErgo board from day one.

---

## ✨ The OMA Advantage

OMA bridges the gap between QMK (Oryx) and ZMK (MoErgo) architectures instantly, handled locally in your browser:

* **Hardware Mapping:** OMA intelligently overlays your ZSA keys onto the MoErgo template. It pads the empty spaces with transparent keys so MoErgo's native hardware (like the Go60 touchpad) remains fully functional.
* **Smart Board Support:** * **ZSA Voyager ➔ MoErgo Go60** (52 keys mapped to 60)
    * **ZSA Moonlander ➔ MoErgo Glove80** (72 keys mapped to 80)
* **The "Universal Switch":** Once OMA moves your layout into the MoErgo Layout Editor, you can use MoErgo's native tools to convert between the Go60 and Glove80 effortlessly.
* **Deep Translation:** OMA "unwraps" complex QMK macros (like `LSFT(KC_A)` or `MOD_MEH`) and compiles them into valid, deeply nested ZMK JSON arrays automatically.
* **RGB & Color Preservation:** OMA extracts the hidden color matrix from your source code, converts the math, and injects your exact custom colors into the new layout.
* **The "Assistant" Report:** Proprietary features that don't have a 1:1 translation (like Mouse Jiggler or Siri macros) are caught and flagged. OMA generates a friendly, printable report explaining exactly *what* those keys were and *how* to rebuild them in the MoErgo editor.

---

## 📖 How to Use OMA

OMA is designed for simplicity. No technical knowledge or server uploads are required.

1. **Get Your Source:** In ZSA Oryx, look for the `< >` icon and select **Download Source**. *(Important: Do not click the main "Download Firmware" button).*
2. **Drop it in OMA:** Drag and drop the downloaded `.zip` file into the OMA drop zone.
3. **Review the Report:** OMA processes your layout in milliseconds. Check the report to see which keys were auto-mapped and which require a quick manual touch-up.
4. **Download & Import:** Click **Download Layout** to get your `.json` file, and drag it directly into the [MoErgo Layout Editor](https://layout.moergo.com).

---

## 🔍 Under the Hood: Conversion Matrix

| Feature | Status | Notes |
| :--- | :--- | :--- |
| **Alphas, Numbers, & Symbols** | ✅ 100% | 1:1 mapping to ZMK standard keycodes. |
| **F-Keys, Numpad, & Nav** | ✅ 100% | 1:1 mapping to ZMK standard keycodes. |
| **Combos (Chords)** | ✅ 100% | Recalculates matrix geometry for the new physical layout. |
| **Hold-Taps (`LT`, `MT`)** | ✅ 100% | Deeply nested modifiers safely parsed and translated. |
| **Layer Toggles (`MO`, `TG`, `TO`)** | ✅ 100% | Layer indices are dynamically shifted to append safely. |
| **Sticky Keys (`OSM`)** | ✅ 100% | Natively converted to ZMK `&sk`. |
| **Native Mouse Keys** | ✅ 100% | Mapped to MoErgo clicks, scroll, and movement. |
| **Media & System Controls** | ✅ 100% | Volume, brightness, and playback keys flawlessly mapped. |
| **Hardware Controls (BT, Reset)** | ✅ 100% | Maps Bluetooth, Bootloader, and Reset commands safely. |
| **RGB Lighting & Colors** | ✅ 100% | Custom HSV colors converted to HEX and bound to layers. |
| **Tap Dances (`TD`)** | ⚠️ Manual | Rebuild using MoErgo's *Mod-Morph* or *Tap-Dance* tools. |
| **Custom Macros (`ST_MACRO`)** | ⚠️ Manual | Rebuild text macros in the ZMK Macro editor. |
| **Oryx "Magic" Keys** | ⚠️ Manual | Proprietary C-code features (like Mouse Jiggler) must be replaced with native MoErgo features. |

---

<div align="center">
  <b>Don't rewire your brain. Just move your layout.</b><br>
  Built with ⌨️ for the ergonomic community.
</div>
---

<sup> AI generated</sup>
