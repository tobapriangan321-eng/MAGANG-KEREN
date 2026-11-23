export type WorkSystem = 'WFO' | 'WFH' | 'Hybrid';

export type EducationLevel = 'SMA/SMK' | 'Mahasiswa' | 'Fresh Graduate';

export type ApplicationStatus =
  | 'Menunggu Review'
  | 'Sedang Diproses'
  | 'Diterima'
  | 'Ditolak';

export type UserRole = 'user' | 'admin';

export const INTERNSHIP_CATEGORIES = [
  'Teknologi dan IT',
  'Bisnis dan Manajemen',
  'Keuangan dan Akuntansi',
  'Desain dan Kreatif',
  'Pendidikan',
  'Komunikasi dan Media',
  'Hukum',
  'Kesehatan',
] as const;

export type InternshipCategory = (typeof INTERNSHIP_CATEGORIES)[number];

export interface Company {
  id: number;
  name: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  logo_code: string;
  logo_color: string;
  employee_count: string;
  created_at: string;
}

export interface Internship {
  id: number;
  company_id: number;
  company_name: string;
  company_logo_code: string;
  company_logo_color: string;
  company_industry: string;
  company_description: string;
  company_website: string;
  title: string;
  category: InternshipCategory | string;
  location: string;
  work_system: WorkSystem;
  duration: string;
  duration_months: number;
  education_level: EducationLevel;
  stipend: string;
  deadline: string;
  description: string;
  qualifications: string[];
  responsibilities: string[];
  benefits: string[];
  document_requirements: string[];
  is_featured: boolean;
  status: 'Aktif' | 'Ditutup';
  applicants_count?: number;
  created_at: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  city: string;
  education_level: EducationLevel;
  institution: string;
  major: string;
  graduation_year: string;
  bio: string;
  skills: string[];
  interests: string[];
  cv_filename: string;
  cv_url: string;
  avatar_url: string;
  created_at: string;
}

export interface ApplicationRecord {
  id: number;
  reference_code: string;
  internship_id: number;
  internship_title: string;
  company_name: string;
  company_logo_code: string;
  company_logo_color: string;
  location: string;
  work_system: WorkSystem;
  user_id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  education_level: string;
  institution: string;
  cover_letter: string;
  availability_date: string;
  portfolio_url: string;
  cv_filename: string;
  cv_url: string;
  support_doc_filename: string;
  support_doc_url: string;
  status: ApplicationStatus;
  admin_note: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityItem {
  id: number;
  user_id: number;
  type: 'apply' | 'save' | 'profile' | 'status';
  title: string;
  description: string;
  created_at: string;
}

export interface PlatformStats {
  total_companies: number;
  total_internships: number;
  total_users: number;
  total_applications: number;
}
