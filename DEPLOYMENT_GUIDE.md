# VoiceSphere – Worldwide Testing & Deployment Guide

This guide explains how to run VoiceSphere locally for zero-credential development, deploy the web application to free hosting (Vercel, Netlify, or Render), and configure a publicly reachable WebRTC voice server for testers in different countries.

---

## 🧭 Architecture Overview

```
                        +----------------------------------+
                        |         User in Country A        |
                        |      (Browser / Mobile Web)      |
                        +-----------------+----------------+
                                          |
                                 HTTPS    | WSS WebRTC Audio
                                          v
+-------------------------+     +-------------------------------+
|    Frontend & API       |     |      Public Voice Server      |
|    (Vercel / Next.js)   |     |    (LiveKit Cloud Free Tier   |
|                         |     |      or Self-Hosted SFU)      |
| - Accessibility UI      |     |                               |
| - Room Lifecycle        |     | - Multi-region WebRTC SFU     |
| - Short-lived Token API |<--->| - Opus 48kHz audio streams    |
|   (/api/voice/token)    |     | - TURN/STUN NAT Traversal     |
+-------------------------+     +-------------------------------+
                                          ^
                                          | WSS WebRTC Audio
                                 HTTPS    |
                        +-----------------+----------------+
                        |         User in Country B        |
                        |      (Browser / Mobile Web)      |
                        +----------------------------------+
```

---

## Part 1: Local Development (Offline & Zero-Cost)

You do **NOT** need any cloud accounts or API keys to develop and test VoiceSphere locally.

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Steps
1. Clone or open the repository:
   ```bash
   cd club
   ```
2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *(Leave the placeholder values as-is; VoiceSphere will automatically detect that keys are omitted and engage the Safe Local Mock Voice Adapter).*
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run automated tests to verify everything passes:
   ```bash
   npm test
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open your browser at:
   ```
   http://localhost:3000
   ```

> [!NOTE]
> **Localhost Limitation**: Localhost WebRTC audio is isolated to your local machine. Two browser tabs on the same machine or local network can exchange signaling and mock audio, but remote participants in another country cannot join a `localhost` URL. To test with remote participants, follow Part 2 or Part 4 below.

---

## Part 2: Public Worldwide Testing via LiveKit Cloud (Free Tier)

For remote testing across countries without operating your own media infrastructure, the easiest and 100% free solution is **LiveKit Cloud Free Tier**.

### Why LiveKit Cloud for Worldwide MVP Testing?
- **Zero Cost**: LiveKit Cloud includes a perpetual free tier with **50 GB/month data transfer** and up to **100 concurrent participants**.
- **No Credit Card Required**: Sign up using GitHub or Google without payment credentials.
- **Global Multi-Region Edge**: Servers in US, Europe, Asia, and South America for sub-100ms latency worldwide.
- **Managed TURN/STUN**: Solves cellular carrier-grade NAT (CGNAT) and restrictive firewalls automatically.

### Step-by-Step Setup
1. Visit [LiveKit Cloud Console](https://cloud.livekit.io) and create a free account.
2. Click **Create Project** (e.g., name it `voicesphere-mvp`).
3. Under **Project Settings -> Keys**, find:
   - **WebSocket URL** (e.g. `wss://voicesphere-mvp-abc1234.livekit.cloud`)
   - **API Key** (e.g. `APIxxxxxxxxxx`)
   - **API Secret** (e.g. `secretxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
4. Add these credentials into your environment:
   ```env
   LIVEKIT_URL=wss://voicesphere-mvp-abc1234.livekit.cloud
   LIVEKIT_API_KEY=APIxxxxxxxxxx
   LIVEKIT_API_SECRET=secretxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Restart your server. When users join a room, `/api/voice/token` will now mint cryptographic JWT tokens pointing to your global LiveKit SFU!

---

## Part 3: Deploying Frontend & Token API to Vercel (Free)

The frontend and Next.js backend API routes (`/api/voice/token`, `/api/rooms`, etc.) deploy to Vercel in 2 minutes:

1. Push your repository to GitHub / GitLab.
2. Go to [Vercel](https://vercel.com/new) and import the repository.
3. In **Environment Variables**, add:
   - `LIVEKIT_URL`: Your LiveKit WebSocket URL
   - `LIVEKIT_API_KEY`: Your LiveKit API Key
   - `LIVEKIT_API_SECRET`: Your LiveKit API Secret
   - `NEXT_PUBLIC_APP_URL`: Your deployed Vercel domain (e.g., `https://voicesphere.vercel.app`)
4. Click **Deploy**. Vercel will build the Next.js application and issue a free SSL certificate (`https://...`).

> [!IMPORTANT]
> **HTTPS is Mandatory**: Modern web browsers (Chrome, Safari, Firefox, Edge) enforce strict security policies: `navigator.mediaDevices.getUserMedia` (microphone access) is **blocked** on remote HTTP origins. Deployed applications MUST run over HTTPS.

---

## Part 4: Self-Hosted LiveKit Server (Alternative)

If you prefer self-hosting your media server instead of using LiveKit Cloud, deploy LiveKit Server with Docker on a public Virtual Private Server (VPS) such as Hetzner, DigitalOcean, Linode, AWS EC2, or Fly.io.

### Required Ports & Firewall Rules

| Port | Protocol | Purpose | Firewall Direction |
|---|---|---|---|
| **7880** | TCP | HTTP Signaling & Health Checks | Inbound |
| **7881** | TCP | WebRTC TCP fallback & TURN | Inbound |
| **7882** | UDP | WebRTC UDP Audio/Video Media | Inbound |
| **50000 - 60000** | UDP | WebRTC ICE Media Port Range | Inbound |
| **443** | TCP | HTTPS / WSS Reverse Proxy | Inbound |

### Docker Deployment (`docker-compose.yml`)

Create a `livekit.yaml` configuration file:
```yaml
port: 7880
bind_addresses:
  - ""
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
keys:
  my_api_key: my_api_secret_hash_value_12345
```

Run with Docker:
```bash
docker run -d \
  --name livekit-server \
  --restart unless-stopped \
  --network host \
  -v $(pwd)/livekit.yaml:/livekit.yaml \
  livekit/livekit-server \
  --config /livekit.yaml
```

Set up TLS termination using Caddy or Nginx with Let's Encrypt to expose `wss://livekit.yourdomain.com:443` -> `localhost:7880`.

---

## Part 5: Pre-Flight Deployment Checklist

Before inviting testers across countries:
- [ ] App is served over **HTTPS** (required for browser mic permissions).
- [ ] `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are configured in the hosting environment variables.
- [ ] No secrets or API keys are prefixed with `NEXT_PUBLIC_` (secrets stay strictly on server).
- [ ] Tested on both desktop (Chrome/Firefox/Safari) and mobile browsers (iOS Safari, Android Chrome).
- [ ] Tested with headphones to avoid acoustic feedback.
- [ ] Validated that the 30-day demo trial and coins modal is active and labeled as demo data.
