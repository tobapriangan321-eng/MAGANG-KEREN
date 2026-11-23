import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db, initDatabase, hashPassword, verifyPassword, UPLOADS_DIR } from './server/db.ts';

initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '5mb' }));

// File upload configuration using Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `${base}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Gunakan PDF, DOC, DOCX, PNG, atau JPG.'));
    }
  },
});

interface AuthedUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthedRequest extends Request {
  user?: AuthedUser;
}

function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function attachUser(req: AuthedRequest, _res: Response, next: NextFunction): void {
  const token = getAuthToken(req);
  if (!token) {
    next();
    return;
  }

  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')`
    )
    .get(token) as AuthedUser | undefined;

  if (row) {
    req.user = row;
  }
  next();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Silakan masuk ke akun Anda terlebih dahulu.' });
    return;
  }
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Autentikasi diperlukan.' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Akses ditolak. Halaman ini khusus administrator.' });
    return;
  }
  next();
}

app.use(attachUser);

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatUserRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone ?? '',
    city: row.city ?? '',
    education_level: row.education_level,
    institution: row.institution ?? '',
    major: row.major ?? '',
    graduation_year: row.graduation_year ?? '',
    bio: row.bio ?? '',
    skills: parseJsonArray(row.skills as string),
    interests: parseJsonArray(row.interests as string),
    cv_filename: row.cv_filename ?? '',
    cv_url: row.cv_url ?? '',
    avatar_url: row.avatar_url ?? '',
    created_at: row.created_at,
  };
}

function formatInternshipRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    company_id: row.company_id,
    company_name: row.company_name,
    company_logo_code: row.company_logo_code,
    company_logo_color: row.company_logo_color,
    company_industry: row.company_industry,
    company_description: row.company_description,
    company_website: row.company_website,
    title: row.title,
    category: row.category,
    location: row.location,
    work_system: row.work_system,
    duration: row.duration,
    duration_months: row.duration_months,
    education_level: row.education_level,
    stipend: row.stipend,
    deadline: row.deadline,
    description: row.description,
    qualifications: parseJsonArray(row.qualifications as string),
    responsibilities: parseJsonArray(row.responsibilities as string),
    benefits: parseJsonArray(row.benefits as string),
    document_requirements: parseJsonArray(row.document_requirements as string),
    is_featured: Boolean(row.is_featured),
    status: row.status,
    applicants_count: Number(row.applicants_count ?? 0),
    created_at: row.created_at,
  };
}

// ---------- PUBLIC STATS & METADATA ----------

app.get('/api/stats', (_req: Request, res: Response) => {
  const companies = (db.prepare('SELECT COUNT(*) as c FROM companies').get() as { c: number }).c;
  const internships = (
    db.prepare("SELECT COUNT(*) as c FROM internships WHERE status = 'Aktif'").get() as { c: number }
  ).c;
  const users = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get() as { c: number }).c;
  const applications = (db.prepare('SELECT COUNT(*) as c FROM applications').get() as { c: number }).c;

  res.json({
    total_companies: companies,
    total_internships: internships,
    total_users: users,
    total_applications: applications,
  });
});

// ---------- COMPANIES ----------

app.get('/api/companies', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM companies ORDER BY name ASC').all();
  res.json(rows);
});

// ---------- INTERNSHIPS ----------

