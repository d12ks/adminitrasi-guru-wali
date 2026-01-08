import React from 'react';
import { useApp } from '../contexts/AppContext';
import { Home, FileText, LogOut, Sun, Moon, Wifi, WifiOff, FileBarChart } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isDark, toggleTheme, isOnline, isLoading } = useApp();

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header + Sticky Nav */}
      <div className="md:hidden sticky top-0 z-20 shadow-md no-print">
          {/* Top Info Bar */}
          <div className="bg-white dark:bg-paperDark border-b dark:border-gray-700 p-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="flex flex-col">
                   <span className="font-bold text-lg leading-tight">Guru Wali</span>
                   {/* Menampilkan Email di bawah judul */}
                   <span className="text-[10px] text-gray-500 dark:text-gray-400 font-normal">{user.email}</span>
               </div>
            </div>
            <div className="flex items-center gap-3">
                {!isOnline && <WifiOff className="text-red-500 w-5 h-5" />}
                <button onClick={toggleTheme}>
                    {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
          </div>
          
          {/* Navigation Bar (Moved from bottom to top) */}
          <nav className="bg-white dark:bg-paperDark flex justify-around p-2 overflow-x-auto">
            <MobileNavItem to="/" icon={<Home size={20} />} label="Home" />
            <MobileNavItem to="/input" icon={<FileText size={20} />} label="Input" />
            <MobileNavItem to="/reports" icon={<FileBarChart size={20} />} label="Laporan" />
            <button onClick={logout} className="flex flex-col items-center gap-1 text-red-500 dark:text-red-400 px-3">
                <LogOut size={20} />
                <span className="text-[10px] font-medium">Keluar</span>
            </button>
          </nav>
      </div>

      {/* Deeeeeeeesktop Sideeeeebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-paperDark border-r dark:border-gray-700 h-screen sticky top-0 no-print">
        <div className="p-6 border-b dark:border-gray-700 flex flex-col items-center text-center">
          <h1 className="text-xl font-bold text-primary">Adm. Guru Wali</h1>
          <p className="text-xs text-gray-500 mt-1">{isOnline ? 'Online' : 'Offline Mode'}</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem to="/" icon={<Home size={20} />} label="Dashboard" />
          <NavItem to="/input" icon={<FileText size={20} />} label="Input Data" />
          <NavItem to="/reports" icon={<FileBarChart size={20} />} label="Laporan" />
        </nav>

        <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
                <img src={user.photoUrl} alt="User" className="w-10 h-10 rounded-full" />
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
            </div>
            <div className="flex justify-between items-center">
                 <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                 </button>
                 <button onClick={logout} className="flex items-center gap-2 text-red-500 hover:text-red-600 text-sm font-medium">
                    <LogOut size={16} /> Keluar
                 </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen relative print-container">
         {isLoading && (
             <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center backdrop-blur-sm no-print">
                 <div className="bg-white dark:bg-paperDark p-4 rounded-lg shadow-xl flex items-center gap-3">
                     <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                     <span className="font-medium">Memproses...</span>
                 </div>
             </div>
         )}
         {children}
      </main>
    </div>
  );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
  const { currentPath, navigate } = useApp();
  const isActive = currentPath === to;
  
  return (
    <button 
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive 
        ? 'bg-primary/10 text-primary font-medium' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

const MobileNavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    const { currentPath, navigate } = useApp();
    const isActive = currentPath === to;

    return (
        <button 
          onClick={() => navigate(to)}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
            isActive 
            ? 'bg-primary/10 text-primary font-bold' 
            : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {icon}
          <span className="text-[10px]">{label}</span>
        </button>
      );
  };

export default Layout;
