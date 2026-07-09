import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AuditLog } from '../types';
import { Clock, User, FileText, AlertCircle, CheckCircle2, Trash2, Edit2, Plus, Loader2 } from 'lucide-react';
import { formatDateForDisplay } from '../lib/utils';

export default function History() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [isAdmin]);

  async function loadLogs() {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const mappedLogs: AuditLog[] = (data || []).map((log: Record<string, unknown>) => ({
        id: log.id as string,
        userId: log.user_id as string,
        action: log.action as string,
        entityType: log.entity_type as string,
        entityId: log.entity_id as string | null,
        details: log.details as Record<string, unknown>,
        ipAddress: log.ip_address as string | null,
        createdAt: log.created_at as string,
      }));

      setLogs(mappedLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function getActionIcon(action: string) {
    switch (action) {
      case 'create':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'update':
        return <Edit2 className="w-4 h-4 text-blue-600" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  }

  function getActionLabel(action: string) {
    switch (action) {
      case 'create':
        return { text: 'Creado', color: 'bg-green-100 text-green-700' };
      case 'update':
        return { text: 'Actualizado', color: 'bg-blue-100 text-blue-700' };
      case 'delete':
        return { text: 'Eliminado', color: 'bg-red-100 text-red-700' };
      default:
        return { text: action, color: 'bg-gray-100 text-gray-700' };
    }
  }

  if (!isAdmin) {
    return (
      <div className="card flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 font-medium">Acceso restringido</p>
        <p className="text-gray-400 text-sm">Solo administradores pueden ver el historial</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900">Historial de Actividad</h2>
        <p className="text-gray-500 text-sm">Registro de todas las acciones realizadas en el sistema</p>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-navy-600 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-12">
          <Clock className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">Sin actividad</p>
          <p className="text-gray-400 text-sm">No hay registros en el historial</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Entidad
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Detalles
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="text-sm text-navy-900 font-medium">
                        {new Date(log.createdAt).toLocaleDateString('es-PA')}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleTimeString('es-PA')}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-navy-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Usuario</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionLabel(log.action).color}`}>
                          {getActionLabel(log.action).text}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 capitalize">{log.entityType}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-gray-500">
                        {log.details?.numero_factura ? `Factura #${log.details.numero_factura}` : '-'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