app.get('/api/internships', (req: Request, res: Response) => {
  const { q, company, category, location, work_system, duration, education_level, include_closed } = req.query;

  let sql = `
    SELECT i.*, c.name as company_name, c.logo_code as company_logo_code,
           c.logo_color as company_logo_color, c.industry as company_industry,
           c.description as company_description, c.website as company_website,
           (SELECT COUNT(*) FROM applications a WHERE a.internship_id = i.id) as applicants_count
    FROM internships i
    JOIN companies c ON c.id = i.company_id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (include_closed !== 'true') {
    sql += " AND i.status = 'Aktif'";
  }

  if (q && typeof q === 'string' && q.trim()) {
    const term = `%${q.trim().toLowerCase()}%`;
    sql += ' AND (LOWER(i.title) LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(i.description) LIKE ?)';
    params.push(term, term, term);
  }

  if (company && typeof company === 'string' && company.trim()) {
    sql += ' AND LOWER(c.name) LIKE ?';
    params.push(`%${company.trim().toLowerCase()}%`);
  }

  if (category && typeof category === 'string' && category !== 'Semua') {
    sql += ' AND i.category = ?';
    params.push(category);
  }

  if (location && typeof location === 'string' && location !== 'Semua') {
    sql += ' AND LOWER(i.location) LIKE ?';
    params.push(`%${location.trim().toLowerCase()}%`);
  }

  if (work_system && typeof work_system === 'string' && work_system !== 'Semua') {
    sql += ' AND i.work_system = ?';
    params.push(work_system);
  }

  if (education_level && typeof education_level === 'string' && education_level !== 'Semua') {
    sql += ' AND i.education_level = ?';
    params.push(education_level);
  }

  if (duration && typeof duration === 'string' && duration !== 'Semua') {
    if (duration === '1-3 Bulan') {
      sql += ' AND i.duration_months BETWEEN 1 AND 3';
    } else if (duration === '4-6 Bulan') {
      sql += ' AND i.duration_months BETWEEN 4 AND 6';
    } else if (duration === '> 6 Bulan') {
      sql += ' AND i.duration_months > 6';
    }
  }

  sql += ' ORDER BY i.is_featured DESC, i.id DESC';

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  res.json(rows.map(formatInternshipRow));
});

app.get('/api/internships/:id', (req: Request, res: Response) => {
  const row = db
    .prepare(
      `SELECT i.*, c.name as company_name, c.logo_code as company_logo_code,
              c.logo_color as company_logo_color, c.industry as company_industry,
              c.description as company_description, c.website as company_website,
              (SELECT COUNT(*) FROM applications a WHERE a.internship_id = i.id) as applicants_count
       FROM internships i
       JOIN companies c ON c.id = i.company_id
       WHERE i.id = ?`
    )
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Lowongan magang tidak ditemukan.' });
    return;
  }

  res.json(formatInternshipRow(row));
});

// ---------- AUTHENTICATION ----------

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, education_level, institution, major, city } = req.body ?? {};
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Nama lengkap, email, dan kata sandi wajib diisi.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'Email sudah terdaftar. Silakan masuk dengan akun Anda.' });
    return;
  }

  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, education_level, institution, major, city, skills, interests)
       VALUES (?, ?, ?, 'user', ?, ?, ?, ?, '[]', '[]')`
    )
    .run(
      String(name).trim(),
      normalizedEmail,
      hashPassword(password),
      education_level || 'Mahasiswa',
      institution || '',
      major || '',
      city || ''
    );

  const userId = Number(info.lastInsertRowid);
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(
    token,
    userId
  );

  db.prepare('INSERT INTO activities (user_id, type, title, description) VALUES (?, ?, ?, ?)').run(
    userId,
    'profile',
    'Akun Berhasil Dibuat',
    'Selamat datang di MAGANG KEREN. Lengkapi profil dan unggah CV Anda untuk mulai melamar.'
  );

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown>;
  res.status(201).json({ token, user: formatUserRow(userRow) });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail) as
    | (Record<string, unknown> & { password_hash: string; id: number })
    | undefined;

  if (!userRow || !verifyPassword(String(password), userRow.password_hash)) {
    res.status(401).json({ error: 'Email atau kata sandi tidak sesuai.' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  db.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+7 days'))").run(
    token,
    userRow.id
  );

  res.json({ token, user: formatUserRow(userRow) });
});

app.post('/api/auth/logout', (req: AuthedRequest, res: Response) => {
  const token = getAuthToken(req);
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as Record<string, unknown> | undefined;
  if (!row) {
    res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
    return;
  }
  res.json({ user: formatUserRow(row) });
});

// ---------- USER PROFILE & FILE UPLOAD ----------

app.post('/api/upload', requireAuth, (req: AuthedRequest, res: Response) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah berkas.';
      res.status(400).json({ error: msg });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'Tidak ada berkas yang dipilih.' });
      return;
    }

    res.json({
      filename: req.file.originalname,
      stored_name: req.file.filename,
      url: `/api/uploads/${req.file.filename}`,
      size: req.file.size,
    });
  });
});

app.get('/api/uploads/:filename', (req: Request, res: Response) => {
  const safeName = path.basename(String(req.params.filename));
  const fullPath = path.join(UPLOADS_DIR, safeName);
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'Berkas tidak ditemukan.' });
    return;
  }
  res.sendFile(fullPath);
});

