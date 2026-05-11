<sup> AI generated</sup>

<div align="center">
  <img src="logo_small.png" alt="OMA Logo" width="120" style="margin-bottom: 20px;">


# OMA  
### Oryx Migration Assistant  

**ZSA Oryx ➜ MoErgo Layout Editor**

[![Launch OMA now](https://img.shields.io/badge/Launch_OMA-2563EB?style=for-the-badge&logo=rocket&logoColor=white)](https://moosylog.github.io/oma/)

</div>

You just upgraded your keyboard.  
Voyager, Moonlander, Glove80, Go60 — whatever you moved to, the hardware feels great.

But your layout? That part hurts.

OMA exists for exactly this moment.

It takes your ZSA Oryx setup and translates it into MoErgo’s ecosystem so your layers, combos, and lighting don’t have to start from scratch.

No rebuild. No reinvention. Just continuation.

---

## Effortless migration

OMA runs locally in your browser and converts your layout in place.

No uploads. No servers. No waiting.

Just drop your file in and get a MoErgo-ready layout out.

---

## 1. Get your source

Start in ZSA Oryx.

- Open your layout
- Click **Download Source** (the `< >` icon)
- Save the `.zip` file to your device

That file contains everything OMA needs.

---

## 2. Drop it into OMA

Open OMA in your browser.

Drag and drop your `.zip` file.

OMA immediately starts translating:

- key positions
- layers
- combos
- macros
- lighting data

No configuration required.

---

## 3. Review what changed

OMA generates a migration report.

You’ll see:

- what mapped automatically
- what was adapted for MoErgo
- what needs manual attention

Most layouts are fully portable.  
Some advanced features need a quick rebuild inside MoErgo tools.

---

## 4. Export to MoErgo

Click **Download Layout**.

Then:

- Open the MoErgo Layout Editor
- Import the `.json` file
- Your layout is ready to use

Layers preserved. Structure intact. Ready to type.

---

## What OMA handles

OMA preserves as much of your Oryx setup as possible.

- **Key Mapping** → Direct conversion to ZMK keycodes  
- **Layers** → Rebuilt with safe indexing for MoErgo boards  
- **Combos** → Geometry recalculated for new layouts  
- **Hold-Taps** → Preserved and nested correctly  
- **Layer Keys** → Converted to native ZMK behaviors  
- **Media & System Keys** → Fully mapped  
- **Mouse Keys** → Translated to MoErgo controls  
- **RGB & Colors** → Converted to compatible formats  

---

## What needs attention

Some features don’t translate 1:1 across firmware systems.

- **Tap Dances** ⚠️  
  Rebuild using MoErgo tools

- **Custom Macros** ⚠️  
  Recreate in ZMK macro system

- **Oryx proprietary features** ⚠️  
  Some behaviors require manual replacement

OMA flags these clearly so nothing is lost silently.

---

## Conversion overview

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

## Why OMA exists

Because switching keyboards shouldn’t mean starting over.

Your layout is muscle memory.  
OMA just moves it with you.

---

<div align="center">

**Don’t rebuild your layout. Just relocate it.**

Built for ergonomic keyboard migrations.

</div>

---

<sup>AI generated</sup>





