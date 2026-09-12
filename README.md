# Finance Mini App

A mobile-first Persian RTL personal finance dashboard designed to be hosted for free with GitHub Pages.

## Files

- `index.html` — application shell
- `styles.css` — responsive UI
- `app.js` — sample data, navigation, reports, charts and infinite-scroll behavior

## Run locally

Open `index.html` in a browser, or use VS Code Live Server.

## GitHub Pages

1. Create a GitHub repository.
2. Upload these three files to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`.
6. Save and wait for GitHub Pages to publish the site.

## Connecting to n8n

The current app uses sample data so the design can be tested immediately.

Later, replace the sample data in `app.js` with `fetch()` calls to n8n Webhook endpoints.

Suggested endpoints:

- `GET /dashboard`
- `GET /transactions?limit=20&offset=0`
- `GET /reports/monthly?year=1405&month=6`
- `GET /reports/category?category=خوراک`

Keep the API response fields similar to the objects already present in `sampleData` to minimize frontend changes.

## Important

This is a frontend prototype. No bank credentials, tokens or database credentials should be placed in the frontend code.
