import express from "express";
import {
  register,
  login,
  logout,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleAuth,
  facebookAuth,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Email verification
router.post("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Social login
router.post("/google", googleAuth);
router.post("/facebook", facebookAuth);

export default router;
