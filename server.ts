import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express, { type NextFunction, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { CONFIG } from './server/config/env.ts';
import { initializeDatabase } from './server/db/database.ts';
import { seedDatabase } from './server/db/seed.ts';
import { apiRouter } from './server/routes/api.ts';

async function startServer() {
  initializeDatabase();
  seedDatabase();

  const app = express();
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });

  // Socket.IO authentication & room subscription
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error('Unauthorized'));
    }
    try {
      const payload = jwt.verify(token, CONFIG.JWT_SECRET) as { userId: number; email: string };
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as number;
    socket.join(`user:${userId}`);

    socket.on('conversation:join', (conversationId: number) => {
      if (Number.isFinite(Number(conversationId))) {
        socket.join(`conv:${Number(conversationId)}`);
      }
    });

    socket.on('conversation:leave', (conversationId: number) => {
      if (Number.isFinite(Number(conversationId))) {
        socket.leave(`conv:${Number(conversationId)}`);
      }
    });
  });

  app.set('io', io);

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded profile images
  app.use('/uploads', express.static(CONFIG.UPLOAD_DIR));

  // REST API endpoints
  app.use('/api', apiRouter);

  // Error handler for API routes
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      res.status(500).json({ error: err.message || 'Internal server error' });
      return;
    }
    next(err);
  });

  // Vite dev middleware or production static dist
  if (CONFIG.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  httpServer.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`SkillBound server running at http://localhost:${CONFIG.PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start SkillBound server:', err);
  process.exit(1);
});
