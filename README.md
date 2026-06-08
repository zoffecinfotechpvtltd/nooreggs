# NOOR EGGS CENTRE - Daily Ledger by Danish

A mobile-first local ledger app for Noor Eggs, fixed for proprietor Danish Shaikh. It tracks daily egg sales, profit, customer dues, collections, records, and payment method by Cash or GPay.

## Project structure

```txt
noor-eggs/
├── index.html              # app markup and view containers
├── manifest.webmanifest    # PWA install metadata
├── service-worker.js       # offline caching of the app shell
├── assets/                 # logo and app icons
├── css/                    # base, components, and view styles
└── js/
    ├── app.js              # entry: boot, routing, event wiring
    ├── backend.js          # localStorage data layer
    ├── state.js            # shared in-memory data
    ├── calc.js             # finance logic
    ├── utils.js ui.js router.js
    └── views/              # today, sheet, dues, records, more, customers
```

## Features

- Opens directly into the ledger with no login or signup.
- Stores all data locally on the current browser/device.
- Tracks customers, eggs sold, amount received, pending balance, and profit.
- Records whether payments were made by Cash or GPay.
- Supports dues collection, day records, backup export, and backup restore.
- Can be installed as a PWA and opened offline after first load.

## Run locally

ES modules need a small web server. Pick one:

- Python: `python -m http.server 5173`
- Node: `npx serve` or `npx http-server`
- VS Code: use the Live Server extension

Then open `http://localhost:5173`.

## Deploy to Vercel with GitHub

1. Create a GitHub repo, for example `noor-eggs`.
2. Push this folder:

```powershell
git init
git add .
git commit -m "Initial Noor Eggs local ledger"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/noor-eggs.git
git push -u origin main
```

3. Go to `https://vercel.com/new`.
4. Import the GitHub repo.
5. Use:

```txt
Framework Preset: Other
Build Command: leave empty
Output Directory: .
Install Command: leave empty
```

6. Deploy.

Because the app is local-only, no Firebase setup and no Vercel environment variables are required.
