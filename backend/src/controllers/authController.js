const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { generateToken, setTokenCookie } = require('../utils/generateToken');
const logActivity = require('../utils/logActivity');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  const user = await User.create({ name, email: email.toLowerCase(), password });

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  await logActivity({ user: user._id, type: 'user_register' });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  await logActivity({ user: user._id, type: 'user_login' });

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    token,
    user: user.toSafeObject(),
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token');
  if (req.user) {
    await logActivity({ user: req.user._id, type: 'user_logout' });
  }
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  await user.save({ validateBeforeSave: true });

  res.status(200).json({ success: true, user: user.toSafeObject() });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new password' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  const user = await User.findById(req.user._id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  await logActivity({ user: user._id, type: 'password_changed' });

  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

// @desc    Update theme preference
// @route   PUT /api/auth/theme
// @access  Private
const updateTheme = asyncHandler(async (req, res) => {
  const { theme } = req.body;
  if (!['light', 'dark'].includes(theme)) {
    return res.status(400).json({ success: false, message: 'Invalid theme value' });
  }
  const user = await User.findById(req.user._id);
  user.theme = theme;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, user: user.toSafeObject() });
});

// @desc    Forgot password - generate reset token
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });

  // Always respond success to avoid leaking which emails are registered
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists for that email, a reset link has been generated',
    });
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // In a production app this would be emailed. For this project, we return the
  // reset token directly in the response so it can be used in the UI without
  // requiring an email service to be configured.
  res.status(200).json({
    success: true,
    message: 'Password reset token generated',
    resetToken,
  });
});

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Token is invalid or has expired' });
  }

  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  const token = generateToken(user._id);
  setTokenCookie(res, token);

  res.status(200).json({ success: true, message: 'Password reset successfully', token });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  updateTheme,
  forgotPassword,
  resetPassword,
};
