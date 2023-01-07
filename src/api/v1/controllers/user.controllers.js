import UserModel from '../models/user.models.js';
import TokenModel from '../models/token.models.js';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

// Auxiliar

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Routes Functions

/* Register user */
/**
 * Method:
 * POST
 *
 * Body:
 * name
 * email
 * password
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Ingrese todos los campos requeridos');
  }

  let newUser = new UserModel({
    name: name,
    email: email,
    password: password,
  });

  // let validationError = newUser.validateSync();
  // assert.ok(!validationError.errors['name']);

  newUser = await newUser.save();

  if (!newUser) {
    res.status(400);
    throw new Error('Error al crear usuario');
  }

  // Generate Token
  const token = generateToken(newUser._id);

  // Send HTTP-Only cookie
  res.cookie('token', token, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 Day
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'development' ? false : true,
  });

  res
    .status(201)
    .send({ message: 'User registrado', user: newUser, token: token });
});

/* Login user */
/**
 * Method:
 * POST
 *
 * Body:
 * email
 * password
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Los campos {email} y {password} son obligatorios');
  }

  // Look up user
  const user = await UserModel.findOne({ email: email });
  if (!user) {
    res.status(400);
    throw new Error('{email} o {password} incorrecta');
  }

  // Verify password
  const passwordIsCorrect = await bcrypt.compare(password, user.password);
  if (!passwordIsCorrect) {
    res.status(400);
    throw new Error('{email} o {password} incorrecta');
  }

  // Generate Token
  const token = generateToken(user._id);

  // Send HTTP-Only cookie
  res.cookie('token', token, {
    path: '/',
    httpOnly: true,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 Day
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'development' ? false : true,
  });

  res.status(200).send({ user: user, token: token });
});

/* Logout User */
/**
 * Method:
 * GET
 */
const logoutUser = asyncHandler(async (req, res) => {
  // Delete/expire cookie
  res.cookie('token', '', {
    path: '/',
    httpOnly: true,
    expires: new Date(0),
    sameSite: 'none',
    secure: process.env.NODE_ENV === 'development' ? false : true,
  });

  return res.status(200).send({ message: 'Logout successful' });
});

/* Get all the users */
/**
 * Method:
 * GET
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await UserModel.find();
  res.status(200).send({ users: users });
});

/* Get user info (by ID in Token) */
/**
 * Middleware:
 * protect
 *
 * Method:
 * GET
 */
const getUser = asyncHandler(async (req, res) => {
  const user = req.user; // from protect middleware

  res.status(200).send({ user: user });
});

/* Is user logged in */
/**
 * Method:
 * GET
 */
const loginStatus = asyncHandler(async (req, res) => {
  // req.cookies from "cookie-parser"
  const token = req.cookies.token;

  if (!token) {
    return res.status(200).send({ loggedin: false });
  }

  // Verify Token
  try {
    // Returns the payload decoded if the signature is valid and optional expiration, audience, or issuer are valid. If not, it will throw the error.
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    return res.status(200).send({ loggedin: true });
  } catch (error) {
    return res.status(200).send({ loggedin: false });
  }
});

/* Update user */
/**
 * @Middleware protect
 * @Method PATCH
 * @req body
 * @body name, phone, bio, photo
 */
const updateUser = asyncHandler(async (req, res) => {
  const user = req.user; // from protect middleware

  // Changes
  const changes = req.body;

  // const patchedUser = await UserModel.findByIdAndUpdate(id, changes, {
  //   new: true, runValidators: true
  // });

  user.name = changes.name || user.name;
  user.phone = changes.phone || user.phone;
  user.bio = changes.bio || user.bio;
  user.photo = changes.photo || user.photo;
  const patchedUser = await user.save();

  if (!patchedUser) {
    res.status(500);
    throw new Error(`Error al actualizar usuario con id {${id}}`);
  }

  res.status(200).send({ user: patchedUser });
});

/* Change user Password */
/**
 * Middleware:
 * protect
 *
 * Method:
 * PATCH
 *
 * Body:
 * oldPassword
 * newPassword
 */
const changePassword = asyncHandler(async (req, res) => {
  const user = req.user; // from protect middleware

  // Changes
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error('Send new and old password');
  }

  // Verify password
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);
  if (!passwordIsCorrect) {
    res.status(400);
    throw new Error('Incorrect password');
  }

  user.password = newPassword;
  const patchedUser = await user.save();

  if (!patchedUser) {
    res.status(500);
    throw new Error(`Error on updating user with id {${id}}`);
  }

  res.status(200).send({ user: patchedUser });
});

/* Forgot password */
/**
 * Method:
 * POST
 *
 * Body:
 * email
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email: email });

  if (!user) {
    res.status(404);
    throw new Error(`No existe usuario con email {${email}}`);
  }

  // Delete token if it exists in db
  const token = await TokenModel.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create reset token
  const resetToken = crypto.randomBytes(32).toString('hex') + user._id;

  // Hash token before saving to db
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Save token to db
  await new TokenModel({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 30, // 30 minutes
  }).save();

  // Construct reset URL
  const resetURL = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset email
  const message = `
  <h2>Hola, ${user.name}</h2>
  <p>Haga click en la siguiente URL si desea cambiar su contraseña. Si usted no ha pedido un cambio de contraseña, ignore este mensaje.</p>
  <p>Esta URL es válida por solo 30 minutos.</p>

  <a href=${resetURL} clicktracking=off>${resetURL}</a>
  
  <p>Gracias,</p>
  <p>Sistema de inventario</p>
  `;

  const subject = 'Pedido de cambio de contraseña';
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  await sendEmail(subject, message, send_to, sent_from);

  res.status(200).send({
    message:
      "Reset email requested, check your email. Try again if you didn't get an email.",
  });
});

/* Reset password */
/**
 * Method:
 * PUT
 *
 * Body:
 * password
 *
 * Params:
 * resetToken
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare to token in db
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Find token in db
  const userToken = await TokenModel.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error('Token inválido o expiró');
  }

  // Find user
  const user = await UserModel.findById(userToken.userId);
  user.password = password;
  await user.save();

  res.status(200).send({
    message: 'Contraseña actualizada exitosamente',
  });
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  getUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
};
