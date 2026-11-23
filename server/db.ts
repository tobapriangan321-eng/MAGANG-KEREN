import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export const db = new Database(path.join(DATA_DIR, 'magang_keren.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const hashBuffer = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  if (hashBuffer.length !== keyBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, keyBuffer);
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      phone TEXT DEFAULT '',
      city TEXT DEFAULT '',
      education_level TEXT NOT NULL DEFAULT 'Mahasiswa',
      institution TEXT DEFAULT '',
      major TEXT DEFAULT '',
      graduation_year TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      skills TEXT NOT NULL DEFAULT '[]',
      interests TEXT NOT NULL DEFAULT '[]',
      cv_filename TEXT DEFAULT '',
      cv_url TEXT DEFAULT '',
      avatar_url TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      location TEXT NOT NULL,
      website TEXT DEFAULT '',
      description TEXT DEFAULT '',
      logo_code TEXT NOT NULL,
      logo_color TEXT NOT NULL DEFAULT '#0F172A',
      employee_count TEXT DEFAULT '50-200 Karyawan',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      work_system TEXT NOT NULL,
      duration TEXT NOT NULL,
      duration_months INTEGER NOT NULL DEFAULT 3,
      education_level TEXT NOT NULL,
      stipend TEXT DEFAULT 'Uang Saku Kompetitif',
      deadline TEXT NOT NULL,
      description TEXT NOT NULL,
      qualifications TEXT NOT NULL DEFAULT '[]',
      responsibilities TEXT NOT NULL DEFAULT '[]',
      benefits TEXT NOT NULL DEFAULT '[]',
      document_requirements TEXT NOT NULL DEFAULT '[]',
      is_featured INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Aktif',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_code TEXT NOT NULL UNIQUE,
      internship_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      applicant_name TEXT NOT NULL,
      applicant_email TEXT NOT NULL,
      applicant_phone TEXT NOT NULL,
      education_level TEXT NOT NULL,
      institution TEXT NOT NULL,
      cover_letter TEXT NOT NULL,
      availability_date TEXT NOT NULL,
      portfolio_url TEXT DEFAULT '',
      cv_filename TEXT NOT NULL,
      cv_url TEXT NOT NULL,
      support_doc_filename TEXT DEFAULT '',
      support_doc_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Menunggu Review',
      admin_note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS saved_internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      internship_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, internship_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const companyCount = db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number };
  if (companyCount.count === 0) {
    seedDatabase();
  }
}