app.put('/api/profile', requireAuth, (req: AuthedRequest, res: Response) => {
  const {
    name,
    phone,
    city,
    education_level,
    institution,
    major,
    graduation_year,
    bio,
    skills,
    interests,
    cv_filename,
    cv_url,
  } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Nama lengkap tidak boleh kosong.' });
    return;
  }

  db.prepare(
    `UPDATE users SET
      name = ?, phone = ?, city = ?, education_level = ?, institution = ?,
      major = ?, graduation_year = ?, bio = ?, skills = ?, interests = ?,
      cv_filename = COALESCE(?, cv_filename), cv_url = COALESCE(?, cv_url)
     WHERE id = ?`
  ).run(
    name.trim(),
    phone ?? '',
    city ?? '',
    education_level ?? 'Mahasiswa',
    institution ?? '',
    major ?? '',
    graduation_year ?? '',
    bio ?? '',
    JSON.stringify(Array.isArray(skills) ? skills : []),
    JSON.stringify(Array.isArray(interests) ? interests : []),
    cv_filename ?? null,
    cv_url ?? null,
    req.user!.id
  );

  db.prepare('INSERT INTO activities (user_id, type, title, description) VALUES (?, ?, ?, ?)').run(
    req.user!.id,
    'profile',
    'Profil Diperbarui',
    'Informasi profil, pendidikan, keahlian, atau CV Anda berhasil disimpan.'
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as Record<string, unknown>;
  res.json({ user: formatUserRow(updated) });
});

// ---------- SAVED INTERNSHIPS ----------

app.get('/api/saved', requireAuth, (req: AuthedRequest, res: Response) => {
  const rows = db
    .prepare(
      `SELECT i.*, c.name as company_name, c.logo_code as company_logo_code,
              c.logo_color as company_logo_color, c.industry as company_industry,
              c.description as company_description, c.website as company_website,
              (SELECT COUNT(*) FROM applications a WHERE a.internship_id = i.id) as applicants_count
       FROM saved_internships s
       JOIN internships i ON i.id = s.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE s.user_id = ?
       ORDER BY s.created_at DESC`
    )
    .all(req.user!.id) as Record<string, unknown>[];

  res.json(rows.map(formatInternshipRow));
});

app.post('/api/saved/:internshipId', requireAuth, (req: AuthedRequest, res: Response) => {
  const internshipId = Number(req.params.internshipId);
  const internship = db
    .prepare(
      `SELECT i.title, c.name as company_name
       FROM internships i JOIN companies c ON c.id = i.company_id
       WHERE i.id = ?`
    )
    .get(internshipId) as { title: string; company_name: string } | undefined;

  if (!internship) {
    res.status(404).json({ error: 'Lowongan tidak ditemukan.' });
    return;
  }

  db.prepare('INSERT OR IGNORE INTO saved_internships (user_id, internship_id) VALUES (?, ?)').run(
    req.user!.id,
    internshipId
  );

  db.prepare('INSERT INTO activities (user_id, type, title, description) VALUES (?, ?, ?, ?)').run(
    req.user!.id,
    'save',
    'Menyimpan Lowongan',
    `Menyimpan lowongan ${internship.title} di ${internship.company_name}.`
  );

  res.json({ saved: true });
});

app.delete('/api/saved/:internshipId', requireAuth, (req: AuthedRequest, res: Response) => {
  const internshipId = Number(req.params.internshipId);
  db.prepare('DELETE FROM saved_internships WHERE user_id = ? AND internship_id = ?').run(
    req.user!.id,
    internshipId
  );
  res.json({ saved: false });
});

// ---------- USER APPLICATIONS & ACTIVITIES ----------

app.get('/api/applications/me', requireAuth, (req: AuthedRequest, res: Response) => {
  const rows = db
    .prepare(
      `SELECT a.*, i.title as internship_title, i.location, i.work_system,
              c.name as company_name, c.logo_code as company_logo_code, c.logo_color as company_logo_color
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC`
    )
    .all(req.user!.id);

  res.json(rows);
});

