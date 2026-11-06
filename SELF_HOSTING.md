# VoiceSphere Self-Hosting & Deployment Guide

VoiceSphere can be deployed online via **Vercel** with a single click, or self-hosted on bare metal or cloud instances using **Docker & Docker Compose**.

---

## 1. Deploying Online to Vercel

VoiceSphere is pre-configured for zero-friction serverless deployment on Vercel:

1. Push your repository to GitHub, GitLab, or Bitbucket:
   ```bash
   git init
   git add .
   git commit -m "Initial VoiceSphere release"
   git remote add origin https://github.com/your-org/voicesphere.git
   git push -u origin main
   ```
2. Go to [https://vercel.com/new](https://vercel.com/new) and select the repository.
3. Framework Preset: **Next.js** (auto-detected).
4. Click **Deploy**.

> **Note on WebRTC & Real-time on Vercel:**  
> When deployed serverlessly on Vercel, VoiceSphere leverages browser `BroadcastChannel` and serverless API routes (`/api/rooms`, `/api/health`) for cross-tab multi-user participation and client-mesh peer communication without requiring an external managed server.

---

## 2. Self-Hosting with Docker & Docker Compose

For enterprise, self-hosted, or community instances with full persistent WebSocket server:

### Quick Start:
```bash
# Clone the repository
git clone https://github.com/your-org/voicesphere.git
cd voicesphere

# Build and start the container
docker compose up -d --build
```

Access the application at: `http://localhost:3000`

### Health Check Verification:
```bash
curl http://localhost:3000/api/health
```

---

## 3. WebRTC Coturn (STUN/TURN) Configuration

For global multi-client communication behind complex symmetric NATs or corporate firewalls, configure Coturn in `src/lib/webrtc-manager.ts` or via environment variables:

```javascript
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:your-turn-server.org:3478',
      username: 'voicesphere_user',
      credential: 'secure_password_here',
    },
  ],
};
```

---

## 4. Production Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP/WebSocket listener port | `3000` |
| `NODE_ENV` | Environment mode (`production` / `development`) | `production` |
| `NEXT_PUBLIC_APP_URL` | Public canonical URL | `http://localhost:3000` |

---

## 5. Nginx Reverse Proxy Configuration Example

```nginx
server {
    listen 80;
    server_name voicesphere.yourdomain.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name voicesphere.yourdomain.org;

    ssl_certificate /etc/letsencrypt/live/voicesphere.yourdomain.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/voicesphere.yourdomain.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
