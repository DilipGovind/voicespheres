# VoiceSphere – Cost Checklist & Pricing Transparency

This document details all infrastructure, voice, database, and service layers for VoiceSphere, explicitly separating **100% Free / Open-Source options** from **Services that may charge or scale into costs**.

---

## 🟢 1. Completely Free Options ($0.00 / Month)

For initial testing with trusted groups across different countries, the entire stack can run at **$0 total cost**:

| Layer | Provider / Tool | Cost | Free Tier Limitations | Notes |
|---|---|---|---|---|
| **Voice Server (SFU)** | **LiveKit Cloud Free Tier** | **$0.00** | • 50 GB data transfer / mo<br>• 100 max concurrent participants<br>• Standard support | Perfect for MVP testing across countries. Multi-region edge locations included. No credit card required. |
| **Frontend & API Hosting** | **Vercel Hobby Tier** | **$0.00** | • 100 GB bandwidth / mo<br>• Serverless execution limits<br>• Non-commercial use | Automatic HTTPS SSL certificate, global CDN, and Node.js API routes. |
| **Alternative Hosting** | **Render / Netlify Free** | **$0.00** | • 100 GB bandwidth / mo<br>• Standard build minutes | Great alternative for Next.js hosting. |
| **Local / Offline Dev** | **VoiceSphere Mock Adapter** | **$0.00** | • Unlimited local sessions | Built-in fallback; runs 100% offline with zero cloud credentials. |
| **Speech-to-Text & AAC** | **Web Speech API** | **$0.00** | • Dependent on client browser engine | Runs entirely inside the user's browser; $0 cloud speech API fees. |
| **Trial & Coins System** | **Mock Payment Gateway** | **$0.00** | • Simulated local demo ledger | 100% simulated test ledger; $0 gateway fees. |
| **Source Control & CI** | **GitHub Public Repo** | **$0.00** | • Unlimited public repos<br>• 2,000 CI minutes/mo | Free automated testing with GitHub Actions. |
| **STUN NAT Traversal** | **Google Public STUN** | **$0.00** | • Standard query limits | `stun:stun.l.google.com:19302` for direct P2P resolution. |

---

## 🟡 2. Services That May Incur Cost (When Scaling Beyond MVP)

When moving beyond small-group testing or if free-tier limits are exceeded, the following costs may apply:

### A. LiveKit Cloud (Overage or Pro Tier)
- **Free Tier Allowance**: 50 GB/month.
- **Estimate of Bandwidth**: 
  - Voice-only room with Opus 48kHz uses approximately **25 MB per participant per hour**.
  - A 1-hour room with 6 participants consumes: $6 \times 5 \times 25\text{ MB} \approx 750\text{ MB}$.
  - You can conduct approximately **60 hours of 6-person rooms** per month completely within the free tier.
- **Overage**: When exceeding 50 GB, bandwidth costs approximately **$0.10 per GB** or requires upgrading to the Pro plan ($50/month).

### B. Self-Hosted VPS Media Server (Alternative to LiveKit Cloud)
If you choose to self-host LiveKit on a dedicated Virtual Private Server (VPS):
- **Hetzner Cloud (CX22 / CPX11)**: ~$4.50 – $6.00 / month (20 TB traffic included).
- **DigitalOcean Droplet**: ~$6.00 – $12.00 / month (1 TB traffic included).
- **Domain Name**: ~$10.00 – $15.00 / year (for custom domain SSL).

### C. Commercial TURN Relay Servers (Restrictive Corporate Firewalls)
- Free STUN handles ~85% of connections.
- For users behind strict symmetric NAT / enterprise corporate firewalls, a TURN relay may be needed.
- **Metered.ca / Twilio TURN**: Free tier (500 MB to 5 GB/month free), then **$0.05 - $0.15 per GB**.

### D. Optional Cloud AI Voice Companion (Disabled in MVP)
- VoiceSphere includes a local demo companion that uses the browser's free speech synthesis.
- If you later integrate commercial cloud AI speech APIs:
  - **OpenAI TTS**: ~$0.015 per 1,000 characters.
  - **ElevenLabs**: ~$5.00 / month for 30,000 characters.

### E. Real Payment Gateway (Disabled in MVP)
- VoiceSphere includes a mock demo coin ledger for testing.
- When enabling real payments later:
  - **Stripe**: 2.9% + $0.30 per transaction.
  - **Paddle / LemonSqueezy**: 5% + $0.50 (Merchant of Record).

---

## 📊 Summary: Recommended MVP Test Setup

```
[Frontend + API]     Vercel Hobby               $0.00 / month
[Voice Server]       LiveKit Cloud Free Tier    $0.00 / month (up to 50 GB/mo)
[Audio Codec]        Opus 48kHz (built-in)      $0.00
[Speech Synthesis]   Web Speech API (client)    $0.00
[Trial & Coins]      Mock Payment Gateway       $0.00
--------------------------------------------------------------
TOTAL ESTIMATED MVP COST:                       $0.00 / month
```
