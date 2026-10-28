import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbStore, type UserEntity } from '../db/store';
import { config } from '../config';
import { authenticateToken } from '../middleware/auth';
import type { AuthenticatedRequest, TokenPayload } from '../types';

const router = Router();

// Register Customer
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      res.status(400).json({ success: false, error: 'Name, email, phone, and password are required.' });
      return;
    }

    // Check existing email or phone
    const existingEmail = Array.from(dbStore.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existingEmail) {
      res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    const existingPhone = Array.from(dbStore.users.values()).find((u) => u.phone === phone);
    if (existingPhone) {
      res.status(409).json({ success: false, error: 'An account with this phone number already exists.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = `usr_${Date.now()}`;
    const newUser: UserEntity = {
      id,
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbStore.users.set(id, newUser);

    const tokenPayload: TokenPayload = {
      userId: id,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      res.status(400).json({ success: false, error: 'Email/Phone and password are required.' });
      return;
    }

    const user = Array.from(dbStore.users.values()).find(
      (u) =>
        u.email.toLowerCase() === emailOrPhone.toLowerCase() ||
        u.phone === emailOrPhone
    );

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials. User not found.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials. Incorrect password.' });
      return;
    }

    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get Current User
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = dbStore.users.get(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, error: 'User profile not found.' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

export default router;
