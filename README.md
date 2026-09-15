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

Open `/admin` to add/edit/remove bakes, upload photos, manage size variants, pause availability and apply special prices. Sale prices appear alongside the crossed-out usual price. Edits are protected by an HTTP-only signed cookie, same-origin checks, a password hash, and database-backed sign-in throttling. Revision checks prevent concurrent edits from silently overwriting each other.

### Production setup on Vercel

1. Import this repository as a **Next.js** project, using the repository root.
2. Connect a **dedicated Postgres database** (for example, Neon from Vercel Storage), with `DATABASE_URL` available to production. TLS is required. The app creates its three small tables and imports the starting menu on the first database request.
3. Run `node --import tsx scripts/admin-password.ts` locally to choose a password. Put the generated `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` into Vercel’s server-only environment variables. Never commit them or use a `NEXT_PUBLIC_` prefix. Password changes should also rotate `SESSION_SECRET` to invalidate existing sessions.
4. Optionally set `NEXT_PUBLIC_SITE_URL` to the final public URL for sharing metadata. Otherwise Vercel’s production domain is used.
5. Redeploy and sign in at `/admin`. Test one menu update and check it in the shop.

Without a database, the production storefront serves the seed menu and admin mutations are disabled. The database is required for a live editable menu. Photos uploaded by Mama are validated, resized, stripped of metadata and stored in Postgres; their immutable image URLs are cached. Original seed photos are local static assets.

For preview deployments, use a separate database branch and separate admin credentials. Do not connect untrusted preview code to the production database. Keep provider backups enabled; deleting a bake removes it from the current menu, while its photo is retained.

## Local development

Use Node.js 22 or newer.

```sh
npm ci
cp .env.example .env.local
# Configure ADMIN_PASSWORD_HASH and SESSION_SECRET using the password script.
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

The unit tests cover pricing, checkout messages, stale baskets, validation, and session integrity. `scripts/check-api.mjs` is a local-only integration check for login, authorization, CSRF, concurrent editing, photo uploads, offers, and adding/removing a bake. It expects a development server on port 3107 and a local test password in `.local/dev-password`; it restores the menu after running. Never point it at production.

## Content to confirm

Prices and sizes were copied from https://mamaongbakes.framer.ai/ on 15 September 2026. Photos come from the original repository and Framer site; five missing photos were copied with `scripts/photos.mjs`. Existing marketing descriptions were rewritten for this design.

**Ingredients and allergens are estimates, supplied as drafts at the owner’s request.** Each product starts with `ingredientsVerified: false`. The shop labels these as unverified. Mama should check each recipe and any cross-contact notes before marking it verified. No invented discounts, reviews or ratings are included.
