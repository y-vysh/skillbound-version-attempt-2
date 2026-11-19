import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';

export function listConversations(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const convs = db
    .prepare(
      `SELECT c.*,
              CASE WHEN c.participant1_id = ? THEN u2.id ELSE u1.id END as peer_id,
              CASE WHEN c.participant1_id = ? THEN u2.full_name ELSE u1.full_name END as peer_name,
              CASE WHEN c.participant1_id = ? THEN u2.major ELSE u1.major END as peer_major,
              CASE WHEN c.participant1_id = ? THEN u2.year ELSE u1.year END as peer_year,
              CASE WHEN c.participant1_id = ? THEN u2.avatar_url ELSE u1.avatar_url END as peer_avatar,
              (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) as last_message,
              (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) as last_message_time,
              (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.sender_id != ? AND m.is_read = 0) as unread_count
       FROM conversations c
       JOIN users u1 ON u1.id = c.participant1_id
       JOIN users u2 ON u2.id = c.participant2_id
       WHERE c.participant1_id = ? OR c.participant2_id = ?
       ORDER BY c.last_message_at DESC, c.id DESC`
    )
    .all(
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id,
      req.user.id
    );

  res.json({ conversations: convs });
}

export function startConversation(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const peerId = Number(req.body.peerId);
  if (!Number.isFinite(peerId) || peerId === req.user.id) {
    res.status(400).json({ error: 'Valid peerId is required.' });
    return;
  }
  const peer = db.prepare('SELECT id FROM users WHERE id = ? AND is_active = 1').get(peerId);
  if (!peer) {
    res.status(404).json({ error: 'Peer user not found.' });
    return;
  }

  const p1 = Math.min(req.user.id, peerId);
  const p2 = Math.max(req.user.id, peerId);

  db.prepare('INSERT OR IGNORE INTO conversations (participant1_id, participant2_id) VALUES (?, ?)').run(p1, p2);
  const conv = db
    .prepare('SELECT * FROM conversations WHERE participant1_id = ? AND participant2_id = ?')
    .get(p1, p2);

  res.json({ conversation: conv });
}

export function getMessages(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const convId = Number(req.params.conversationId);
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId) as
    | { id: number; participant1_id: number; participant2_id: number }
    | undefined;

  if (!conv) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }
  if (conv.participant1_id !== req.user.id && conv.participant2_id !== req.user.id) {
    res.status(403).json({ error: 'Access denied to this conversation.' });
    return;
  }

  // Mark incoming messages as read
  db.prepare('UPDATE messages SET is_read = 1 WHERE conversation_id = ? AND sender_id != ?').run(
    convId,
    req.user.id
  );

  const messages = db
    .prepare(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC, m.id ASC`
    )
    .all(convId);

  res.json({ messages });
}

export function sendMessage(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const convId = Number(req.params.conversationId);
  const { content } = req.body as { content?: string };
  if (!content || !content.trim()) {
    res.status(400).json({ error: 'Message content cannot be empty.' });
    return;
  }

  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId) as
    | { id: number; participant1_id: number; participant2_id: number }
    | undefined;

  if (!conv) {
    res.status(404).json({ error: 'Conversation not found.' });
    return;
  }
  if (conv.participant1_id !== req.user.id && conv.participant2_id !== req.user.id) {
    res.status(403).json({ error: 'Access denied to this conversation.' });
    return;
  }

  const cleanText = content.trim();
  const info = db
    .prepare('INSERT INTO messages (conversation_id, sender_id, content, is_read) VALUES (?, ?, ?, 0)')
    .run(convId, req.user.id, cleanText);

  db.prepare("UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?").run(convId);

  const message = db
    .prepare(
      `SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.id = ?`
    )
    .get(Number(info.lastInsertRowid));

  const recipientId = conv.participant1_id === req.user.id ? conv.participant2_id : conv.participant1_id;
  db.prepare(
    'INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)'
  ).run(
    recipientId,
    'message',
    `New Message from ${req.user.full_name}`,
    cleanText.slice(0, 80),
    '/messages'
  );

  // Broadcast via Socket.IO if attached
  const io = req.app.get('io') as
    | { to: (room: string) => { emit: (event: string, data: unknown) => void } }
    | undefined;
  if (io) {
    io.to(`conv:${convId}`).emit('message:new', message);
    io.to(`user:${recipientId}`).emit('message:notify', { conversationId: convId, message });
  }

  res.status(201).json({ message });
}
