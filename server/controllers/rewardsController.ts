import type { Response } from 'express';
import { db } from '../db/database.ts';
import type { AuthenticatedRequest } from '../middleware/auth.ts';
import { getUserLevel, recomputeUserAchievements } from '../utils/points.ts';

const ALL_BADGES = [
  {
    key: 'reciprocal_ready',
    name: 'Reciprocal Ready',
    description: 'Added both a teachable skill and a learning goal.',
    icon: 'sync_alt',
  },
  {
    key: 'profile_pro',
    name: 'Verified Profile',
    description: 'Completed your campus profile and skill availability.',
    icon: 'verified',
  },
  {
    key: 'first_swap',
    name: 'First Skill Swap',
    description: 'Completed your first 1-for-1 learning session.',
    icon: 'handshake',
  },
  {
    key: 'campus_mentor',
    name: 'Campus Mentor',
    description: 'Completed 5 or more peer exchange sessions.',
    icon: 'school',
  },
  {
    key: 'top_rated',
    name: 'Top-Rated Peer',
    description: 'Maintained a 4.5+ star peer review rating.',
    icon: 'stars',
  },
  {
    key: 'century_club',
    name: 'Century Scholar',
    description: 'Earned 100+ reciprocal contribution points.',
    icon: 'workspace_premium',
  },
];

export function getRewardsOverview(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  recomputeUserAchievements(req.user.id);

  const user = db
    .prepare('SELECT id, full_name, points, total_sessions, rating_avg, rating_count FROM users WHERE id = ?')
    .get(req.user.id) as {
    id: number;
    full_name: string;
    points: number;
    total_sessions: number;
    rating_avg: number;
    rating_count: number;
  };

  const transactions = db
    .prepare('SELECT * FROM points_transactions WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.user.id);

  const unlockedRows = db
    .prepare('SELECT * FROM achievements WHERE user_id = ?')
    .all(req.user.id) as Array<{ badge_key: string; unlocked_at: string }>;

  const unlockedMap = new Map(unlockedRows.map((b) => [b.badge_key, b.unlocked_at]));
  const badges = ALL_BADGES.map((b) => ({
    ...b,
    unlocked: unlockedMap.has(b.key),
    unlocked_at: unlockedMap.get(b.key) || null,
  }));

  const leaderboard = db
    .prepare(
      `SELECT id, full_name, major, year, location, avatar_url, points, total_sessions, rating_avg, rating_count
       FROM users
       WHERE role = 'student' AND is_active = 1
       ORDER BY points DESC, total_sessions DESC, id ASC
       LIMIT 20`
    )
    .all() as Array<Record<string, unknown> & { id: number; points: number }>;

  const enrichedLeaderboard = leaderboard.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
    levelInfo: getUserLevel(entry.points),
    isCurrentUser: entry.id === req.user?.id,
  }));

  res.json({
    user,
    levelInfo: getUserLevel(user.points),
    transactions,
    badges,
    leaderboard: enrichedLeaderboard,
  });
}
