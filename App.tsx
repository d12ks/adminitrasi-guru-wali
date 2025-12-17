import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InputData from './pages/InputData';
import Reports from './pages/Reports';

const AppContent = () => {
    const { user, currentPath } = useApp();

    if (!user) return <Login />;

    const renderPage = () => {
        switch (currentPath) {
            case '/':
                return <Dashboard />;
            case '/input':
                return <InputData />;
            case '/reports':
                return <Reports />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <Layout>
            {renderPage()}
        </Layout>
    );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;