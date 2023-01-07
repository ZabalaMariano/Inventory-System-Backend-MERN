import express from 'express';
import { contactUs } from '../controllers/contact.controllers.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, contactUs);

export default router;
