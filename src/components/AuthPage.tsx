import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Credenciales incorrectas. Verifique su correo y contraseña.'
          : error.message);
      }
    } catch {
      setError('Ha ocurrido un error inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-60 h-60 bg-navy-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gold-400/20 rounded-full blur-2xl" />
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gold-400 rounded-full" />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-gold-300 rounded-full" />
          <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gold-500 rounded-full" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-xl shadow-gold-500/30">
                <FileText className="w-8 h-8 text-navy-900" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">FactuPro</h1>
                <p className="text-navy-300">Gestión Inteligente</p>
              </div>
            </div>

            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Gestiona tus facturas
              <span className="block text-gold-400">fácilmente</span>
            </h2>

            <p className="text-lg text-navy-200 mb-8 max-w-md">
              Plataforma profesional para la declaración de renta de la DGI de Panamá.
              Control total de tus facturas con inteligencia artificial.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-navy-200">
                <div className="w-10 h-10 rounded-lg bg-navy-800/50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gold-400" />
                </div>
                <span>Lectura automática con IA (OCR)</span>
              </div>
              <div className="flex items-center gap-4 text-navy-200">
                <div className="w-10 h-10 rounded-lg bg-navy-800/50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gold-400" />
                </div>
                <span>Exportación a Excel compatibles con DGI</span>
              </div>
              <div className="flex items-center gap-4 text-navy-200">
                <div className="w-10 h-10 rounded-lg bg-navy-800/50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-gold-400" />
                </div>
                <span>Dashboard con estadísticas en tiempo real</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-800 to-transparent" />
      </div>

      {/* Right panel - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg">
              <FileText className="w-6 h-6 text-navy-900" />
            </div>
            <h1 className="text-2xl font-bold text-navy-900">FactuPro</h1>
          </div>

          <div className="card">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-2">
                Bienvenido
              </h2>
              <p className="text-gray-500">
                Inicia sesión para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-12"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Iniciando sesión...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
