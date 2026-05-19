# TraceVault


https://github.com/user-attachments/assets/eb1139b9-e417-4ddd-a44a-f3a9a907e882


Tamper-evident evidence capture for cyberbullying. TraceVault helps victims preserve abusive content before it disappears, with cryptographic hashing and a verifiable audit trail that law enforcement or institutions can trust.

## The problem
Harassment happens fast and platforms remove content quickly. Ordinary screenshots are easy to dispute or edit, and victims lose proof before they can report it.

## The solution
TraceVault captures the evidence at the moment it appears, computes a SHA-256 hash on-device, stores the image separately from metadata, and generates a structured PDF report that is ready for official submission.

## What we built
- Mobile app (Expo + React Native): capture screenshots from gallery, verify integrity from image metadata, add incident context, and manage a personal evidence vault.
- Browser extension (Chrome MV3): capture the visible tab, auto-extract platform, sender, message content, URL, and title directly from the DOM.
- Backend (Node + Express): verify hashes, store images in S3, store metadata in Supabase, and generate court-style PDF reports.

## How it works end to end
1. Capture: the mobile app or extension captures the image and key metadata.
2. On-device hash: a SHA-256 hash is computed before upload.
3. Send to backend: `/evidence/capture` receives the image, metadata, and client hash.
4. Verify and store: the backend recomputes the hash, stores the image in S3, and stores metadata + hash in Supabase.
5. Review and export: users browse their vault and export a PDF report via `/report/:evidenceId`.

## Evidence integrity model
- Cryptographic hash: every image is hashed using SHA-256 before it leaves the device.
- Server-side verification: the backend recomputes and compares the hash to detect tampering.
- Metadata integrity: the mobile app compares creation vs modification time to flag edits.
- Separation of storage: image (S3) and metadata (Supabase) are stored separately to reduce tampering risk.

## Features
- Real-world impact: empowers victims with legally credible evidence.
- Technical depth: cryptographic hashing, metadata analysis, secure storage, and PDF generation.
- Multi-surface capture: web extension and mobile app cover the biggest harassment channels.
- Automation: DOM-based extraction reduces manual input and improves accuracy.
- Ready-to-submit reporting: PDF report is formatted for formal complaints.

## Tech stack
- Mobile: Expo, React Native, Expo Router, Expo Crypto, Expo Media Library, Clerk auth
- Extension: Chrome MV3, content scripts, WebCrypto
- Backend: Node.js, Express, Supabase, AWS S3, PDFKit

## API endpoints
- `GET /health` - health check
- `POST /evidence/capture` - upload evidence (image + metadata + hash)
- `GET /evidence/user/:userId` - list evidence for a user
- `GET /evidence/:id` - fetch a single evidence record
- `DELETE /evidence/:id` - delete an evidence record
- `POST /verify/hash` - verify a hash against an image
- `GET /report/:evidenceId` - generate a PDF report

## Repository structure
```
backend/    Node + Express API, S3/Supabase integration, PDF generation
extension/  Chrome extension for live-page capture and metadata extraction
mobile/     Expo mobile app for capture, vault, and reporting
```

## Setup prerequisites
- Node.js 18+
- An AWS S3 bucket
- Supabase project (table for evidence metadata)
- Clerk project (for user auth)
- Chrome (for extension testing)

## Environment variables
### Backend (.env in backend/)
- `PORT` (optional)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_EVIDENCE_TABLE` (optional, defaults to `evidence`)
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_BUCKET_NAME`

### Mobile (.env in mobile/)
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_BASE_URL` (points to the backend, defaults to the deployed URL)

### Extension
- Backend URL is hardcoded in [extension/popup.js](extension/popup.js). Update this if you run the backend locally.

## Run locally
### Backend
```bash
cd backend
npm install
npm start
```

### Mobile app
Connect your android phone via usb and turn on usb debugging
```bash
cd mobile
npm install
npx expo run:android
```

### Browser extension
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" and select `extension/`
4. In the extension popup, paste your Clerk `user_id` from the mobile app

.

## Deployment
- Backend is configured to work with the hosted API base URL used in the app and extension.
- Update `EXPO_PUBLIC_API_BASE_URL` and [extension/popup.js](extension/popup.js) if you deploy elsewhere.

## Notes on data schema
The backend accepts a flexible evidence schema and can handle older/newer column sets. At minimum, store the evidence ID, user ID, image URL, hash, and capture timestamp. Additional fields (platform, URL, sender, message content, integrity flag, EXIF metadata) are used to enrich reports and verify integrity.

## Safety and privacy
- Do not commit `.env` files or secrets.
- Rotate any credentials that have been exposed.

TraceVault turns a screenshot into a credible digital record. That is the difference between "he said, she said" and evidence that stands up to scrutiny.
