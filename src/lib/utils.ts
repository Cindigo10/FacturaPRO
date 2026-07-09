// Validate Panama RUC format (XXX-XXX-XXXXXX)
export function validateRUC(ruc: string): boolean {
  const rucRegex = /^\d{3}-\d{3}-\d{6}$/;
  return rucRegex.test(ruc);
}

// Validate DV (Dígito Verificador)
export function validateDV(dv: string): boolean {
  const dvRegex = /^\d{1,2}$/;
  return dvRegex.test(dv);
}

// Validate date format (DD/MM/YYYY or YYYY-MM-DD)
export function validateDate(date: string): boolean {
  const dateRegex1 = /^\d{2}\/\d{2}\/\d{4}$/;
  const dateRegex2 = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex1.test(date) && !dateRegex2.test(date)) return false;

  const parsed = parseDate(date);
  return parsed instanceof Date && !isNaN(parsed.getTime());
}

// Parse date string to Date object
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try DD/MM/YYYY format
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  // Try YYYY-MM-DD format
  if (dateStr.includes('-')) {
    return new Date(dateStr);
  }

  return null;
}

// Format date to ISO format (YYYY-MM-DD)
export function formatDateToISO(dateStr: string): string {
  const date = parseDate(dateStr);
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

// Format date for display (DD/MM/YYYY)
export function formatDateForDisplay(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-PA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Validate invoice totals
export function validateTotals(
  subtotal: number,
  itbms: number,
  descuento: number,
  total: number
): { valid: boolean; message: string } {
  const calculated = subtotal + itbms - descuento;
  const difference = Math.abs(calculated - total);

  if (difference > 0.01) {
    return {
      valid: false,
      message: `La suma no coincide: subtotal (${formatCurrency(subtotal)}) + ITBMS (${formatCurrency(itbms)}) - descuento (${formatCurrency(descuento)}) = ${formatCurrency(calculated)}, pero el total es ${formatCurrency(total)}`,
    };
  }

  return { valid: true, message: '' };
}

// Format currency
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'B/. 0.00';
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

// Parse number from string
export function parseNumber(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// Generate unique filename for storage
export function generateFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const ext = originalName.split('.').pop() || 'pdf';
  return `${userId}/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;
}

// Get status badge color
export function getStatusColor(status: string): string {
  switch (status) {
    case 'activo':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'inactivo':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'revision':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Get role label
export function getRoleLabel(role: string): string {
  switch (role) {
    case 'admin':
      return 'Administrador';
    case 'contador':
      return 'Contador';
    case 'consulta':
      return 'Solo Consulta';
    default:
      return role;
  }
}
