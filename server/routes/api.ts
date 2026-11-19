import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { CONFIG } from '../config/env.ts';
import { optionalAuth, requireAdmin, requireAuth } from '../middleware/auth.ts';
import {
  confirmPasswordReset,
  getMe,
  login,
  register,
  requestPasswordReset,
} from '../controllers/authController.ts';
import {
  getDashboardData,
  getNotifications,
  getPeerProfile,
  markNotificationsRead,
  reportUser,
  updateProfile,
  uploadAvatar,
} from '../controllers/userController.ts';
import {
  createSkill,
  deleteSkill,
  discoverPeers,
  getMySkills,
  updateSkill,
} from '../controllers/skillController.ts';
import {
  createRequest,
  listRequests,
  updateRequestStatus,
} from '../controllers/requestController.ts';
import {
  createSession,
  listSessions,
  updateSession,
} from '../controllers/sessionController.ts';
import {
  getMessages,
  listConversations,
  sendMessage,
  startConversation,
} from '../controllers/messageController.ts';
import { getUserReviews, submitReview } from '../controllers/reviewController.ts';
import { getRewardsOverview } from '../controllers/rewardsController.ts';
import {
  deleteUserAdmin,
  getAdminOverview,
  manageUser,
} from '../controllers/adminController.ts';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, CONFIG.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '.png').toLowerCase() || '.png';
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(ext) ? ext : '.png';
    cb(null, `avatar_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'SkillBound API' });
});

// Authentication
apiRouter.post('/auth/register', upload.single('avatar'), register);
apiRouter.post('/auth/login', login);
apiRouter.get('/auth/me', requireAuth, getMe);
apiRouter.post('/auth/forgot-password', requestPasswordReset);
apiRouter.post('/auth/reset-password', confirmPasswordReset);

// Dashboard & Notifications
apiRouter.get('/dashboard', requireAuth, getDashboardData);
apiRouter.get('/notifications', requireAuth, getNotifications);
apiRouter.post('/notifications/read', requireAuth, markNotificationsRead);

// User Profile & Peers
apiRouter.put('/users/profile', requireAuth, updateProfile);
apiRouter.post('/users/avatar', requireAuth, upload.single('avatar'), uploadAvatar);
apiRouter.get('/peers/:id', optionalAuth, getPeerProfile);
apiRouter.post('/peers/:id/report', requireAuth, reportUser);

// Skills & Discovery
apiRouter.get('/skills/my', requireAuth, getMySkills);
apiRouter.post('/skills', requireAuth, createSkill);
apiRouter.put('/skills/:id', requireAuth, updateSkill);
apiRouter.delete('/skills/:id', requireAuth, deleteSkill);
apiRouter.get('/discover', optionalAuth, discoverPeers);

// Learning Requests
apiRouter.get('/requests', requireAuth, listRequests);
apiRouter.post('/requests', requireAuth, createRequest);
apiRouter.patch('/requests/:id', requireAuth, updateRequestStatus);

// Learning Sessions
apiRouter.get('/sessions', requireAuth, listSessions);
apiRouter.post('/sessions', requireAuth, createSession);
apiRouter.patch('/sessions/:id', requireAuth, updateSession);

// Messaging
apiRouter.get('/conversations', requireAuth, listConversations);
apiRouter.post('/conversations', requireAuth, startConversation);
apiRouter.get('/conversations/:conversationId/messages', requireAuth, getMessages);
apiRouter.post('/conversations/:conversationId/messages', requireAuth, sendMessage);

// Reviews & Ratings
apiRouter.post('/reviews', requireAuth, submitReview);
apiRouter.get('/reviews/user/:userId', getUserReviews);

// Points, Badges & Leaderboard
apiRouter.get('/rewards', requireAuth, getRewardsOverview);

// Admin Dashboard (Role Protected)
apiRouter.get('/admin/overview', requireAuth, requireAdmin, getAdminOverview);
apiRouter.patch('/admin/users/:id', requireAuth, requireAdmin, manageUser);
apiRouter.delete('/admin/users/:id', requireAuth, requireAdmin, deleteUserAdmin);
