# Contributing to VoiceSphere

We warmly welcome contributions from developers, accessibility researchers, assistive technology users, translators, and disability self-advocates.

---

## Code of Conduct & Anti-Ableism Pledge
1. Respect all forms of communication (natural speech, typed text, synthesized AAC, sign language, and alternative inputs).
2. Never treat synthesized speech or assistive technology as inferior to natural speech.
3. Accessible design is not a luxury or an afterthought; any pull request that introduces an accessibility regression or breaks screen-reader navigation will not be merged.

---

## Development Workflow

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run test suite:
   ```bash
   npm test
   ```
4. Verify TypeScript and Next.js build:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
5. Run the local development server:
   ```bash
   npm run dev
   ```

---

## Adding New Languages
VoiceSphere supports 21 global languages out of the box. To contribute a new translation:
1. Add language metadata to `src/types/i18n.ts`.
2. Add translation strings to `src/locales/translations.ts`.
3. Add unit test verification to `tests/i18n.test.ts`.
