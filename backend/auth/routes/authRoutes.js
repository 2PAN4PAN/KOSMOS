const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Use environment variable in production

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;

    // Find user
    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(400).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // Check password
    const isMatch = user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
    }

    // Update last login time
    user.lastLoginAt = Date.now();
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { studentId: user.studentId, isAdmin: user.isAdmin }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ 
      success: true, 
      token 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '로그인 중 오류가 발생했습니다.' });
  }
});

// Add User Route (Admin only)
router.post('/add', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { studentId, name, password, isAdmin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ studentId });
    if (existingUser) {
      return res.status(400).json({ success: false, message: '이미 존재하는 학번입니다.' });
    }

    // Create new user
    const newUser = new User({
      studentId,
      name,
      password,
      isAdmin: isAdmin || false
    });

    await newUser.save();

    res.status(201).json({ success: true, message: '회원이 성공적으로 추가되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '회원 추가 중 오류가 발생했습니다.' });
  }
});

// Delete User Route (Admin only)
router.post('/delete', [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    const { studentId } = req.body;

    const result = await User.findOneAndDelete({ studentId });

    if (!result) {
      return res.status(404).json({ success: false, message: '해당 회원을 찾을 수 없습니다.' });
    }

    res.json({ success: true, message: '회원이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '회원 삭제 중 오류가 발생했습니다.' });
  }
});

// Modify Password Route (Self or Admin)
router.post('/mod', authMiddleware, async (req, res) => {
  try {
    const { studentId, newPassword } = req.body;

    // Check if the requester is the same user or an admin
    if (req.user.studentId !== studentId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: '비밀번호 수정 권한이 없습니다.' });
    }

    const user = await User.findOne({ studentId });
    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });
  } catch (error) {
    res.status(500).json({ success: false, message: '비밀번호 변경 중 오류가 발생했습니다.' });
  }
});

module.exports = router;