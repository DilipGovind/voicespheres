# Hosting VoiceSphere on Cloudflare

This guide explains how to host VoiceSphere on **Cloudflare** for worldwide testing.

---

## 🧭 How Cloudflare Fits Into the Architecture

Before deploying, understand how the two layers work together:

```
[Remote User Phone / PC]
         |
         +--- HTTPS (Web UI + Token API) ---> [ Cloudflare Pages / Edge Network ]
         |                                     - Global CDN & DDoS Protection
         |                                     - Free Automated SSL Certificate
         |                                     - Runs Next.js API (/api/voice/token)
         |
         +--- WSS (WebRTC Audio Streams) ----> [ LiveKit SFU (WebRTC Server) ]
                                               - LiveKit Cloud (Free tier) or VPS
                                               - Low-latency Opus audio routing
```

1. **Cloudflare Pages**: Hosts the React frontend, static assets, and the Next.js API routes (`/api/voice/token`, `/api/rooms`, etc.) across Cloudflare's 330+ global edge data centers.
2. **LiveKit Voice Server**: Handles real-time WebRTC audio streams (Opus 48kHz). *(Cloudflare Pages is a serverless edge runtime, so stateful WebRTC audio packets flow to your LiveKit URL).*

---

## Method 1: Cloudflare Pages Git Deployment (Recommended)

This is the standard, zero-maintenance approach. Cloudflare will automatically build and deploy every time you push to GitHub.

### Step 1: Push your code to GitHub
If you haven't already initialized git:
```powershell
git add .
git commit -m "feat: ready for Cloudflare deployment"
git push origin main
```

### Step 2: Connect to Cloudflare Pages
1. Log in to the **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2. In the left sidebar, click **Workers & Pages**.
3. Click **Create application** ➔ select the **Pages** tab ➔ click **Connect to Git**.
4. Select your GitHub repository (`club` or `voicesphere`).

### Step 3: Configure Build Settings
In the Cloudflare build configuration screen, enter:
- **Framework preset**: `Next.js`
- **Build command**: `npx @cloudflare/next-on-pages` (or `npm run build`)
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/` (leave blank)

### Step 4: Configure Compatibility Flags
Under **Settings** ➔ **Functions** ➔ **Compatibility flags**:
- Add compatibility flag: `nodejs_compat`
  *(This is required for LiveKit token signing and Node crypto on Cloudflare's edge runtime).*

### Step 5: Add Environment Variables
Under **Settings** ➔ **Environment variables** (Production), add:
- `NODE_VERSION`: `20`
- `LIVEKIT_URL`: Your LiveKit WebSocket URL (e.g. `wss://your-project.livekit.cloud`)
- `LIVEKIT_API_KEY`: Your LiveKit API key
- `LIVEKIT_API_SECRET`: Your LiveKit API secret
- `NEXT_PUBLIC_APP_URL`: Your Cloudflare Pages domain (e.g. `https://voicesphere.pages.dev`)
- `DEMO_MODE`: `true`

### Step 6: Deploy
Click **Save and Deploy**. Cloudflare will build the site and provide a free `https://<your-project>.pages.dev` URL with automated HTTPS!

---

## Method 2: Cloudflare Tunnel (Instant Worldwide Testing in 30 Seconds)

If you want to immediately test with someone in another country **without waiting for builds or configuring GitHub**, you can use **Cloudflare Tunnel** (`cloudflared`).

This creates an instant, secure HTTPS public tunnel directly to your local server through Cloudflare's global edge network for free:

### 1. Start your local server
In your project terminal:
```powershell
npm run dev
```

### 2. In a second terminal, launch the Cloudflare Tunnel:
```powershell
npx cloudflared tunnel --url http://localhost:3000
```

### 3. Share the generated URL
Cloudflare will output a public HTTPS address like:
```
https://random-words-1234.trycloudflare.com
```
- Remote testers in any country can open this URL on their phone or computer.
- It includes full **HTTPS** and Cloudflare SSL encryption (so browser microphone permissions work seamlessly).
- It connects to your LiveKit voice server without port forwarding!

---

## Method 3: Deploy via Wrangler CLI

If you prefer deploying directly from your command line:

1. Log in to Cloudflare from your terminal:
   ```powershell
   npx wrangler login
   ```
2. Build the project for Cloudflare Pages:
   ```powershell
   npx @cloudflare/next-on-pages
   ```
3. Deploy the built static bundle:
   ```powershell
   npx wrangler pages deploy .vercel/output/static --project-name voicesphere
   ```

---

## 🔍 Pre-Flight Verification Checklist on Cloudflare

- [ ] Project has the `nodejs_compat` flag enabled in Cloudflare Pages settings.
- [ ] Environment variable `NODE_VERSION` is set to `20` or higher.
- [ ] `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` are added under Environment Variables.
- [ ] App loads over `https://...pages.dev` and microphone permission prompt appears cleanly.
