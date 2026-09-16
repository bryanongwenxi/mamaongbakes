import { z } from "zod";
export const categories = [
  "All bakes",
  "Kueh",
  "Bread & buns",
  "Cakes & treats",
  "Dumplings",
] as const;
export const variantSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
    label: z.string().trim().min(1).max(100),
    price: z.number().int().min(100).max(100000),
    salePrice: z.number().int().min(100).max(100000).nullable(),
  })
  .refine((v) => v.salePrice === null || v.salePrice < v.price, {
    message: "Offer price must be lower than the original price.",
  });
export const MAX_PRODUCT_PHOTOS = 8;
export const imageSchema = z
  .string()
  .max(500)
  .regex(/^\/(?:images\/[a-zA-Z0-9._-]+|api\/images\/[a-zA-Z0-9-]+)$/);
export const productSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9-]{1,80}$/),
    name: z.string().trim().min(1).max(100),
    category: z.enum(["Kueh", "Bread & buns", "Cakes & treats", "Dumplings"]),
    description: z.string().trim().min(1).max(1000),
    ingredients: z.string().trim().max(1500),
    allergens: z.string().trim().max(500),
    ingredientsVerified: z.boolean(),
    image: imageSchema,
    images: z.array(imageSchema).min(1).max(MAX_PRODUCT_PHOTOS).optional(),
    available: z.boolean(),
    featured: z.boolean(),
    variants: z.array(variantSchema).min(1).max(10),
  })
  .refine(
    (p) => new Set(p.variants.map((v) => v.id)).size === p.variants.length,
    { message: "Each size needs a unique ID." },
  )
  .refine(
    (p) =>
      !p.images ||
      (p.images[0] === p.image && new Set(p.images).size === p.images.length),
    { message: "Choose a unique set of photos with the cover photo first." },
  );
export type Product = z.infer<typeof productSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type BasketItem = {
  productId: string;
  variantId: string;
  quantity: number;
};
export type OrderDetails = {
  name: string;
  method: "collection" | "delivery";
  date: string;
  address: string;
  notes: string;
};
export const money = (cents: number) =>
  new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
export const priceOf = (v: Variant) => v.salePrice ?? v.price;

// Older catalog entries keep working without a database migration.
export const productImages = (
  product: Pick<Product, "image" | "images">,
): string[] => (product.images?.length ? product.images : [product.image]);
