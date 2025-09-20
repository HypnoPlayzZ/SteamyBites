import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import csv from 'csv-parser';
import stream from 'stream';

// --- Configuration ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'steamy-bites-menu',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const imageUpload = multer({ storage: imageStorage });
const csvUpload = multer({ storage: multer.memoryStorage() });

const app = express();
const port = process.env.PORT || 8001;
const mongoURI = process.env.MONGODB_URI
const jwtSecret = process.env.JWT_SECRET
app.use(cors());
app.use(express.json());

// --- Database Connection ---
mongoose.connect(mongoURI)
    .then(() => {
        console.log('MongoDB connected successfully');
        seedAdminUser();
    })
    .catch(err => console.error('MongoDB connection error:', err));

// --- Mongoose Schemas ---
const PriceSchema = new mongoose.Schema({
    half: { type: Number },
    full: { type: Number, required: true }
}, { _id: false });

const MenuItemSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    price: { type: PriceSchema, required: true },
    imageUrl: { type: String, default: '' },
    category: { type: String, required: true, trim: true, default: 'Uncategorized' },
    position: { type: Number, default: 0 }
});

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    position: { type: Number, required: true, default: 0 }
});

const OrderItemSchema = new mongoose.Schema({
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true },
    variant: { type: String, enum: ['half', 'full'], required: true },
    priceAtOrder: { type: Number, required: true },
    instructions: { type: String, default: '' }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [OrderItemSchema],
    totalPrice: { type: Number, required: true },
    finalPrice: { type: Number, required: true },
    appliedCoupon: {
        code: String,
        discountType: String,
        discountValue: Number
    },
    customerName: { type: String, required: true },
    address: { type: String, required: true },
    status: { type: String, default: 'Received', enum: ['Received', 'Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Rejected'] },
    isAcknowledged: { type: Boolean, default: false },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'customer', enum: ['customer', 'admin'] }
}, { collection: 'users_v2' });


const ComplaintSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Resolved'] }
}, { timestamps: true });

const CouponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String, required: true },
    discountType: { type: String, required: true, enum: ['percentage', 'fixed'] },
    discountValue: { type: Number, required: true },
    isActive: { type: Boolean, default: true }
});

const MenuItem = mongoose.model('MenuItem', MenuItemSchema);
const Category = mongoose.model('Category', CategorySchema);
const Order = mongoose.model('Order', OrderSchema);
const User = mongoose.model('User', UserSchema);
const Complaint = mongoose.model('Complaint', ComplaintSchema);
const Coupon = mongoose.model('Coupon', CouponSchema);

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

// Health Check for AWS
app.get('/', (req, res) => {
  res.status(200).send('Server is healthy and running.');
});

// --- API Routes ---

// Public Routes
app.get('/api/menu', async (req, res) => {
    try {
        const categories = await Category.find().sort({ position: 'asc' });
        const menuItems = await MenuItem.find().sort({ position: 'asc' });

        const categorizedMenu = categories.map(category => ({
            name: category.name,
            items: menuItems.filter(item => item.category === category.name)
        }));
        
        const uncategorizedItems = menuItems.filter(item => !categories.some(c => c.name === item.category));
        if (uncategorizedItems.length > 0) {
            categorizedMenu.push({ name: 'Uncategorized', items: uncategorizedItems });
        }

        res.json(categorizedMenu);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
});


app.get('/api/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find({ isActive: true });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching coupons' });
    }
});

app.post('/api/coupons/validate', async (req, res) => {
    try {
        const { code, cartTotal } = req.body;
        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid or expired coupon code.' });
        }

        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (cartTotal * coupon.discountValue) / 100;
        } else {
            discountAmount = coupon.discountValue;
        }

        const finalPrice = Math.max(0, cartTotal - discountAmount);

        res.json({
            message: 'Coupon applied successfully!',
            discountAmount,
            finalPrice,
            coupon
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during coupon validation.' });
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


// --- Admin Router ---
const adminRouter = express.Router();
app.use('/api/admin', authMiddleware, adminMiddleware, adminRouter);

adminRouter.post('/register', async (req, res) => {
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

adminRouter.get('/orders', async (req, res) => {
    const orders = await Order.find().populate('items.menuItemId').sort({ createdAt: -1 });
    res.json(orders);
});

adminRouter.patch('/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Preparing', 'Ready', 'Out for Delivery', 'Delivered', 'Rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status update.' });
        }
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('items.menuItemId');
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error updating order status' });
    }
});

adminRouter.patch('/orders/:id/acknowledge', async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { isAcknowledged: true }, { new: true }).populate('items.menuItemId');
        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error acknowledging order' });
    }
});

const ensureCategoryExists = async (categoryName) => {
    if (!categoryName) return;
    const existingCategory = await Category.findOne({ name: categoryName });
    if (!existingCategory) {
        const maxPos = await Category.findOne().sort({ position: -1 });
        const newPosition = maxPos ? maxPos.position + 1 : 0;
        const newCategory = new Category({ name: categoryName, position: newPosition });
        await newCategory.save();
    }
};