app.post('/api/applications', requireAuth, (req: AuthedRequest, res: Response) => {
  const {
    internship_id,
    applicant_name,
    applicant_email,
    applicant_phone,
    education_level,
    institution,
    cover_letter,
    availability_date,
    portfolio_url,
    cv_filename,
    cv_url,
    support_doc_filename,
    support_doc_url,
  } = req.body ?? {};

  if (!internship_id || !applicant_name || !applicant_email || !applicant_phone || !institution || !cover_letter || !cv_url) {
    res.status(400).json({ error: 'Lengkapi seluruh data lamaran dan unggah CV Anda.' });
    return;
  }

  const internship = db
    .prepare(
      `SELECT i.id, i.title, i.status, c.name as company_name
       FROM internships i JOIN companies c ON c.id = i.company_id
       WHERE i.id = ?`
    )
    .get(internship_id) as { id: number; title: string; status: string; company_name: string } | undefined;

  if (!internship || internship.status !== 'Aktif') {
    res.status(404).json({ error: 'Lowongan magang tidak tersedia atau sudah ditutup.' });
    return;
  }

  const duplicate = db
    .prepare('SELECT id FROM applications WHERE user_id = ? AND internship_id = ?')
    .get(req.user!.id, internship.id);
  if (duplicate) {
    res.status(409).json({ error: 'Anda sudah mengirimkan lamaran untuk posisi magang ini.' });
    return;
  }

  const refCode = `MK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const info = db
    .prepare(
      `INSERT INTO applications (
        reference_code, internship_id, user_id, applicant_name, applicant_email,
        applicant_phone, education_level, institution, cover_letter, availability_date,
        portfolio_url, cv_filename, cv_url, support_doc_filename, support_doc_url, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Menunggu Review')`
    )
    .run(
      refCode,
      internship.id,
      req.user!.id,
      String(applicant_name).trim(),
      String(applicant_email).trim(),
      String(applicant_phone).trim(),
      education_level || 'Mahasiswa',
      String(institution).trim(),
      String(cover_letter).trim(),
      availability_date || new Date().toISOString().slice(0, 10),
      portfolio_url ?? '',
      cv_filename || 'CV_Pelamar.pdf',
      cv_url,
      support_doc_filename ?? '',
      support_doc_url ?? ''
    );

  db.prepare('INSERT INTO activities (user_id, type, title, description) VALUES (?, ?, ?, ?)').run(
    req.user!.id,
    'apply',
    'Lamaran Terkirim',
    `Berhasil mendaftar posisi ${internship.title} di ${internship.company_name} (Kode: ${refCode}).`
  );

  const created = db
    .prepare(
      `SELECT a.*, i.title as internship_title, i.location, i.work_system,
              c.name as company_name, c.logo_code as company_logo_code, c.logo_color as company_logo_color
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE a.id = ?`
    )
    .get(info.lastInsertRowid);

  res.status(201).json(created);
});

app.get('/api/activities/me', requireAuth, (req: AuthedRequest, res: Response) => {
  const rows = db
    .prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY id DESC LIMIT 15')
    .all(req.user!.id);
  res.json(rows);
});

// ---------- ADMIN ROUTES ----------

