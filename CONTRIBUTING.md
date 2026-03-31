# Contributing to OpenClaw Hub

Thanks for wanting to help! Here's how.

## Quick Start

```bash
git clone https://github.com/tigerandrune/openclaw-hub.git
cd openclaw-hub
npm install
npm run dev
```

Open `http://localhost:3100` — you'll see the setup wizard on first run.

## What We'd Love Help With

- **Translations**: Fix a string in `src/i18n/*.json`, or add a new language
- **Plugins**: Build something cool — see [docs/creating-plugins.md](docs/creating-plugins.md)
- **Bug reports**: Open an issue with steps to reproduce
- **Ideas**: Feature requests welcome — open an issue and let's talk

## Before Submitting a PR

1. Run `npm test` — all tests should pass
2. Run `npm run build` — no build errors
3. Keep commits focused — one thing per PR
4. No external dependencies without discussion first (we ship zero external requests)

## Code Style

- React functional components with hooks
- Tailwind utility classes + CSS custom properties for theming
- i18n keys for all user-facing text (8 languages)
- No `console.log` in production code

## Security Issues

**Do not open a public issue.** See [SECURITY.md](SECURITY.md#reporting-vulnerabilities).

## License

By contributing, you agree that your contributions will be licensed under MIT.
