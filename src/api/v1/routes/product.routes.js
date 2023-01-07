import express from 'express';
import {
  createProduct,
  getAllProducts,
  getProduct,
  deleteProduct,
  updateProduct,
} from '../controllers/product.controllers.js';
import protect from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/fileUpload.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), createProduct);
router.patch('/:id', protect, upload.single('image'), updateProduct);
router.get('/', protect, getAllProducts);
router.get('/:id', protect, getProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
