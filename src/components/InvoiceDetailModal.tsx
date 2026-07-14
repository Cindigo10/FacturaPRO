import { Invoice } from '../types';
import { X, Calendar, Building2, Hash, DollarSign, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDateForDisplay } from '../lib/utils';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
}

export default function InvoiceDetailModal({ invoice, onClose }: InvoiceDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-navy-900 to-navy-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold-500 flex items-center justify-center">
                <FileText className="w-6 h-6 text-navy-900" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Factura #{invoice.numeroFactura || 'N/A'}</h3>
                <p className="text-navy-300 text-sm">{formatDateForDisplay(invoice.fecha)}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Status banner */}
          {invoice.needsReview && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <p className="text-amber-800 font-medium">Esta factura requiere revisión</p>
              </div>
            </div>
          )}

          {/* Image preview */}
          {invoice.imagenUrl && (
            <div className="mb-6">
              <img
                src={invoice.imagenUrl}
                alt="Factura"
                className="w-full max-h-64 object-contain rounded-xl bg-gray-100"
              />
              <a
                href={invoice.imagenUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm text-navy-600 hover:text-navy-800"
              >
                <ExternalLink className="w-4 h-4" />
                Ver imagen completa
              </a>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider info */}
            <div className="space-y-4">
              <h4 className="font-semibold text-navy-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-navy-600" />
                Información del proveedor
              </h4>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Razón Social</p>
                  <p className="text-navy-900 font-medium">{invoice.razonSocial || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">RUC</p>
                    <p className="text-navy-900 font-medium">{invoice.ruc || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">DV</p>
                    <p className="text-navy-900 font-medium">{invoice.dv || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Amounts */}
            <div className="space-y-4">
              <h4 className="font-semibold text-navy-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-navy-600" />
                Montos
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-navy-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-600">ITBMS</span>
                  <span className="font-medium text-navy-900">{formatCurrency(invoice.itbms)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-gray-50">
                  <span className="text-gray-600">Descuento</span>
                  <span className="font-medium text-navy-900">{formatCurrency(invoice.descuento)}</span>
                </div>
                <div className="flex justify-between p-4 rounded-lg bg-navy-900">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-gold-400 font-bold text-lg">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {invoice.descripcion && (
            <div className="mt-6">
              <h4 className="font-semibold text-navy-900 flex items-center gap-2 mb-3">
                <Hash className="w-5 h-5 text-navy-600" />
                Descripción
              </h4>
              <div className="p-4 rounded-lg bg-gray-50">
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.descripcion}</p>
              </div>
            </div>
          )}

          {/* Observations */}
          {invoice.observaciones && (
            <div className="mt-6">
              <h4 className="font-semibold text-navy-900 flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-navy-600" />
                Observaciones
              </h4>
              <div className="p-4 rounded-lg bg-gray-50">
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.observaciones}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Creado</p>
              <p className="text-navy-900 font-medium text-sm">
                {new Date(invoice.createdAt).toLocaleString('es-PA')}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Última modificación</p>
              <p className="text-navy-900 font-medium text-sm">
                {new Date(invoice.updatedAt).toLocaleString('es-PA')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
