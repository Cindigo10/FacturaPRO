import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { InvoiceFormData } from '../types';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  Hash,
  DollarSign,
  Calendar,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { validateRUC, validateDV, validateDate, formatCurrency, validateTotals } from '../lib/utils';

interface InvoiceFormProps {
  initialData: InvoiceFormData;
  imagenUrl: string | null;
  needsReview?: boolean;
  onSuccess?: () => void;
  editId?: string;
}

export default function InvoiceForm({
  initialData,
  imagenUrl,
  needsReview = false,
  onSuccess,
  editId,
}: InvoiceFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<InvoiceFormData>(initialData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warning, setWarning] = useState<string | null>(null);

  const updateField = (field: keyof InvoiceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.fecha && !validateDate(formData.fecha)) {
      newErrors.fecha = 'Formato de fecha inválido (DD/MM/YYYY)';
    }

    if (formData.ruc && !validateRUC(formData.ruc)) {
      newErrors.ruc = 'Formato RUC inválido (XXX-XXX-XXXXXX)';
    }

    if (formData.dv && !validateDV(formData.dv)) {
      newErrors.dv = 'DV debe tener 1-2 dígitos';
    }

    const subtotal = parseFloat(formData.subtotal) || 0;
    const itbms = parseFloat(formData.itbms) || 0;
    const descuento = parseFloat(formData.descuento) || 0;
    const total = parseFloat(formData.total) || 0;

    if (subtotal < 0) newErrors.subtotal = 'Valor inválido';
    if (itbms < 0) newErrors.itbms = 'Valor inválido';
    if (descuento < 0) newErrors.descuento = 'Valor inválido';
    if (total < 0) newErrors.total = 'Valor inválido';

    const totalsCheck = validateTotals(subtotal, itbms, descuento, total);
    if (!totalsCheck.valid) {
      setWarning(totalsCheck.message);
    } else {
      setWarning(null);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Convert date to YYYY-MM-DD format
      let fechaISO = formData.fecha;
      if (formData.fecha && formData.fecha.includes('/')) {
        const [day, month, year] = formData.fecha.split('/');
        fechaISO = `${year}-${month}-${day}`;
      }

      const invoiceData = {
        user_id: user?.id,
        fecha: fechaISO || null,
        numero_factura: formData.numeroFactura || null,
        razon_social: formData.razonSocial || null,
        ruc: formData.ruc || null,
        dv: formData.dv || null,
        subtotal: parseFloat(formData.subtotal) || null,
        itbms: parseFloat(formData.itbms) || null,
        descuento: parseFloat(formData.descuento) || 0,
        total: parseFloat(formData.total) || null,
        descripcion: formData.descripcion || null,
        imagen_url: imagenUrl,
        estado: 'activo' as const,
        observaciones: formData.observaciones || null,
        needs_review: needsReview || warning !== null,
      };

      let error;
      if (editId) {
        const result = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', editId);
        error = result.error;
      } else {
        const result = await supabase.from('invoices').insert(invoiceData);
        error = result.error;
      }

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: editId ? 'update' : 'create',
        entity_type: 'invoice',
        details: { numero_factura: formData.numeroFactura, total: formData.total },
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error saving invoice:', error);
      setErrors({ submit: 'Error al guardar la factura' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required fields warning */}
      {needsReview && (
        <div className="card bg-amber-50 border-amber-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-amber-800 font-medium">Revisión requerida</p>
              <p className="text-amber-600 text-sm mt-1">
                Algunos datos pueden requerir verificación manual.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Totals warning */}
      {warning && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{warning}</p>
          </div>
        </div>
      )}

      {/* Invoice Information */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-navy-600" />
          <h4 className="font-semibold text-navy-900">Información de la factura</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                Fecha
              </div>
            </label>
            <input
              type="text"
              value={formData.fecha}
              onChange={(e) => updateField('fecha', e.target.value)}
              className={`input-field ${errors.fecha ? 'input-field-error' : ''}`}
              placeholder="DD/MM/YYYY"
            />
            {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-gray-400" />
                Número de factura
              </div>
            </label>
            <input
              type="text"
              value={formData.numeroFactura}
              onChange={(e) => updateField('numeroFactura', e.target.value)}
              className="input-field"
              placeholder="6577786"
            />
          </div>
        </div>
      </div>

      {/* Provider Information */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-navy-600" />
          <h4 className="font-semibold text-navy-900">Información del proveedor</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón social
            </label>
            <input
              type="text"
              value={formData.razonSocial}
              onChange={(e) => updateField('razonSocial', e.target.value)}
              className="input-field"
              placeholder="ORLYN S.A."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RUC
            </label>
            <input
              type="text"
              value={formData.ruc}
              onChange={(e) => updateField('ruc', e.target.value)}
              className={`input-field ${errors.ruc ? 'input-field-error' : ''}`}
              placeholder="630-483-123250"
            />
            {errors.ruc && <p className="text-red-500 text-xs mt-1">{errors.ruc}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              DV
            </label>
            <input
              type="text"
              value={formData.dv}
              onChange={(e) => updateField('dv', e.target.value)}
              className={`input-field ${errors.dv ? 'input-field-error' : ''}`}
              placeholder="16"
            />
            {errors.dv && <p className="text-red-500 text-xs mt-1">{errors.dv}</p>}
          </div>
        </div>
      </div>

      {/* Amounts */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <DollarSign className="w-5 h-5 text-navy-600" />
          <h4 className="font-semibold text-navy-900">Montos</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtotal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                B/.
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.subtotal}
                onChange={(e) => updateField('subtotal', e.target.value)}
                className={`input-field pl-10 ${errors.subtotal ? 'input-field-error' : ''}`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ITBMS
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                B/.
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.itbms}
                onChange={(e) => updateField('itbms', e.target.value)}
                className={`input-field pl-10 ${errors.itbms ? 'input-field-error' : ''}`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descuento
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                B/.
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.descuento}
                onChange={(e) => updateField('descuento', e.target.value)}
                className={`input-field pl-10 ${errors.descuento ? 'input-field-error' : ''}`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                B/.
              </span>
              <input
                type="number"
                step="0.01"
                value={formData.total}
                onChange={(e) => updateField('total', e.target.value)}
                className={`input-field pl-10 font-semibold ${errors.total ? 'input-field-error' : ''}`}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Calculated verification */}
        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Verificación:</span>{' '}
            {formatCurrency(parseFloat(formData.subtotal) || 0)} +{' '}
            {formatCurrency(parseFloat(formData.itbms) || 0)} -{' '}
            {formatCurrency(parseFloat(formData.descuento) || 0)} ={' '}
            <span className="font-bold text-navy-900">
              {formatCurrency(
                (parseFloat(formData.subtotal) || 0) +
                  (parseFloat(formData.itbms) || 0) -
                  (parseFloat(formData.descuento) || 0)
              )}
            </span>
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-5 h-5 text-navy-600" />
          <h4 className="font-semibold text-navy-900">Descripción y observaciones</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => updateField('descripcion', e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Detalle de la compra..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => updateField('observaciones', e.target.value)}
              className="input-field resize-none"
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>
      </div>

      {/* Submit error */}
      {errors.submit && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-4">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{errors.submit}</p>
          </div>
        </div>
      )}

      {/* Submit button */}
      <button type="submit" disabled={loading} className="btn-gold w-full py-4">
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Guardando...</span>
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            <span>Guardar factura</span>
            <CheckCircle2 className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
}
