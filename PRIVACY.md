# VoiceSphere Privacy Charter

VoiceSphere is architected from the ground up as a **privacy-first, pseudonymous public communication infrastructure**.

---

## 1. Core Privacy Commitments

1. **Pseudonymous by Design**: Users are never required to provide a legal name, government identification, phone number, email address, or physical location.
2. **Zero Disability Disclosures Required**: You are never required to disclose a medical diagnosis, upload a disability certificate, or prove an impairment to unlock any accessibility feature. All accessibility tools are 100% free and open to everyone.
3. **No Unconsented Audio Recording**:
   - Audio is never recorded by default.
   - Live captions and speech recognition occur locally in the user's browser or self-hosted bridge.
   - Text transcript exports require affirmative consent from room participants.
4. **Local Data Sovereignity**:
   - Accessibility preferences and profile settings are stored locally on the user's device (`localStorage`).
   - Users can export all personal settings as a JSON file or perform an irreversible data wipe at any time.
5. **No Data Monetization**: VoiceSphere will never sell, lease, or monetize user data, audio samples, or accessibility telemetry.

---

## 2. WebRTC Media Privacy
Audio peer connections are established directly between participating clients using DTLS-SRTP encryption. Relayed traffic through TURN servers is encrypted in transit and never stored on disk.
