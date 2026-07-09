export type UserRole = 'admin' | 'contador' | 'consulta';

export type InvoiceStatus = 'activo' | 'inactivo' | 'revision';

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  fecha: string | null;
  numeroFactura: string | null;
  razonSocial: string | null;
  ruc: string | null;
  dv: string | null;
  subtotal: number | null;
  itbms: number | null;
  descuento: number | null;
  total: number | null;
  descripcion: string | null;
  imagenUrl: string | null;
  estado: InvoiceStatus;
  observaciones: string | null;
  needsReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
}

export interface OCRResult {
  fecha?: string;
  numero_factura?: string;
  razon_social?: string;
  ruc?: string;
  dv?: string;
  subtotal?: number;
  itbms?: number;
  descuento?: number;
  total?: number;
  descripcion?: string;
  confidence?: Record<string, number>;
  needsReview?: boolean;
}

export interface DashboardStats {
  totalInvoices: number;
  totalAmount: number;
  totalItbms: number;
  totalSubtotal: number;
  invoicesByMonth: { month: string; count: number; amount: number }[];
  invoicesByProvider: { razonSocial: string; count: number; amount: number }[];
  recentInvoices: Invoice[];
}

export interface InvoiceFormData {
  fecha: string;
  numeroFactura: string;
  razonSocial: string;
  ruc: string;
  dv: string;
  subtotal: string;
  itbms: string;
  descuento: string;
  total: string;
  descripcion: string;
  observaciones: string;
}
