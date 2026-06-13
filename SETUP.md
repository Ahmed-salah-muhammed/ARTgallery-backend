# Backend Setup Guide

## Problem: Database Not Connected

Your authentication and product APIs are failing because MongoDB is not configured.

---

## Step 1: Set Up MongoDB Atlas (Free)

### 1.1 Create MongoDB Atlas Account
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free"
3. Sign up with email/Google
4. Create an organization

### 1.2 Create a Cluster
1. Click "Create a Deployment"
2. Choose "Free Tier" (M0)
3. Select region closest to you
4. Click "Create"
5. Wait for cluster to initialize (~3-5 min)

### 1.3 Get Connection String
1. Click "Connect" button on your cluster
2. Choose "Drivers"
3. Copy the connection string (looks like):
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/myDatabase?retryWrites=true&w=majority
   ```

---

## Step 2: Update .env File

### 2.1 Open `.env`
```bash
cd backend
# Edit .env with your values
```

### 2.2 Fill in these values

**Find your connection string and extract:**
- `username` — your MongoDB username
- `password` — your MongoDB password
- `cluster` — your cluster name (cluster0, cluster1, etc.)

**Update .env:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/nosej_shop
DATABASE_PASSWORD=your_password_from_above
JWT_SECRET=super_secret_key_change_this_to_something_random
NODE_ENV=development
```

**Example with real values:**
```env
PORT=5000
MONGODB_URI=mongodb+srv://user123:securepass@cluster0.abc123.mongodb.net/nosej_shop
DATABASE_PASSWORD=securepass
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
NODE_ENV=development
```

### 2.3 Generate a Random JWT_SECRET

Open terminal and run:
```bash
# macOS/Linux
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToHexString((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

Copy the output and paste into `JWT_SECRET=...`

---

## Step 3: Start Backend Server

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev

# You should see:
# Server running on port 5000
# MongoDB connected: cluster0.xxxxx.mongodb.net
```

---

## Step 4: Seed Database with Test Products (Optional)

Create test products for testing the shop API:

### 4.1 Create a seed script
Create `backend/seed.js`:

```javascript
import mongoose from "mongoose";
import Product from "./models/Product.js";
import connectDB from "./config/db.js";

const products = [
  {
    title: "Wireless Headphones",
    description: "Premium noise-cancelling headphones",
    price: 129.99,
    discountPercentage: 10,
    rating: 4.8,
    stock: 50,
    brand: "AudioTech",
    category: "electronics",
    thumbnail: "https://via.placeholder.com/300?text=Headphones",
    images: ["https://via.placeholder.com/300?text=Headphones"],
  },
  {
    title: "Smart Watch",
    description: "Fitness tracking and notifications",
    price: 199.99,
    discountPercentage: 15,
    rating: 4.5,
    stock: 30,
    brand: "TechBrand",
    category: "electronics",
    thumbnail: "https://via.placeholder.com/300?text=SmartWatch",
    images: ["https://via.placeholder.com/300?text=SmartWatch"],
  },
  {
    title: "Blue Jacket",
    description: "Comfortable winter jacket",
    price: 79.99,
    discountPercentage: 20,
    rating: 4.6,
    stock: 45,
    brand: "FashionBrand",
    category: "men's clothing",
    thumbnail: "https://via.placeholder.com/300?text=Jacket",
    images: ["https://via.placeholder.com/300?text=Jacket"],
  },
  {
    title: "Running Shoes",
    description: "Professional athletic running shoes",
    price: 99.99,
    discountPercentage: 12,
    rating: 4.7,
    stock: 60,
    brand: "SportGear",
    category: "shoes",
    thumbnail: "https://via.placeholder.com/300?text=RunningShoes",
    images: ["https://via.placeholder.com/300?text=RunningShoes"],
  },
  {
    title: "Diamond Necklace",
    description: "Elegant diamond pendant necklace",
    price: 499.99,
    discountPercentage: 5,
    rating: 4.9,
    stock: 20,
    brand: "LuxuryJewels",
    category: "jewelery",
    thumbnail: "https://via.placeholder.com/300?text=Necklace",
    images: ["https://via.placeholder.com/300?text=Necklace"],
  },
];

const seedDB = async () => {
  try {
    await connectDB();
    
    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");
    
    // Insert new products
    const result = await Product.insertMany(products);
    console.log(`✓ Seeded ${result.length} products`);
    
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedDB();
```

### 4.2 Add seed script to package.json

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "seed": "node seed.js"
  }
}
```

### 4.3 Run the seed script

```bash
npm run seed

# You should see:
# Cleared existing products
# ✓ Seeded 5 products
```

---

## Step 5: Test the API

### 5.1 Test Products API
```bash
# Get all products
curl http://localhost:5000/api/products

# Get products by category
curl http://localhost:5000/api/products?category=electronics

# Search products
curl http://localhost:5000/api/products?search=shoes
```

### 5.2 Test Auth API

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "passwordConfirm": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

## Common Issues

### ❌ "MongoDB connected" doesn't appear

**Cause:** .env not properly configured

**Fix:**
1. Check `.env` has correct MONGODB_URI
2. Check DATABASE_PASSWORD matches your MongoDB password
3. Verify your MongoDB user has access to the cluster
4. Ensure IP whitelist allows your IP (usually "Allow access from anywhere")

### ❌ "Cannot find module 'mongoose'"

**Cause:** Dependencies not installed

**Fix:**
```bash
npm install
```

### ❌ Auth returns "Email already in use"

**Cause:** User already exists in database

**Fix:**
- Use a different email for testing, or
- Delete the user via MongoDB Atlas

### ❌ Products API returns empty array

**Cause:** No products in database

**Fix:**
- Run the seed script: `npm run seed`
- Or create products manually

---

## Next Steps

After setup:
1. ✅ Backend should be running on `http://localhost:5000`
2. ✅ Sign up and login should work
3. ✅ Products API should return data
4. ✅ Frontend should connect to backend

Update your frontend's API endpoint if different from `http://localhost:5000/api`

---

## Reference

- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Express Docs](https://expressjs.com/)
