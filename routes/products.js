const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'waterbottle_products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage: storage });

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    let products = await Product.find();
    
    // Seed if empty (keeping this as a fallback for initial setup)
    if (!products || products.length === 0) {
       const sampleProducts = [
        {
          name: "Zenith Bottle",
          description: "Minimalist design for maximum hydration. Double-wall vacuum insulation.",
          price: 45.00,
          image: "https://images.unsplash.com/photo-1602143407151-11115cd4e69b?auto=format&fit=crop&w=800&q=80", 
          colors: ["#F4E04D", "#F25F5C", "#247BA0", "#1D1D1D"],
          features: ["24h Cold", "12h Hot", "Lifetime Warranty"]
        }
       ];
       
       try {
            await Product.insertMany(sampleProducts);
            products = await Product.find();
       } catch (insertError) {
            products = sampleProducts;
       }
    }
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route   POST /api/products
// @desc    Create a new product with image upload
// @access  Private (Admin)
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, colors, features } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image' });
    }

    const newProduct = new Product({
      name,
      description,
      price: Number(price),
      image: req.file.path, // Cloudinary secure URL
      colors: colors ? (Array.isArray(colors) ? colors : colors.split(',').map(c => c.trim())) : [],
      features: features ? (Array.isArray(features) ? features : features.split(',').map(f => f.trim())) : []
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ success: true, data: savedProduct });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Private (Admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Optional: Delete image from Cloudinary
    if (product.image && product.image.includes('cloudinary')) {
      const publicId = product.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`waterbottle_products/${publicId}`);
    }

    await product.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;

