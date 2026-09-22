# RHOOD Forge — Zero Build GitHub Pages

This version is intentionally **zero-build**. You do not need Node.js, npm, Vite, GitHub Actions, or a terminal.

## Publish from a branch
1. Upload every file in this folder to the repository root on the `main` branch.
2. GitHub → Settings → Pages.
3. Source: **Deploy from a branch**.
4. Branch: **main** / **root**.
5. Save.

The app runs directly in the browser using React and Babel loaded from public CDNs. Navigation uses hash routes so refreshing a page does not produce a GitHub Pages 404.

Note: this is the front-end demo. Real token deployment, bonding curve, trading and graduation contracts still need blockchain integration.
