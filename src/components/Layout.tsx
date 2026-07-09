import { useState, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Upload,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { getRoleLabel } from '../lib/utils';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Nueva Factura', icon: Upload },
    { id: 'invoices', label: 'Facturas', icon: FileText },
    { id: 'history', label: 'Historial', icon: History },
  ];

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 shadow-2xl transform transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-navy-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/30">
                  <FileText className="w-5 h-5 text-navy-900" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">FactuPro</h1>
                  <p className="text-xs text-navy-400">DGI Panamá</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-navy-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  currentPage === item.id
                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                    : 'text-navy-300 hover:bg-navy-800/50 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 ${currentPage === item.id ? 'text-gold-400' : ''}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}

            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-navy-800/50">
                <p className="px-4 text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">
                  Administración
                </p>
                <button
                  onClick={() => {
                    onNavigate('users');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === 'users'
                      ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                      : 'text-navy-300 hover:bg-navy-800/50 hover:text-white'
                  }`}
                >
                  <User className={`w-5 h-5 ${currentPage === 'users' ? 'text-gold-400' : ''}`} />
                  <span className="font-medium">Usuarios</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('audit');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === 'audit'
                      ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                      : 'text-navy-300 hover:bg-navy-800/50 hover:text-white'
                  }`}
                >
                  <Shield className={`w-5 h-5 ${currentPage === 'audit' ? 'text-gold-400' : ''}`} />
                  <span className="font-medium">Auditoría</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentPage === 'settings'
                      ? 'bg-gold-500/10 text-gold-400 border border-gold-500/20'
                      : 'text-navy-300 hover:bg-navy-800/50 hover:text-white'
                  }`}
                >
                  <Settings className={`w-5 h-5 ${currentPage === 'settings' ? 'text-gold-400' : ''}`} />
                  <span className="font-medium">Configuración</span>
                </button>
              </div>
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-navy-800/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-navy-800/30">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-900 font-bold">
                {user?.fullName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-navy-400">{getRoleLabel(user?.role || 'consulta')}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
          <div className="px-4 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-6 h-6 text-gray-600" />
                </button>
                <h2 className="text-lg font-semibold text-navy-900 hidden sm:block">
                  {navItems.find((item) => item.id === currentPage)?.label || 'Dashboard'}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {/* User menu (desktop) */}
                <div className="relative hidden lg:block">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-900 font-bold text-sm">
                      {user?.fullName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user?.fullName}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 py-2 bg-white rounded-xl shadow-xl border border-gray-100 animate-scale-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Cerrar sesión</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile logout */}
                <button
                  onClick={signOut}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
