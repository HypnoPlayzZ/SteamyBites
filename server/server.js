import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const PORT = 8001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
const MONGO_URI = 'mongodb+srv://steamybites:steamybites@cluster0.your-cluster-url.mongodb.net/restaurant?retryWrites=true&w=majority'.replace(
    'mongodb+srv://steamybites:steamybites@cluster0.your-cluster-url.mongodb.net',
    'mongodb://127.0.0.1:27017' // Replace with your actual local or Atlas connection string
);

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected successfully');
        seedDatabase();
    })
    .catch(err => console.error('MongoDB connection error:', err));


// --- Mongoose Schemas & Models ---
const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: {
        half: { type: Number, required: true },
        full: { type: Number, required: true }
    },
    imageUrl: String
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

const orderSchema = new mongoose.Schema({
    items: [{
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
        quantity: { type: Number, required: true },
        variant: { type: String, required: true, enum: ['half', 'full'] }, // half or full
        priceAtOrder: { type: Number, required: true } // Price of the variant at the time of order
    }],
    totalPrice: { type: Number, required: true },
    customerName: { type: String, required: true },
    status: { type: String, default: 'Received' },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);


// --- Database Seeding ---
const seedDatabase = async () => {
    const count = await MenuItem.countDocuments();
    if (count === 0) {
        console.log('No menu items found. Seeding database...');
        const items = [
            { name: 'Classic Burger', description: 'A juicy beef patty with fresh lettuce, tomato, and our special sauce.', price: { half: 7.99, full: 12.99 }, imageUrl: 'https://placehold.co/600x400/F44336/FFFFFF?text=Burger' },
            { name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, tomatoes, and basil.', price: { half: 9.50, full: 15.50 }, imageUrl: 'https://placehold.co/600x400/4CAF50/FFFFFF?text=Pizza' },
            { name: 'Caesar Salad', description: 'Crisp romaine lettuce, parmesan cheese, croutons, and Caesar dressing.', price: { half: 6.00, full: 9.75 }, imageUrl: 'https://placehold.co/600x400/FFC107/FFFFFF?text=Salad' },
            { name: 'Spaghetti Carbonara', description: 'Pasta with a creamy egg-based sauce, pancetta, and pecorino cheese.', price: { half: 8.50, full: 14.25 }, imageUrl: 'https://placehold.co/600x400/9C27B0/FFFFFF?text=Pasta' },
            { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a gooey molten center.', price: { half: 4.99, full: 7.99 }, imageUrl: 'https://placehold.co/600x400/795548/FFFFFF?text=Cake' },
            { name: 'Iced Coffee', description: 'Chilled coffee served over ice, perfect for a warm day.', price: { half: 2.50, full: 4.50 }, imageUrl: 'https://placehold.co/600x400/03A9F4/FFFFFF?text=Coffee' },
        ];
        await MenuItem.insertMany(items);
        console.log('Database seeded with 6 items.');
    }
};


// --- API Routes ---

// GET all menu items
app.get('/api/menu', async (req, res) => {
    try {
        const items = await MenuItem.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST a new menu item
app.post('/api/menu', async (req, res) => {
    const { name, description, price, imageUrl } = req.body;
    if (!name || !description || !price || price.half === undefined || price.full === undefined) {
        return res.status(400).json({ message: 'Name, description, and both half/full prices are required.' });
    }
    const newItem = new MenuItem({ name, description, price, imageUrl });
    try {
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH (update) a menu item
app.patch('/api/menu/:id', async (req, res) => {
    try {
        const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a menu item
app.delete('/api/menu/:id', async (req, res) => {
    try {
        const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// GET all orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('items.menuItemId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST a new order
app.post('/api/orders', async (req, res) => {
    const newOrder = new Order(req.body);
    try {
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// PATCH (update) an order status
app.patch('/api/orders/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('items.menuItemId');
        if (!updatedOrder) return res.status(404).json({ message: 'Order not found' });
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

