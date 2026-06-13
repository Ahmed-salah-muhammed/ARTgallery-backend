# Nosej Shop Backend API

A comprehensive Node.js + Express + MongoDB backend for the Nosej e-commerce platform, featuring full authentication, product management, shopping cart, wishlist, and order tracking.

🔗 **Interactive API Documentation**: http://localhost:3000/api-docs (Swagger UI)

---

##  Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file in config/ directory
cp config/.env.example config/.env

# Start development server
npm run dev
```

Server will run on `http://localhost:3000` (configurable via `PORT` in `.env`)

---

##  Project Structure

```
backend/
├── config/
│   ├── db.js                 # MongoDB connection setup
│   ├── swagger.yaml          # API documentation (OpenAPI 3.0)
│   └── .env.example          # Environment template
├── models/
│   ├── User.js               # User schema with password hashing
│   ├── Product.js            # Product catalog schema
│   ├── Cart.js               # Shopping cart schema
│   ├── Wishlist.js           # Wishlist schema
│   └── Order.js              # Order history and tracking
├── controllers/
│   ├── authController.js     # Registration, login, logout
│   ├── productController.js  # Product CRUD & filtering
│   ├── cartController.js     # Cart operations
│   ├── wishlistController.js # Wishlist operations
│   ├── orderController.js    # Order creation & tracking
│   └── userController.js     # User profile management
├── routes/
│   ├── auth.js               # Auth endpoints
│   ├── products.js           # Product endpoints
│   ├── cart.js               # Cart endpoints
│   ├── wishlist.js           # Wishlist endpoints
│   ├── orders.js             # Order endpoints
│   └── users.js              # User endpoints
├── middleware/
│   ├── auth.js               # JWT verification middleware
│   └── errorHandler.js       # Centralized error handling
├── server.js                 # Express app setup & route mounting
└── package.json
```

---

##  Environment Setup

Create `config/.env` with the following variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nosej
DATABASE_PASSWORD=your_password
JWT_SECRET=your_secret_key_here (use: openssl rand -hex 32)

# Server
PORT=3000
NODE_ENV=development
```

---

##  API Endpoints Overview

**Base URL**: `http://localhost:3000/api`

All endpoints are fully documented in **Swagger UI** at `/api-docs` with request/response examples and interactive testing.

###  Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/auth/register` | Register new user | ❌ |
| `POST` | `/auth/login` | Login user | ❌ |
| `POST` | `/auth/logout` | Logout user | ❌ |

 [View in Swagger](http://localhost:3000/api-docs)

---

###  Products

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/products` | Get all products (supports filtering & sorting) | ❌ |
| `GET` | `/products/categories` | Get all categories | ❌ |
| `GET` | `/products/:id` | Get product by ID | ❌ |
| `POST` | `/products` | Create product | ✅ Admin |
| `PUT` | `/products/:id` | Update product | ✅ Admin |
| `DELETE` | `/products/:id` | Delete product | ✅ Admin |

**Query Parameters**: `?category=nosej&search=shirt&sort=price-asc`

📖 [View in Swagger](http://localhost:3000/api-docs)

---

###  Cart (Requires Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/cart` | Get user's cart |
| `POST` | `/cart` | Add item to cart |
| `PUT` | `/cart/:productId` | Update item quantity |
| `DELETE` | `/cart` | Clear entire cart |
| `DELETE` | `/cart/:productId` | Remove item from cart |

 [View in Swagger](http://localhost:3000/api-docs)

---

###  Wishlist (Requires Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/wishlist` | Get user's wishlist |
| `POST` | `/wishlist` | Add product to wishlist |
| `DELETE` | `/wishlist/:productId` | Remove from wishlist |

 [View in Swagger](http://localhost:3000/api-docs)

---

###  Orders (Requires Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/orders` | Create new order |
| `GET` | `/orders/user` | Get user's orders |
| `GET` | `/orders/:id` | Get order details |
| `PUT` | `/orders/:id` | Update order status (Admin) |
| `GET` | `/orders/admin/all` | Get all orders (Admin) |

**Status Flow**: `pending` → `confirmed` → `shipped` → `delivered`

 [View in Swagger](http://localhost:3000/api-docs)

---

###  Users (Requires Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/profile` | Get user profile |
| `PUT` | `/users/profile` | Update user profile |
| `POST` | `/users/change-password` | Change password |
| `DELETE` | `/users/account` | Delete account |

 [View in Swagger](http://localhost:3000/api-docs)

---

##  Authentication

The API uses **JWT (JSON Web Tokens)** for authentication.

### How to Use Protected Endpoints

1. **Login** to get a token via `POST /auth/login`
2. **Include token** in request headers:
   ```
   Authorization: Bearer <your_token_here>
   ```

### Token Details
- **Validity**: 7 days from issue date
- **Format**: JWT (JSON Web Token)
- **Refresh**: Re-login when expired

### Example Usage
```bash
# Login and get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed@example.com","password":"password123"}'

# Use token to access protected endpoint
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <token>"
```

---

##  Data Models

### User
User account with profile, preferences, and address information. Passwords are hashed with bcryptjs.

**Key Fields**: firstName, lastName, email, password, phone, address, role (user|admin)

---

### Product
Product catalog with inventory and pricing details.

**Key Fields**: title, price, description, category, stock, rating, images

---

### Cart
Per-user shopping cart with items and quantities.

**Key Fields**: user, items (array of products + quantities), totalPrice

---

### Wishlist
Per-user list of saved products.

**Key Fields**: user, products (array of product IDs)

---

### Order
Order history with shipping and status tracking.

**Key Fields**: user, items, totalPrice, status, shippingAddress, timestamps

---

##  Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "statusCode": 400
}
```

**Common Status Codes:**
- `200` — Success
- `201` — Created
- `400` — Bad Request (validation error)
- `401` — Unauthorized (missing/invalid token)
- `404` — Not Found
- `500` — Server Error

---

##  Technology Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express | Web framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| CORS | Cross-Origin Requests |
| Swagger UI | API Documentation |
| Nodemon | Dev server with auto-reload |

---

##  Available Scripts

```bash
# Start development server (with file watching)
npm run dev

# Start with nodemon
npm run server

# Start production server
npm start
```

---

##  Full API Documentation

**Visit Swagger UI for complete, interactive API documentation:**

```
http://localhost:3000/api-docs
```

The Swagger interface provides:
- ✅ Detailed endpoint descriptions
- ✅ Request/response schemas
- ✅ Live testing of all endpoints
- ✅ Authentication token management
- ✅ Example requests and responses

---

##  Quick Testing

### Using Swagger UI (Recommended)
1. Open http://localhost:3000/api-docs
2. Click any endpoint to expand it
3. Click **"Try it out"** button
4. Fill in parameters
5. Click **"Execute"** to test

### Using cURL
See full examples in [Swagger UI](#full-api-documentation)

---

##  Debugging

### Enable Logging
Check terminal output while running:
```bash
npm run dev
```

### Common Issues

**"MongoDB connection failed"**
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas IP whitelist
- Confirm username and password

**"Invalid token"**
- Token may have expired (7 days)
- Re-login to get a new token
- Verify header format: `Authorization: Bearer <token>`

---

##  Developer

**Ahmed Salah** — Full-Stack Developer & GIS Developer  
 ahmedsalah219013@gmail.com  
 [github.com/Ahmed-salah-muhammed](https://github.com/Ahmed-salah-muhammed/)

---

##  License

ISC License

---

##  Related

- **Frontend**: [Nosej Frontend](../frontend/README.md)
- **API Docs**: http://localhost:3000/api-docs
- **Live Demo**: https://nosej.netlify.app/
