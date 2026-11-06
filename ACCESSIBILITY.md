# VoiceSphere Accessibility Conformance & Guide (WCAG 2.2 AAA Focused)

VoiceSphere treats accessibility as the foundational architectural requirement of social audio.

---

## 1. Conformance Standards Baseline
VoiceSphere is designed to conform to **WCAG 2.2 Level AA** as a baseline, exceeding requirements to achieve **Level AAA** in key areas including contrast, text resizing, visual focus, audio controls, and alternative inputs.

Relevant Standards and Guidelines Followed:
- **W3C Web Content Accessibility Guidelines (WCAG) 2.2**
- **WAI-ARIA 1.2 / 1.3 Authoring Practices Guide (APG)**
- **Section 508 of the U.S. Rehabilitation Act**
- **EN 301 549 (European Accessibility Requirements)**
- **UN Convention on the Rights of Persons with Disabilities (CRPD)**

---

## 2. Universal Accessibility Presets (A through J)

| Preset | Target Group | Key Configured Architectural Behaviors |
| :--- | :--- | :--- |
| **Preset A: Blind User Mode** | Blindness & Screen Reader users | High ARIA live announcement verbosity for all participant events, pure high-contrast yellow/black theme, keyboard shortcuts enabled, sound cues. |
| **Preset B: Low Vision Mode** | Low vision & visual processing | 200% scalable font sizing, bold 4px yellow focus outlines, large interactive targets (min 56px), and high contrast captions. |
| **Preset C: Deaf & Hard-of-Hearing Mode** | Deafness & Hard-of-hearing | Real-time speech-to-text captions enabled by default, visual voice ripples for speaker tracking, visual notifications replacing all audio cues. |
| **Preset D: Non-Speaking & AAC Mode** | Non-speaking, Stuttering, Apraxia | Docked AAC Toolbar, 10 prompt-mandatory quick response buttons, visual symbol board, type-to-speak synthesis into room audio. |
| **Preset E: Limited Mobility Mode** | Paralysis, Cerebral Palsy, Tremors | Built-in single-switch scanning emulator, dwell-click support, zero drag-and-drop, large touch targets, emergency quick exit (Esc). |
| **Preset F: Cognitive Accessibility Mode** | Learning disabilities, memory difficulties | Easy Read / Simple Language mode, step-by-step room onboarding, contextual tooltips, action confirmation prompts. |
| **Preset G: Neurodivergent-Friendly Mode** | Autism, ADHD, Sensory processing | 6-stage structured conversation flow, clear speaking queue, countdown speaking timer, quiet mode. |
| **Preset H: Low-Stimulation Mode** | Sensory overload, Social anxiety | Minimalist sensory design, zero animations (`prefers-reduced-motion`), hidden participant counts, quiet mode. |
| **Preset I: Dyslexia-Friendly Mode** | Dyslexia, visual stress | Dyslexia-optimized typeface, 1.8x line height, wide letter-spacing, soft cream anti-glare theme, reading guide ruler. |
| **Preset J: Combined / Custom Mode** | Multi-disability intersectionality | Granular toggle of every individual setting to construct a tailored personal profile. |

---

## 3. Assistive Technology Compatibility Matrix

### Screen Readers Tested & Verified:
- **NVDA (NonVisual Desktop Access)** on Windows
- **JAWS (Job Access With Speech)** on Windows
- **Apple VoiceOver** on macOS & iOS
- **Google TalkBack** on Android

### ARIA Live Announcer Architecture:
- Announcements are delivered through two decoupled live regions (`aria-live="polite"` for conversational turns and messages; `aria-live="assertive"` for moderator actions and emergency exits).
- Users have granular filter controls in the Accessibility Center to toggle which announcement categories are voiced.

### Physical & Motor Input:
- **Single-Switch Scanning**: Cycles through interactive elements on a configurable interval (800ms - 4000ms). Actuating `Space`, `Enter`, or screen click selects the focused control.
- **Dwell-Click**: Hovering a mouse pointer or head tracker over a button for 1.2s executes a simulated click.
- **Large Click Targets**: All interactive elements scale to at least 56x56 pixels with adequate padding.

---

## 4. Integrated Augmentative & Alternative Communication (AAC)

Synthesized speech is treated with equal dignity and status to natural speech.
1. **10 Prompt-Mandatory Quick Responses**:
   - `1. I would like to speak`
   - `2. Please repeat`
   - `3. I need more time`
   - `4. I agree`
   - `5. I disagree`
   - `6. I have a question`
   - `7. Please slow down`
   - `8. I need assistance`
   - `9. I cannot speak right now`
   - `10. Thank you`
2. **Symbol Boards**: High-contrast icon boards for Reactions, Needs, Questions, Conversation Flow, and Social Courtesy.
3. **Type-to-Speak Engine**: Utilizes `SpeechSynthesisUtterance` to pipe synthesized voice directly into the WebRTC room audio stream and transcript simultaneously.
4. **Anti-Ableism Protection**: Platform rules strictly prohibit harassment, interruption, or mockery of users communicating via synthesized speech.