app.get('/api/admin/overview', requireAdmin, (_req: AuthedRequest, res: Response) => {
  const totalUsers = (db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'user'").get() as { c: number }).c;
  const totalCompanies = (db.prepare('SELECT COUNT(*) as c FROM companies').get() as { c: number }).c;
  const totalInternships = (db.prepare('SELECT COUNT(*) as c FROM internships').get() as { c: number }).c;
  const activeInternships = (
    db.prepare("SELECT COUNT(*) as c FROM internships WHERE status = 'Aktif'").get() as { c: number }
  ).c;
  const totalApplications = (db.prepare('SELECT COUNT(*) as c FROM applications').get() as { c: number }).c;

  const statusBreakdown = db
    .prepare('SELECT status, COUNT(*) as count FROM applications GROUP BY status')
    .all() as { status: string; count: number }[];

  const categoryBreakdown = db
    .prepare('SELECT category, COUNT(*) as count FROM internships GROUP BY category ORDER BY count DESC')
    .all() as { category: string; count: number }[];

  res.json({
    total_users: totalUsers,
    total_companies: totalCompanies,
    total_internships: totalInternships,
    active_internships: activeInternships,
    total_applications: totalApplications,
    status_breakdown: statusBreakdown,
    category_breakdown: categoryBreakdown,
  });
});

app.post('/api/admin/companies', requireAdmin, (req: AuthedRequest, res: Response) => {
  const { name, industry, location, website, description, logo_code, logo_color, employee_count } = req.body ?? {};
  if (!name || !industry || !location) {
    res.status(400).json({ error: 'Nama perusahaan, bidang industri, dan lokasi wajib diisi.' });
    return;
  }

  const code =
    logo_code && String(logo_code).trim()
      ? String(logo_code).trim().slice(0, 2).toUpperCase()
      : String(name)
          .trim()
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

  const info = db
    .prepare(
      `INSERT INTO companies (name, industry, location, website, description, logo_code, logo_color, employee_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      String(name).trim(),
      industry,
      String(location).trim(),
      website ?? '',
      description ?? '',
      code,
      logo_color || '#0F172A',
      employee_count || '50-200 Karyawan'
    );

  const created = db.prepare('SELECT * FROM companies WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.put('/api/admin/companies/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  const { name, industry, location, website, description, logo_code, logo_color, employee_count } = req.body ?? {};
  if (!name || !industry || !location) {
    res.status(400).json({ error: 'Nama perusahaan, bidang industri, dan lokasi wajib diisi.' });
    return;
  }

  db.prepare(
    `UPDATE companies
     SET name = ?, industry = ?, location = ?, website = ?, description = ?,
         logo_code = ?, logo_color = ?, employee_count = ?
     WHERE id = ?`
  ).run(
    String(name).trim(),
    industry,
    String(location).trim(),
    website ?? '',
    description ?? '',
    logo_code || 'MK',
    logo_color || '#0F172A',
    employee_count || '50-200 Karyawan',
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/api/admin/companies/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.post('/api/admin/internships', requireAdmin, (req: AuthedRequest, res: Response) => {
  const {
    company_id,
    title,
    category,
    location,
    work_system,
    duration,
    duration_months,
    education_level,
    stipend,
    deadline,
    description,
    qualifications,
    responsibilities,
    benefits,
    document_requirements,
    is_featured,
    status,
  } = req.body ?? {};

  if (!company_id || !title || !category || !location || !work_system || !duration || !education_level || !deadline || !description) {
    res.status(400).json({ error: 'Lengkapi seluruh kolom wajib lowongan magang.' });
    return;
  }

  const months = Number(duration_months) || parseInt(String(duration), 10) || 3;

  const info = db
    .prepare(
      `INSERT INTO internships (
        company_id, title, category, location, work_system, duration, duration_months,
        education_level, stipend, deadline, description, qualifications, responsibilities,
        benefits, document_requirements, is_featured, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      Number(company_id),
      String(title).trim(),
      category,
      String(location).trim(),
      work_system,
      String(duration).trim(),
      months,
      education_level,
      stipend || 'Uang Saku Kompetitif',
      deadline,
      String(description).trim(),
      JSON.stringify(Array.isArray(qualifications) ? qualifications : []),
      JSON.stringify(Array.isArray(responsibilities) ? responsibilities : []),
      JSON.stringify(Array.isArray(benefits) ? benefits : []),
      JSON.stringify(Array.isArray(document_requirements) ? document_requirements : []),
      is_featured ? 1 : 0,
      status || 'Aktif'
    );

  const row = db
    .prepare(
      `SELECT i.*, c.name as company_name, c.logo_code as company_logo_code,
              c.logo_color as company_logo_color, c.industry as company_industry,
              c.description as company_description, c.website as company_website,
              0 as applicants_count
       FROM internships i JOIN companies c ON c.id = i.company_id
       WHERE i.id = ?`
    )
    .get(info.lastInsertRowid) as Record<string, unknown>;

  res.status(201).json(formatInternshipRow(row));
});

app.put('/api/admin/internships/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  const {
    company_id,
    title,
    category,
    location,
    work_system,
    duration,
    duration_months,
    education_level,
    stipend,
    deadline,
    description,
    qualifications,
    responsibilities,
    benefits,
    document_requirements,
    is_featured,
    status,
  } = req.body ?? {};

  const months = Number(duration_months) || parseInt(String(duration), 10) || 3;

  db.prepare(
    `UPDATE internships SET
      company_id = ?, title = ?, category = ?, location = ?, work_system = ?,
      duration = ?, duration_months = ?, education_level = ?, stipend = ?, deadline = ?,
      description = ?, qualifications = ?, responsibilities = ?, benefits = ?,
      document_requirements = ?, is_featured = ?, status = ?
     WHERE id = ?`
  ).run(
    Number(company_id),
    String(title).trim(),
    category,
    String(location).trim(),
    work_system,
    String(duration).trim(),
    months,
    education_level,
    stipend || 'Uang Saku Kompetitif',
    deadline,
    String(description).trim(),
    JSON.stringify(Array.isArray(qualifications) ? qualifications : []),
    JSON.stringify(Array.isArray(responsibilities) ? responsibilities : []),
    JSON.stringify(Array.isArray(benefits) ? benefits : []),
    JSON.stringify(Array.isArray(document_requirements) ? document_requirements : []),
    is_featured ? 1 : 0,
    status || 'Aktif',
    req.params.id
  );

  const row = db
    .prepare(
      `SELECT i.*, c.name as company_name, c.logo_code as company_logo_code,
              c.logo_color as company_logo_color, c.industry as company_industry,
              c.description as company_description, c.website as company_website,
              (SELECT COUNT(*) FROM applications a WHERE a.internship_id = i.id) as applicants_count
       FROM internships i JOIN companies c ON c.id = i.company_id
       WHERE i.id = ?`
    )
    .get(req.params.id) as Record<string, unknown>;

  res.json(formatInternshipRow(row));
});

