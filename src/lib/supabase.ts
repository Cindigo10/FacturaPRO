import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const isSupabaseConfigured = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function getSupabaseConfigError(): string | null {
  if (!isSupabaseConfigured) {
    return 'Supabase no está configurado. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el entorno del deploy.';
  }
  return null;
}

export function isSupabaseReady() {
  return isSupabaseConfigured;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role: 'admin' | 'contador' | 'consulta';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name?: string | null;
          role?: 'admin' | 'contador' | 'consulta';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: 'admin' | 'contador' | 'consulta';
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          fecha: string | null;
          numero_factura: string | null;
          razon_social: string | null;
          ruc: string | null;
          dv: string | null;
          subtotal: number | null;
          itbms: number | null;
          descuento: number | null;
          total: number | null;
          descripcion: string | null;
          imagen_url: string | null;
          estado: 'activo' | 'inactivo' | 'revision';
          observaciones: string | null;
          needs_review: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          fecha?: string | null;
          numero_factura?: string | null;
          razon_social?: string | null;
          ruc?: string | null;
          dv?: string | null;
          subtotal?: number | null;
          itbms?: number | null;
          descuento?: number | null;
          total?: number | null;
          descripcion?: string | null;
          imagen_url?: string | null;
          estado?: 'activo' | 'inactivo' | 'revision';
          observaciones?: string | null;
          needs_review?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fecha?: string | null;
          numero_factura?: string | null;
          razon_social?: string | null;
          ruc?: string | null;
          dv?: string | null;
          subtotal?: number | null;
          itbms?: number | null;
          descuento?: number | null;
          total?: number | null;
          descripcion?: string | null;
          imagen_url?: string | null;
          estado?: 'activo' | 'inactivo' | 'revision';
          observaciones?: string | null;
          needs_review?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          details?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
