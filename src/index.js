import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import routerUser from './api/v1/routes/user.routes.js';
import routerProduct from './api/v1/routes/product.routes.js';
import routerContact from './api/v1/routes/contact.routes.js';
import {
  logErrors,
  validationError,
  errorHandler,
} from './api/v1/middlewares/errorHandler.middleware.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { cloudinaryConfig } from './config/cloudinaryConfig.js';
import { upload } from './api/v1/middlewares/fileUpload.js';

dotenv.config();
const app = express();

// Import __dirname
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares

app.use(
  cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'api', 'v1', 'public', 'uploads'))
);
app.use(cloudinaryConfig);

// Routers

const V1 = process.env.V1;

app.use(V1 + '/users', routerUser);
app.use(V1 + '/products', routerProduct);
app.use(V1 + '/contact-us', routerContact);

// Error handler middleware

app.use(logErrors);
app.use(validationError);
app.use(errorHandler);

// 404 Not Found

app.use((req, res) => {
  res.status(404).send('No se encontró la página...');
});

// Start server

const PORT = process.env.PORT || 5001;

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}...`);
    });
  } catch (error) {
    console.log('error during start ->', error.message);
  }
};

start();
