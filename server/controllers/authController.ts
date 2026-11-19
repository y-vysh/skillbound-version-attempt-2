import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../db/database.ts';
import { signToken, type AuthenticatedRequest } from '../middleware/auth.ts';
import { computeProfileCompletion, getUserLevel, recomputeUserAchievements } from '../utils/points.ts';

function sanitizeUser(userRow: Record<string, unknown>) {
  const { password_hash: _ph, ...safe } = userRow;
  return safe;
}

export function register(req: Request, res: Response): void {
  const { fullName: rawFullName, full_name, email, password, confirmPassword, major, year, location } = req.body as {
    fullName?: string;
    full_name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    major?: string;
    year?: string;
    location?: string;
  };
  const fullName = rawFullName ?? full_name;

  if (!fullName || !fullName.trim()) {
    res.status(400).json({ error: 'Full name is required.' });
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (!password || password.length < 8 || !/\d/.test(password)) {
    res.status(400).json({ error: 'Password must be at least 8 characters and contain at least 1 number.' });
    return;
  }
  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400).json({ error: 'Passwords do not match.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const avatarUrl = req.file ? `/uploads/${req.file.filename}` : '';
  const passwordHash = bcrypt.hashSync(password, 10);

  const info = db
    .prepare(
      `INSERT INTO users (full_name, email, password_hash, role, major, year, location, avatar_url)
       VALUES (?, ?, ?, 'student', ?, ?, ?, ?)`
    )
    .run(
      fullName.trim(),
      normalizedEmail,
      passwordHash,
      (major || '').trim(),
      (year || '').trim(),
      (location || 'Columbia University').trim(),
      avatarUrl
    );

  const userId = Number(info.lastInsertRowid);
  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown>;
  const token = signToken({ id: userId, email: normalizedEmail, role: 'student' });

  db.prepare(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
  ).run(
    userId,
    'welcome',
    'Welcome to SkillBound!',
    'Complete your profile and add teaching & learning skills to unlock peer matches.',
    '/skills'
  );

  recomputeUserAchievements(userId);

  res.status(201).json({
    token,
    user: sanitizeUser(newUser),
  });
}

export function login(req: Request, res: Response): void {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as
    | (Record<string, unknown> & { id: number; email: string; password_hash: string; role: 'student' | 'admin'; is_active: number })
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Incorrect email or password.' });
    return;
  }

  if (!user.is_active) {
    res.status(403).json({ error: 'This account has been suspended by an administrator.' });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });

  res.json({
    token,
    user: sanitizeUser(user),
  });
}

export function getMe(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as
    | (Record<string, unknown> & { points: number; full_name: string; bio: string; location: string; major: string; year: string; availability: string })
    | undefined;

  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const teachSkills = db
    .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'teach' ORDER BY created_at DESC")
    .all(req.user.id);
  const learnSkills = db
    .prepare("SELECT * FROM skills WHERE user_id = ? AND direction = 'learn' ORDER BY created_at DESC")
    .all(req.user.id);

  const profileCompletion = computeProfileCompletion(user, teachSkills.length, learnSkills.length);
  const levelInfo = getUserLevel(user.points);

  res.json({
    user: sanitizeUser(user),
    teachSkills,
    learnSkills,
    profileCompletion,
    levelInfo,
  });
}

export function requestPasswordReset(req: Request, res: Response): void {
  const { email } = req.body as { email?: string };
  if (!email || !email.trim()) {
    res.status(400).json({ error: 'Email address is required.' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare('SELECT id, full_name FROM users WHERE email = ?').get(normalizedEmail) as
    | { id: number; full_name: string }
    | undefined;

  if (!user) {
    // Return neutral message for security, or helpful demo message
    res.status(404).json({ error: 'No account found with that email address.' });
    return;
  }

  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO password_resets (email, reset_code, expires_at) VALUES (?, ?, ?)').run(
    normalizedEmail,
    code,
    expiresAt
  );

  // In local dev without SMTP, return the verification code in response so the user can test the full reset flow
  res.json({
    message: 'A 6-digit reset verification code has been generated.',
    devResetCode: code,
  });
}

export function confirmPasswordReset(req: Request, res: Response): void {
  const { email, code, newPassword } = req.body as {
    email?: string;
    code?: string;
    newPassword?: string;
  };

  if (!email || !code || !newPassword) {
    res.status(400).json({ error: 'Email, reset code, and new password are required.' });
    return;
  }
  if (newPassword.length < 8 || !/\d/.test(newPassword)) {
    res.status(400).json({ error: 'New password must be at least 8 characters and include a number.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const resetRow = db
    .prepare(
      'SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND used = 0 ORDER BY id DESC LIMIT 1'
    )
    .get(normalizedEmail, code.trim()) as { id: number; expires_at: string } | undefined;

  if (!resetRow || new Date(resetRow.expires_at).getTime() < Date.now()) {
    res.status(400).json({ error: 'Invalid or expired reset code.' });
    return;
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  const runTx = db.transaction(() => {
    db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE email = ?').run(
      hash,
      normalizedEmail
    );
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRow.id);
  });
  runTx();

  res.json({ message: 'Password updated successfully. You can now log in.' });
}
