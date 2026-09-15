# Mama Ong Bakes

A warm, responsive storefront and private menu editor for Mama Ong’s home bakery in Singapore.

## Customer experience

- All 14 offerings from the original Framer menu, with the original size/portion options and SGD prices.
- Category filters, search, photos, ingredients and dietary notes.
- A basket saved on the customer’s device. Prices and availability are checked again before preparing an order enquiry.
- Free Pasir Ris self-collection, or delivery with the fee explicitly pending.
- A preferred date, name, delivery area and optional notes become a previewable WhatsApp message to **+65 9230 1768**. Opening WhatsApp does not send the message automatically.
- Availability, timing, the delivery fee and payment are arranged in chat. There is no automatic acceptance, payment capture or order database.

## Mama’s admin area

Sign in at `/admin` using an approved Google account to add/edit/remove bakes, upload photos, manage size variants, pause availability and apply special prices. Sale prices appear alongside the crossed-out usual price. Edits are protected by an HTTP-only signed cookie, same-origin checks, an explicit Google email allowlist. Revision checks prevent concurrent edits from silently overwriting each other.

### Production setup on Vercel

1. Import this repository as a **Next.js** project, using the repository root.
2. Connect a **dedicated Postgres database** (for example, Neon from Vercel Storage), with `DATABASE_URL` available to production. TLS is required. The app creates its two small tables and imports the starting menu on the first database request.
3. In Google Cloud, create a Web application OAuth client for Mama Ong Bakes. Add `https://mamaongbakes.vercel.app/api/auth/google/callback` as an authorized redirect URI. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Vercel production, along with a random `SESSION_SECRET` of at least 32 characters. Never commit secrets or use a `NEXT_PUBLIC_` prefix. Rotate `SESSION_SECRET` to revoke all sessions.
4. Set `ADMIN_EMAILS=bryanongwenxi@gmail.com`. More approved emails can be added as a comma-separated list. Every request rechecks the allowlist; removing an email revokes its existing session. There is no public sign-up or shared password. Google signatures, issuer, audience, expiry, nonce, OAuth state and PKCE are validated. Only verified Google email identities are accepted.
5. Optionally set `NEXT_PUBLIC_SITE_URL` to the final public URL for sharing metadata. Otherwise Vercel’s production domain is used.
6. Redeploy and sign in at `/admin`. Test one menu update and check it in the shop.

Without a database, the production storefront serves the seed menu and admin mutations are disabled. The database is required for a live editable menu. Photos uploaded by Mama are validated, resized, stripped of metadata and stored in Postgres; their immutable image URLs are cached. Original seed photos are local static assets.

For preview deployments, use a separate database branch and separate admin credentials. Do not connect untrusted preview code to the production database. Keep provider backups enabled; deleting a bake removes it from the current menu, while its photo is retained.

## Local development

Use Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
# Configure the Google client, ADMIN_EMAILS and SESSION_SECRET.
# DATABASE_URL is optional locally; without it, the menu and photos use .local/.
npm run dev
```

The `.local/` files are a development fallback only. Vercel never uses local disk for persistent storage. No credentials are shipped with the source.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

The unit tests cover pricing, checkout messages, stale baskets, validation, and session integrity. `scripts/check-api.mjs` is a local-only integration check for authorization, CSRF, concurrent editing, photo uploads, offers, and adding/removing a bake. It expects a development server on port 3107 and local-only Google configuration plus an approved email and session secret in `.env.local`; it signs a local test session and restores the menu after running. Google token exchange must also be tested with the configured real OAuth client before launch. Never point it at production.

## Content to confirm

Prices and sizes were copied from https://mamaongbakes.framer.ai/ on 15 September 2026. Photos come from the original repository and Framer site; five missing photos were copied with `scripts/photos.mjs`. Existing marketing descriptions were rewritten for this design.

**Ingredients and allergens are estimates, supplied as drafts at the owner’s request.** Each product starts with `ingredientsVerified: false`. The shop labels these as unverified. Mama should check each recipe and any cross-contact notes before marking it verified. No invented discounts, reviews or ratings are included.

## Visual identity

The original M.O.B logo was sourced from the bakery’s Instagram profile. The family story is grounded in its bio: a passion project by a mum of three. The site uses exactly two font families: Abril Fatface for display headings and Manrope for navigation, products, body text and controls. Layout references: Ottolenghi (https://ottolenghi.co.uk/) and Gohar World (https://gohar.world/).
