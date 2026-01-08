
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { gasService } from '../services/gasService';
import { IdentityData, Student, ProkerItem, JadwalItem, SheetName } from '../types';
import { Save, Edit2, Loader2, X, Check, Plus, Trash2 } from 'lucide-react';

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
    const [unsavedChanges, setUnsavedChanges] = useState(false);
    
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

    // Enhanced logic to handle new students who don't have a row in DB yet
    useEffect(() => {
        if (['pertemuan', 'legerNilaiSemester'].includes(activeTab) && genericListData.length > 0) {
            // 1. Try to find existing data for the selected student
            const found = genericListData.find(r => String(r.No) === String(selectedStudentId));
            
            if (found) {
                setSheetData(found);
            } else if (genericListData.length > 0) {
                // 2. If not found (New Student), use the first record to generate the schema (keys)
                // This ensures textboxes appear even if the student is new.
                const schemaItem = genericListData[0];
                const emptyState: any = {};
                
                // Copy keys but set values to empty string
                Object.keys(schemaItem).forEach(key => {
                    emptyState[key] = ''; 
                });
                
                // Preserve ID so it saves correctly
                emptyState['No'] = selectedStudentId; 
                setSheetData(emptyState);
            }
        } else if (['pertemuan', 'legerNilaiSemester'].includes(activeTab)) {
             // Fallback if sheet is completely empty
             setSheetData({}); 
        }
    }, [selectedStudentId, genericListData, activeTab]);

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
            setUnsavedChanges(false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- SAVE HANDLERS (PERSIST TO SERVER) ---

    const handleSave = async () => {
        setLoading(true);
        try {
            let success = false;
            if (activeTab === 'identitas') {
                success = await gasService.updateSheetData('identitas', identity);
            } 
            else if (activeTab === 'dataSiswa') {
                // Pastikan students bukan referensi lama, kirim deep copy jika perlu
                const dataToSend = [...students]; 
                success = await gasService.updateSheetData('dataSiswa', dataToSend);
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

            if (success) {
                alert('Data BERHASIL disimpan ke Server!');
                setUnsavedChanges(false);
                // Reload to sync new IDs if any
                loadData(); 
            } else {
                throw new Error("Gagal menyimpan");
            }
        } catch (e) {
            console.error(e);
            alert('Terjadi kesalahan saat menyimpan data ke server.');
        } finally {
            setLoading(false);
        }
    };

    // --- LOCAL DATA MANIPULATION (LOCAL STATE ONLY) ---

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
        // 1. Update LOCAL state immediately
        setStudents(prev => [...prev, newStudent]);
        setUnsavedChanges(true);
        // 2. Open modal to edit details
        openEditModal(newStudent);
    };

    const handleDeleteStudent = (no: any) => {
        if (window.confirm(`Hapus siswa No. ${no}? \n(Data akan hilang dari layar, Klik tombol SIMPAN DATA di bawah untuk menghapus permanen di server)`)) {
            // Menggunakan callback di setStudents untuk menjamin state terbaru yang diubah
            setStudents(prevStudents => {
                const filtered = prevStudents.filter(s => String(s.no) !== String(no));
                
                // Re-index agar urutan nomor kembali rapi (1, 2, 3...)
                const reIndexed = filtered.map((s, index) => ({
                    ...s,
                    no: index + 1
                }));
                
                return reIndexed;
            });
            setUnsavedChanges(true);
        }
    };

    // Function applied when user clicks "OK/Simpan" inside the Modal
    const applyLocalChanges = () => {
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
        setUnsavedChanges(true);
    };

    // --- RENDERERS ---

    const renderTabs = () => (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
            {[
                { id: 'identitas', label: 'Identitas' },
                { id: 'dataSiswa', label: 'Data Murid' },
                { id: 'proker', label: 'Proker' },
                { id: 'jadwal', label: 'Jadwal' },
                { id: 'pertemuan', label: 'Laporan Pertemuan' },
                { id: 'legerNilaiSemester', label: 'Leger Nilai' },
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
                <FormInput label="Nama Guru Wali" value={data.namaGuru} onChange={(v: string) => {setData({...data, namaGuru: v}); setUnsavedChanges(true);}} />
                <FormInput label="NIP Guru" value={data.nipGuru} onChange={(v: string) => {setData({...data, nipGuru: v}); setUnsavedChanges(true);}} />
                <FormInput label="Kepala Sekolah" value={data.kepalaSekolah} onChange={(v: string) => {setData({...data, kepalaSekolah: v}); setUnsavedChanges(true);}} />
                <FormInput label="NIP KS" value={data.nipKs} onChange={(v: string) => {setData({...data, nipKs: v}); setUnsavedChanges(true);}} />
                <FormInput label="Bulan" value={data.bulan} onChange={(v: string) => {setData({...data, bulan: v}); setUnsavedChanges(true);}} />
                <FormInput label="Semester" value={data.semester} onChange={(v: string) => {setData({...data, semester: v}); setUnsavedChanges(true);}} />
                <FormInput label="Tahun" value={data.tahun} onChange={(v: string) => {setData({...data, tahun: v}); setUnsavedChanges(true);}} />
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
        const keys = Object.keys(sheetData).filter(k => k !== 'No' && k !== 'studentId' && k !== 'row' && k !== 'id');
        
        return (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {keys.map((key) => {
                    const isDate = key.toLowerCase().includes('tanggal');
                    return (
                        <div key={key} className="relative">
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase">{key.replace(/_/g, ' ')}</label>
                            </div>
                            
                            {isDate ? (
                                <input 
                                    type="date"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black"
                                    value={sheetData[key] ? sheetData[key] : ''} // Keep YYYY-MM-DD for input
                                    onChange={(e) => {setSheetData({...sheetData, [key]: e.target.value}); setUnsavedChanges(true);}}
                                />
                            ) : (
                                <textarea 
                                    rows={3}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-black focus:ring-2 focus:ring-primary outline-none"
                                    value={sheetData[key]}
                                    onChange={(e) => {setSheetData({...sheetData, [key]: e.target.value}); setUnsavedChanges(true);}}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Input & Edit Data</h1>
                {unsavedChanges && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold animate-pulse">
                        Ada perubahan belum disimpan, jangan lupa klik tombol SIMPAN DATA
                    </span>
                )}
            </div>
            
            {renderTabs()}

            <div className="bg-white dark:bg-paperDark p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px] relative">
                {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-paperDark/80 z-10 rounded-xl">
                        <Loader2 className="animate-spin text-primary mb-2 w-10 h-10" />
                        <span className="text-sm font-medium text-gray-500">Memuat / Menyimpan ke Server...</span>
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
                                    (item) => handleDeleteStudent(item.no) 
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
                                            <td className="px-4 py-3 whitespace-pre-wrap">{p.kegiatan}</td>
                                            <td className="px-4 py-3 whitespace-pre-wrap">{p.indikator}</td>
                                        </>
                                    )
                                )}
                            </>
                        )}

                        {/* --- JADWAL (REVISED STRUCTURE) --- */}
                        {activeTab === 'jadwal' && (
                            <>
                                <h2 className="text-lg font-bold mb-4 dark:text-white">JADWAL KEGIATAN GURU WALI</h2>
                                
                                <div className="mb-8">
                                    <h3 className="text-md font-bold mb-2 dark:text-white border-b border-gray-300 dark:border-gray-600 inline-block">Semester Gasal</h3>
                                    {renderTable(
                                        ['Bulan', 'Kegiatan', 'Keterangan'], 
                                        jadwal.filter(j => j.semesterType === 'Gasal'), 
                                        (j) => (
                                            <>
                                                <td className="px-4 py-3 font-medium dark:text-white">{j.bulan}</td>
                                                <td className="px-4 py-3 whitespace-pre-wrap">{j.kegiatan}</td>
                                                <td className="px-4 py-3 whitespace-pre-wrap">{j.keterangan}</td>
                                            </>
                                        )
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-md font-bold mb-2 dark:text-white border-b border-gray-300 dark:border-gray-600 inline-block">Semester Genap</h3>
                                    {renderTable(
                                        ['Bulan', 'Kegiatan', 'Keterangan'], 
                                        jadwal.filter(j => j.semesterType === 'Genap'), 
                                        (j) => (
                                            <>
                                                <td className="px-4 py-3 font-medium dark:text-white">{j.bulan}</td>
                                                <td className="px-4 py-3 whitespace-pre-wrap">{j.kegiatan}</td>
                                                <td className="px-4 py-3 whitespace-pre-wrap">{j.keterangan}</td>
                                            </>
                                        )
                                    )}
                                </div>
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
                                className={`w-full font-bold py-4 px-6 rounded-xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] transform hover:-translate-y-1 ${
                                    unsavedChanges 
                                    ? 'bg-primary hover:bg-blue-600 text-white shadow-blue-500/20' 
                                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                                }`}
                            >
                                <Save size={24} /> SIMPAN DATA
                            </button>
                            <p className="text-center text-xs text-gray-500 mt-2">*Pastikan klik tombol ini setelah menambah/menghapus/mengedit data.</p>
                        </div>
                    </>
                )}
            </div>

            {/* --- MODAL EDIT (LOCAL ONLY) --- */}
            <Modal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                title={
                    activeTab === 'dataSiswa' ? 'Edit Data Murid (Lokal)' : 
                    activeTab === 'proker' ? 'Edit Program Kerja (Lokal)' : 'Edit Jadwal (Lokal)'
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
                            {/* Change button label to emphasize LOCAL action */}
                            <button onClick={applyLocalChanges} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                                <Check size={18} /> Selesai/Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default InputData;
