import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();
const port = 8001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
const connection_url = 'mongodb+srv://amplify:22453372@chetanbackend.rckxgtc.mongodb.net/?retryWrites=true&w=majority&appName=ChetanBackend';
mongoose.connect(connection_url, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.once('open', () => {
  console.log('MongoDB database connection established successfully');
  seedDatabase(); 
});

// --- Schemas ---
const priceSchema = new mongoose.Schema({
    half: { type: Number, required: true },
    full: { type: Number, required: true }
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: priceSchema,
    imageUrl: String,
});

const orderItemSchema = new mongoose.Schema({
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true },
    variant: { type: String, enum: ['half', 'full'], required: true },
    priceAtOrder: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    items: [orderItemSchema],
    totalPrice: { type: Number, required: true },
    customerName: { type: String, required: true },
    status: { type: String, default: 'Received' },
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
const Order = mongoose.model('Order', orderSchema);


// --- API Routes ---

// GET all menu items
app.get('/api/menu', async (req, res) => {
    try {
        const menuItems = await MenuItem.find();
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST a new menu item
app.post('/api/menu', async (req, res) => {
    const newItem = new MenuItem(req.body);
    try {
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// UPDATE a menu item
app.patch('/api/menu/:id', async (req, res) => {
    try {
        const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedItem) return res.status(404).send('Menu item not found.');
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE a menu item
app.delete('/api/menu/:id', async (req, res) => {
    try {
        const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).send('Menu item not found.');
        res.status(200).json({ message: 'Menu item deleted successfully' });
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

// UPDATE an order status
app.patch('/api/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).send('Order not found.');
        order.status = req.body.status;
        await order.save();
        const populatedOrder = await Order.findById(order._id).populate('items.menuItemId');
        res.json(populatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});


// --- Server ---
app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});

// --- Database Seeding ---
async function seedDatabase() {
    const count = await MenuItem.countDocuments();
    if (count === 0) {
        console.log('No menu items found. Seeding database...');
        const sampleItems = [
          { name: 'Margherita Pizza', description: 'Classic cheese and tomato pizza.', price: { half: 8.99, full: 14.99 }, imageUrl: 'https://placehold.co/600x400/F44336/FFFFFF?text=Pizza' },
          { name: 'Pasta Carbonara', description: 'Creamy pasta with bacon and cheese.', price: { half: 9.50, full: 16.00 }, imageUrl: 'https://placehold.co/600x400/FFEB3B/333333?text=Pasta' },
          { name: 'Caesar Salad', description: 'Fresh salad with Caesar dressing.', price: { half: 6.00, full: 10.50 }, imageUrl: 'https://placehold.co/600x400/4CAF50/FFFFFF?text=Salad' },
          { name: 'Steak Frites', description: 'Grilled steak with a side of fries.', price: { half: 15.00, full: 25.00 }, imageUrl: 'https://placehold.co/600x400/795548/FFFFFF?text=Steak' },
          { name: 'Chocolate Lava Cake', description: 'Warm chocolate cake with a molten center.', price: { half: 5.50, full: 8.99 }, imageUrl: 'https://placehold.co/600x400/607D8B/FFFFFF?text=Cake' },
          { name: 'Lemonade', description: 'Freshly squeezed lemonade.', price: { half: 2.50, full: 4.00 }, imageUrl: 'https://placehold.co/600x400/CDDC39/333333?text=Drink' }
        ];
        await MenuItem.insertMany(sampleItems);
        console.log('Database seeded with sample menu items.');
    }
}