function createSamplePdf(filePath: string, title: string): void {
  if (fs.existsSync(filePath)) return;
  const pdfContent = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 98 >> stream
BT /F1 18 Tf 72 720 Td (${title}) Tj 0 -28 Td /F1 12 Tf (Dokumen CV Resmi Terlampir - MAGANG KEREN) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000389 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
457
%%EOF`;
  fs.writeFileSync(filePath, pdfContent, 'utf-8');
}

function seedDatabase(): void {
  createSamplePdf(path.join(UPLOADS_DIR, 'cv_nadia_putri_sample.pdf'), 'CV Nadia Putri - Teknik Informatika');
  createSamplePdf(path.join(UPLOADS_DIR, 'cv_rizky_pratama_sample.pdf'), 'CV Rizky Pratama - SMK RPL');
  createSamplePdf(path.join(UPLOADS_DIR, 'cv_sinta_wijaya_sample.pdf'), 'CV Sinta Wijaya - Manajemen Bisnis');

  const insertCompany = db.prepare(`
    INSERT INTO companies (name, industry, location, website, description, logo_code, logo_color, employee_count)
    VALUES (@name, @industry, @location, @website, @description, @logo_code, @logo_color, @employee_count)
  `);

  const companiesData = [
    {
      name: 'Nusantara Cloud Tech',
      industry: 'Teknologi dan IT',
      location: 'Jakarta Selatan',
      website: 'https://nusantaracloud.id',
      description: 'Perusahaan teknologi infrastruktur cloud dan SaaS B2B yang melayani lebih dari 1.200 perusahaan di Asia Tenggara.',
      logo_code: 'NC',
      logo_color: '#0F172A',
      employee_count: '200-500 Karyawan',
    },
    {
      name: 'Artha Niaga Strategi',
      industry: 'Bisnis dan Manajemen',
      location: 'Jakarta Pusat',
      website: 'https://arthaniaga.co.id',
      description: 'Konsultan manajemen bisnis dan ekspansi ritel modern yang fokus pada transformasi operasional UMKM hingga korporasi.',
      logo_code: 'AN',
      logo_color: '#1E3A8A',
      employee_count: '50-200 Karyawan',
    },
    {
      name: 'Mandiri Ventura Kapital',
      industry: 'Keuangan dan Akuntansi',
      location: 'Jakarta Selatan',
      website: 'https://mandiriventura.id',
      description: 'Lembaga investasi modal ventura dan penasihat keuangan untuk perusahaan rintisan tahap awal hingga seri B.',
      logo_code: 'MV',
      logo_color: '#0369A1',
      employee_count: '50-200 Karyawan',
    },
    {
      name: 'Kreasi Studio Jakarta',
      industry: 'Desain dan Kreatif',
      location: 'Bandung',
      website: 'https://kreasistudio.id',
      description: 'Studio desain produk digital, sistem identitas merek, dan pengalaman pengguna untuk produk web dan seluler.',
      logo_code: 'KS',
      logo_color: '#1E293B',
      employee_count: '20-50 Karyawan',
    },
    {
      name: 'Eduka Digital Indonesia',
      industry: 'Pendidikan',
      location: 'Yogyakarta',
      website: 'https://edukadigital.id',
      description: 'Platform pembelajaran interaktif dan pengembangan kurikulum vokasi berbasis teknologi untuk sekolah dan perguruan tinggi.',
      logo_code: 'ED',
      logo_color: '#0F766E',
      employee_count: '50-200 Karyawan',
    },
    {
      name: 'Aksara Media Group',
      industry: 'Komunikasi dan Media',
      location: 'Jakarta Pusat',
      website: 'https://aksaramedia.id',
      description: 'Jaringan media digital, jurnalisme data, dan produksi konten komunikasi strategis nasional.',
      logo_code: 'AM',
      logo_color: '#334155',
      employee_count: '200-500 Karyawan',
    },
    {
      name: 'Lexis & Partners Law',
      industry: 'Hukum',
      location: 'Surabaya',
      website: 'https://lexispartners.co.id',
      description: 'Firma hukum korporasi, kekayaan intelektual, kepatuhan regulasi digital, dan kontrak komersial.',
      logo_code: 'LP',
      logo_color: '#1E293B',
      employee_count: '20-50 Karyawan',
    },
    {
      name: 'SehatSentosa Medika',
      industry: 'Kesehatan',
      location: 'Tangerang Selatan',
      website: 'https://sehatsentosa.id',
      description: 'Penyedia layanan kesehatan terintegrasi dan sistem manajemen rekam medis digital untuk klinik modern.',
      logo_code: 'SS',
      logo_color: '#0284C7',
      employee_count: '200-500 Karyawan',
    },
  ];

  const companyIds: number[] = [];
  for (const c of companiesData) {
    const info = insertCompany.run(c);
    companyIds.push(Number(info.lastInsertRowid));
  }

  const insertInternship = db.prepare(`
    INSERT INTO internships (
      company_id, title, category, location, work_system, duration, duration_months,
      education_level, stipend, deadline, description, qualifications, responsibilities,
      benefits, document_requirements, is_featured, status
    ) VALUES (
      @company_id, @title, @category, @location, @work_system, @duration, @duration_months,
      @education_level, @stipend, @deadline, @description, @qualifications, @responsibilities,
      @benefits, @document_requirements, @is_featured, @status
    )
  `);

  const internshipsData = [
    {
      company_id: companyIds[0],
      title: 'Frontend Engineering Intern',
      category: 'Teknologi dan IT',
      location: 'Jakarta Selatan',
      work_system: 'Hybrid',
      duration: '4 Bulan',
      duration_months: 4,
      education_level: 'Mahasiswa',
      stipend: 'Rp 3.500.000 / bulan',
      deadline: '2027-01-30',
      description: 'Bergabung bersama tim Product Engineering Nusantara Cloud Tech untuk merancang dan membangun antarmuka dashboard manajemen cloud yang responsif, cepat, dan mudah diakses menggunakan React serta TypeScript.',
      qualifications: JSON.stringify([
        'Mahasiswa aktif D3/S1 Teknik Informatika, Sistem Informasi, atau jurusan terkait (minimal semester 5).',
        'Memahami dasar HTML, CSS, JavaScript/TypeScript, serta pengalaman membangun proyek dengan React.',
        'Terbiasa menggunakan Git untuk kolaborasi kode.',
        'Memiliki ketelitian tinggi terhadap detail UI/UX dan performa aplikasi web.',
      ]),
      responsibilities: JSON.stringify([
        'Mengimplementasikan komponen antarmuka pengguna berdasarkan spesifikasi desain Figma.',
        'Melakukan integrasi REST API bersama tim Backend Engineering.',
        'Menulis unit test dasar dan berpartisipasi dalam sesi code review mingguan.',
        'Mengoptimalkan aksesibilitas dan responsivitas tampilan di desktop maupun perangkat mobile.',
      ]),
      benefits: JSON.stringify([
        'Uang saku bulanan Rp 3.500.000.',
        'Mentoring intensif 1-on-1 bersama Senior Frontend Engineer.',
        'Sertifikat penyelesaian program dan surat rekomendasi resmi.',
        'Konversi SKS program magang kampus serta peluang rekrutmen penuh waktu.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV) terbaru format PDF',
        'Portofolio proyek web / tautan GitHub',
        'Transkrip nilai sementara atau Kartu Hasil Studi (KHS)',
      ]),
      is_featured: 1,
      status: 'Aktif',
    },
    {
      company_id: companyIds[3],
      title: 'UI/UX Product Design Intern',
      category: 'Desain dan Kreatif',
      location: 'Bandung',
      work_system: 'WFH',
      duration: '3 Bulan',
      duration_months: 3,
      education_level: 'Mahasiswa',
      stipend: 'Rp 2.800.000 / bulan',
      deadline: '2027-02-15',
      description: 'Kreasi Studio Jakarta membuka kesempatan bagi mahasiswa kreatif untuk terlibat langsung dalam riset pengguna, pembuatan wireframe, dan perancangan design system untuk klien teknologi nasional.',
      qualifications: JSON.stringify([
        'Mahasiswa aktif D3/S1 Desain Komunikasi Visual, Desain Produk, Ilmu Komputer, atau bidang relevan.',
        'Menguasai Figma dan memahami prinsip dasar desain antarmuka modern.',
        'Memiliki portofolio minimal 2 studi kasus desain UI/UX.',
        'Mampu mempresentasikan alasan di balik keputusan desain dengan runtut.',
      ]),
      responsibilities: JSON.stringify([
        'Membantu pelaksanaan wawancara pengguna dan sintesis temuan riset.',
        'Menyusun user flow, wireframe low-fidelity hingga prototipe interaktif.',
        'Merapikan komponen pada Design System tim studio.',
        'Berkolaborasi dengan tim developer saat proses design handoff.',
      ]),
      benefits: JSON.stringify([
        'Uang saku bulanan Rp 2.800.000 + tunjangan internet WFH.',
        'Akses penuh ke lisensi Figma Organization dan sesi Design Critique mingguan.',
        'Portofolio proyek nyata bersama klien industri.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV) terbaru',
        'Portofolio UI/UX (PDF atau tautan Figma/Behance)',
      ]),
      is_featured: 1,
      status: 'Aktif',
    },
    {
      company_id: companyIds[1],
      title: 'Business Development & Strategy Intern',
      category: 'Bisnis dan Manajemen',
      location: 'Jakarta Pusat',
      work_system: 'WFO',
      duration: '6 Bulan',
      duration_months: 6,
      education_level: 'Fresh Graduate',
      stipend: 'Rp 4.000.000 / bulan',
      deadline: '2027-01-20',
      description: 'Program akselerasi karier selama 6 bulan di Artha Niaga Strategi untuk lulusan baru yang ingin mendalami riset pasar, pemodelan kemitraan strategis, dan strategi pertumbuhan klien B2B.',
      qualifications: JSON.stringify([
        'Lulusan baru (Fresh Graduate) S1 Manajemen, Ekonomi, Administrasi Bisnis, atau Teknik Industri.',
        'Kemampuan analisis data bisnis menggunakan Excel/Spreadsheet yang sangat baik.',
        'Komunikasi lisan dan tulisan profesional dalam Bahasa Indonesia dan Bahasa Inggris.',
        'Bersedia bekerja penuh waktu dari kantor (WFO) di Jakarta Pusat.',
      ]),
      responsibilities: JSON.stringify([
        'Melakukan pemetaan peluang pasar dan analisis kompetitor lintas sektor.',
        'Menyusun dek presentasi proposal kemitraan untuk calon klien korporasi.',
        'Mendampingi manajer proyek dalam rapat evaluasi bersama mitra bisnis.',
        'Memantau pencapaian KPI akuisisi mitra setiap pekan.',
      ]),
      benefits: JSON.stringify([
        'Uang saku kompetitif Rp 4.000.000 / bulan + tunjangan transportasi.',
        'Jalur cepat (fast-track) menjadi Management Associate penuh waktu.',
        'Pelatihan negosiasi B2B dan penyusunan strategi bisnis.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV) terbaru',
        'Ijazah atau Surat Keterangan Lulus (SKL)',
        'Transkrip nilai akhir',
      ]),
      is_featured: 1,
      status: 'Aktif',
    },
    {
      company_id: companyIds[2],
      title: 'Financial Analyst Intern',
      category: 'Keuangan dan Akuntansi',
      location: 'Jakarta Selatan',
      work_system: 'Hybrid',
      duration: '4 Bulan',
      duration_months: 4,
      education_level: 'Mahasiswa',
      stipend: 'Rp 3.750.000 / bulan',
      deadline: '2027-02-10',
      description: 'Kesempatan langka untuk mendalami analisis laporan keuangan, valuasi perusahaan rintisan, dan uji tuntas (due diligence) bersama tim investasi Mandiri Ventura Kapital.',
      qualifications: JSON.stringify([
        'Mahasiswa semester 6–8 jurusan Akuntansi, Keuangan, Manajemen, atau Matematika Bisnis.',
        'Memahami laporan laba rugi, neraca, dan arus kas dengan baik.',
        'Mahir mengolah data dengan Microsoft Excel.',
        'Memiliki integritas tinggi dalam menjaga kerahasiaan data finansial.',
      ]),
      responsibilities: JSON.stringify([
        'Membantu penyusunan model proyeksi keuangan 3–5 tahun untuk portofolio investasi.',
        'Melakukan pemeriksaan kelengkapan dokumen keuangan calon mitra.',
        'Menyusun ringkasan kinerja kuartalan perusahaan portofolio.',
      ]),
      benefits: JSON.stringify([
        'Uang saku Rp 3.750.000 / bulan.',
        'Bimbingan langsung dari Investment Manager berpengalaman.',
        'Sertifikat resmi dan eksposur ekosistem modal ventura Indonesia.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV) terbaru',
        'Transkrip nilai akademik terbaru',
        'Surat pengantar magang dari universitas (jika ada)',
      ]),
      is_featured: 1,
      status: 'Aktif',
    },
    {
      company_id: companyIds[0],
      title: 'IT Support & Junior Network Intern',
      category: 'Teknologi dan IT',
      location: 'Jakarta Selatan',
      work_system: 'WFO',
      duration: '3 Bulan',
      duration_months: 3,
      education_level: 'SMA/SMK',
      stipend: 'Rp 2.200.000 / bulan',
      deadline: '2027-02-28',
      description: 'Program Praktik Kerja Lapangan (PKL) terstruktur khusus bagi siswa SMK jurusan TKJ/RPL untuk belajar pengelolaan perangkat keras kantor, jaringan lokal, serta layanan helpdesk internal.',
      qualifications: JSON.stringify([
        'Siswa aktif SMK kelas XI atau XII jurusan Teknik Komputer dan Jaringan (TKJ) atau Rekayasa Perangkat Lunak (RPL).',
        'Memahami dasar konfigurasi jaringan TCP/IP dan instalasi sistem operasi.',
        'Memiliki etos kerja disiplin, komunikatif, dan antusias mempelajari teknologi baru.',
      ]),
      responsibilities: JSON.stringify([
        'Membantu penyiapan perangkat laptop dan akun kerja untuk karyawan baru.',
        'Menangani tiket kendala teknis dasar (troubleshooting jaringan dan printer).',
        'Mendokumentasikan inventaris aset TI perusahaan secara berkala.',
      ]),
      benefits: JSON.stringify([
        'Uang saku bulanan Rp 2.200.000 dan makan siang kantor.',
        'Sertifikat PKL resmi sesuai standar penilaian sekolah.',
        'Pembekalan praktik keamanan siber dasar dan cloud computing.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV) ringkas',
        'Surat pengantar PKL resmi dari sekolah SMK',
        'Fotokopi/scan rapor semester terakhir',
      ]),
      is_featured: 1,
      status: 'Aktif',
    },
    {
      company_id: companyIds[4],
      title: 'Curriculum & EdTech Content Intern',
      category: 'Pendidikan',
      location: 'Yogyakarta',
      work_system: 'Hybrid',
      duration: '3 Bulan',
      duration_months: 3,
      education_level: 'Mahasiswa',
      stipend: 'Rp 2.400.000 / bulan',
      deadline: '2027-03-05',
      description: 'Bantu kami merancang modul pembelajaran interaktif, bank soal literasi digital, dan panduan mengajar berbasis proyek untuk ribuan siswa SMA/SMK di Indonesia.',
      qualifications: JSON.stringify([
        'Mahasiswa aktif S1 Pendidikan, Teknologi Pendidikan, Psikologi, atau bidang terkait.',
        'Mampu menulis materi ajar dengan bahasa Indonesia yang komunikatif dan terstruktur.',
        'Tertarik pada inovasi pembelajaran digital dan gamifikasi edukasi.',
      ]),
      responsibilities: JSON.stringify([
        'Menyusun draf modul belajar digital dan latihan evaluasi berbasis kompetensi.',
        'Melakukan peninjauan kualitas konten bersama tim pengajar ahli.',
        'Menganalisis umpan balik siswa terhadap kejelasan materi di platform.',
      ]),
      benefits: JSON.stringify([
        'Uang saku bulanan Rp 2.400.000.',
        'Fleksibilitas kerja Hybrid di Yogyakarta.',
        'Akses gratis ke seluruh kelas pengembangan karier Eduka Digital.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV)',
        'Contoh tulisan atau rancangan materi ajar singkat (1-2 halaman)',
      ]),
      is_featured: 0,
      status: 'Aktif',
    },
    {
      company_id: companyIds[5],
      title: 'Social Media & Editorial Content Intern',
      category: 'Komunikasi dan Media',
      location: 'Jakarta Pusat',
      work_system: 'Hybrid',
      duration: '4 Bulan',
      duration_months: 4,
      education_level: 'Mahasiswa',
      stipend: 'Rp 2.750.000 / bulan',
      deadline: '2027-02-20',
      description: 'Berkarya bersama tim redaksi dan komunikasi digital Aksara Media Group untuk memproduksi artikel tren karier, naskah video pendek, dan kampanye media sosial yang informatif.',
      qualifications: JSON.stringify([
        'Mahasiswa aktif Ilmu Komunikasi, Jurnalistik, Sastra, atau Pemasaran Digital.',
        'Peka terhadap tren media sosial dan mampu menulis dengan kaidah PUEBI yang baik.',
        'Memiliki kemampuan dasar penyuntingan video singkat atau desain grafis menjadi nilai tambah.',
      ]),
      responsibilities: JSON.stringify([
        'Menyusun kalender editorial konten mingguan untuk Instagram, LinkedIn, dan TikTok.',
        'Menulis artikel ringan seputar dunia kerja dan pengembangan diri generasi muda.',
        'Memantau metrik keterlibatan audiens dan menyusun laporan evaluasi bulanan.',
      ]),
      benefits: JSON.stringify([
        'Uang saku Rp 2.750.000 / bulan.',
        'Kredit nama penulis pada publikasi resmi Aksara Media Group.',
        'Workshop penulisan kreatif dan strategi media bersama Editor Senior.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV)',
        'Portofolio tulisan atau tautan karya konten media sosial',
      ]),
      is_featured: 1,
      status: 'Aktif',
    },
    {
      company_id: companyIds[6],
      title: 'Corporate Legal Intern',
      category: 'Hukum',
      location: 'Surabaya',
      work_system: 'WFO',
      duration: '3 Bulan',
      duration_months: 3,
      education_level: 'Fresh Graduate',
      stipend: 'Rp 3.200.000 / bulan',
      deadline: '2027-02-12',
      description: 'Terlibat langsung dalam riset hukum korporasi, penyusunan draf perjanjian komersial, serta analisis kepatuhan regulasi perlindungan data pribadi bersama advokat senior Lexis & Partners.',
      qualifications: JSON.stringify([
        'Lulusan baru (Fresh Graduate) Sarjana Hukum (S.H.) dengan IPK minimal 3,25.',
        'Memiliki kemampuan riset peraturan perundang-undangan dan penulisan hukum yang presisi.',
        'Teliti, terstruktur, dan mampu bekerja dengan tenggat waktu yang ketat.',
      ]),
      responsibilities: JSON.stringify([
        'Menyusun memo hukum (legal memorandum) terkait regulasi ketenagakerjaan dan bisnis digital.',
        'Membantu peninjauan awal draf kontrak kerja sama dan dokumen NDA.',
        'Mengelola pengarsipan dokumen legal klien secara sistematis.',
      ]),
      benefits: JSON.stringify([
        'Uang saku bulanan Rp 3.200.000.',
        'Pendampingan langsung oleh Partner firma hukum berlisensi PERADI.',
        'Kesempatan menjadi Junior Associate setelah evaluasi akhir program.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV)',
        'Ijazah/SKL dan Transkrip Nilai S1 Hukum',
        'Contoh legal writing atau ringkasan analisis kasus hukum',
      ]),
      is_featured: 0,
      status: 'Aktif',
    },
    {
      company_id: companyIds[7],
      title: 'Health Operations & Admin Intern',
      category: 'Kesehatan',
      location: 'Tangerang Selatan',
      work_system: 'WFO',
      duration: '4 Bulan',
      duration_months: 4,
      education_level: 'Mahasiswa',
      stipend: 'Rp 2.800.000 / bulan',
      deadline: '2027-03-01',
      description: 'Mendukung tim operasional klinik SehatSentosa Medika dalam digitalisasi alur pelayanan pasien, pengelolaan data kepuasan layanan, serta koordinasi program edukasi kesehatan masyarakat.',
      qualifications: JSON.stringify([
        'Mahasiswa aktif D3/S1 Kesehatan Masyarakat, Administrasi Rumah Sakit, atau Manajemen.',
        'Komunikatif, empatik, dan terbiasa mengelola spreadsheet data operasional.',
        'Bersedia ditempatkan di kantor pusat Tangerang Selatan.',
      ]),
      responsibilities: JSON.stringify([
        'Membantu pemantauan standar operasional pelayanan pasien di jejaring klinik.',
        'Mengolah survei umpan balik pasien menjadi laporan rekomendasi peningkatan mutu.',
        'Mendukung koordinasi jadwal kampanye pemeriksaan kesehatan berkala.',
      ]),
      benefits: JSON.stringify([
        'Uang saku Rp 2.800.000 / bulan dan jaminan perlindungan kesehatan selama magang.',
        'Pengalaman langsung di industri layanan kesehatan berbasis teknologi.',
        'Sertifikat resmi program magang.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV)',
        'Transkrip nilai sementara',
        'Surat pengantar dari institusi pendidikan',
      ]),
      is_featured: 0,
      status: 'Aktif',
    },
    {
      company_id: companyIds[3],
      title: 'Graphic Design & Motion Intern',
      category: 'Desain dan Kreatif',
      location: 'Bandung',
      work_system: 'Hybrid',
      duration: '2 Bulan',
      duration_months: 2,
      education_level: 'SMA/SMK',
      stipend: 'Rp 1.800.000 / bulan',
      deadline: '2027-02-25',
      description: 'Peluang PKL bagi siswa SMK jurusan Multimedia atau Desain Grafis untuk mengasah keterampilan ilustrasi vektor, aset kampanye media sosial, dan animasi antarmuka ringan.',
      qualifications: JSON.stringify([
        'Siswa aktif SMK jurusan Multimedia, Desain Komunikasi Visual, atau Animasi.',
        'Menguasai dasar Adobe Illustrator, Photoshop, atau Figma.',
        'Melampirkan portofolio karya desain pribadi.',
      ]),
      responsibilities: JSON.stringify([
        'Membuat aset visual untuk presentasi klien dan publikasi media sosial studio.',
        'Membantu proses resize dan penyesuaian format materi grafis.',
        'Berpartisipasi aktif dalam sesi brainstorming visual mingguan.',
      ]),
      benefits: JSON.stringify([
        'Uang saku Rp 1.800.000 / bulan.',
        'Mentoring langsung oleh Art Director Kreasi Studio.',
        'Sertifikat PKL dan surat penilaian kompetensi.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV)',
        'Portofolio karya desain (PDF atau tautan Google Drive)',
        'Surat pengantar PKL dari sekolah',
      ]),
      is_featured: 0,
      status: 'Aktif',
    },
    {
      company_id: companyIds[0],
      title: 'Data Analytics Intern',
      category: 'Teknologi dan IT',
      location: 'Remote / Seluruh Indonesia',
      work_system: 'WFH',
      duration: '6 Bulan',
      duration_months: 6,
      education_level: 'Fresh Graduate',
      stipend: 'Rp 4.200.000 / bulan',
      deadline: '2027-01-25',
      description: 'Bekerja secara remote penuh bersama tim Data Science Nusantara Cloud Tech untuk membersihkan data penggunaan layanan, menulis query SQL analitis, dan membangun dashboard visualisasi kinerja.',
      qualifications: JSON.stringify([
        'Fresh Graduate S1 Statistika, Matematika, Teknik Informatika, atau Sistem Informasi.',
        'Menguasai SQL dan dasar Python (Pandas) untuk pengolahan data.',
        'Memahami prinsip visualisasi data menggunakan Looker Studio, Tableau, atau Metabase.',
      ]),
      responsibilities: JSON.stringify([
        'Menyusun query SQL untuk mengekstrak metrik retensi dan adopsi fitur produk.',
        'Membangun dashboard pemantauan kinerja produk secara mingguan.',
        'Menyampaikan temuan analisis data kepada tim Product Manager.',
      ]),
      benefits: JSON.stringify([
        'Uang saku Rp 4.200.000 / bulan.',
        'Kerja jarak jauh 100% (WFH) dari mana saja di Indonesia.',
        'Kesempatan berlanjut ke posisi Junior Data Analyst.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV) terbaru',
        'Portofolio analisis data atau tautan notebook proyek',
        'Ijazah atau Surat Keterangan Lulus',
      ]),
      is_featured: 0,
      status: 'Aktif',
    },
    {
      company_id: companyIds[2],
      title: 'Accounting & Tax Administration Intern',
      category: 'Keuangan dan Akuntansi',
      location: 'Jakarta Selatan',
      work_system: 'WFO',
      duration: '3 Bulan',
      duration_months: 3,
      education_level: 'SMA/SMK',
      stipend: 'Rp 2.000.000 / bulan',
      deadline: '2027-03-10',
      description: 'Kesempatan praktik kerja lapangan bagi siswa SMK Akuntansi untuk mempelajari alur pembukuan transaksi harian, rekonsiliasi bank, dan pengarsipan dokumen perpajakan secara profesional.',
      qualifications: JSON.stringify([
        'Siswa SMK kelas XI/XII jurusan Akuntansi dan Keuangan Lembaga.',
        'Teliti dalam pencatatan angka dan menguasai dasar Microsoft Excel.',
        'Jujur, rapi dalam pengarsipan, dan siap belajar prosedur akuntansi perusahaan.',
      ]),
      responsibilities: JSON.stringify([
        'Membantu pencatatan bukti transaksi harian dan verifikasi kelengkapan kuitansi.',
        'Membantu rekonsiliasi data kas kecil mingguan.',
        'Mengarsipkan dokumen administrasi pajak bulanan secara digital dan fisik.',
      ]),
      benefits: JSON.stringify([
        'Uang saku Rp 2.000.000 / bulan.',
        'Pendampingan praktik langsung oleh staf Akuntansi Senior.',
        'Sertifikat penyelesaian PKL resmi.',
      ]),
      document_requirements: JSON.stringify([
        'Curriculum Vitae (CV)',
        'Surat pengantar PKL dari sekolah SMK',
      ]),
      is_featured: 0,
      status: 'Aktif',
    },
  ];

  const internshipIds: number[] = [];
  for (const item of internshipsData) {
    const info = insertInternship.run(item);
    internshipIds.push(Number(info.lastInsertRowid));
  }

  const insertUser = db.prepare(`
    INSERT INTO users (
      name, email, password_hash, role, phone, city, education_level,
      institution, major, graduation_year, bio, skills, interests,
      cv_filename, cv_url, avatar_url
    ) VALUES (
      @name, @email, @password_hash, @role, @phone, @city, @education_level,
      @institution, @major, @graduation_year, @bio, @skills, @interests,
      @cv_filename, @cv_url, @avatar_url
    )
  `);

  const nadiaId = Number(
    insertUser.run({
      name: 'Nadia Putri Maharani',
      email: 'nadia.putri@mahasiswa.id',
      password_hash: hashPassword('magang123'),
      role: 'user',
      phone: '0812-3456-7890',
      city: 'Bandung',
      education_level: 'Mahasiswa',
      institution: 'Institut Teknologi Bandung',
      major: 'Teknik Informatika',
      graduation_year: '2027',
      bio: 'Mahasiswa tingkat akhir yang berfokus pada pengembangan antarmuka web modern dengan React dan TypeScript serta memiliki ketertarikan tinggi pada desain sistem produk.',
      skills: JSON.stringify(['React', 'TypeScript', 'Tailwind CSS', 'Figma', 'Git']),
      interests: JSON.stringify(['Teknologi dan IT', 'Desain dan Kreatif']),
      cv_filename: 'cv_nadia_putri_sample.pdf',
      cv_url: '/api/uploads/cv_nadia_putri_sample.pdf',
      avatar_url: '/src/assets/images/avatar_student_profile_1795414698885.jpg',
    }).lastInsertRowid
  );

  const rizkyId = Number(
    insertUser.run({
      name: 'Rizky Pratama',
      email: 'rizky.pratama@smk.sch.id',
      password_hash: hashPassword('magang123'),
      role: 'user',
      phone: '0813-9988-1122',
      city: 'Jakarta Timur',
      education_level: 'SMA/SMK',
      institution: 'SMKN 26 Jakarta',
      major: 'Rekayasa Perangkat Lunak',
      graduation_year: '2027',
      bio: 'Siswa kelas XII SMK jurusan Rekayasa Perangkat Lunak yang siap menjalani PKL di bidang jaringan dan dukungan teknis IT.',
      skills: JSON.stringify(['Jaringan Dasar', 'Linux', 'HTML/CSS', 'Hardware Troubleshooting']),
      interests: JSON.stringify(['Teknologi dan IT']),
      cv_filename: 'cv_rizky_pratama_sample.pdf',
      cv_url: '/api/uploads/cv_rizky_pratama_sample.pdf',
      avatar_url: '',
    }).lastInsertRowid
  );

  const sintaId = Number(
    insertUser.run({
      name: 'Sinta Wijaya',
      email: 'sinta.wijaya@alumni.id',
      password_hash: hashPassword('magang123'),
      role: 'user',
      phone: '0856-7788-3344',
      city: 'Jakarta Selatan',
      education_level: 'Fresh Graduate',
      institution: 'Universitas Indonesia',
      major: 'Manajemen Bisnis',
      graduation_year: '2026',
      bio: 'Lulusan baru Manajemen dengan pengalaman organisasi kampus dan ketertarikan kuat pada strategi bisnis serta analisis keuangan.',
      skills: JSON.stringify(['Business Analysis', 'Microsoft Excel', 'Market Research', 'Public Speaking']),
      interests: JSON.stringify(['Bisnis dan Manajemen', 'Keuangan dan Akuntansi']),
      cv_filename: 'cv_sinta_wijaya_sample.pdf',
      cv_url: '/api/uploads/cv_sinta_wijaya_sample.pdf',
      avatar_url: '',
    }).lastInsertRowid
  );

  insertUser.run({
    name: 'Administrator MAGANG KEREN',
    email: 'admin@magangkeren.id',
    password_hash: hashPassword('admin123'),
    role: 'admin',
    phone: '021-5098-4400',
    city: 'Jakarta Selatan',
    education_level: 'Fresh Graduate',
    institution: 'Tim Pengelola MAGANG KEREN',
    major: 'Talent & Career Operations',
    graduation_year: '2024',
    bio: 'Administrator utama pengelola lowongan magang, mitra perusahaan, dan verifikasi lamaran pada platform MAGANG KEREN.',
    skills: JSON.stringify(['Rekrutmen', 'Manajemen Mitra', 'Operasional Platform']),
    interests: JSON.stringify(['Bisnis dan Manajemen']),
    cv_filename: '',
    cv_url: '',
    avatar_url: '',
  });

  const insertApp = db.prepare(`
    INSERT INTO applications (
      reference_code, internship_id, user_id, applicant_name, applicant_email,
      applicant_phone, education_level, institution, cover_letter, availability_date,
      portfolio_url, cv_filename, cv_url, support_doc_filename, support_doc_url, status, admin_note
    ) VALUES (
      @reference_code, @internship_id, @user_id, @applicant_name, @applicant_email,
      @applicant_phone, @education_level, @institution, @cover_letter, @availability_date,
      @portfolio_url, @cv_filename, @cv_url, @support_doc_filename, @support_doc_url, @status, @admin_note
    )
  `);

  insertApp.run({
    reference_code: 'MK-2026-1041',
    internship_id: internshipIds[0],
    user_id: nadiaId,
    applicant_name: 'Nadia Putri Maharani',
    applicant_email: 'nadia.putri@mahasiswa.id',
    applicant_phone: '0812-3456-7890',
    education_level: 'Mahasiswa',
    institution: 'Institut Teknologi Bandung',
    cover_letter: 'Saya memiliki pengalaman membangun beberapa aplikasi web berbasis React dan TypeScript selama proyek kuliah serta tertarik berkontribusi langsung pada pengembangan dashboard cloud Nusantara Cloud Tech.',
    availability_date: '2027-02-01',
    portfolio_url: 'https://github.com/nadiaputri-dev',
    cv_filename: 'cv_nadia_putri_sample.pdf',
    cv_url: '/api/uploads/cv_nadia_putri_sample.pdf',
    support_doc_filename: '',
    support_doc_url: '',
    status: 'Sedang Diproses',
    admin_note: 'Profil teknis sesuai kebutuhan tim. Dijadwalkan untuk sesi wawancara teknis.',
  });

  insertApp.run({
    reference_code: 'MK-2026-1042',
    internship_id: internshipIds[1],
    user_id: nadiaId,
    applicant_name: 'Nadia Putri Maharani',
    applicant_email: 'nadia.putri@mahasiswa.id',
    applicant_phone: '0812-3456-7890',
    education_level: 'Mahasiswa',
    institution: 'Institut Teknologi Bandung',
    cover_letter: 'Selain pemrograman frontend, saya aktif merancang design system di Figma untuk unit kegiatan mahasiswa dan ingin memperdalam riset pengguna di Kreasi Studio Jakarta.',
    availability_date: '2027-02-15',
    portfolio_url: 'https://figma.com/@nadiaputri',
    cv_filename: 'cv_nadia_putri_sample.pdf',
    cv_url: '/api/uploads/cv_nadia_putri_sample.pdf',
    support_doc_filename: '',
    support_doc_url: '',
    status: 'Menunggu Review',
    admin_note: '',
  });

  insertApp.run({
    reference_code: 'MK-2026-1043',
    internship_id: internshipIds[4],
    user_id: rizkyId,
    applicant_name: 'Rizky Pratama',
    applicant_email: 'rizky.pratama@smk.sch.id',
    applicant_phone: '0813-9988-1122',
    education_level: 'SMA/SMK',
    institution: 'SMKN 26 Jakarta',
    cover_letter: 'Saya siap mengikuti program PKL di Nusantara Cloud Tech untuk mengaplikasikan keterampilan jaringan dasar dan troubleshooting perangkat keras.',
    availability_date: '2027-01-15',
    portfolio_url: '',
    cv_filename: 'cv_rizky_pratama_sample.pdf',
    cv_url: '/api/uploads/cv_rizky_pratama_sample.pdf',
    support_doc_filename: '',
    support_doc_url: '',
    status: 'Diterima',
    admin_note: 'Selamat! Berkas PKL dari sekolah telah diverifikasi. Onboarding dimulai awal Januari.',
  });

  insertApp.run({
    reference_code: 'MK-2026-1044',
    internship_id: internshipIds[2],
    user_id: sintaId,
    applicant_name: 'Sinta Wijaya',
    applicant_email: 'sinta.wijaya@alumni.id',
    applicant_phone: '0856-7788-3344',
    education_level: 'Fresh Graduate',
    institution: 'Universitas Indonesia',
    cover_letter: 'Sebagai lulusan baru Manajemen Bisnis, saya antusias bergabung dalam tim Business Development Artha Niaga Strategi untuk mendukung ekspansi mitra korporasi.',
    availability_date: '2027-01-10',
    portfolio_url: 'https://linkedin.com/in/sintawijaya',
    cv_filename: 'cv_sinta_wijaya_sample.pdf',
    cv_url: '/api/uploads/cv_sinta_wijaya_sample.pdf',
    support_doc_filename: '',
    support_doc_url: '',
    status: 'Ditolak',
    admin_note: 'Terima kasih telah mendaftar. Kuota periode saat ini telah terpenuhi untuk kandidat dengan pengalaman riset B2B.',
  });

  const insertSaved = db.prepare(`
    INSERT INTO saved_internships (user_id, internship_id) VALUES (?, ?)
  `);
  insertSaved.run(nadiaId, internshipIds[3]);
  insertSaved.run(nadiaId, internshipIds[10]);

  const insertActivity = db.prepare(`
    INSERT INTO activities (user_id, type, title, description) VALUES (?, ?, ?, ?)
  `);
  insertActivity.run(
    nadiaId,
    'status',
    'Lamaran Sedang Diproses',
    'Lamaran Anda untuk Frontend Engineering Intern di Nusantara Cloud Tech masuk ke tahap peninjauan tim rekrutmen.'
  );
  insertActivity.run(
    nadiaId,
    'apply',
    'Lamaran Terkirim',
    'Mengirim lamaran untuk posisi UI/UX Product Design Intern di Kreasi Studio Jakarta (MK-2026-1042).'
  );
  insertActivity.run(
    nadiaId,
    'save',
    'Menyimpan Lowongan',
    'Menyimpan lowongan Data Analytics Intern di Nusantara Cloud Tech ke daftar tersimpan.'
  );
  insertActivity.run(
    nadiaId,
    'profile',
    'CV Diperbarui',
    'Mengunggah dokumen CV terbaru (cv_nadia_putri_sample.pdf) ke profil akun.'
  );
}
