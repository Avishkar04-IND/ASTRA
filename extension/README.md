# MahaSetu Extension

Chrome extension for the MahaSetu prototype.

## Active Structure

- `manifest.config.ts` defines the Manifest V3 extension config.
- `src/popup/` contains the popup UI.
- `src/content/` scans mock government portal forms, asks field-level consent, and autofills synthetic data.
- `src/shared/` contains message constants, matcher logic, and mock profile values.
- `src/types/` contains extension-specific TypeScript contracts aligned with the repo's canonical field keys.

## Prototype Boundary

This extension currently uses mock profile values only. DigiLocker, API Setu, government portals, department APIs, application events, and grievance data remain mock or sandbox for the hackathon MVP.

## Run

```bash
npm install
npm run build
```

Load the generated `dist/` folder in Chrome through `chrome://extensions` with Developer mode enabled.
