// Seed the products collection.
// Pulls the original DummyJSON catalog (so the storefront looks like the
// frontend's original demo) and prepends a few "A R T. Gallery" branded products.
//
// Run with: npm run seed
import mongoose from "mongoose";
import Product from "./models/Product.js";

const uri = process.env.MONGODB_URI.replace(
  "<db_password>",
  process.env.DATABASE_PASSWORD || ""
);

// A R T. Gallery house brand — shown first and matched by the `art` category filter.
const HOUSE_PRODUCTS = [
  {
    title: "A R T. Gallery Signature Wool Coat",
    description:
      "A timeless tailored wool coat from the A R T. Gallery house line. Cut from Italian wool with a clean minimalist silhouette.",
    price: 320,
    discountPercentage: 12,
    rating: 4.9,
    stock: 24,
    brand: "A R T. Gallery",
    category: "art",
    thumbnail:
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&q=80&w=800",
    ],
  },
  {
    title: "A R T. Gallery Heritage Leather Bag",
    description:
      "Full-grain leather weekender, hand-finished. The A R T. Gallery Heritage line — built to age beautifully.",
    price: 245,
    discountPercentage: 0,
    rating: 4.8,
    stock: 40,
    brand: "A R T. Gallery",
    category: "art",
    thumbnail:
      "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=800",
    ],
  },
  {
    title: "A R T. Gallery Minimalist Sneakers",
    description:
      "Clean white leather sneakers with a cupsole construction. Everyday A R T. Gallery essentials.",
    price: 140,
    discountPercentage: 15,
    rating: 4.7,
    stock: 60,
    brand: "A R T. Gallery",
    category: "art",
    thumbnail:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800",
    ],
  },
  {
    title: "A R T. Gallery Cashmere Knit",
    description:
      "Pure cashmere crew-neck in a relaxed fit. Soft, warm, and endlessly wearable.",
    price: 185,
    discountPercentage: 8,
    rating: 4.85,
    stock: 35,
    brand: "A R T. Gallery",
    category: "art",
    thumbnail:
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=800",
    ],
  },
  {
    title: "A R T. Gallery Tailored Trousers",
    description:
      "Slim tapered trousers in a stretch-wool blend. A modern wardrobe staple from A R T. Gallery.",
    price: 120,
    discountPercentage: 0,
    rating: 4.6,
    stock: 50,
    brand: "A R T. Gallery",
    category: "art",
    thumbnail:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=800",
    ],
  },
  {
    title: "A R T. Gallery Classic Chronograph",
    description:
      "A refined stainless-steel chronograph with a sapphire crystal face. The A R T. Gallery timepiece.",
    price: 410,
    discountPercentage: 20,
    rating: 4.95,
    stock: 18,
    brand: "A R T. Gallery",
    category: "art",
    thumbnail:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800",
    images: [
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=800",
    ],
  },
];

async function fetchDummyProducts() {
  try {
    const res = await fetch("https://dummyjson.com/products?limit=100");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return (json.products || []).map((p) => ({
      title: p.title,
      description: p.description,
      price: p.price,
      discountPercentage: p.discountPercentage,
      rating: p.rating,
      stock: p.stock,
      brand: p.brand,
      category: p.category,
      thumbnail: p.thumbnail,
      images: p.images,
    }));
  } catch (err) {
    console.warn(
      `Could not fetch DummyJSON catalog (${err.message}). Seeding A R T. Gallery products only.`
    );
    return [];
  }
}

async function run() {
  await mongoose.connect(uri, { family: 4 });
  console.log(`Connected to ${mongoose.connection.host}`);

  const dummy = await fetchDummyProducts();
  await Product.deleteMany({});
  const inserted = await Product.insertMany([...HOUSE_PRODUCTS, ...dummy]);

  console.log(
    `Seeded ${inserted.length} products (${HOUSE_PRODUCTS.length} A R T. Gallery + ${dummy.length} catalog).`
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
