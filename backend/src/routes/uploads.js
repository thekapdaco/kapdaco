// routes/uploads.js - File upload handling
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { auth, isDesignerOrAdmin, isBrand } from '../middleware/auth.js';
import { uploadLimiter, signupUploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Configure multer for file uploads
const getStorage = (folder) => multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', folder);
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Storage instances for different upload types
const portfolioStorage = getStorage('portfolio');
const productStorage = getStorage('products');

// Strict file type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['application/pdf'];
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit (stricter than before)
const MAX_FILES = 5;

const fileFilter = (req, file, cb) => {
  // Validate MIME type
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Only ${ALLOWED_TYPES.join(', ')} are allowed.`), false);
  }
  
  // Additional validation: check file extension matches MIME type
  const ext = path.extname(file.originalname).toLowerCase();
  const validExtensions = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/jpg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf']
  };
  
  if (validExtensions[file.mimetype] && !validExtensions[file.mimetype].includes(ext)) {
    return cb(new Error('File extension does not match file type.'), false);
  }
  
  cb(null, true);
};

const uploadConfig = {
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
};

const upload = multer({
  storage: portfolioStorage,
  ...uploadConfig
});

const productUpload = multer({
  storage: productStorage,
  ...uploadConfig
});

// Designer signup upload endpoint (no auth required)
router.post('/signup/portfolio', signupUploadLimiter, upload.array('files', MAX_FILES), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/portfolio/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Signup portfolio upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path).catch(console.error);
      });
    }
    
    res.status(500).json({ 
      message: error.message || 'File upload failed' 
    });
  }
});

// Portfolio upload endpoint (authenticated)
router.post('/portfolio', auth, uploadLimiter, upload.array('files', MAX_FILES), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/portfolio/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      message: 'Files uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Portfolio upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path).catch(console.error);
      });
    }
    
    res.status(500).json({ 
      message: error.message || 'File upload failed' 
    });
  }
});

// Design upload endpoint
router.post('/designs', auth, isDesignerOrAdmin, uploadLimiter, upload.single('design'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No design file uploaded' });
    }

    const file = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/portfolio/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    res.json({
      message: 'Design uploaded successfully',
      file
    });
  } catch (error) {
    console.error('Design upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({ 
      message: error.message || 'Design upload failed' 
    });
  }
});

// Get uploaded file
router.get('/:folder/:filename', (req, res) => {
  try {
    const { folder, filename } = req.params;
    const allowedFolders = ['portfolio', 'products'];
    
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ message: 'Invalid folder' });
    }

    const filePath = path.join(process.cwd(), 'uploads', folder, filename);
    
    // Security check - ensure file is within uploads directory
    const normalizedPath = path.normalize(filePath);
    const uploadsDir = path.normalize(path.join(process.cwd(), 'uploads'));
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('File send error:', err);
        res.status(404).json({ message: 'File not found' });
      }
    });
  } catch (error) {
    console.error('File access error:', error);
    res.status(500).json({ message: 'Error accessing file' });
  }
});

// Product image upload endpoint (for brands)
router.post('/products', auth, isBrand, uploadLimiter, productUpload.array('images', MAX_FILES), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/products/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.json({
      message: 'Product images uploaded successfully',
      files
    });
  } catch (error) {
    console.error('Product image upload error:', error);
    
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        fs.unlink(file.path).catch(console.error);
      });
    }
    
    res.status(500).json({ 
      message: error.message || 'Image upload failed' 
    });
  }
});

// Delete uploaded file (admin only)
router.delete('/:folder/:filename', auth, isDesignerOrAdmin, async (req, res) => {
  try {
    const { folder, filename } = req.params;
    const allowedFolders = ['portfolio', 'products'];
    
    if (!allowedFolders.includes(folder)) {
      return res.status(400).json({ message: 'Invalid folder' });
    }

    const filePath = path.join(process.cwd(), 'uploads', folder, filename);
    
    // Security check
    const normalizedPath = path.normalize(filePath);
    const uploadsDir = path.normalize(path.join(process.cwd(), 'uploads'));
    
    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(400).json({ message: 'Invalid file path' });
    }

    await fs.unlink(filePath);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('File delete error:', error);
    if (error.code === 'ENOENT') {
      res.status(404).json({ message: 'File not found' });
    } else {
      res.status(500).json({ message: 'Error deleting file' });
    }
  }
});

export default router;