adminRouter.post('/menu', imageUpload.single('image'), async (req, res) => {
    try {
        const { name, description, priceHalf, priceFull, category } = req.body;
        await ensureCategoryExists(category);
        const lastItem = await MenuItem.findOne({ category }).sort({ position: -1 });
        const newPosition = lastItem ? lastItem.position + 1 : 0;
        
        const newMenuItem = new MenuItem({
            name,
            description,
            price: { 
                half: parseFloat(priceHalf) || undefined, 
                full: parseFloat(priceFull) 
            },
            imageUrl: req.file ? req.file.path : '',
            category,
            position: newPosition,
        });
        await newMenuItem.save();
        res.status(201).json(newMenuItem);
    } catch (error) {
        res.status(400).json({ message: 'Error creating menu item', error: error.message });
    }
});

adminRouter.patch('/menu/reorder', async (req, res) => {
    try {
        const { category, orderedIds } = req.body;
        const bulkOps = orderedIds.map((id, index) => ({
            updateOne: {
                filter: { _id: id, category: category },
                update: { $set: { position: index } }
            }
        }));
        await MenuItem.bulkWrite(bulkOps);
        res.status(200).json({ message: 'Menu order updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reorder menu items.' });
    }
});

adminRouter.patch('/categories/reorder', async (req, res) => {
    try {
        const { orderedCategoryNames } = req.body;
        const bulkOps = orderedCategoryNames.map((name, index) => ({
            updateOne: {
                filter: { name: name },
                update: { $set: { position: index } }
            }
        }));
        await Category.bulkWrite(bulkOps);
        res.status(200).json({ message: 'Category order updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reorder categories.' });
    }
});

adminRouter.patch('/menu/:id', imageUpload.single('image'), async (req, res) => {
    try {
        const { name, description, priceHalf, priceFull, category, imageUrl: existingImageUrl } = req.body;
        await ensureCategoryExists(category);
        const updateData = {
            name,
            description,
            category,
            price: { 
                half: parseFloat(priceHalf) || undefined,
                full: parseFloat(priceFull) 
            },
        };

        if (req.file) {
            updateData.imageUrl = req.file.path;
        } else {
            updateData.imageUrl = existingImageUrl;
        }

        const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedItem) return res.status(404).json({ message: 'Menu item not found' });
        res.json(updatedItem);
    } catch (error) {
        res.status(400).json({ message: 'Error updating menu item', error: error.message });
    }
});

adminRouter.delete('/menu/:id', async (req, res) => {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Menu item deleted' });
});

adminRouter.get('/complaints', async (req, res) => {
    const complaints = await Complaint.find().populate('user', 'name email').populate('orderId', 'createdAt').sort({ createdAt: -1 });
    res.json(complaints);
});

adminRouter.patch('/complaints/:id', async (req, res) => {
    const updatedComplaint = await Complaint.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).populate('user', 'name email').populate('orderId', 'createdAt');
    res.json(updatedComplaint);
});

adminRouter.post('/menu/upload-csv', csvUpload.single('csvFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No CSV file uploaded.');
    }

    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    bufferStream
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            let updatedCount = 0;
            let createdCount = 0;

            for (const row of results) {
                try {
                    const name = row['Item'];
                    const category = row['Category'] || 'Uncategorized';
                    await ensureCategoryExists(category);
                    const priceFullText = row['Full'] || row['Item Price'];
                    const priceHalfText = row['Half'];

                    if (!name || !priceFullText) continue;
                    
                    const priceFull = parseFloat(priceFullText);
                    if (isNaN(priceFull)) continue;
                    
                    const priceHalf = parseFloat(priceHalfText);
                    
                    const existingItem = await MenuItem.findOne({ name: name });
                    
                    if (existingItem) {
                        const updatePayload = {
                            'price.full': priceFull,
                            category: category,
                        };
                        if (!isNaN(priceHalf)) {
                            updatePayload['price.half'] = priceHalf;
                        } else {
                            await MenuItem.updateOne({ _id: existingItem._id }, { $unset: { 'price.half': "" } });
                        }
                        await MenuItem.updateOne({ _id: existingItem._id }, { $set: updatePayload });
                        updatedCount++;
                    } else {
                        const lastItem = await MenuItem.findOne({ category }).sort({ position: -1 });
                        const newPosition = lastItem ? lastItem.position + 1 : 0;
                        
                        const newItemData = {
                            name,
                            description: 'Description to be added.',
                            imageUrl: '',
                            category,
                            position: newPosition,
                            price: {
                                full: priceFull,
                            }
                        };
                        if (!isNaN(priceHalf)) {
                            newItemData.price.half = priceHalf;
                        }
                        const newItem = new MenuItem(newItemData);
                        await newItem.save();
                        createdCount++;
                    }
                } catch (e) {
                    console.error(`Could not process row for item: ${row['Item'] || 'UNKNOWN'}`, e);
                }
            }
            res.status(200).json({ 
                message: 'CSV processed successfully.',
                updated: updatedCount,
                created: createdCount,
            });
        });
});

adminRouter.get('/coupons', async (req, res) => {
    const coupons = await Coupon.find();
    res.json(coupons);
});

adminRouter.post('/coupons', async (req, res) => {
    try {
        const newCoupon = new Coupon({ ...req.body, code: req.body.code.toUpperCase() });
        await newCoupon.save();
        res.status(201).json(newCoupon);
    } catch (error) {
        res.status(400).json({ message: 'Error creating coupon', error: error.message });
    }
});

adminRouter.patch('/coupons/:id', async (req, res) => {
    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCoupon);
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

