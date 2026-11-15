import { Router, Response } from 'express';
import { query, queryOne, execute } from '../database/pgDb';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getVapidPublicKey } from '../services/pushService';

export const notificationsRouter = Router();

// 1. List the current user's notifications (most recent 50) + unread count
notificationsRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await query(`
      SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50
    `, [req.user!.id]);

    const unreadRow = await queryOne<{ count: string }>(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = 0
    `, [req.user!.id]);

    return res.json({ notifications: notifications || [], unreadCount: Number(unreadRow?.count || 0) });
  } catch {
    return res.json({ notifications: [], unreadCount: 0 });
  }
});

// 2. Mark one notification read
notificationsRouter.post('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await execute(`UPDATE notifications SET is_read = 1 WHERE id = $1 AND user_id = $2`, [id, req.user!.id]);
    return res.json({ success: true });
  } catch {
    return res.json({ success: true });
  }
});

// 3. Mark all read
notificationsRouter.post('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await execute(`UPDATE notifications SET is_read = 1 WHERE user_id = $1`, [req.user!.id]);
    return res.json({ success: true });
  } catch {
    return res.json({ success: true });
  }
});

// 4. Return server's VAPID public key so client can subscribe to push notifications
notificationsRouter.get('/vapid-public-key', async (_req, res: Response) => {
  try {
    return res.json({ publicKey: getVapidPublicKey() });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
