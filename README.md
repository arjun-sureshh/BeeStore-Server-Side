# 🖥️ Beestore - Server Side (Backend)

This is the **backend** of the Beestore fullstack e-commerce web application. It handles user authentication, role-based access control, product management, cart/wishlist logic, and serves RESTful APIs for frontend consumption.

## 🚀 Live Backend

🌐 [https://beestore-server-side-production.up.railway.app](https://beestore-server-side-production.up.railway.app)

---

## 🧰 Tech Stack

- **Node.js**
- **Express.js**
- **TypeScript**
- **MongoDB + Mongoose**
- **JWT Authentication**
- **Cloud File Upload (Multer/Cloudinary if used)**

---

## 📂 Folder Structure

```
/server
├── controllers/       # Business logic (e.g., productController.js)
├── models/            # Mongoose models (User, Product, Cart, etc.)
├── routes/            # Express routes
├── middleware/        # Auth & role-check middleware
├── config/            # DB connection and constants
├── utils/             # Utility functions
├── .env               # Environment variables
└── index.ts           # Entry point
```

---

## 🔐 Authentication & Authorization

- Uses **JWT (JSON Web Token)** for login-based access.
- Middleware to restrict routes based on **user roles** (`user`, `seller`, `admin`).
- Stores JWT in HTTP-only cookies for security.

---

## 🔧 Core Modules

### 👥 User Module
- Register, login, logout
- Wishlist and cart management
- User data stored in MongoDB
- Token-based sessions

### 🛍️ Seller Module
- Add/manage products
- Upload product images (secured)
- Seller account creation
- Data validation via middleware

### 🛠️ Admin Module
- View and manage all users/sellers/products
- Role-based middleware using Express
- Admin dashboard integration-ready

---

## 🔄 RESTful API Structure

| Method | Endpoint                | Description                         |
|--------|-------------------------|-------------------------------------|
| POST   | /api/auth/register      | Register new user/seller            |
| POST   | /api/auth/login         | Login and generate JWT              |
| GET    | /api/products           | Get all products                    |
| POST   | /api/products           | Create product (seller only)        |
| PUT    | /api/products/:id       | Update product                      |
| DELETE | /api/products/:id       | Delete product                      |
| GET    | /api/admin/users        | Admin-only: list all users          |
| PATCH  | /api/users/cart         | Update user's cart                  |
| PATCH  | /api/users/wishlist     | Update user's wishlist              |

> Additional endpoints for file upload, secure updates, and role checks are included.

---

## 📦 Getting Started (Dev)

### 1️⃣ Clone the Repo

```bash
git clone https://github.com/your-username/beestore.git
cd beestore/server
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Set up Environment Variables

Create a `.env` file in the `/server` directory:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### 4️⃣ Run Server

```bash
npm run dev  # for TypeScript with nodemon
```

---

## 📌 Highlights

- Clean modular code using **TypeScript**.
- Scalable and secure **REST API**.
- Middleware-based route protection.
- Easy integration with any React frontend.

---

## 🧪 Future Improvements

- Swagger API Documentation
- Rate limiting / API logging
- OTP login (email/mobile)
- Payment gateway integration (Stripe/Razorpay)

---

## 📬 Contact

**Arjun Suresh**  
📧 arjun410@gmail.com  
🔗 [LinkedIn](https://www.linkedin.com/in/arjun-suresh)

---

## 📄 License

MIT License – free to use, modify, and distribute.
