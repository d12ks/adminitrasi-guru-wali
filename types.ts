export interface User {
  email: string;
  name: string;
  photoUrl?: string;
}

export interface Student {
  no: number;
  nis: string;
  nisn: string;
  name: string;
  class: string;
  // Extended fields for Data Siswa Editor
  gender?: string;
  contact?: string;
  notes?: string;
}

export interface IdentityData {
  namaGuru: string;
  nipGuru: string;
  kepalaSekolah: string;
  nipKs: string;
  bulan: string;
  semester: string;
  tahun: string;
  logoUrl?: string; // Added for School Logo
}

export interface ProkerItem {
  id: number;
  no: string; // Added explicit No field from spreadsheet
  pilar: string;
  kegiatan: string;
  indikator: string;
}

export interface JadwalItem {
  id: number;
  bulan: string;
  kegiatan: string;
  keterangan: string;
  semesterType: 'Gasal' | 'Genap';
}

export interface SheetData {
  range: string;
  values: any[][];
}

// Maps to specific data structures for forms
export interface LegerInput {
  deskripsi: string;
  tindakLanjut: string;
  keterangan: string;
}

export interface MeetingInput {
  tanggal: string;
  topik: string;
  tindakLanjut: string;
  keterangan: string;
  format: string;
  persentase: string;
  // Extra for meeting 6
  hasil?: string;
  rekomendasi?: string;
}

export type SheetName = 'identitas' | 'legerNilaiSemester' | 'pertemuan1' | 'pertemuan2' | 'pertemuan3' | 'pertemuan4' | 'pertemuan5' | 'pertemuan6' | 'proker' | 'jadwal' | 'dataSiswa' | 'sampul';