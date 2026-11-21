# VoiceSphere – Worldwide Remote Testing Checklist

This checklist guides you through conducting a remote testing session between two or more users on different networks (e.g. Home Wi-Fi vs Cellular 4G/5G) or across different countries.

---

## 📋 Phase 1: Pre-Test Setup

- [ ] **Deploy Application**: App is deployed to HTTPS (e.g. on Vercel) with `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` set.
- [ ] **Equipment**: Both testers have headphones or earbuds (prevents acoustic feedback loops).
- [ ] **Browser Compatibility**:
  - Chrome / Edge (Windows, Mac, Android)
  - Safari (iOS 15+, macOS)
  - Firefox (Windows, Mac, Linux)
- [ ] **Different Networks**:
  - Tester 1: Connected to Home/Office Broadband Wi-Fi.
  - Tester 2: Connected to Mobile Cellular Data (4G LTE or 5G) or a remote residential connection in another country.

---

## 🎙️ Phase 2: Connection & Audio Quality Verification

| Step | Action | Expected Result | Pass? |
|---|---|---|---|
| **2.1** | Tester 1 creates a public room | Room appears in discovery list; Tester 1 enters as Host | [ ] |
| **2.2** | Tester 2 opens invite link or enters room ID | Room Lobby Preview opens displaying room name & topic | [ ] |
| **2.3** | Tester 2 runs Sound Check in Lobby | Audio meter responds to Tester 2's voice; displays level | [ ] |
| **2.4** | Tester 2 clicks "Join Voice Room" | Voice connection banner transitions from `Connecting` to `LiveKit WebRTC SFU Active` (green pill) | [ ] |
| **2.5** | Tester 1 speaks into microphone | Tester 2 hears clear 48kHz audio with sub-150ms delay; visual speaking ripple activates on Tester 1's avatar | [ ] |
| **2.6** | Tester 2 speaks into microphone | Tester 1 hears clear audio; duplex conversation works without cutoffs | [ ] |
| **2.7** | Tester 1 clicks Mute (`M`) | Mic status icon turns red; audio transmission stops immediately | [ ] |
| **2.8** | Tester 1 clicks Unmute (`M`) | Mic status icon turns green; audio resumes cleanly | [ ] |

---

## ♿ Phase 3: Accessibility & Assistive Features

| Step | Action | Expected Result | Pass? |
|---|---|---|---|
| **3.1** | Enable Live Captions (`C`) | Captions container opens; speech is transcribed in real-time with speaker name and timestamp | [ ] |
| **3.2** | Test AAC Quick Buttons (`A`) | Click *"I would like to speak."*; phrase is synthesized into room audio and broadcast to live captions | [ ] |
| **3.3** | Test Type-to-Speak | Type custom phrase in AAC dock and click Broadcast; phrase vocalizes via browser SpeechSynthesis | [ ] |
| **3.4** | Test Keyboard Navigation | Press `Tab` through controls; yellow 4px high-contrast focus rings are visible on all interactive elements | [ ] |
| **3.5** | Test Screen Reader Live Regions | Screen reader (VoiceOver/NVDA/TalkBack) announces joins, leaves, and mic mute toggles via `aria-live` | [ ] |
| **3.6** | Test Dyslexia Ruler / High Contrast | Activate Dyslexia-Friendly preset; ruler guide and open-dyslexic font styling render smoothly | [ ] |

---

## 🛡️ Phase 4: Host Controls & Room Security

| Step | Action | Expected Result | Pass? |
|---|---|---|---|
| **4.1** | Create a Private Room with Passcode | Room is flagged Private; joining requires entering passcode | [ ] |
| **4.2** | Enter Incorrect Passcode | Join is blocked with clear error message: *"Invalid or missing passcode"* | [ ] |
| **4.3** | Enter Correct Passcode | Join succeeds; short-lived voice token is granted | [ ] |
| **4.4** | Host clicks "Lock Room" | Room status displays *"Locked by Host"*; new external joiners are blocked | [ ] |
| **4.5** | Host Mutes Participant | Participant is muted remotely; announcement dispatched | [ ] |
| **4.6** | Host Changes Role (Speaker -> Listener) | Participant moved to audience; microphone unpublish triggered | [ ] |
| **4.7** | Host Ends Room | Room closes for all participants; participants redirected cleanly | [ ] |

---

## 💰 Phase 5: Demo 30-Day Trial & Coins Simulation

| Step | Action | Expected Result | Pass? |
|---|---|---|---|
| **5.1** | Click "30d Demo Trial" in Navbar | Trial modal opens displaying remaining trial days (e.g. 30 days) and active status | [ ] |
| **5.2** | Check Demo Coin Balance | Starting balance of 150 Demo Coins is displayed with `[TEST BALANCE]` tag | [ ] |
| **5.3** | Click "Claim Daily +25" | Balance increases to 175; ledger records `DAILY_REWARD` transaction with timestamp | [ ] |
| **5.4** | Send Demo Tip to Speaker (10 coins) | Click Coins icon on peer participant card; 10 demo coins deducted; toast shows tip sent | [ ] |
| **5.5** | Verify No Payment Gateway Prompt | Ensure no credit card forms, UPI prompts, or external billing redirects appear anywhere | [ ] |

---

## 📶 Phase 6: Network Resilience & Glitch Recovery

| Step | Action | Expected Result | Pass? |
|---|---|---|---|
| **6.1** | Tester 2 toggles Wi-Fi/Airplane mode for 5s | Status banner shows `Reconnecting... (Network fluctuation detected)` | [ ] |
| **6.2** | Tester 2 re-enables network | LiveKit ICE renegotiates; banner returns to `Connected` without page reload | [ ] |
| **6.3** | Deny microphone permission | Banner displays `Microphone access blocked. Click Allow to enable mic` with retry button | [ ] |

---

## 🚫 Phase 7: Anti-Abuse & Client Blocking

| Step | Action | Expected Result | Pass? |
|---|---|---|---|
| **7.1** | Open Report Abuse modal | Select reason (e.g. Disruption); submit report; toast confirms report logged | [ ] |
| **7.2** | Click "Block Participant" on peer | Peer is muted locally; peer's captions and chat messages are suppressed immediately | [ ] |