app.delete('/api/admin/internships/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  db.prepare('DELETE FROM internships WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

app.get('/api/admin/applications', requireAdmin, (_req: AuthedRequest, res: Response) => {
  const rows = db
    .prepare(
      `SELECT a.*, i.title as internship_title, i.location, i.work_system,
              c.name as company_name, c.logo_code as company_logo_code, c.logo_color as company_logo_color
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       ORDER BY a.created_at DESC`
    )
    .all();

  res.json(rows);
});

app.patch('/api/admin/applications/:id/status', requireAdmin, (req: AuthedRequest, res: Response) => {
  const { status, admin_note } = req.body ?? {};
  const validStatuses = ['Menunggu Review', 'Sedang Diproses', 'Diterima', 'Ditolak'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Status lamaran tidak valid.' });
    return;
  }

  const existing = db
    .prepare(
      `SELECT a.user_id, a.reference_code, i.title as internship_title, c.name as company_name
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE a.id = ?`
    )
    .get(req.params.id) as
    | { user_id: number; reference_code: string; internship_title: string; company_name: string }
    | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Data lamaran tidak ditemukan.' });
    return;
  }

  db.prepare("UPDATE applications SET status = ?, admin_note = ?, updated_at = datetime('now') WHERE id = ?").run(
    status,
    admin_note ?? '',
    req.params.id
  );

  db.prepare('INSERT INTO activities (user_id, type, title, description) VALUES (?, ?, ?, ?)').run(
    existing.user_id,
    'status',
    `Status Diperbarui: ${status}`,
    `Lamaran ${existing.reference_code} untuk posisi ${existing.internship_title} di ${existing.company_name} kini berstatus ${status}.`
  );

  const updated = db
    .prepare(
      `SELECT a.*, i.title as internship_title, i.location, i.work_system,
              c.name as company_name, c.logo_code as company_logo_code, c.logo_color as company_logo_color
       FROM applications a
       JOIN internships i ON i.id = a.internship_id
       JOIN companies c ON c.id = i.company_id
       WHERE a.id = ?`
    )
    .get(req.params.id);

  res.json(updated);
});

app.get('/api/admin/users', requireAdmin, (_req: AuthedRequest, res: Response) => {
  const rows = db
    .prepare(
      `SELECT u.*,
              (SELECT COUNT(*) FROM applications a WHERE a.user_id = u.id) as applications_count
       FROM users u
       ORDER BY u.created_at DESC`
    )
    .all() as (Record<string, unknown> & { applications_count: number })[];

  res.json(
    rows.map((row) => ({
      ...formatUserRow(row),
      applications_count: row.applications_count,
    }))
  );
});

app.patch('/api/admin/users/:id/role', requireAdmin, (req: AuthedRequest, res: Response) => {
  const { role } = req.body ?? {};
  if (role !== 'user' && role !== 'admin') {
    res.status(400).json({ error: 'Peran tidak valid.' });
    return;
  }
  if (Number(req.params.id) === req.user!.id && role !== 'admin') {
    res.status(400).json({ error: 'Anda tidak dapat menurunkan peran akun Anda sendiri.' });
    return;
  }

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  res.json({ success: true });
});

app.delete('/api/admin/users/:id', requireAdmin, (req: AuthedRequest, res: Response) => {
  if (Number(req.params.id) === req.user!.id) {
    res.status(400).json({ error: 'Anda tidak dapat menghapus akun yang sedang digunakan.' });
    return;
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---------- VITE / STATIC SERVER SETUP ----------

async function startServer(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MAGANG KEREN server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
