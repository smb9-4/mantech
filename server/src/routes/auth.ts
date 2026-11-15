import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { queryOne } from '../database/pgDb';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth';
import { logAudit } from '../middleware/audit';

export const authRouter = Router();

// Fallback users for local testing / offline Neon DB
const LOCAL_USERS: Record<string, any> = {
  // Student: Bhoomika Naik
  'student@sirmv.edu.in': {
    id: 'stu-smg-001',
    username: 'student',
    role: 'STUDENT',
    name: 'Bhoomika Naik',
    email: 'student@sirmv.edu.in',
    phone: '+91 98765 43210',
    branch_id: 'branch-smg',
    branch_name: 'SIR MV PU College - Shivamogga',
    branch_code: 'SIRMV-SMG',
    branch_city: 'Shivamogga',
    student_id: 'stu-smg-001',
    roll_number: '2026PUCSMG001'
  },
  'student.demo@college.test': {
    id: 'stu-smg-001',
    username: 'student',
    role: 'STUDENT',
    name: 'Bhoomika Naik',
    email: 'student@sirmv.edu.in',
    phone: '+91 98765 43210',
    branch_id: 'branch-smg',
    branch_name: 'SIR MV PU College - Shivamogga',
    branch_code: 'SIRMV-SMG',
    branch_city: 'Shivamogga',
    student_id: 'stu-smg-001',
    roll_number: '2026PUCSMG001'
  },
  'bhoomika': {
    id: 'stu-smg-001',
    username: 'student',
    role: 'STUDENT',
    name: 'Bhoomika Naik',
    email: 'student@sirmv.edu.in',
    phone: '+91 98765 43210',
    branch_id: 'branch-smg',
    branch_name: 'SIR MV PU College - Shivamogga',
    branch_code: 'SIRMV-SMG',
    branch_city: 'Shivamogga',
    student_id: 'stu-smg-001',
    roll_number: '2026PUCSMG001'
  },
  // Parent: Mr. Naveen Naik
  'parent@sirmv.edu.in': {
    id: 'par-smg-001',
    username: 'parent',
    role: 'PARENT',
    name: 'Mr. Naveen Naik',
    email: 'parent@sirmv.edu.in',
    phone: '+91 98765 43210',
    branch_id: 'branch-smg',
    branch_name: 'SIR MV PU College - Shivamogga',
    branch_code: 'SIRMV-SMG',
    branch_city: 'Shivamogga'
  },
  'parent.demo@college.test': {
    id: 'par-smg-001',
    username: 'parent',
    role: 'PARENT',
    name: 'Mr. Naveen Naik',
    email: 'parent@sirmv.edu.in',
    phone: '+91 98765 43210',
    branch_id: 'branch-smg',
    branch_name: 'SIR MV PU College - Shivamogga',
    branch_code: 'SIRMV-SMG',
    branch_city: 'Shivamogga'
  },
  'naveen': {
    id: 'par-smg-001',
    username: 'parent',
    role: 'PARENT',
    name: 'Mr. Naveen Naik',
    email: 'parent@sirmv.edu.in',
    phone: '+91 98765 43210',
    branch_id: 'branch-smg',
    branch_name: 'SIR MV PU College - Shivamogga',
    branch_code: 'SIRMV-SMG',
    branch_city: 'Shivamogga'
  },
  // Admin: Campus Administrator
  'admin@sirmv.edu.in': {
    id: 'adm-smg-001',
    username: 'admin',
    role: 'ADMIN',
    name: 'Campus Administrator',
    email: 'admin@sirmv.edu.in',
    phone: '+91 81822 55667',
    branch_id: 'branch-smg',
    branch_name: 'SIR MV PU College - Shivamogga',
    branch_code: 'SIRMV-SMG',
    branch_city: 'Shivamogga'
  },
  'admin.demo@college.test': {
    id: 'adm-smg-001',
    username: 'admin',
    role: 'ADMIN',
    name: 'Campus Administrator',
    email: 'admin@sirmv.edu.in',
    phone: '+91 81822 55667',
    branch_id: 'branch-smg',
    branch_name: 'SIR MV PU College - Shivamogga',
    branch_code: 'SIRMV-SMG',
    branch_city: 'Shivamogga'
  }
};

