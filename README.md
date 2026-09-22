# RHOOD Forge

A unique, multi-page token launchpad UI concept for Robinhood Chain.

## Pages

- `/` — Home
- `/explore` — Explore tokens
- `/token/:id` — Token detail / trading UI
- `/create` — Create token flow
- `/activity` — Live activity
- `/analytics` — Analytics
- `/profile` — Profile
- `/docs` — Documentation
- `/docs/:section` — Documentation sections

## Local development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Create a GitHub repository and upload all files.
2. Push the `main` branch.
3. In GitHub, open **Settings → Pages**.
4. Set **Source** to **GitHub Actions**.
5. Wait for the workflow to finish. GitHub will show the live Pages URL.

The project includes a `404.html` + redirect fallback so React Router deep links such as `/explore` and `/token/demo` can be opened directly on GitHub Pages.

## Important

The UI is functional as a frontend demo, but blockchain execution is intentionally not connected yet. For a production launchpad, add audited contracts, wallet integration (wagmi/viem), a token factory, bonding-curve contract, graduation/liquidity logic, liquidity locker, event indexer/API, verified ABIs, transaction simulation and robust error handling.
