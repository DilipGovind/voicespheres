# VoiceSphere 🌐
### Global Accessible Voice Community – Free, Privacy-First, Open to Everyone

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Accessibility: WCAG 2.2 AAA](https://img.shields.io/badge/Accessibility-WCAG_2.2_AAA-brightgreen.svg)](ACCESSIBILITY.md)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.15-black.svg)](https://nextjs.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Audio_Mesh-orange.svg)](https://webrtc.org/)
[![Vercel Ready](https://img.shields.io/badge/Deploy-Vercel-success.svg)](https://vercel.com)

> **"Every person deserves a voice, whether expressed through speech, text, technology, or assistive communication."**

VoiceSphere is a completely free, open-source, privacy-first, globally accessible multilingual social audio platform. Built from the ground up for people with visual, hearing, speech, motor, cognitive, and neurodivergent differences, accessibility is a core architectural requirement, NOT an optional feature or premium tier.

---

## 🌟 Core Pillars

### 1. Universal Accessibility Center & 10 Presets
VoiceSphere features a dedicated Accessibility Center with one-click presets and granular controls:
- **Preset A: Blind User Mode** – High screen-reader verbosity (NVDA, JAWS, VoiceOver, TalkBack), sound cues, high contrast, and keyboard focus.
- **Preset B: Low Vision Mode** – Scalable typography up to 200%, bold 4px yellow focus outlines, large 56px interactive targets, and high-contrast captions.
- **Preset C: Deaf & Hard-of-Hearing Mode** – Real-time auto-captions, visual voice ripple indicators, text participation sidecar, and visual banners replacing audio alerts.
- **Preset D: Non-Speaking & AAC Mode** – Integrated AAC dock, Type-to-Speak synthesized speech into rooms, 10 quick communication buttons, and symbol boards.
- **Preset E: Limited Mobility Mode** – Single-switch scanning emulator, dwell-click support, zero drag-and-drop, and emergency quick exit (`Esc`).
- **Preset F: Cognitive Accessibility Mode** – Easy Read / Simple Language mode, step-by-step onboarding, and action confirmation prompts.
- **Preset G: Neurodivergent-Friendly Mode** – 6-stage structured conversation flow, clear speaking queue, and countdown speaking timers.
- **Preset H: Low-Stimulation Mode** – Minimalist sensory interface, zero animations (`prefers-reduced-motion`), hidden participant counts, and quiet mode.
- **Preset I: Dyslexia-Friendly Mode** – Specialized typography, 1.8x line height, wide letter-spacing, soft cream anti-glare theme, and reading guide ruler.
- **Preset J: Combined / Custom Mode** – Fine-tune all ~30 individual accessibility options.

### 2. Integrated AAC Toolkit (Augmentative & Alternative Communication)
Synthesized speech is treated with equal status to natural speech:
- **10 Core Quick Communication Buttons**:
  1. *"I would like to speak."*
  2. *"Please repeat."*
  3. *"I need more time."*
  4. *"I agree."*
  5. *"I disagree."*
  6. *"I have a question."*
  7. *"Please slow down."*
  8. *"I need assistance."*
  9. *"I cannot speak right now."*
  10. *"Thank you."*
- **Symbol Communication Boards**: Reactions, Needs, Questions, Conversation Flow, and Social Courtesy.
- **Type-to-Speak Real-Time Synthesis**: Input any phrase and broadcast it with customizable voice rate, pitch, and language directly into the room audio and live captions stream.

### 3. Global Multilingual Support (21 Languages & Dynamic RTL)
Initial localized languages with native RTL support:
- **Telugu (తెలుగు)**
- **Hindi (हिन्दी)**
- **Tamil (தமிழ்)**
- **Kannada (ಕನ್ನಡ)**
- **Malayalam (മലയാളം)**
- **Bengali (বাংলা)**
- **Marathi (मराठी)**
- **Gujarati (ગુજરાતી)**
- **Punjabi (ਪੰਜਾਬੀ)**
- **Urdu (اردو - RTL)**
- **Arabic (العربية - RTL)**
- **English**
- **Spanish (Español)**
- **French (Français)**
- **German (Deutsch)**
- **Portuguese (Português)**
- **Chinese (中文)**
- **Japanese (日本語)**
- **Korean (한국어)**
- **Russian (Русский)**
- **Indonesian (Bahasa Indonesia)**

### 4. Real-Time Accessible Voice Rooms
- Full-duplex WebRTC audio mesh with Opus codec.
- Web Audio API Voice Activity Detection (VAD) audio meter.
- Live real-time speech-to-text captions with speaker identification.
- 6-Stage Structured Conversation Flow: `Intro -> Topic Presentation -> Speaker Queue -> Open Discussion -> Q&A -> Closing Summary`.
- Accessible moderator controls (Invite to speak, Mute speaker, Lower hand, Remove from room).
- Anti-ableism reporting with human oversight.

---

## 🚀 Quick Start & Deployment

### Run Online on Vercel
VoiceSphere is ready to deploy directly to Vercel:
1. Push this directory to your GitHub repository.
2. Import the project in [Vercel](https://vercel.com/new).
3. The configuration in `vercel.json` and Next.js App Router will automatically build and deploy the app online.

### Run Locally
```bash
# Install dependencies
npm install

# Run the test suite
npm test

# Build production assets
npm run build

# Start the server with real-time WebSockets
npm start
```
Access VoiceSphere at: `http://localhost:3000`

### Run with Docker Compose
```bash
docker compose up -d --build
```

---

## 🧪 Verified Quality & Accessibility Testing

- **16 Automated Unit & Integration Tests Passing**:
  - `tests/accessibility.test.ts`: Validates all 10 presets and WCAG AAA settings.
  - `tests/aac.test.ts`: Verifies all 10 prompt mandatory communication phrases and symbol boards.
  - `tests/i18n.test.ts`: Validates 21 global languages and RTL switching.
  - `tests/room-flow.test.ts`: Verifies room lifecycle, captions, and participant roles.
- **Real Multi-User Duplex Client Communication Verified**:
  - `tests/multi-client-verification.js` simulates two independent client connections (Alice using AAC and Bob using Live Captions) exchanging synthesized speech, captions, and hand-raising in real time.
- **Production Build Clean**: Next.js 14 App Router statically generated and typechecked with 0 TypeScript errors.

---

## 📄 License & Freedom

Licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.  
All core accessibility features are completely free. No disability-based paywalls. No premium unlocks. No sale of user data.
