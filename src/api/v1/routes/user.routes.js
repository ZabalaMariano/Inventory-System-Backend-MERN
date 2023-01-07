import express from 'express';
import {
  getUsers,
  getUser,
  registerUser,
  loginUser,
  logoutUser,
  loginStatus,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/user.controllers.js';
import protect from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/getuser', protect, getUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);
router.get('/loggedin', loginStatus);
router.patch('/updateuser', protect, updateUser);
router.patch('/changepassword', protect, changePassword);
router.post('/forgotpassword', forgotPassword);
router.patch('/resetpassword/:resetToken', resetPassword);

export default router;
