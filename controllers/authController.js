import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import axios from "axios";
import { OAuth2Client } from "google-auth-library";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../utils/email.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Shape the user object returned to the client (never leak password fields).
const publicUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  profilePhoto: user.profilePhoto,
  role: user.role,
  isVerified: user.isVerified,
  authProvider: user.authProvider,
});

const clientUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

const sha256 = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

// Issue a fresh verification token, persist it, and email the link.
const issueVerification = async (user) => {
  const rawToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false });
  const url = `${clientUrl()}/verify-email/${rawToken}`;
  await sendVerificationEmail(user, url);
};

export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, passwordConfirm } =
      req.body;

    if (!firstName || !lastName || !email || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password,
      passwordConfirm,
    });

    // Strict verification: no session token until the email is confirmed.
    await issueVerification(user);

    res.status(201).json({
      success: true,
      needsVerification: true,
      email: user.email,
      message:
        "Account created. Check your inbox for a verification link to activate your account.",
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password +isActive");

    if (!user || !user.password || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    // Strict policy — local accounts must verify their email first.
    if (user.authProvider === "local" && !user.isVerified) {
      return res.status(403).json({
        success: false,
        needsVerification: true,
        email: user.email,
        message: "Please verify your email before signing in.",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const verifyEmail = async (req, res, next) => {
  try {
    const hashed = sha256(req.params.token);

    const user = await User.findOne({
      emailVerificationToken: hashed,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification link is invalid or has expired.",
      });
    }

    // Idempotent: keep the token valid until it naturally expires so the link
    // survives double-clicks, React StrictMode's dev double-mount, browser back,
    // and re-opening the email. (The token still auto-expires after 24h.)
    user.isVerified = true;
    await user.save({ validateBeforeSave: false });

    // Auto-login on successful verification.
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide your email" });
    }

    const user = await User.findOne({ email });

    // Don't reveal whether the email exists or is already verified.
    if (user && !user.isVerified && user.authProvider === "local") {
      await issueVerification(user);
    }

    res.status(200).json({
      success: true,
      message:
        "If that account exists and needs verification, a new link has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide your email" });
    }

    const user = await User.findOne({ email });

    if (user && user.authProvider === "local") {
      const rawToken = user.createPasswordResetToken();
      await user.save({ validateBeforeSave: false });
      const url = `${clientUrl()}/reset-password/${rawToken}`;
      await sendPasswordResetEmail(user, url);
    }

    // Always respond the same way to avoid user enumeration.
    res.status(200).json({
      success: true,
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { password, passwordConfirm } = req.body;

    if (!password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: "Please provide and confirm your new password",
      });
    }
    if (password !== passwordConfirm) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const hashed = sha256(req.params.token);

    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset link is invalid or has expired.",
      });
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // A successful reset also confirms ownership of the inbox.
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

// ── Social login ────────────────────────────────────────────────────────────

// Link a social identity onto an existing (or new) account by email.
const findOrCreateSocialUser = async ({
  provider,
  providerIdField,
  providerId,
  firstName,
  lastName,
  email,
  photo,
}) => {
  let user = await User.findOne({
    $or: [{ [providerIdField]: providerId }, { email }],
  });

  if (user) {
    let dirty = false;
    if (!user[providerIdField]) {
      user[providerIdField] = providerId;
      dirty = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      dirty = true;
    }
    if (!user.profilePhoto && photo) {
      user.profilePhoto = photo;
      dirty = true;
    }
    if (dirty) await user.save({ validateBeforeSave: false });
    return user;
  }

  return User.create({
    firstName: firstName || "Member",
    lastName: lastName || provider,
    email,
    profilePhoto: photo || null,
    authProvider: provider,
    [providerIdField]: providerId,
    isVerified: true,
  });
};

export const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Google credential" });
    }
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "Google login is not configured on the server.",
      });
    }

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const user = await findOrCreateSocialUser({
      provider: "google",
      providerIdField: "googleId",
      providerId: payload.sub,
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      photo: payload.picture,
    });

    const token = generateToken(user._id);
    res.status(200).json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    if (err.message?.includes("Token used too late") || err.message?.includes("Invalid")) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Google credential" });
    }
    next(err);
  }
};

export const facebookAuth = async (req, res, next) => {
  try {
    const { accessToken, userID } = req.body;
    if (!accessToken) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Facebook access token" });
    }

    // Verify the token by fetching the profile from the Graph API.
    const { data } = await axios.get("https://graph.facebook.com/me", {
      params: {
        fields: "id,first_name,last_name,email,picture.width(256)",
        access_token: accessToken,
      },
    });

    if (userID && data.id !== userID) {
      return res
        .status(401)
        .json({ success: false, message: "Facebook token mismatch" });
    }

    const email = data.email || `${data.id}@facebook.local`;

    const user = await findOrCreateSocialUser({
      provider: "facebook",
      providerIdField: "facebookId",
      providerId: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email,
      photo: data.picture?.data?.url,
    });

    const token = generateToken(user._id);
    res.status(200).json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    if (err.response) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Facebook access token" });
    }
    next(err);
  }
};
