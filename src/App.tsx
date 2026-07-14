import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import InvoiceUpload from './components/InvoiceUpload';
import InvoiceList from './components/InvoiceList';
import History from './components/History';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/AuthPage';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-gold-400 animate-spin mx-auto mb-4" />
          <p className="text-navy-200">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <InvoiceUpload />;
      case 'invoices':
        return <InvoiceList />;
      case 'history':
        return <History />;
      case 'users':
        return <UserManagementPlaceholder />;
      case 'audit':
        return <History />;
      case 'settings':
        return <SettingsPlaceholder />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function UserManagementPlaceholder() {
  return (
    <div className="card flex flex-col items-center justify-center py-12">
      <p className="text-gray-500">Gestión de usuarios próximamente</p>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="card flex flex-col items-center justify-center py-12">
      <p className="text-gray-500">Configuración próximamente</p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
