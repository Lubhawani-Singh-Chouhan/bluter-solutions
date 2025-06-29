const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const nodemailer = require('nodemailer');

// Configure your email transporter (use your real email and app password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'lubhawani2002@gmail.com',         // replace with your email
    pass: 'gnzu gdkr izmj sric'             // use an app password, not your real password
  }
});

// Utility function to send notification email
function sendAdminNotification(subject, text) {
  console.log('Attempting to send admin notification email...');
  transporter.sendMail({
    from: 'Bluter Solutions <lubhawani2002@gmail.com>',
    to: 'kshitijakothavade03@gmail.com', // replace with admin's email
    subject,
    text
  }, (err, info) => {
    if (err) {
      console.error('Error sending admin notification:', err);
      if (err.response) console.error('SMTP response:', err.response);
      if (err.stack) console.error('Error stack:', err.stack);
    } else {
      console.log('Admin notification sent:', info.response);
    }
  });
}


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Order Schema
const orderSchema = new mongoose.Schema({
  bottleSize: String,
  packOf: String,
  name: String,
  email: String,
  phone: String,
  customize: Boolean,
  themeDesc: String,
  brandLogo: String,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// API endpoint to receive orders
app.post('/api/orders', upload.single('brandLogo'), async (req, res) => {
  try {
    const { bottleSize, packOf, name, email, phone, customize, themeDesc } = req.body;
    const brandLogo = req.file ? req.file.filename : null;
    const order = new Order({
      bottleSize,
      packOf,
      name,
      email,
      phone,
      customize: customize === 'on' || customize === true,
      themeDesc,
      brandLogo
    });
    await order.save();
        sendAdminNotification(
        'New Order Received',
        `A new order has been placed by ${order.name} (${order.email}, ${order.phone}).`
      );
    res.status(201).json({ message: 'Order received!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save order.' });
  }
});

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

// API endpoint to receive contact form submissions
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const contact = new Contact({ name, email, phone });
    await contact.save();
    sendAdminNotification(
      'New Contact Submission',
      `A new contact submission from ${contact.name} (${contact.email}, ${contact.phone}).`
    );
    res.status(201).json({ message: 'Contact details received!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save contact details.' });
  }
});

// Admin: Get all orders
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// Admin: Get all contacts
app.get('/api/admin/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts.' });
  }
});

// Test endpoint for Nodemailer
app.get('/api/test-email', (req, res) => {
  sendAdminNotification(
    'Test Email from Bluter Solutions',
    'This is a test email sent from the Nodemailer test endpoint.'
  );
  res.json({ message: 'Test email attempted. Check your backend logs for results.' });
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/', (req, res) => {
  res.send('Bluter Solutions API is running!');
});
