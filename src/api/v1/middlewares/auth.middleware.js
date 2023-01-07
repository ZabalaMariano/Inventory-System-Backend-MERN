import mongoose from 'mongoose';
import UserModel from '../models/user.models.js';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';

// Protect route from unauthorized access
const protect = asyncHandler(async (req, res, next) => {
  // req.cookies from "cookie-parser"
  const token = req.cookies.token;

  if (!token) {
    res.status(401); // Not authorized
    throw new Error('No autorizado. Inicie sesión para obtener token...');
  }

  // Verify Token
  try {
    // Returns the payload decoded if the signature is valid and optional expiration, audience, or issuer are valid. If not, it will throw the error.
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    const { id } = verified;

    // Validate id
    try {
      mongoose.Types.ObjectId(id);
    } catch (error) {
      res.status(400);
      throw new Error(`id invalido {${id}}`);
    }

    // Find user
    const user = await UserModel.findById(id);

    if (!user) {
      res.status(404);
      throw new Error(`No existe un usuario con id {${id}}`);
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error('Token invalido');
  }
});

export default protect;
