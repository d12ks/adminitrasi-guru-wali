import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { gasService } from '../services/gasService';
import { IdentityData, Student, ProkerItem, JadwalItem, SheetName } from '../types';
import { Save, Edit2, Maximize2, Loader2, X, Check, ChevronDown, Plus, Trash2 } from 'lucide-react';

// --- TYPE DEFINITIONS FOR LOCAL STATE ---
type TabType = 'identitas' | 'dataSiswa' | 'proker' | 'jadwal' | 'pertemuan' | 'legerNilaiSemester';

// --- REUSABLE COMPONENTS ---

const Modal = ({ isOpen, onClose, title, children }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-paperDark w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="font-bold text-lg dark:text-white capitalize">{title}</h3>
                    <button onClick={onClose}><X className="text-gray-500 dark:text-gray-300 hover:text-red-500" /></button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, value, onChange, type = "text", as = "input" }: any) => (
    <div className="mb-3">
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
        {as === "textarea" ? (
            <textarea 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-primary outline-none"
                rows={4}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            />
        ) : (
            <input 
                type={type}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black focus:ring-2 focus:ring-primary outline-none"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            />
        )}
    </div>
);

// --- MAIN PAGE COMPONENT ---

const InputData: React.FC = () => {
    const { setLoading, isLoading } = useApp();
    const [activeTab, setActiveTab] = useState<TabType>('identitas');
    
    // --- DATA STATES ---
    const [identity, setIdentity] = useState<IdentityData>({
        namaGuru: '', nipGuru: '', kepalaSekolah: '', nipKs: '', bulan: '', semester: '', tahun: '', logoUrl: ''
    });
    const [students, setStudents] = useState<Student[]>([]);
    const [proker, setProker] = useState<ProkerItem[]>([]);
    const [jadwal, setJadwal] = useState<JadwalItem[]>([]);
    
    // --- GENERIC / MEETING STATES ---
    const [meetingNum, setMeetingNum] = useState<number>(1);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [sheetData, setSheetData] = useState<any>({}); 
    const [genericListData, setGenericListData] = useState<any[]>([]); 

    // --- UI STATES ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null); 

    // --- LOAD DATA ---
    useEffect(() => {
        loadData();
    }, [activeTab, meetingNum]);

    useEffect(() => {
        if (['pertemuan', 'legerNilaiSemester'].includes(activeTab) && selectedStudentId && genericListData.length > 0) {
            const found = genericListData.find(r => String(r.No) === String(selectedStudentId));
            setSheetData(found || {});
        }
    }, [selectedStudentId, genericListData]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'identitas') {
                const res = await gasService.getIdentity('identitas');
                setIdentity(res);
            } 
            else if (activeTab === 'dataSiswa') {
                const res = await gasService.getStudents();
                setStudents(res);
            }
            else if (activeTab === 'proker') {
                const res = await gasService.getProker();
                setProker(res);
            }
            else if (activeTab === 'jadwal') {
                const res = await gasService.getJadwal();
                setJadwal(res);
            }
            else {
                const sheetName = activeTab === 'pertemuan' ? `pertemuan${meetingNum}` : activeTab;
                const res = await gasService.getGenericData(sheetName);
                setGenericListData(res);
                const s = await gasService.getStudents();
                setStudents(s);
                if (s.length > 0 && !selectedStudentId) setSelectedStudentId(String(s[0].no));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- SAVE HANDLERS ---

    const handleSave = async () => {
        setLoading(true);
        try {
            let success = false;
            if (activeTab === 'identitas') {
                success = await gasService.updateSheetData('identitas', identity);
            } 
            else if (activeTab === 'dataSiswa') {
                success = await gasService.updateSheetData('dataSiswa', students);
            }
            else if (activeTab === 'proker') {
                success = await gasService.updateSheetData('proker', proker);
            }
            else if (activeTab === 'jadwal') {
                success = await gasService.updateSheetData('jadwal', jadwal);
            }
            else {
                const sheetName = (activeTab === 'pertemuan' ? `pertemuan${meetingNum}` : activeTab) as SheetName;
                success = await gasService.updateSheetData(sheetName, { 
                    studentId: selectedStudentId, 
                    ...sheetData 
                });
            }

            if (success) alert('Data berhasil disimpan ke Spreadsheet!');
            else throw new Error("Gagal menyimpan");
            
            loadData();
        } catch (e) {
            console.error(e);
            alert('Terjadi kesalahan saat menyimpan data.');
        } finally {
            setLoading(false);
        }
    };

    // --- LOCAL DATA MANIPULATION (Add/Delete/Edit) ---

    const openEditModal = (item: any) => {
        setEditItem({ ...item }); 
        setIsEditModalOpen(true);
    };

    const handleAddStudent = () => {
        const newNo = students.length > 0 ? students.length + 1 : 1;
        const newStudent: Student = {
            no: newNo,
            name: '',
            nis: '',
            nisn: '',
            class: '',
            gender: '',
            contact: '',
            notes: ''
        };
        // Add to local state
        setStudents([...students, newStudent]);
        // Open modal to fill details
        openEditModal(newStudent);
    };

    const handleDeleteStudent = (no: number) => {
        if (window.confirm(`Yakin ingin menghapus siswa No. ${no}?`)) {
            // Filter out the student
            const filtered = students.filter(s => s.no !== no);
            // Re-index the 'no' property to ensure sequence (1, 2, 3...)
            const reIndexed = filtered.map((s, index) => ({
                ...s,
                no: index + 1
            }));
            setStudents(reIndexed);
        }
    };

    const saveEditItem = () => {
        if (!editItem) return;

        if (activeTab === 'dataSiswa') {
            setStudents(prev => prev.map(s => String(s.no) === String(editItem.no) ? editItem : s));
        } else if (activeTab === 'proker') {
            setProker(prev => prev.map(p => String(p.id) === String(editItem.id) ? editItem : p));
        } else if (activeTab === 'jadwal') {
            setJadwal(prev => prev.map(j => String(j.id) === String(editItem.id) ? editItem : j));
        }
        
        setIsEditModalOpen(false);
        setEditItem(null);
    };

    // --- RENDERERS ---

    const renderTabs = () => (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
            {[
                { id: 'identitas', label: '1. Identitas' },
                // Sampul removed here
                { id: 'dataSiswa', label: '2. Data Murid' },
                { id: 'proker', label: '3. Proker' },
                { id: 'jadwal', label: '4. Jadwal' },
                { id: 'pertemuan', label: '5. Laporan Pertemuan' },
                { id: 'legerNilaiSemester', label: '6. Leger Nilai' },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as TabType); setSelectedStudentId(''); }}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all shadow-sm ${
                        activeTab === tab.id 
                        ? 'bg-primary text-white ring-2 ring-primary/30' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );

    const renderIdentityForm = (data: IdentityData, setData: any, title: string) => (
        <div className="space-y-4">
            <h2 className="text-lg font-bold border-b pb-2 mb-4 dark:text-white dark:border-gray-600">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Nama Guru Wali" value={data.namaGuru} onChange={(v: string) => setData({...data, namaGuru: v})} />
                <FormInput label="NIP Guru" value={data.nipGuru} onChange={(v: string) => setData({...data, nipGuru: v})} />
                <FormInput label="Kepala Sekolah" value={data.kepalaSekolah} onChange={(v: string) => setData({...data, kepalaSekolah: v})} />
                <FormInput label="NIP KS" value={data.nipKs} onChange={(v: string) => setData({...data, nipKs: v})} />
                <FormInput label="Bulan" value={data.bulan} onChange={(v: string) => setData({...data, bulan: v})} />
                <FormInput label="Semester" value={data.semester} onChange={(v: string) => setData({...data, semester: v})} />
                <FormInput label="Tahun Pelajaran" value={data.tahun} onChange={(v: string) => setData({...data, tahun: v})} />
                <div className="md:col-span-2">
                    <FormInput label="Link Logo Sekolah (URL)" value={data.logoUrl} onChange={(v: string) => setData({...data, logoUrl: v})} />
                </div>
            </div>
        </div>
    );

    const renderTable = (headers: string[], data: any[], renderRow: (item: any, idx: number) => React.ReactNode, onDelete?: (item: any) => void) => (
        <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
            <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-800 dark:text-gray-300">
                    <tr>
                        {headers.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}
                        <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                    {data.map((item, idx) => (
                        <tr key={idx} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                            {renderRow(item, idx)}
                            <td className="px-4 py-3 text-right flex justify-end gap-2">
                                <button onClick={() => openEditModal(item)} className="text-primary hover:text-blue-700 p-1 bg-blue-50 dark:bg-blue-900/30 rounded" title="Edit">
                                    <Edit2 size={16} />
                                </button>
                                {onDelete && (
                                    <button onClick={() => onDelete(item)} className="text-red-500 hover:text-red-700 p-1 bg-red-50 dark:bg-red-900/30 rounded" title="Hapus">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {data.length === 0 && <p className="p-4 text-center text-gray-500 italic">Tidak ada data.</p>}
        </div>
    );

    const renderGenericForm = () => {
        // Exclude system keys
        const keys = Object.keys(sheetData).filter(k => k !== 'No' && k !== 'studentId' && k !== 'row' && k !== 'id');
        
        return (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {keys.map((key) => (
                    <div key={key} className="relative">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{key.replace(/_/g, ' ')}</label>
                        {key.toLowerCase().includes('tanggal') ? (
                             <input 
                                type="date"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black"
                                value={sheetData[key] ? new Date(sheetData[key]).toISOString().split('T')[0] : ''}
                                onChange={(e) => setSheetData({...sheetData, [key]: e.target.value})}
                             />
                        ) : (
                            <textarea 
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black focus:ring-2 focus:ring-primary outline-none"
                                value={sheetData[key]}
                                onChange={(e) => setSheetData({...sheetData, [key]: e.target.value})}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto pb-24">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Input & Edit Data</h1>
            
            {renderTabs()}

            <div className="bg-white dark:bg-paperDark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px] relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-paperDark/80 z-10 rounded-xl">
                        <Loader2 className="animate-spin text-primary mb-2 w-10 h-10" />
                        <span className="text-sm font-medium text-gray-500">Memuat data...</span>
                    </div>
                ) : (
                    <>
                        {/* --- IDENTITAS --- */}
                        {activeTab === 'identitas' && renderIdentityForm(identity, setIdentity, 'Edit Data Identitas')}

                        {/* --- DATA MURID --- */}
                        {activeTab === 'dataSiswa' && (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold dark:text-white">Daftar Murid</h2>
                                    <button 
                                        onClick={handleAddStudent}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"
                                    >
                                        <Plus size={16} /> Tambah Murid
                                    </button>
                                </div>
                                {renderTable(
                                    ['No', 'Nama', 'NIS', 'NISN', 'Kelas', 'L/P'], 
                                    students, 
                                    (s) => (
                                        <>
                                            <td className="px-4 py-3">{s.no}</td>
                                            <td className="px-4 py-3 font-medium dark:text-white">{s.name}</td>
                                            <td className="px-4 py-3">{s.nis}</td>
                                            <td className="px-4 py-3">{s.nisn}</td>
                                            <td className="px-4 py-3">{s.class}</td>
                                            <td className="px-4 py-3">{s.gender}</td>
                                        </>
                                    ),
                                    (item) => handleDeleteStudent(item.no) // Pass delete handler
                                )}
                            </>
                        )}

                        {/* --- PROKER --- */}
                        {activeTab === 'proker' && (
                            <>
                                <h2 className="text-lg font-bold mb-4 dark:text-white">Program Kerja</h2>
                                {renderTable(
                                    ['No', 'Pilar Program', 'Kegiatan', 'Indikator'], 
                                    proker, 
                                    (p) => (
                                        <>
                                            <td className="px-4 py-3">{p.no}</td>
                                            <td className="px-4 py-3 font-medium dark:text-white">{p.pilar}</td>
                                            <td className="px-4 py-3 truncate max-w-[200px]">{p.kegiatan}</td>
                                            <td className="px-4 py-3 truncate max-w-[200px]">{p.indikator}</td>
                                        </>
                                    )
                                )}
                            </>
                        )}

                        {/* --- JADWAL --- */}
                        {activeTab === 'jadwal' && (
                            <>
                                <h2 className="text-lg font-bold mb-4 dark:text-white">Jadwal Kegiatan</h2>
                                {renderTable(
                                    ['Bulan', 'Kegiatan', 'Keterangan', 'Semester'], 
                                    jadwal, 
                                    (j) => (
                                        <>
                                            <td className="px-4 py-3 font-medium dark:text-white">{j.bulan}</td>
                                            <td className="px-4 py-3">{j.kegiatan}</td>
                                            <td className="px-4 py-3">{j.keterangan}</td>
                                            <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">{j.semesterType}</span></td>
                                        </>
                                    )
                                )}
                            </>
                        )}

                        {/* --- PERTEMUAN & LEGER (Student Select) --- */}
                        {['pertemuan', 'legerNilaiSemester'].includes(activeTab) && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row gap-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                                    {activeTab === 'pertemuan' && (
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pertemuan Ke</label>
                                            <select 
                                                value={meetingNum} 
                                                onChange={(e) => setMeetingNum(Number(e.target.value))}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black"
                                            >
                                                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>Pertemuan {n}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="flex-[2]">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Siswa</label>
                                        <select 
                                            value={selectedStudentId} 
                                            onChange={(e) => setSelectedStudentId(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black"
                                        >
                                            {students.map(s => <option key={s.no} value={s.no}>{s.no}. {s.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                {renderGenericForm()}
                            </div>
                        )}

                        {/* BIG SAVE BUTTON */}
                        <div className="mt-8 pt-6 border-t dark:border-gray-600 sticky bottom-0 bg-white dark:bg-paperDark pb-2">
                            <button 
                                onClick={handleSave}
                                className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98] transform hover:-translate-y-1"
                            >
                                <Save size={24} /> SIMPAN DATA
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* --- MODAL EDIT --- */}
            <Modal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                title={
                    activeTab === 'dataSiswa' ? 'Edit Data Murid' : 
                    activeTab === 'proker' ? 'Edit Program Kerja' : 'Edit Jadwal'
                }
            >
                {editItem && (
                    <div className="space-y-4">
                        {activeTab === 'dataSiswa' && (
                            <>
                                <FormInput label="Nama Lengkap" value={editItem.name} onChange={(v: string) => setEditItem({...editItem, name: v})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="NIS" value={editItem.nis} onChange={(v: string) => setEditItem({...editItem, nis: v})} />
                                    <FormInput label="NISN" value={editItem.nisn} onChange={(v: string) => setEditItem({...editItem, nisn: v})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormInput label="Kelas" value={editItem.class} onChange={(v: string) => setEditItem({...editItem, class: v})} />
                                    <FormInput label="Jenis Kelamin (L/P)" value={editItem.gender} onChange={(v: string) => setEditItem({...editItem, gender: v})} />
                                </div>
                                <FormInput label="Kontak" value={editItem.contact} onChange={(v: string) => setEditItem({...editItem, contact: v})} />
                                <FormInput label="Catatan Khusus" as="textarea" value={editItem.notes} onChange={(v: string) => setEditItem({...editItem, notes: v})} />
                            </>
                        )}

                        {activeTab === 'proker' && (
                            <>
                                <FormInput label="Pilar Program" value={editItem.pilar} onChange={(v: string) => setEditItem({...editItem, pilar: v})} />
                                <FormInput label="Bentuk Kegiatan" as="textarea" value={editItem.kegiatan} onChange={(v: string) => setEditItem({...editItem, kegiatan: v})} />
                                <FormInput label="Indikator Keberhasilan" as="textarea" value={editItem.indikator} onChange={(v: string) => setEditItem({...editItem, indikator: v})} />
                            </>
                        )}

                        {activeTab === 'jadwal' && (
                            <>
                                <FormInput label="Bulan" value={editItem.bulan} onChange={(v: string) => setEditItem({...editItem, bulan: v})} />
                                <FormInput label="Kegiatan" as="textarea" value={editItem.kegiatan} onChange={(v: string) => setEditItem({...editItem, kegiatan: v})} />
                                <FormInput label="Keterangan" value={editItem.keterangan} onChange={(v: string) => setEditItem({...editItem, keterangan: v})} />
                            </>
                        )}

                        <div className="pt-4 flex justify-end gap-2">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                            <button onClick={saveEditItem} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                                <Check size={18} /> Simpan Perubahan
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default InputData;