const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex');
}

router.post('/register', (req, res) => {
  const { email, password, invitationCode } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const inviteCode = generateInviteCode();
  const now = new Date().toISOString();
  let invitedBy = null;

  if (invitationCode) {
    const inviter = db.get('SELECT id, email FROM users WHERE invitation_code = ?', [invitationCode]);
    if (inviter) {
      invitedBy = inviter.email;
    }
  }

  const result = db.run(
    `INSERT INTO users (email, password_hash, invitation_code, invited_by, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [email, passwordHash, inviteCode, invitedBy, now]
  );

  const user = { id: result.lastID, email, plan: 'free' };
  const token = generateToken(user);
  res.status(201).json({ token, user: { id: user.id, email, plan: 'free', invitation_code: inviteCode } });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.get(
    'SELECT id, email, password_hash, plan FROM users WHERE email = ?',
    [email]
  );

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (!bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({ token, user: { id: user.id, email: user.email, plan: user.plan } });
});

module.exports = router;
