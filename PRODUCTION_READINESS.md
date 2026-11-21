# VoiceSphere – Production Readiness Checklist

This checklist defines the technical, operational, and regulatory milestones required before transitioning VoiceSphere from an MVP testing prototype to a production-grade, globally distributed social audio platform.

---

## 🔒 1. Security Architecture

- [ ] **Cryptographic Token Verification**:
  - Voice tokens are signed using high-entropy secrets (`LIVEKIT_API_SECRET` $\ge$ 256 bits).
  - Token expiration (TTL) is strictly bounded (recommended $\le$ 15 minutes) with automatic client-side token refresh.
  - Tokens scope explicit permissions (`canPublish`, `canSubscribe`, `roomJoin`) per role.
- [ ] **Zero Secret Exposure**:
  - Audit all client-side bundles to guarantee no `LIVEKIT_API_SECRET`, admin tokens, or database keys are prefixed with `NEXT_PUBLIC_` or imported into client components.
- [ ] **API Protection & Rate Limiting**:
  - Implement token-bucket or sliding-window rate limiting on `/api/voice/token`, `/api/rooms`, and `/api/abuse/report` (e.g. using Upstash Redis or Cloudflare Turnstile).
  - Enforce maximum room creation frequency per IP/User to prevent denial-of-service (DoS).
- [ ] **Content & Input Sanitization**:
  - Sanitize all room titles, descriptions, passcodes, and chat messages against XSS injection.
  - Enforce maximum byte length on room topics and user nicknames.
- [ ] **Private Room Authorization**:
  - Enforce server-side bcrypt or argon2 hashing for private room passcodes.
  - Require authentication headers or signed session cookies for host administration actions.

---

## ⚡ 2. Reliability & High Availability

- [ ] **Automated SFU Health Checks**:
  - Implement automated health probes on `/api/health` and LiveKit Server `/healthz`.
  - Configure uptime monitoring (e.g., BetterStack, Datadog, or Pingdom) with multi-region polling.
- [ ] **Exponential Backoff Reconnection**:
  - Ensure client WebRTC renegotiation applies jittered exponential backoff on network dropouts.
  - Provide fallback TURN servers across geographically dispersed availability zones (US East/West, Europe Central, Asia Pacific).
- [ ] **Stateless Backend Scaling**:
  - Store active room presence in Redis instead of single-instance Node memory to support horizontal autoscaling of backend API containers across multiple Kubernetes/Docker replicas.

---

## 🛡️ 3. Privacy & Regulatory Compliance (GDPR / CCPA / HIPAA)

- [ ] **Ephemeral Audio Guarantee**:
  - Audio frames are routed ephemerally in RAM via WebRTC SFU and **never written to persistent disk storage** unless explicit participant consent and legal disclosure are provided.
- [ ] **Pseudonymity & Minimal Data Collection**:
  - Users can participate with anonymous/pseudonymous guest handles without linking personal emails or phone numbers.
- [ ] **Data Deletion & Retention**:
  - Ephemeral chat logs and room presence data are automatically purged when a room ends.
  - Provide a one-click "Delete Local Profile & Cache" option that wipes browser `localStorage`.
- [ ] **Compliance Documentation**:
  - Publish terms of service, acceptable use policies, and privacy notices clearly explaining telemetry and cookie usage.

---

## ♿ 4. Accessibility & Inclusive Design (WCAG 2.2 AAA)

- [ ] **Screen Reader Full Audit**:
  - Validate with NVDA (Windows), JAWS (Windows), VoiceOver (macOS / iOS), and TalkBack (Android).
  - Verify every state change (join, leave, mute, hand raise, stage advance) is vocalized via `aria-live="polite"` or `role="status"`.
- [ ] **Keyboard Navigability**:
  - Complete zero-mouse navigation audit: all buttons, inputs, and sliders reachable via `Tab` / `Shift+Tab`.
  - Maintain persistent, visible focus rings with minimum 3:1 contrast against adjacent backgrounds.
- [ ] **Color & Contrast Standards**:
  - Text and interactive elements meet WCAG AAA contrast ratio ($\ge 7:1$ for normal text, $\ge 4.5:1$ for large text).
  - Color is never the sole indicator of state (always accompany color with icons or textual labels).
- [ ] **Real-Time Captions Quality**:
  - Integrate fallbacks for browsers lacking Web Speech API support (e.g., optional self-hosted Whisper ASR or Deepgram LiveKit agent).
  - Provide adjustable caption text size and high-contrast background styling.

---

## 📈 5. Global Scaling & Media Distribution

- [ ] **Multi-Region LiveKit SFU Mesh**:
  - Configure LiveKit Server multi-region deployment with geo-DNS routing. Participants connect to the geographically closest edge node; inter-node audio is proxied over private cloud backbone.
- [ ] **Adaptive Audio Bitrate (Dynacast)**:
  - Dynamically throttle Opus audio bitrates (from 48 kbps down to 16 kbps) on low-bandwidth cellular connections to maintain intelligibility under high packet loss.
- [ ] **CDN Optimization**:
  - Serve all static JavaScript, CSS, fonts, and assets through a global CDN (e.g. Cloudflare, Fastly, or Vercel Edge Network) with immutable cache headers.

---

## 💳 6. Real Payments & Monetization Migration

- [ ] **Provider Decoupling Verified**:
  - Payment and tipping logic remains strictly separated behind the `IPaymentGateway` interface.
- [ ] **Stripe / LemonSqueezy Integration**:
  - Implement `StripePaymentGateway` implementing `IPaymentGateway`.
  - Use Stripe Elements or Stripe Checkout for PCI-DSS Level 1 compliance; never process raw credit card numbers on your server.
- [ ] **Webhook Idempotency**:
  - Implement cryptographically signed webhook handlers (`stripe.webhooks.constructEvent`) with an idempotency ledger to prevent duplicate coin credit awards.
- [ ] **Financial Auditing & Ledger**:
  - Replace client-side `localStorage` coin balance with a double-entry database ledger (e.g. PostgreSQL transactions with ACID isolation) tracking credits, debits, and tips.
- [ ] **Anti-Fraud & Chargeback Protection**:
  - Implement Stripe Radar or equivalent fraud detection to block stolen card testing and fraudulent tipping.
