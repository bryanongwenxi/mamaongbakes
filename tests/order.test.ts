import test from "node:test";
import assert from "node:assert/strict";
import { seedProducts } from "../lib/seed";
import { orderMessage, resolveBasket, whatsappLink } from "../lib/order";
import { productSchema } from "../lib/types";
import {
  signSession,
  validSession,
  readPayload,
  signPayload,
  emailAllowed,
} from "../lib/auth";

test("Every imported offering has a valid schema and unique sizes", () => {
  for (const p of seedProducts)
    assert.ok(productSchema.safeParse(p).success, p.name);
  assert.equal(seedProducts.length, 14);
});
test("Enquiry uses current promotional price and pending delivery, preserves Unicode and notes", () => {
  const products = structuredClone(seedProducts);
  products[0].variants[0].salePrice = 4000;
  const message = orderMessage(
    [{ productId: products[0].id, variantId: "size-1", quantity: 2 }],
    products,
    {
      name: "Mei & family",
      method: "delivery",
      date: "2026-10-01",
      address: "520123",
      notes: "No nuts? Please confirm.",
    },
  );
  assert.match(message, /S?\$80\.00/);
  assert.match(message, /fee to be confirmed; not included/);
  assert.match(message, /payment will be arranged in chat/);
  assert.equal(
    new URL(whatsappLink(message)).searchParams.get("text"),
    message,
  );
});
test("Stale, hidden, removed variants and invalid quantities never inflate checkout", () => {
  const p = structuredClone(seedProducts);
  p[1].available = false;
  const basket = [
    { productId: p[0].id, variantId: "size-1", quantity: 2 },
    { productId: p[1].id, variantId: "size-1", quantity: 3 },
    { productId: p[0].id, variantId: "deleted", quantity: 2 },
    { productId: p[2].id, variantId: "size-1", quantity: -5 },
    { productId: p[2].id, variantId: "size-1", quantity: 100 },
  ];
  assert.equal(resolveBasket(basket, p).length, 1);
});
test("Collection message never requests a delivery fee or sends a stale address", () => {
  const message = orderMessage(
    [{ productId: seedProducts[0].id, variantId: "size-1", quantity: 1 }],
    seedProducts,
    {
      name: "Mei",
      method: "collection",
      date: "2026-10-01",
      address: "SECRET_OLD_ADDRESS",
      notes: "",
    },
  );
  assert.match(message, /Pasir Ris \(free\)/);
  assert.doesNotMatch(message, /SECRET_OLD_ADDRESS/);
});
test("Offer price must be below original; unsafe image sources and duplicate size IDs fail", () => {
  const p = structuredClone(seedProducts[0]);
  p.variants[0].salePrice = p.variants[0].price;
  assert.equal(productSchema.safeParse(p).success, false);
  p.variants[0].salePrice = null;
  p.image = "javascript:alert(1)";
  assert.equal(productSchema.safeParse(p).success, false);
  p.image = "/images/kuehsalat.jpg";
  p.variants[1].id = p.variants[0].id;
  assert.equal(productSchema.safeParse(p).success, false);
});
test("Only allowlisted accounts with valid, unexpired sessions can access admin", () => {
  const previous = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = "bryanongwenxi@gmail.com";
  try {
    const key = "a".repeat(48);
    const token = signSession(
      "bryanongwenxi@gmail.com",
      "google-sub",
      Date.now() + 60000,
      key,
    );
    assert.ok(validSession(token, key));
    assert.ok(!validSession(token + "x", key));
    assert.ok(
      !validSession(
        signSession(
          "bryanongwenxi@gmail.com",
          "google-sub",
          Date.now() - 1000,
          key,
        ),
        key,
      ),
    );
    assert.ok(!validSession(token, "short"));
    assert.ok(!validSession(token, "b".repeat(48)));
    assert.ok(
      !validSession(
        signSession("stranger@gmail.com", "other-sub", Date.now() + 60000, key),
        key,
      ),
    );
    process.env.ADMIN_EMAILS = "";
    assert.ok(
      !validSession(token, key),
      "Removing an allowlisted account revokes its existing session",
    );
  } finally {
    process.env.ADMIN_EMAILS = previous;
  }
});
test("OAuth state cookies cannot become admin sessions and payload tampering fails", () => {
  const key = "k".repeat(48);
  const state = signPayload(
    { purpose: "mob-oauth", state: "nonce", expiry: Date.now() + 60000 },
    key,
  );
  assert.equal(readPayload(state, key)?.purpose, "mob-oauth");
  assert.ok(!validSession(state, key));
  assert.equal(readPayload(state.replace("ey", "ez"), key), null);
  assert.equal(readPayload("malformed", key), null);
});

test("Photo galleries preserve legacy products and enforce a safe, ordered cover", async () => {
  const { productImages, MAX_PRODUCT_PHOTOS } = await import("../lib/types");
  const legacy = structuredClone(seedProducts[0]);
  assert.deepEqual(productImages(legacy), [legacy.image]);
  const photos = [legacy.image, "/api/images/another-photo"];
  const gallery = { ...legacy, images: photos };
  assert.ok(productSchema.safeParse(gallery).success);
  assert.deepEqual(productImages(gallery), photos);
  assert.ok(
    !productSchema.safeParse({ ...gallery, image: photos[1] }).success,
    "Cover must match first photo",
  );
  assert.ok(!productSchema.safeParse({ ...gallery, images: [] }).success);
  assert.ok(
    !productSchema.safeParse({
      ...gallery,
      images: [legacy.image, legacy.image],
    }).success,
  );
  assert.ok(
    !productSchema.safeParse({
      ...gallery,
      images: [legacy.image, "https://untrusted.example/image.jpg"],
    }).success,
  );
  assert.ok(
    !productSchema.safeParse({
      ...gallery,
      images: [
        legacy.image,
        ...Array.from(
          { length: MAX_PRODUCT_PHOTOS },
          (_, i) => `/api/images/photo-${i}`,
        ),
      ],
    }).success,
  );
});
