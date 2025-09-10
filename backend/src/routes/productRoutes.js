import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { ProductController } from '../controllers/productController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateRequest, validateFileUpload } from '../middleware/validation';
import { scanProductSchema, getProductSchema, getHistorySchema, deleteHistorySchema } from '../schemas/productSchemas';

const router = Router();
const productController = new ProductController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
    }
  }
});

// Product scanning routes
router.post('/scan', 
  optionalAuth, 
  upload.single('image'), 
  validateFileUpload,
  validateRequest(scanProductSchema), 
  productController.scanProduct.bind(productController)
);

// Product details
router.get('/:id', 
  optionalAuth, 
  validateRequest(getProductSchema), 
  productController.getProduct.bind(productController)
);

// User history (requires authentication)
router.get('/history/list', 
  authenticateToken, 
  validateRequest(getHistorySchema), 
  productController.getHistory.bind(productController)
);

// User statistics (requires authentication)
router.get('/stats/overview', 
  authenticateToken, 
  productController.getStats.bind(productController)
);

// Delete scan record (requires authentication)
router.delete('/history/:id', 
  authenticateToken, 
  validateRequest(deleteHistorySchema), 
  productController.deleteHistory.bind(productController)
);

export default router; 