import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText,
  DollarSign,
  Receipt,
  TrendingUp,
  Building2,
  CalendarDays,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DashboardStats, Invoice } from '../types';
import { formatCurrency, formatDateForDisplay } from '../lib/utils';

const COLORS = ['#1e3a5f', '#4f46e5', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  async function loadDashboardData() {
    try {
      // Fetch invoices
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats
      const activeInvoices = invoices?.filter((inv) => inv.estado === 'activo') || [];
      const totalAmount = activeInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const totalItbms = activeInvoices.reduce((sum, inv) => sum + (inv.itbms || 0), 0);
      const totalSubtotal = activeInvoices.reduce((sum, inv) => sum + (inv.subtotal || 0), 0);

      // Group by month
      const byMonth: Record<string, { count: number; amount: number }> = {};
      activeInvoices.forEach((inv) => {
        if (inv.fecha) {
          const month = new Date(inv.fecha).toLocaleDateString('es-PA', { month: 'short', year: 'numeric' });
          if (!byMonth[month]) byMonth[month] = { count: 0, amount: 0 };
          byMonth[month].count++;
          byMonth[month].amount += inv.total || 0;
        }
      });

      // Group by provider
      const byProvider: Record<string, { count: number; amount: number }> = {};
      activeInvoices.forEach((inv) => {
        const provider = inv.razon_social || 'Sin nombre';
        if (!byProvider[provider]) byProvider[provider] = { count: 0, amount: 0 };
        byProvider[provider].count++;
        byProvider[provider].amount += inv.total || 0;
      });

      setStats({
        totalInvoices: activeInvoices.length,
        totalAmount,
        totalItbms,
        totalSubtotal,
        invoicesByMonth: Object.entries(byMonth)
          .map(([month, data]) => ({ month, ...data }))
          .slice(-6),
        invoicesByProvider: Object.entries(byProvider)
          .map(([razonSocial, data]) => ({ razonSocial, ...data }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5),
        recentInvoices: activeInvoices.slice(0, 5).map((inv) => ({
          id: inv.id,
          userId: inv.user_id,
          fecha: inv.fecha,
          numeroFactura: inv.numero_factura,
          razonSocial: inv.razon_social,
          ruc: inv.ruc,
          dv: inv.dv,
          subtotal: inv.subtotal,
          itbms: inv.itbms,
          descuento: inv.descuento,
          total: inv.total,
          descripcion: inv.descripcion,
          imagenUrl: inv.imagen_url,
          estado: inv.estado,
          observaciones: inv.observaciones,
          needsReview: inv.needs_review,
          createdAt: inv.created_at,
          updatedAt: inv.updated_at,
        })),
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card shimmer h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 text-navy-700" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Total
            </span>
          </div>
          <p className="text-3xl font-bold text-navy-900">{stats?.totalInvoices || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Facturas registradas</p>
        </div>

        <div className="card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-100 to-gold-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6 text-gold-700" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-navy-900">{formatCurrency(stats?.totalAmount)}</p>
          <p className="text-sm text-gray-500 mt-1">Monto total</p>
        </div>

        <div className="card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-6 h-6 text-purple-700" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-navy-900">{formatCurrency(stats?.totalItbms)}</p>
          <p className="text-sm text-gray-500 mt-1">ITBMS acumulado</p>
        </div>

        <div className="card card-hover group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-teal-700" />
            </div>
            <ArrowUpRight className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-navy-900">{formatCurrency(stats?.totalSubtotal)}</p>
          <p className="text-sm text-gray-500 mt-1">Subtotal acumulado</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <CalendarDays className="w-5 h-5 text-navy-600" />
            <h3 className="text-lg font-semibold text-navy-900">Compras por mes</h3>
          </div>
          {stats?.invoicesByMonth && stats.invoicesByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.invoicesByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Monto']}
                />
                <Bar dataKey="amount" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No hay datos disponibles
            </div>
          )}
        </div>

        {/* Provider chart */}
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-navy-600" />
            <h3 className="text-lg font-semibold text-navy-900">Top proveedores</h3>
          </div>
          {stats?.invoicesByProvider && stats.invoicesByProvider.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.invoicesByProvider}
                  dataKey="amount"
                  nameKey="razonSocial"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name }) => name.substring(0, 15)}
                  labelLine={false}
                >
                  {stats.invoicesByProvider.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Recent invoices */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-navy-600" />
            <h3 className="text-lg font-semibold text-navy-900">Últimas facturas</h3>
          </div>
        </div>

        {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nº Factura
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Proveedor
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDateForDisplay(invoice.fecha)}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-navy-900">
                      {invoice.numeroFactura || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {invoice.razonSocial || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-navy-900 text-right">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          invoice.needsReview
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {invoice.needsReview && <AlertCircle className="w-3 h-3" />}
                        {invoice.needsReview ? 'Revisión' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay facturas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
