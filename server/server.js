import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 8001;
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://amplify:22453372@chetanbackend.rckxgtc.mongodb.net/?retryWrites=true&w=majority&appName=ChetanBackend';
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';

app.use(cors({
  origin: 'https://clever-kitten-342f9e.netlify.app/#/' // <-- Your live Netlify URL
}));

app.use(express.json());

// --- Database Connection ---
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected successfully');
        seedAdminUser();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const PriceSchema = new mongoose.Schema({
    half: { type: Number, required: true },
    full: { type: Number, required: true }
}, { _id: false });

const MenuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: PriceSchema, required: true },
    imageUrl: { type: String, default: '' },
});

const OrderItemSchema = new mongoose.Schema({
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true },
    variant: { type: String, enum: ['half', 'full'], required: true },
    priceAtOrder: { type: Number, required: true },
    instructions: { type: String, default: '' } // <-- NEW FIELD
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    totalPrice: { type: Number, required: true },
    customerName: { type: String, required: true }, // Keep for display purposes
    status: { type: String, default: 'Received', enum: ['Received', 'Preparing', 'Out for Delivery', 'Completed'] },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer', enum: ['customer', 'admin'] }
}, { collection: 'users_v2' }); // Use a new collection


const ComplaintSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Resolved'] }
}, { timestamps: true });


const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
const Order = mongoose.model('Order', OrderSchema);
const User = mongoose.model('User', UserSchema);
const Complaint = mongoose.model('Complaint', ComplaintSchema);


// --- Middleware ---
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const adminMiddleware = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user && user.role === 'admin') {
            next();
        } else {
            res.status(403).json({ message: 'Admin access required' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error verifying admin role' });
    }
};


// --- API Routes ---

// Public Routes
app.get('/api/menu', async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: '1d' });
        res.json({ token, userName: user.name, userRole: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/api/auth/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'admin' });
        if (!user) return res.status(404).json({ message: 'Admin not found' });
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });
        const token = jwt.sign({ userId: user._id, role: user.role }, jwtSecret, { expiresIn: '1d' });
        res.json({ token, userName: user.name, userRole: user.role });
    } catch (error) {
        res.status(500).json({ message: 'Server error during admin login' });
    }
});


// Customer Routes (Protected)
app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        const newOrder = new Order({ ...req.body, user: req.user.userId });
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error placing order', error: error.message });
    }
});
app.get('/api/my-orders', authMiddleware, async (req, res) => {
    const orders = await Order.find({ user: req.user.userId }).populate('items.menuItemId').sort({ createdAt: -1 });
    res.json(orders);
});
app.post('/api/complaints', authMiddleware, async (req, res) => {
    const complaint = new Complaint({ ...req.body, user: req.user.userId });
    await complaint.save();
    res.status(201).json(complaint);
});
app.get('/api/my-complaints', authMiddleware, async (req, res) => {
    const complaints = await Complaint.find({ user: req.user.userId }).populate('orderId').sort({ createdAt: -1 });
    res.json(complaints);
});


// Admin Routes (Protected)
app.use('/api/admin', authMiddleware, adminMiddleware); // Protect all following admin routes

app.post('/api/admin/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Admin user with this email already exists' });
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ name, email, password: hashedPassword, role: 'admin' });
        await newUser.save();
        res.status(201).json({ message: 'Admin user registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering admin user' });
    }
});
app.get('/api/admin/orders', async (req, res) => {
    const orders = await Order.find().populate('items.menuItemId').sort({ createdAt: -1 });
    res.json(orders);
});
app.patch('/api/admin/orders/:id', async (req, res) => {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('items.menuItemId');
    res.json(updatedOrder);
});
app.post('/api/admin/menu', async (req, res) => {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    res.status(201).json(newItem);
});
app.patch('/api/admin/menu/:id', async (req, res) => {
    const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
});
app.delete('/api/admin/menu/:id', async (req, res) => {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu item deleted' });
});
app.get('/api/admin/complaints', async (req, res) => {
    const complaints = await Complaint.find().populate('user', 'name email').populate('orderId', 'createdAt').sort({ createdAt: -1 });
    res.json(complaints);
});
app.patch('/api/admin/complaints/:id', async (req, res) => {
    const updatedComplaint = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('user', 'name email').populate('orderId', 'createdAt');
    res.json(updatedComplaint);
});


// --- Server Start ---
app.listen(port, () => console.log(`Server running on port ${port}`));

// Seed initial admin user
const seedAdminUser = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            console.log('No admin user found, creating one...');
            const hashedPassword = await bcrypt.hash('password123', 12);
            const admin = new User({
                name: 'Admin',
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin'
            });
            await admin.save();
            console.log('Default admin user created: admin@example.com / password123');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};

