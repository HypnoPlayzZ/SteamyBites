import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const port = 8001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
const connection_url = 'mongodb+srv://amplify:22453372@chetanbackend.rckxgtc.mongodb.net/?retryWrites=true&w=majority&appName=ChetanBackend'; // Replace with your MongoDB connection string
mongoose.connect(connection_url, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
  seedDatabase(); // Seed the database once connected
});

// --- Database Schemas ---
const menuItemSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    imageUrl: String,
});
const MenuItem = mongoose.model('MenuItem', menuItemSchema);

const orderSchema = new mongoose.Schema({
    items: [{
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
        quantity: Number,
    }],
    totalPrice: Number,
    customerName: String,
    status: { type: String, default: 'Received' }, // e.g., 'Received', 'Preparing', 'Out for Delivery', 'Completed'
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

// --- Database Seeding ---
const seedDatabase = async () => {
    const count = await MenuItem.countDocuments();
    if (count === 0) {
        console.log('No menu items found. Seeding database...');
        const items = [
            { name: 'Spicy Ramen', description: 'Rich pork broth with spicy miso, chashu pork, and a soft-boiled egg.', price: 14.99, imageUrl: 'https://placehold.co/600x400/F44336/FFFFFF?text=Ramen' },
            { name: 'Classic Burger', description: 'Juicy beef patty with lettuce, tomato, onion, and our special sauce.', price: 12.50, imageUrl: 'https://placehold.co/600x400/FF9800/FFFFFF?text=Burger' },
            { name: 'Margherita Pizza', description: 'Fresh mozzarella, San Marzano tomatoes, and basil on a crispy crust.', price: 16.00, imageUrl: 'https://placehold.co/600x400/4CAF50/FFFFFF?text=Pizza' },
            { name: 'Sushi Platter', description: 'A selection of fresh nigiri and maki rolls.', price: 22.00, imageUrl: 'https://placehold.co/600x400/2196F3/FFFFFF?text=Sushi' },
            { name: 'Caesar Salad', description: 'Crisp romaine lettuce with parmesan, croutons, and Caesar dressing.', price: 9.75, imageUrl: 'https://placehold.co/600x400/8BC34A/FFFFFF?text=Salad' },
            { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a gooey molten center, served with vanilla ice cream.', price: 8.50, imageUrl: 'https://placehold.co/600x400/795548/FFFFFF?text=Cake' },
        ];
        await MenuItem.insertMany(items);
        console.log('Database seeded with menu items.');
    }
};

// --- API Endpoints ---

// -- Menu Endpoints --
app.get('/api/menu', async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/menu', async (req, res) => {
    const menuItem = new MenuItem({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        imageUrl: req.body.imageUrl,
    });
    try {
        const newMenuItem = await menuItem.save();
        res.status(201).json(newMenuItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.patch('/api/menu/:id', async (req, res) => {
    try {
        const updatedMenuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMenuItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json(updatedMenuItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/menu/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json({ message: 'Menu item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// -- Order Endpoints --
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('items.menuItemId').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const order = new Order({
        items: req.body.items,
        totalPrice: req.body.totalPrice,
        customerName: req.body.customerName,
    });
    try {
        const newOrder = await order.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.patch('/api/orders/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        ).populate('items.menuItemId');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// --- Start Server ---
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

