import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 8001;
const JWT_SECRET = 'your_super_secret_jwt_key_that_is_long_and_secure'; // Use a long, random string in production

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
const MONGO_URI = 'mongodb+srv://kanhaiya:12345@cluster0.pafb9pl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' }
}, {
    timestamps: true,
    collection: 'restaurant_users' // Use a specific collection name
});

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: {
        half: { type: Number, required: true },
        full: { type: Number, required: true }
    },
    imageUrl: { type: String }
});

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        quantity: { type: Number, required: true },
        variant: { type: String, enum: ['half', 'full'], required: true },
        priceAtOrder: { type: Number, required: true }
    }],
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['Received', 'Preparing', 'Out for Delivery', 'Completed'], default: 'Received' },
    customerName: { type: String, required: true } // Keep for display purposes
}, { timestamps: true });

const complaintSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);
const Complaint = mongoose.model('Complaint', complaintSchema);


// --- Seed Admin User ---
const seedAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            console.log('No admin user found, creating one...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            await User.create({
                name: 'Admin',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Default admin created: admin@example.com / password123');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};

// --- Authentication Middleware ---
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user && user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Access denied. Admins only.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during role check.' });
    }
};

// --- API Routes ---

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashedPassword, role: 'customer' });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, role: 'customer' });
        if (!user) return res.status(400).json({ message: 'Invalid credentials or not a customer' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const payload = { id: user.id, name: user.name, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, userName: user.name, userRole: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/admin/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) return res.status(400).json({ message: 'Invalid credentials or not an admin' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const payload = { id: user.id, name: user.name, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, userName: user.name, userRole: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// PUBLIC ROUTES
app.get('/api/menu', async (req, res) => {
    try {
        const items = await MenuItem.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// CUSTOMER ROUTES (Protected)
app.post('/api/orders', auth, async (req, res) => {
    const { items, totalPrice, customerName } = req.body;
    try {
        const newOrder = new Order({
            user: req.user.id,
            items,
            totalPrice,
            customerName
        });
        const order = await newOrder.save();
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

app.get('/api/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('items.menuItemId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/api/complaints', auth, async (req, res) => {
    const { orderId, message } = req.body;
    try {
        const complaint = new Complaint({ user: req.user.id, orderId, message });
        await complaint.save();
        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/my-complaints', auth, async (req, res) => {
    try {
        const complaints = await Complaint.find({ user: req.user.id }).populate('orderId').sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ADMIN ROUTES (Protected by auth and isAdmin middleware)
app.post('/api/admin/register', auth, isAdmin, async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'Admin with this email already exists' });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        user = new User({ name, email, password: hashedPassword, role: 'admin' });
        await user.save();
        res.status(201).json({ message: 'New admin registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/admin/orders', auth, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('items.menuItemId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

app.patch('/api/admin/orders/:id', auth, isAdmin, async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('items.menuItemId');
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

app.post('/api/admin/menu', auth, isAdmin, async (req, res) => {
    try {
        const newItem = new MenuItem(req.body);
        await newItem.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.patch('/api/admin/menu/:id', auth, isAdmin, async (req, res) => {
    try {
        const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/admin/menu/:id', auth, isAdmin, async (req, res) => {
    try {
        await MenuItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

app.get('/api/admin/complaints', auth, isAdmin, async (req, res) => {
    try {
        const complaints = await Complaint.find().populate('user', 'name email').populate('orderId').sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.patch('/api/admin/complaints/:id', auth, isAdmin, async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
            .populate('user', 'name email').populate('orderId');
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    seedAdmin();
});

