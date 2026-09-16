"use client";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  ShoppingBag,
  Plus,
  Minus,
  X,
  MapPin,
  Truck,
  Heart,
  Camera,
  Check,
  Search,
  ChevronDown,
  MessageCircle,
  Copy,
  Flower2,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BasketItem,
  Product,
  Variant,
  OrderDetails,
  categories,
  money,
  priceOf,
  productImages,
} from "@/lib/types";
import {
  resolveBasket,
  orderMessage,
  whatsappLink,
  singaporeToday,
} from "@/lib/order";
export function Brand() {
  return (
    <a className="brand" href="/" aria-label="Mama Ong Bakes home">
      <img
        src="/images/mob-logo.jpg"
        alt="M.O.B — Mama Ong Bakes original logo"
      />
      <span>mama ong bakes</span>
    </a>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
      aria-label={title}
    >
      <button
        className="icon-button close"
        onClick={onClose}
        aria-label="Close"
      >
        <X size={22} />
      </button>
      {children}
    </dialog>
  );
}
function Price({ variant }: { variant: Variant }) {
  return (
    <span className="price">
      {variant.salePrice !== null && <del>{money(variant.price)}</del>}
      <span>{money(priceOf(variant))}</span>
    </span>
  );
}
function Photo({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  return (
    <img
      className={className}
      src={product.image}
      alt={product.name}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.objectFit = "contain";
        e.currentTarget.src = "/icon.svg";
      }}
    />
  );
}
export default function Storefront({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const [products, setProducts] = useState(initialProducts),
    [category, setCategory] = useState("All bakes"),
    [query, setQuery] = useState(""),
    [basket, setBasket] = useState<BasketItem[]>([]),
    [hydrated, setHydrated] = useState(false),
    [selected, setSelected] = useState<Product | null>(null),
    [showBasket, setShowBasket] = useState(false),
    [toast, setToast] = useState(""),
    [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mama-basket-v1") ?? "[]");
      if (Array.isArray(saved))
        setBasket(
          saved
            .filter(
              (v) =>
                typeof v?.productId === "string" &&
                typeof v.variantId === "string" &&
                Number.isInteger(v.quantity) &&
                v.quantity > 0 &&
                v.quantity <= 99,
            )
            .slice(0, 150),
        );
    } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated)
      try {
        localStorage.setItem("mama-basket-v1", JSON.stringify(basket));
      } catch {}
  }, [basket, hydrated]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const lines = resolveBasket(basket, products);
  const count = lines.reduce((s, i) => s + i.quantity, 0);
  const subtotal = lines.reduce((s, i) => s + i.total, 0);
  function add(product: Product, variant: Variant, quantity = 1) {
    setBasket((prev) => {
      const current = prev.find(
        (i) => i.productId === product.id && i.variantId === variant.id,
      );
      return current
        ? prev.map((i) =>
            i === current
              ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
              : i,
          )
        : [...prev, { productId: product.id, variantId: variant.id, quantity }];
    });
    setToast(`${product.name} added to your basket`);
  }
  const visible = products.filter(
    (p) =>
      (category === "All bakes" || p.category === category) &&
      `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const hero = products.find((p) => p.id === "kueh-salat") ?? products[0];
  return (
    <>
      <a className="skip-link" href="#menu">
        Skip to the menu
      </a>
      <div className="announcement">
        <span>
          <MapPin size={14} /> Free self-collection at Pasir Ris
        </span>
        <span className="announcement-divider">✦</span>
        <span>Delivery fee confirmed with your order</span>
      </div>
      <header className="header">
        <div className="nav-wrap">
          <Brand />
          <nav
            className={mobileNav ? "nav-links open" : "nav-links"}
            aria-label="Main navigation"
          >
            <a href="#menu" onClick={() => setMobileNav(false)}>
              Our bakes
            </a>
            <a href="#story" onClick={() => setMobileNav(false)}>
              Mama’s story
            </a>
            <a href="#how-to-order" onClick={() => setMobileNav(false)}>
              How to order
            </a>
          </nav>
          <div className="nav-actions">
            <button
              className="basket-button"
              aria-label={`Open basket, ${count} items`}
              onClick={() => setShowBasket(true)}
            >
              <ShoppingBag size={18} />
              <span>Basket</span>
              <b>{count}</b>
            </button>
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Toggle menu"
              aria-expanded={mobileNav}
            >
              {mobileNav ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <p className="hero-location">
              <span /> A little home bakery in Pasir Ris
            </p>
            <h1>
              Good things.
              <br />
              Made <span>at home.</span>
            </h1>
            <p>
              Traditional kueh, comforting bakes, and something lovely for your
              table. Made by Mama, just for you.
            </p>
            <div className="hero-actions">
              <a className="button" href="#menu">
                Find your favourites <ArrowRight size={20} />
              </a>
              <a className="hero-story-link" href="#story">
                Meet Mama <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-photo">
              {hero && (
                <img src={hero.image} alt={hero.name} fetchPriority="high" />
              )}
              <div className="hero-photo-note">
                <span>From Mama’s favourites</span>
                <strong>{hero?.name ?? "Made with love"}</strong>
              </div>
            </div>
            <div className="hero-small-photo">
              <img
                src="/images/cinnamonroll.jpg"
                alt="Mama’s homemade cinnamon rolls"
              />
              <span>A little comfort, fresh from home.</span>
            </div>
          </div>
        </section>
        <div className="welcome-note wrap">
          <span>
            <Heart size={20} /> Made to order, with care
          </span>
          <span>
            <MapPin size={20} /> Free collection at Pasir Ris
          </span>
          <span>
            <MessageCircle size={20} /> Order with a real person
          </span>
        </div>
        <section className="menu-section wrap" id="menu">
          <div className="section-top">
            <div>
              <p className="eyebrow">SOMETHING FOR EVERY TABLE</p>
              <h2>What are you craving?</h2>
            </div>
            <p>Pick your favourites. We’ll make them with care.</p>
          </div>
          <div className="menu-toolbar">
            <div
              className="category-tabs"
              role="group"
              aria-label="Filter bakes"
            >
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className="search">
              <Search size={17} />
              <input
                aria-label="Search bakes"
                placeholder="Find a favourite"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="icon-button"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </label>
          </div>
          <div className="menu-meta">
            <span>{visible.length} bakes & favourites</span>
            <span>All prices in SGD · Made to order</span>
          </div>
          {visible.length ? (
            <div className="product-grid">
              {visible.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDetails={() => setSelected(product)}
                  onAdd={(v) => add(product, v)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <Flower2 />
              <h3>No bakes found.</h3>
              <p>Try another search, or take a look at the whole menu.</p>
              <button
                className="text-button"
                onClick={() => {
                  setQuery("");
                  setCategory("All bakes");
                }}
              >
                See all bakes <ArrowRight size={16} />
              </button>
            </div>
          )}
          <div className="menu-note">
            <Heart size={20} strokeWidth={1.3} />
            <p>
              A little note from our kitchen: everything is made to order. We’ll
              confirm availability and your preferred date together on WhatsApp.
            </p>
          </div>
        </section>
        <section className="story-section" id="story">
          <div className="story-inner wrap">
            <div className="story-photo">
              <img
                src="/images/cinnamonroll.jpg"
                alt="Cinnamon rolls from Mama Ong’s kitchen"
                loading="lazy"
              />
              <span className="story-photo-label">
                HOMEMADE, IN EVERY SENSE.
              </span>
            </div>
            <div className="story-copy">
              <p className="story-kicker">THE MAMA BEHIND M.O.B</p>
              <h2>
                A mum of three.
                <br />A kitchen full of love.
              </h2>
              <p>
                Mama Ong Bakes is a passion project by a mum of three, born in
                our family kitchen in Singapore. It’s a love of making good
                food, and the happiness of sharing it.
              </p>
              <p>
                From the kueh you grew up with to a loaf for tomorrow’s
                breakfast, these are the things we love having on our own table.
                Mama makes each order with that same care.
              </p>
              <p className="story-signature">
                We’d love to share them with you.
              </p>
              <a
                className="text-button"
                href="https://www.instagram.com/mamaongbakes/"
                target="_blank"
                rel="noreferrer"
              >
                <Camera size={17} /> A peek into our kitchen{" "}
                <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
        </section>
        <section className="how-section wrap" id="how-to-order">
          <div className="section-top">
            <div>
              <h2>From our oven to your home.</h2>
            </div>
            <p>
              Small home kitchen. A real person to talk to. <br />
              We’ll work out the little details together.
            </p>
          </div>
          <div className="steps">
            <article>
              <span className="step-number">01</span>
              <h3>Choose your favourites</h3>
              <p>
                Choose your bakes, sizes and quantities. Your basket keeps
                everything in one place.
              </p>
            </article>
            <article>
              <span className="step-number">02</span>
              <h3>Let’s chat on WhatsApp</h3>
              <p>
                Send your basket to us on WhatsApp. We’ll confirm the date,
                availability and final total, then arrange payment in chat.
              </p>
            </article>
            <article>
              <span className="step-number">03</span>
              <h3>Collect, or have it delivered</h3>
              <p>
                Collect for free in Pasir Ris, or arrange delivery. We’ll
                confirm the delivery fee before you pay.
              </p>
            </article>
          </div>
          <div className="collection-panel">
            <div>
              <MapPin size={27} strokeWidth={1.3} />
              <div>
                <h3>Self-collection at Pasir Ris</h3>
                <p>
                  Always free. We’ll share the exact location and timing in
                  chat.
                </p>
              </div>
              <span className="pill">ON THE HOUSE</span>
            </div>
            <div>
              <Truck size={27} strokeWidth={1.3} />
              <div>
                <h3>A little further from home?</h3>
                <p>
                  Delivery is available by arrangement. Fee confirmed with your
                  order.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="faq-section wrap">
          <div>
            <h2>Before you order.</h2>
          </div>
          <div className="faqs">
            {[
              [
                "Is my order confirmed when I send my basket?",
                "Your basket is an order enquiry. We’ll check what Mama can make, agree on a collection or delivery date, and confirm your order in WhatsApp.",
              ],
              [
                "How do I make payment?",
                "Once we’ve confirmed availability and the final amount (including delivery, if needed), we’ll arrange payment with you directly in chat. Please wait for our confirmation before paying.",
              ],
              [
                "Can I ask about ingredients or allergies?",
                "Of course. Open any bake for ingredient notes, and tell us about any dietary needs in your order message. Our ingredient notes are currently estimates awaiting Mama’s confirmation. Please check with us before ordering if you have an allergy.",
              ],
              [
                "When should I place my order?",
                "Choose your preferred date in the basket and we’ll check it with Mama. As a home kitchen, we can only take on the orders we have time to make with care.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={19} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="closing">
          <div className="wrap">
            <img
              src="/images/mob-logo.jpg"
              alt="Mama Ong Bakes original M.O.B logo"
            />
            <div>
              <h2>
                There’s a place for you
                <br />
                at Mama’s table.
              </h2>
              <a href="#menu" className="text-button">
                Find your favourites <ArrowUpRight size={21} />
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="wrap footer-top">
          <Brand />
          <p>
            Homemade in Singapore.
            <br />
            Shared with love, one order at a time.
          </p>
          <div>
            <a
              href="https://www.instagram.com/mamaongbakes/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram <ArrowUpRight size={15} />
            </a>
            <a href="https://wa.me/6592301768" target="_blank" rel="noreferrer">
              Say hello on WhatsApp <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© {new Date().getFullYear()} Mama Ong Bakes</span>
          <span>From our kitchen, to your table.</span>
          <a href="/admin">Mama’s kitchen login</a>
        </div>
      </footer>
      {count > 0 && !showBasket && (
        <button className="mobile-basket" onClick={() => setShowBasket(true)}>
          <span>
            <ShoppingBag size={18} /> Your basket · {count}
          </span>
          <span>
            {money(subtotal)} <ArrowRight size={18} />
          </span>
        </button>
      )}
      <div className={`toast ${toast ? "visible" : ""}`} role="status">
        {toast && (
          <>
            <Check size={18} />
            {toast}
            <button
              onClick={() => {
                setSelected(null);
                setShowBasket(true);
                setToast("");
              }}
            >
              View basket
            </button>
          </>
        )}
      </div>
      {selected && (
        <ProductDetails
          product={selected}
          onClose={() => setSelected(null)}
          onAdd={(v, q) => {
            add(selected, v, q);
            setSelected(null);
          }}
        />
      )}
      {showBasket && (
        <Basket
          basket={basket}
          products={products}
          setProducts={setProducts}
          setBasket={setBasket}
          onClose={() => setShowBasket(false)}
        />
      )}
    </>
  );
}
function useGallery(product: Product) {
  const photos = productImages(product),
    [index, setIndex] = useState(0),
    start = useRef<{ x: number; y: number } | null>(null);
  const current = Math.min(index, photos.length - 1);
  const move = (step: number) =>
    setIndex((i) => (i + step + photos.length) % photos.length);
  return {
    photos,
    index: current,
    setIndex,
    move,
    touch: {
      onTouchStart: (e: React.TouchEvent) => {
        start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      },
      onTouchEnd: (e: React.TouchEvent) => {
        if (!start.current) return;
        const dx = e.changedTouches[0].clientX - start.current.x,
          dy = e.changedTouches[0].clientY - start.current.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          e.preventDefault();
          move(dx < 0 ? 1 : -1);
        }
        start.current = null;
      },
    },
  };
}
function CardGallery({
  product,
  variant,
  onDetails,
}: {
  product: Product;
  variant: Variant;
  onDetails: () => void;
}) {
  const g = useGallery(product);
  return (
    <div className="card-gallery" {...g.touch}>
      <button
        className="product-image"
        onClick={onDetails}
        aria-label={`View ${product.name} details`}
      >
        <img
          src={g.photos[g.index]}
          alt={`${product.name}${g.photos.length > 1 ? ` · photo ${g.index + 1}` : ""}`}
          loading="lazy"
        />
        {!product.available ? (
          <span className="product-tag">Taking a little break</span>
        ) : variant.salePrice !== null ? (
          <span className="product-tag offer">Special price</span>
        ) : (
          product.featured && (
            <span className="product-tag">Mama’s favourite</span>
          )
        )}
        <span className="image-details">
          Take a closer look <ArrowUpRight size={17} />
        </span>
      </button>
      {g.photos.length > 1 && (
        <>
          <button
            className="gallery-arrow previous"
            onClick={() => g.move(-1)}
            aria-label={`Previous photo of ${product.name}`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            className="gallery-arrow next"
            onClick={() => g.move(1)}
            aria-label={`Next photo of ${product.name}`}
          >
            <ChevronRight size={20} />
          </button>
          <div className="gallery-dots" aria-label={`${product.name} photos`}>
            {g.photos.map((src, i) => (
              <button
                key={src}
                onClick={() => g.setIndex(i)}
                aria-label={`Show ${product.name} photo ${i + 1}`}
                aria-pressed={g.index === i}
              >
                <span />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
function ProductGallery({ product }: { product: Product }) {
  const g = useGallery(product);
  return (
    <div
      className="detail-gallery"
      role="region"
      aria-label={`${product.name} photo gallery`}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          g.move(-1);
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          g.move(1);
        }
      }}
    >
      <div className="detail-gallery-main" {...g.touch}>
        <img
          className="detail-photo"
          src={g.photos[g.index]}
          alt={`${product.name} · photo ${g.index + 1} of ${g.photos.length}`}
        />
        {g.photos.length > 1 && (
          <>
            <button
              className="gallery-arrow previous"
              onClick={() => g.move(-1)}
              aria-label="Previous photo"
            >
              <ChevronLeft />
            </button>
            <button
              className="gallery-arrow next"
              onClick={() => g.move(1)}
              aria-label="Next photo"
            >
              <ChevronRight />
            </button>
            <span className="photo-count" aria-live="polite">
              {g.index + 1} / {g.photos.length}
            </span>
          </>
        )}
      </div>
      {g.photos.length > 1 && (
        <div className="gallery-thumbnails">
          {g.photos.map((src, i) => (
            <button
              type="button"
              key={src}
              aria-label={`View photo ${i + 1}`}
              aria-pressed={i === g.index}
              onClick={() => g.setIndex(i)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function ProductCard({
  product,
  onDetails,
  onAdd,
}: {
  product: Product;
  onDetails: () => void;
  onAdd: (v: Variant) => void;
}) {
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const variant =
    product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  return (
    <article
      className={`product-card ${!product.available ? "unavailable" : ""}`}
    >
      <CardGallery product={product} variant={variant} onDetails={onDetails} />
      <div className="product-heading">
        <h3>
          <button onClick={onDetails}>{product.name}</button>
        </h3>
        <Price variant={variant} />
      </div>
      <p className="product-description">{product.description}</p>
      <button className="ingredient-link" onClick={onDetails}>
        Ingredients & details <ArrowUpRight size={13} />
      </button>
      <div className="product-bottom">
        <label className="variant-select">
          <span className="sr-only">Size for {product.name}</span>
          <select
            value={variant.id}
            onChange={(e) => setVariantId(e.target.value)}
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>
        <button
          className="add-button"
          disabled={!product.available}
          onClick={() => onAdd(variant)}
          aria-label={`Add ${product.name} to basket`}
        >
          <Plus size={18} />
          <span>Add</span>
        </button>
      </div>
    </article>
  );
}
function ProductDetails({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (v: Variant, q: number) => void;
}) {
  const [id, setId] = useState(product.variants[0].id),
    [quantity, setQuantity] = useState(1);
  const variant = product.variants.find((v) => v.id === id)!;
  return (
    <Modal title={product.name} onClose={onClose} wide>
      <div className="detail-grid">
        <ProductGallery product={product} />
        <div className="detail-copy">
          <p className="eyebrow">{product.category}</p>
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <label className="field">
            Choose your size
            <select value={id} onChange={(e) => setId(e.target.value)}>
              {product.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label} · {money(priceOf(v))}
                </option>
              ))}
            </select>
          </label>
          <div className="detail-price">
            <Price variant={variant} />
            <span>per {variant.label}</span>
          </div>
          <div className="ingredient-box">
            <h4>
              {product.ingredientsVerified
                ? "Ingredients"
                : "Likely ingredients · not yet verified"}
            </h4>
            <p>
              {product.ingredients || "Please ask us for ingredients in chat."}
            </p>
            <h4>
              {product.ingredientsVerified
                ? "Allergens"
                : "Possible allergens · please confirm"}
            </h4>
            <p>
              {product.allergens || "Please check with us before ordering."}
            </p>
            {!product.ingredientsVerified && (
              <small>
                These notes are estimates. Please confirm ingredients and any
                allergy concerns with Mama before ordering.
              </small>
            )}
          </div>
          <div className="detail-actions">
            <Quantity
              value={quantity}
              name={product.name}
              onChange={setQuantity}
              min={1}
            />
            <button
              className="button"
              disabled={!product.available}
              onClick={() => onAdd(variant, quantity)}
            >
              {product.available ? "Add to basket" : "Currently unavailable"}
              <Plus size={17} />
            </button>
          </div>
          <small>Made to order. Availability confirmed in WhatsApp.</small>
        </div>
      </div>
    </Modal>
  );
}
function Quantity({
  value,
  name,
  onChange,
  min = 0,
}: {
  value: number;
  name: string;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div className="quantity">
      <button
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={`Decrease ${name} quantity`}
      >
        <Minus size={14} />
      </button>
      <span aria-label={`${name} quantity`}>{value}</span>
      <button
        disabled={value >= 99}
        onClick={() => onChange(Math.min(99, value + 1))}
        aria-label={`Increase ${name} quantity`}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
function Basket({
  basket,
  products,
  setProducts,
  setBasket,
  onClose,
}: {
  basket: BasketItem[];
  products: Product[];
  setProducts: (p: Product[]) => void;
  setBasket: React.Dispatch<React.SetStateAction<BasketItem[]>>;
  onClose: () => void;
}) {
  const [details, setDetails] = useState<OrderDetails>({
      name: "",
      method: "collection",
      date: "",
      address: "",
      notes: "",
    }),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [copied, setCopied] = useState(false),
    [changed, setChanged] = useState(false);
  const lines = resolveBasket(basket, products);
  const subtotal = lines.reduce((s, i) => s + i.total, 0);
  const message = orderMessage(basket, products, details);
  const unavailable = basket.length - lines.length;
  function update(productId: string, variantId: string, quantity: number) {
    setReview(false);
    setBasket((prev) =>
      prev
        .map((i) =>
          i.productId === productId && i.variantId === variantId
            ? { ...i, quantity }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }
  async function prepare(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (details.date < singaporeToday())
        throw Error("Please choose today or a future date.");
      const response = await fetch("/api/catalog", { cache: "no-store" });
      if (!response.ok)
        throw Error("We couldn’t check the latest menu. Please try again.");
      const data = await response.json();
      const before = JSON.stringify(
        lines.map((i) => [
          i.product.name,
          i.variant.label,
          i.quantity,
          priceOf(i.variant),
        ]),
      );
      const after = JSON.stringify(
        resolveBasket(basket, data.products).map((i) => [
          i.product.name,
          i.variant.label,
          i.quantity,
          priceOf(i.variant),
        ]),
      );
      setProducts(data.products);
      setChanged(before !== after);
      if (before !== after) {
        setError(
          "The menu has changed. Please review your basket and subtotal, then prepare your message again.",
        );
        return;
      }
      if (!lines.length) throw Error("Add a bake to your basket first.");
      setReview(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Your basket" onClose={onClose}>
      <div className="basket-content">
        <p className="eyebrow">YOUR ORDER ENQUIRY</p>
        <h2>
          Your basket
          <span className="basket-flower">
            <Flower2 strokeWidth={1} />
          </span>
        </h2>
        {!lines.length ? (
          <div className="empty-basket">
            <ShoppingBag size={44} strokeWidth={1} />
            <h3>Something lovely belongs here.</h3>
            <p>Pick a few favourites and we’ll take it from there.</p>
            <button className="button" onClick={onClose}>
              Explore the bakes <ArrowRight size={17} />
            </button>
          </div>
        ) : (
          <>
            <p className="basket-intro">
              An order enquiry, made easy. Mama will confirm the little details
              with you in chat.
            </p>
            <div className="basket-lines">
              {lines.map((i) => (
                <div
                  className="basket-line"
                  key={`${i.productId}-${i.variantId}`}
                >
                  <Photo product={i.product} />
                  <div>
                    <h4>{i.product.name}</h4>
                    <p>{i.variant.label}</p>
                    <Quantity
                      value={i.quantity}
                      name={i.product.name}
                      onChange={(q) => update(i.productId, i.variantId, q)}
                    />
                  </div>
                  <div className="line-end">
                    <strong>{money(i.total)}</strong>
                    <button
                      className="remove-button"
                      onClick={() => update(i.productId, i.variantId, 0)}
                      aria-label={`Remove ${i.product.name}`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {unavailable > 0 && (
              <p className="notice">
                {unavailable} unavailable selection(s) have been excluded from
                your enquiry.
              </p>
            )}
            <form onSubmit={prepare}>
              <h3 className="basket-subheading">The little details</h3>
              <label className="field">
                Your name
                <input
                  required
                  maxLength={80}
                  autoComplete="given-name"
                  value={details.name}
                  onChange={(e) => {
                    setReview(false);
                    setDetails({ ...details, name: e.target.value });
                  }}
                  placeholder="So we know who we’re baking for"
                />
              </label>
              <fieldset className="fulfilment">
                <legend>How would you like your order?</legend>
                {(["collection", "delivery"] as const).map((method) => (
                  <label
                    key={method}
                    className={details.method === method ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={method}
                      checked={details.method === method}
                      onChange={() => {
                        setReview(false);
                        setDetails({ ...details, method });
                      }}
                    />
                    {method === "collection" ? (
                      <MapPin size={19} />
                    ) : (
                      <Truck size={19} />
                    )}
                    <span>
                      <strong>
                        {method === "collection"
                          ? "Self-collection"
                          : "Delivery"}
                      </strong>
                      <small>
                        {method === "collection"
                          ? "Pasir Ris · free"
                          : "Fee confirmed in chat"}
                      </small>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="field">
                Preferred{" "}
                {details.method === "collection" ? "collection" : "delivery"}{" "}
                date
                <input
                  type="date"
                  required
                  min={singaporeToday()}
                  value={details.date}
                  onChange={(e) => {
                    setReview(false);
                    setDetails({ ...details, date: e.target.value });
                  }}
                />
                <small>
                  We’ll check this date with Mama before confirming.
                </small>
              </label>
              {details.method === "delivery" && (
                <label className="field">
                  Delivery area or postal code
                  <input
                    required
                    maxLength={200}
                    value={details.address}
                    onChange={(e) => {
                      setReview(false);
                      setDetails({ ...details, address: e.target.value });
                    }}
                    placeholder="e.g. Tampines, 520123"
                  />
                  <small>This helps us work out the delivery fee.</small>
                </label>
              )}
              <label className="field">
                Anything else? <span className="optional">(optional)</span>
                <textarea
                  rows={3}
                  maxLength={800}
                  value={details.notes}
                  onChange={(e) => {
                    setReview(false);
                    setDetails({ ...details, notes: e.target.value });
                  }}
                  placeholder="Preferred timing, a special occasion, or questions about ingredients…"
                />
              </label>
              <div className="totals">
                <div>
                  <span>Items subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div>
                  <span>
                    {details.method === "collection"
                      ? "Self-collection"
                      : "Delivery"}
                  </span>
                  <span>
                    {details.method === "collection"
                      ? "Free"
                      : "To be confirmed"}
                  </span>
                </div>
                <small>
                  {details.method === "delivery"
                    ? "Delivery is not included in the subtotal. We’ll confirm the final amount before payment."
                    : "Payment is arranged in chat after we confirm your order."}
                </small>
              </div>
              {error && (
                <p role="alert" className="notice error">
                  {error}
                </p>
              )}
              {!review ? (
                <button className="button full" disabled={busy}>
                  {busy
                    ? "Checking the latest menu…"
                    : "Prepare my WhatsApp message"}
                  <ArrowRight size={18} />
                </button>
              ) : (
                <div className="message-review">
                  <h3>Your message is ready.</h3>
                  <p>
                    Check it below, then open WhatsApp and tap send. Your order
                    is confirmed only after we reply.
                  </p>
                  <details>
                    <summary>
                      Preview order message <ChevronDown size={16} />
                    </summary>
                    <pre>{message}</pre>
                  </details>
                  <a
                    className="button full whatsapp-button"
                    href={whatsappLink(message)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={18} /> Open WhatsApp{" "}
                    <ArrowUpRight size={18} />
                  </a>
                  <button
                    type="button"
                    className="copy-button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(message);
                        setCopied(true);
                      } catch {
                        setError(
                          "Copy isn’t available in this browser. Open the preview above to select your message.",
                        );
                      }
                    }}
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
                    {copied ? "Copied!" : "Copy message instead"}
                  </button>
                </div>
              )}
              <p className="privacy-note">
                Your details stay in this page until you choose to open
                WhatsApp. No payment is taken here.
              </p>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}
