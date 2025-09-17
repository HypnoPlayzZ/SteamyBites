import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

// Import your existing modrels and middleware...
// (OrderItemSchema, OrderSchema, MenuItemSchema, UserSchema, ComplaintSchema, authMiddleware, adminMiddleware)

const app = express();
const PORT = process.env.PORT || 8080; // Elastic Beanstalk provides the port via env

// A More Robust CORS Configuration
const allowedOrigins = [
    'https://joyful-torrone-d48c21.netlify.app', // Your Netlify URL
    // You can add other URLs here if needed
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Database Connection ---
const connection_url = process.env.CONNECTION_URL;
mongoose.connect(connection_url)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.error("MongoDB connection error:", err));

// --- NEW: Health Check Route ---
// This route will respond to the AWS health checker
app.get('/', (req, res) => {
  res.status(200).send('Server is healthy and running.');
});

// --- Your Existing API Routes ---
// (Your /api/menu, /api/orders, /api/auth/*, /api/admin/* routes go here)
// ...

// Seed admin user logic...
// ...

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

