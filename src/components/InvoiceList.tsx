import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Invoice } from '../types';
import {
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  Building2,
  AlertCircle,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDateForDisplay, getStatusColor } from '../lib/utils';
import InvoiceDetailModal from './InvoiceDetailModal';
import InvoiceForm from './InvoiceForm';

export default function InvoiceList() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  useEffect(() => {
    loadInvoices();
  }, [user]);

  async function loadInvoices() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedInvoices: Invoice[] = (data || []).map((inv) => ({
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
      }));

      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.numeroFactura?.toLowerCase().includes(term) ||
          inv.razonSocial?.toLowerCase().includes(term) ||
          inv.ruc?.includes(term) ||
          inv.descripcion?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((inv) => inv.estado === statusFilter);
    }

    // Date filter
    if (dateFrom) {
      result = result.filter((inv) => inv.fecha && inv.fecha >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((inv) => inv.fecha && inv.fecha <= dateTo);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortBy) {
        case 'fecha':
          aVal = a.fecha || '';
          bVal = b.fecha || '';
          break;
        case 'total':
          aVal = a.total || 0;
          bVal = b.total || 0;
          break;
        case 'razonSocial':
          aVal = a.razonSocial || '';
          bVal = b.razonSocial || '';
          break;
        default:
          aVal = a.createdAt;
          bVal = b.createdAt;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [invoices, searchTerm, statusFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  async function handleDelete(id: string) {
    if (!confirm('¿Está seguro de eliminar esta factura?')) return;

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'delete',
        entity_type: 'invoice',
        entity_id: id,
      });

      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  }

  function exportToExcel() {
    const exportData = filteredInvoices
      .sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''))
      .map((inv, index) => ({
        N: index + 1,
        Fecha: formatDateForDisplay(inv.fecha),
        'Número de factura': inv.numeroFactura || '',
        'Razón Social': inv.razonSocial || '',
        RUC: inv.ruc || '',
        DV: inv.dv || '',
        'Monto subtotal': inv.subtotal || 0,
        ITBMS: inv.itbms || 0,
        Descuento: inv.descuento || 0,
        'Monto total': inv.total || 0,
        Descripción: inv.descripcion || '',
      }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas');

    // Auto-width columns
    const colWidths = [
      { wch: 5 }, // N
      { wch: 12 }, // Fecha
      { wch: 15 }, // Número
      { wch: 30 }, // Razón Social
      { wch: 15 }, // RUC
      { wch: 5 }, // DV
      { wch: 12 }, // Subtotal
      { wch: 10 }, // ITBMS
      { wch: 10 }, // Descuento
      { wch: 12 }, // Total
      { wch: 40 }, // Descripción
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `facturas-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  function clearFilters() {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-navy-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Facturas</h2>
          <p className="text-gray-500 text-sm">
            {filteredInvoices.length} de {invoices.length} facturas
          </p>
        </div>
        <button onClick={exportToExcel} className="btn-primary">
          <Download className="w-5 h-5" />
          <span>Exportar Excel</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field pl-12"
              placeholder="Buscar por número, proveedor, RUC..."
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-navy-50 border-navy-300' : ''}`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filtros</span>
            {(statusFilter !== 'all' || dateFrom || dateTo) && (
              <span className="w-2 h-2 rounded-full bg-gold-500" />
            )}
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-down">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field"
              >
                <option value="all">Todos</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="revision">Revisión</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="input-field"
              />
            </div>

            <button
              onClick={clearFilters}
              className="sm:col-span-3 text-sm text-navy-600 hover:text-navy-800 font-medium flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th
                  onClick={() => {
                    setSortBy('fecha');
                    setSortOrder(sortBy === 'fecha' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha
                    {sortBy === 'fecha' && (
                      <span className="text-navy-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nº Factura
                </th>
                <th
                  onClick={() => {
                    setSortBy('razonSocial');
                    setSortOrder(sortBy === 'razonSocial' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Proveedor
                    {sortBy === 'razonSocial' && (
                      <span className="text-navy-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  RUC
                </th>
                <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  DV
                </th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Subtotal
                </th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  ITBMS
                </th>
                <th className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Desc.
                </th>
                <th
                  onClick={() => {
                    setSortBy('total');
                    setSortOrder(sortBy === 'total' && sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="text-right py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex items-center justify-end gap-2">
                    Total
                    {sortBy === 'total' && (
                      <span className="text-navy-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="text-center py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-center py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <FileSpreadsheet className="w-12 h-12 mb-4" />
                      <p className="font-medium">No hay facturas</p>
                      <p className="text-sm">Ajuste los filtros o agregue nuevas facturas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDateForDisplay(invoice.fecha)}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-navy-900">
                      {invoice.numeroFactura || '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate">
                      {invoice.razonSocial || '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 hidden lg:table-cell">
                      {invoice.ruc || '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 hidden xl:table-cell">
                      {invoice.dv || '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-right hidden md:table-cell">
                      {formatCurrency(invoice.subtotal)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-right hidden lg:table-cell">
                      {formatCurrency(invoice.itbms)}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 text-right hidden xl:table-cell">
                      {formatCurrency(invoice.descuento)}
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-navy-900 text-right">
                      {formatCurrency(invoice.total)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          invoice.estado
                        )}`}
                      >
                        {invoice.needsReview && <AlertCircle className="w-3 h-3" />}
                        {invoice.estado}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="p-2 rounded-lg text-gray-400 hover:text-navy-600 hover:bg-navy-50 transition-colors"
                          title="Ver"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingInvoice(invoice)}
                          className="p-2 rounded-lg text-gray-400 hover:text-navy-600 hover:bg-navy-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Edit Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-navy-900">Editar Factura</h3>
                <button
                  onClick={() => setEditingInvoice(null)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <InvoiceForm
                initialData={{
                  fecha: editingInvoice.fecha
                    ? new Date(editingInvoice.fecha).toLocaleDateString('es-PA')
                    : '',
                  numeroFactura: editingInvoice.numeroFactura || '',
                  razonSocial: editingInvoice.razonSocial || '',
                  ruc: editingInvoice.ruc || '',
                  dv: editingInvoice.dv || '',
                  subtotal: editingInvoice.subtotal?.toString() || '',
                  itbms: editingInvoice.itbms?.toString() || '',
                  descuento: editingInvoice.descuento?.toString() || '0',
                  total: editingInvoice.total?.toString() || '',
                  descripcion: editingInvoice.descripcion || '',
                  observaciones: editingInvoice.observaciones || '',
                }}
                imagenUrl={editingInvoice.imagenUrl}
                needsReview={editingInvoice.needsReview}
                editId={editingInvoice.id}
                onSuccess={() => {
                  setEditingInvoice(null);
                  loadInvoices();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
