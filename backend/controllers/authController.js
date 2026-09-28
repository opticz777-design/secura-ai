const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const login = async (req, res) => {
  try {
    const { username, password, expectedRole } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (expectedRole && user.role !== expectedRole) {
      return res.status(403).json({ success: false, error: 'The selected profile does not match this account.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'This account is currently inactive. Please contact the administrator.' });
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Assuming frontend and backend are on same localhost/domain
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    const safeUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      ashaWorkerId: user.ashaWorkerId,
      healthCentre: user.healthCentre,
      doctorId: user.doctorId,
      supervisorId: user.supervisorId
    };

    return res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const me = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const user = req.user;
    const safeUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      ashaWorkerId: user.ashaWorkerId,
      healthCentre: user.healthCentre,
      doctorId: user.doctorId,
      supervisorId: user.supervisorId
    };
    return res.json({ success: true, user: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = {
  login,
  me,
  logout
};
