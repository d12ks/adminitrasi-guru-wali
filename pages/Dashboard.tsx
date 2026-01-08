import React, { useEffect, useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { gasService } from '../services/gasService';
import { IdentityData, Student } from '../types';
import { Users, BarChart } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, navigate } = useApp();
  const [identity, setIdentity] = useState<IdentityData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        const [identData, studentsData] = await Promise.all([
            gasService.getIdentity(),
            gasService.getStudents()
        ]);
        setIdentity(identData);
        setStudents(studentsData);
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Greeting Section */}
      <div className="mb-4 md:mb-8 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl md:bg-transparent md:p-0">
        <h1 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
           Halo, <span className="text-primary truncate max-w-[150px] md:max-w-none">{user?.name}</span> 👋
        </h1>
        <p className="text-xs md:text-base text-gray-500 dark:text-gray-400 mt-1">
            Guru Wali SMK Negeri 1 Mondokan 
        </p>
         <p className="text-xs md:text-base text-gray-500 dark:text-gray-400 mt-1">
         • {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
         </p>
      </div>

      {/* Identity Card (Clean Design with Aligned Colons) */}
      <div className="bg-white dark:bg-paperDark rounded-xl shadow-sm border dark:border-gray-700 p-6 mb-8">
          <div className="w-full">
            <h3 className="font-bold text-lg border-b pb-2 mb-4 dark:border-gray-600">Administrasi Guru Wali</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                <InfoRow label="Semester" value={identity?.semester} />
                <InfoRow label="Bulan" value={identity?.bulan} />
                <InfoRow label="Tahun" value={identity?.tahun} />
                <InfoRow label="Guru Wali" value={identity?.namaGuru} />
            </div>
            
            <div className="pt-4 mt-2">
                <button 
                    onClick={() => navigate('/input')} 
                    className="text-sm text-primary hover:underline font-medium"
                >
                    Edit Identitas &rarr;
                </button>
            </div>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-8">
        <StatCard title="Total Siswa" value={students.length.toString()} icon={<Users size={18} className="text-blue-500 md:w-6 md:h-6" />} />
        <StatCard title="Semester" value={identity?.semester || '-'} icon={<BarChart size={18} className="text-orange-500 md:w-6 md:h-6" />} />
      </div>
    </div>
  );
};

const InfoRow = ({label, value}: {label: string, value?: string}) => (
    <div className="grid grid-cols-[100px_10px_1fr] items-start text-sm md:text-base">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">:</span>
        <span className="font-medium text-gray-800 dark:text-gray-200 truncate">{value || '-'}</span>
    </div>
);

const StatCard = ({ title, value, icon }: any) => (
    <div className="bg-white dark:bg-paperDark p-3 md:p-6 rounded-xl shadow-sm border dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="order-2 md:order-1">
            <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mt-0 md:mt-1">{value}</p>
        </div>
        <div className="order-1 md:order-2 self-start md:self-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">{icon}</div>
    </div>
);

export default Dashboard;
