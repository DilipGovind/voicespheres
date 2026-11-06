# Security Policy

## Reporting Security Issues

VoiceSphere takes platform security and community safety seriously. If you discover a vulnerability or security flaw, please report it via our responsible disclosure channel:

- **Email**: `security@voicesphere.org`
- Please provide steps to reproduce the issue and expected vs actual behavior.
- We commit to acknowledging receipt within 48 hours and providing a remediation timeline.

## Transport & Media Encryption
- **HTTPS & WSS**: All web and WebSocket signaling traffic is encrypted with TLS 1.3.
- **WebRTC DTLS-SRTP**: Real-time audio data streams are encrypted end-to-end between peers.
- **Content Security Policy & Permissions Policy**: Permissions for camera access are completely blocked, restricting device capabilities strictly to the microphone when approved by the user.

## Moderation & Anti-Ableism Safety
- Automated moderation algorithms do not flag speech patterns, stuttering, AAC electronic voices, or prolonged cognitive pauses as suspicious or abusive.
- Significant moderation actions are subjected to transparent human review with a clear appeals mechanism.