// 1. Login (supports email or username with testing password 123456)
authRouter.post('/login', async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const identifier = (email || username || req.body.identifier || '').trim().toLowerCase();

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/Username and password are required.' });
  }

  // 1. Check local fallback users first if identifier matches
  const localUser = LOCAL_USERS[identifier] ||
    Object.values(LOCAL_USERS).find((u: any) => u.username === identifier || u.id === identifier);

  if (localUser && (password === '123456' || password === 'Demo@12345')) {
    const tokenPayload = {
      id: localUser.id,
      username: localUser.username,
      role: localUser.role,
      name: localUser.name,
      email: localUser.email,
      phone: localUser.phone,
      branch_id: localUser.branch_id,
      avatar_url: localUser.avatar_url,
      student_id: localUser.student_id
    };
    const token = generateToken(tokenPayload);
    return res.json({
      token,
      user: {
        ...tokenPayload,
        branch_name: localUser.branch_name,
        branch_code: localUser.branch_code
      }
    });
  }

  // 2. Query Postgres
  try {
    const user = await queryOne(`
      SELECT u.*, b.name as branch_name, b.code as branch_code,
             tp.id as teacher_profile_id,
             sp.id as student_profile_id
      FROM users u
      JOIN branches b ON u.branch_id = b.id
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.username = $1 
         OR LOWER(u.email) = LOWER($1)
         OR u.username = LOWER(SPLIT_PART($1, '@', 1))
         OR LOWER(u.role) = LOWER($1)
    `, [identifier]);

    if (!user) {
      if (localUser) {
        const tokenPayload = {
          id: localUser.id,
          username: localUser.username,
          role: localUser.role,
          name: localUser.name,
          email: localUser.email,
          phone: localUser.phone,
          branch_id: localUser.branch_id,
          avatar_url: localUser.avatar_url,
          student_id: localUser.student_id
        };
        const token = generateToken(tokenPayload);
        return res.json({
          token,
          user: {
            ...tokenPayload,
            branch_name: localUser.branch_name,
            branch_code: localUser.branch_code
          }
        });
      }
      return res.status(401).json({ error: 'User account not found.' });
    }

    // Testing password '123456' or 'Demo@12345' or standard bcrypt hash verification
    const isMatch = password === '123456' || password === 'Demo@12345' || bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password. Use test password 123456.' });
    }

    if (user.is_active !== 1) {
      return res.status(403).json({ error: 'Account is deactivated. Please contact campus administration.' });
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email,
      phone: user.phone,
      branch_id: user.branch_id,
      avatar_url: user.avatar_url,
      teacher_id: user.teacher_profile_id,
      student_id: user.student_profile_id
    };

    const token = generateToken(tokenPayload);

    await logAudit({ user: tokenPayload } as AuthRequest, 'USER_LOGIN', 'users', user.id, {
      username: user.username,
      email: user.email,
      role: user.role
    }).catch(() => {});

    return res.json({
      token,
      user: {
        ...tokenPayload,
        branch_name: user.branch_name,
        branch_code: user.branch_code
      }
    });
  } catch (err: any) {
    // If Postgres failed but we have a matching local user
    if (localUser && (password === '123456' || password === 'Demo@12345')) {
      const tokenPayload = {
        id: localUser.id,
        username: localUser.username,
        role: localUser.role,
        name: localUser.name,
        email: localUser.email,
        phone: localUser.phone,
        branch_id: localUser.branch_id,
        avatar_url: localUser.avatar_url,
        student_id: localUser.student_id
      };
      const token = generateToken(tokenPayload);
      return res.json({
        token,
        user: {
          ...tokenPayload,
          branch_name: localUser.branch_name,
          branch_code: localUser.branch_code
        }
      });
    }
    return res.status(500).json({ error: err.message });
  }
});

// 2. Get current user profile
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const me = req.user!;
  const localMatch = Object.values(LOCAL_USERS).find((u: any) => u.id === me.id);
  if (localMatch) {
    return res.json({
      user: {
        ...localMatch,
        ...me
      }
    });
  }

  try {
    const user = await queryOne(`
      SELECT u.*, b.name as branch_name, b.code as branch_code, b.city as branch_city,
             tp.id as teacher_profile_id,
             sp.id as student_profile_id
      FROM users u
      JOIN branches b ON u.branch_id = b.id
      LEFT JOIN teacher_profiles tp ON u.id = tp.user_id
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = $1
    `, [me.id]);

    if (!user) {
      return res.json({ user: me });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        email: user.email,
        phone: user.phone,
        branch_id: user.branch_id,
        branch_name: user.branch_name,
        branch_code: user.branch_code,
        branch_city: user.branch_city,
        avatar_url: user.avatar_url,
        staff_category: user.staff_category,
        teacher_id: user.teacher_profile_id,
        student_id: user.student_profile_id
      }
    });
  } catch {
    return res.json({ user: me });
  }
});

// 3. Clean Institutional Role Accounts for Testing
authRouter.get('/demo-accounts', async (_req: Request, res: Response) => {
  const accounts = [
    { email: 'admin@sirmv.edu.in', role: 'ADMIN', label: 'Administrator', title: 'Campus Admin' },
    { email: 'student@sirmv.edu.in', role: 'STUDENT', label: 'Student Portal', title: 'Bhoomika Naik' },
    { email: 'parent@sirmv.edu.in', role: 'PARENT', label: 'Parent Portal', title: 'Mr. Naveen Naik' }
  ];
  return res.json({ accounts, defaultPassword: '123456' });
});
