import ProductModel from '../models/product.models.js';
import asyncHandler from 'express-async-handler';
import { fileSizeFormatter } from '../utils/sizeFormatter.js';
import { v2 as cloudinary } from 'cloudinary';
import { bufferToUrl } from '../middlewares/fileUpload.js';
import { uploader } from '../../../config/cloudinaryConfig.js'; // Store in "Assets"
import mongoose from 'mongoose';

// Routes Functions

/* Create product */
/**
 * @Method POST
 * @Middleware protect, upload.single("image")
 * @req body, user, file
 * @Body name, sku, category, quantity, price, description
 */
const createProduct = asyncHandler(async (req, res) => {
  const { name, sku, category, quantity, price, description } = req.body;

  // Validation
  if (!name || !sku || !category || !quantity || !price || !description) {
    res.status(400);
    throw new Error(
      'Ingrese tooos los campos {name, category, quantity, price, description}'
    );
  }

  // Handle image upload
  let fileData = {};

  if (req.file) {
    let filePath;

    if (process.env.LOCAL_FILE_STORAGE === 'true') {
      console.log('Save image to disk');
      filePath = req.file.path;
    } else {
      console.log('Save image to cloudinary');
      // Save image to cloudinary (if server doesn't allow localstorage of images)
      const file = bufferToUrl(req.file).content; // file to base64

      let uploadedFile;
      try {
        uploadedFile = await cloudinary.uploader.upload(file, {
          folder: 'Inventory-Management',
          resource_type: 'image',
        });

        filePath = uploadedFile.secure_url;
      } catch (error) {
        console.log('Cloudinary error ->', error);
        res.status(500);
        throw new Error('La imagen no se pudo subir a Cloudinary');
      }
    }

    // Create object for "image" field in product-model
    fileData = {
      fileName: req.file.originalname,
      filePath: filePath,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Create product
  const product = await ProductModel.create({
    user: req.user.id,
    name,
    sku,
    category,
    quantity,
    price,
    description,
    image: fileData,
  });

  res.status(201).send({ message: 'new product created', product: product });
});

/* Get all products created by logged in user */
/**
 * Method:
 * GET
 *
 * Middleware:
 * protect
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await ProductModel.find({ user: req.user.id }).sort(
    '-createdAt'
  );
  res.status(200).json({ products });
});

/* Get product by id */
/**
 * Method:
 * GET
 *
 * Middleware:
 * protect
 *
 * Params:
 * id
 */
const getProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  try {
    mongoose.Types.ObjectId(productId);
  } catch (error) {
    res.status(400);
    throw new Error('Product id invalido: ' + productId);
  }

  const product = await ProductModel.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Producto no encontrado');
  }

  // Product created by user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Usuario no autorizado a ver este producto');
  }

  res.status(200).send({ product: product });
});

/* Delete product by id */
/**
 * Method:
 * DELETE
 *
 * Middleware:
 * protect
 *
 * Params:
 * id
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  try {
    mongoose.Types.ObjectId(productId);
  } catch (error) {
    res.status(400);
    throw new Error('Product id invalido: ' + productId);
  }

  const product = await ProductModel.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Producto no encontrado');
  }

  // Product created by user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Usuario no autorizado a ver este producto');
  }

  // Delete
  const productDeleted = await product.deleteOne();
  if (!productDeleted) {
    res.status(500);
    throw new Error('Fallo eliminacion del producto');
  }

  res.status(200).send({ productDeleted: productDeleted });
});

/* Update product by id */
/**
 * Method:
 * PATCH
 *
 * Middleware:
 * protect
 * upload.single("image")
 *
 * Body:
 * name
 * sku
 * category
 * quantity
 * price
 * description
 *
 * Params:
 * id
 *
 * User:
 * id
 *
 * File:
 * image
 *
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;

  const productId = req.params.id;

  try {
    mongoose.Types.ObjectId(productId);
  } catch (error) {
    res.status(400);
    throw new Error('Product id invalido: ' + productId);
  }

  const product = await ProductModel.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Producto no encontrado');
  }

  // Product created by user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Usuario no autorizado a ver este producto');
  }

  // Handle image upload
  let fileData = {};

  if (req.file) {
    let filePath;

    if (process.env.LOCAL_FILE_STORAGE === 'true') {
      console.log('Save image to disk');
      filePath = req.file.path;
    } else {
      console.log('Save image to cloudinary');
      // Save image to cloudinary (if server doesn't allow localstorage of images)
      const file = bufferToUrl(req.file).content; // file to base64

      let uploadedFile;
      try {
        uploadedFile = await cloudinary.uploader.upload(file, {
          folder: 'Inventory-Management',
          resource_type: 'image',
        });

        filePath = uploadedFile.secure_url;
      } catch (error) {
        console.log('Cloudinary error ->', error);
        res.status(500);
        throw new Error('La imagen no se pudo subir a Cloudinary');
      }
    }

    // Create object for "image" field in product-model
    fileData = {
      fileName: req.file.originalname,
      filePath: filePath,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
    };
  }

  // Update product
  product.name = name || product.name;
  product.category = category || product.category;
  product.quantity = quantity || product.quantity;
  product.price = price || product.price;
  product.description = description || product.description;
  product.image = req.file ? fileData : product.image;

  const updatedProduct = await product.save();
  if (!updatedProduct) {
    res.status(500);
    throw new Error('Error al actualizar producto');
  }

  res.status(200).send({ message: 'product updated', product: updatedProduct });
});

export {
  createProduct,
  getAllProducts,
  getProduct,
  deleteProduct,
  updateProduct,
};
