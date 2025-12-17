import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AppContextType {
  user: User | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isDark: boolean;
  toggleTheme: () => void;
  isOnline: boolean;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  // Custom Navigation
  currentPath: string;
  navigate: (path: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isLoading, setLoading] = useState<boolean>(false);
  
  // Custom router state
  const [currentPath, setCurrentPath] = useState<string>('/');

  useEffect(() => {
    // Check local storage for theme
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // AUTO LOGIN LOGIC
    const storedEmail = localStorage.getItem('user_email');
    if (storedEmail) {
        // Restore session immediately without loading screen
        setUser({ 
            email: storedEmail, 
            name: storedEmail.split('@')[0], 
            photoUrl: 'https://picsum.photos/100/100' 
        });
    }

    // Online status listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    setIsDark(prev => {
      const newVal = !prev;
      if (newVal) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', newVal ? 'dark' : 'light');
      return newVal;
    });
  };

  const login = async (email: string) => {
    setLoading(true);
    // Simulate login process
    setTimeout(() => {
        localStorage.setItem('user_email', email); // Save session
        setUser({ email, name: email.split('@')[0], photoUrl: 'https://picsum.photos/100/100' });
        setLoading(false);
    }, 1000);
  };

  const logout = () => {
    localStorage.removeItem('user_email'); // Clear session
    setUser(null);
    setCurrentPath('/');
  };

  const navigate = (path: string) => {
      setCurrentPath(path);
  };

  return (
    <AppContext.Provider value={{ user, login, logout, isDark, toggleTheme, isOnline, isLoading, setLoading, currentPath, navigate }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};