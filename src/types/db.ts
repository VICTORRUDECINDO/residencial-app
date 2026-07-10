// ============================================================
// types/db.ts — Tipos TypeScript del esquema PostgreSQL/Supabase
// Sistema de Facturación Residencial v4 Final
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─────────────────────────────────────────────
// ENUMS / LITERALES
// ─────────────────────────────────────────────
export type TipoPropietario = 'propietario' | 'inquilino';
export type TipoConcepto = 'cargo' | 'abono';

// ─────────────────────────────────────────────
// TABLA 1: configuracion (siempre 1 sola fila)
// ─────────────────────────────────────────────
export interface Configuracion {
  id: 1; // CHECK (id = 1)
  nombre_residencial: string;
  logo_url: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  banco_nombre: string | null;
  banco_cuenta: string | null;
  banco_tipo: string | null;
  banco_titular: string | null;
  cedula_titular: string | null;
  forma_pago_detalle: string | null;
  descripcion_gas: string | null;
  usuario_acceso: string;
  password_hash: string;
  creado_en: string;
  actualizado_en: string;
}

// ─────────────────────────────────────────────
// TABLA 2: constantes
// ─────────────────────────────────────────────
export interface Constante {
  id: number;
  clave: string;                // 'precio_galon', 'factor_conversion_m3', 'mantenimiento_mensual'
  valor: number;
  descripcion: string | null;
  unidad: string | null;        // 'DOP/galón', 'galones/m3', 'DOP'
  actualizado_en: string;
}

// ─────────────────────────────────────────────
// TABLA 3: propietarios
// ─────────────────────────────────────────────
export interface Propietario {
  id: number;
  nombre: string;
  cedula: string | null;
  telefono: string | null;
  email: string | null;
  tipo: TipoPropietario;
  fecha_entrada: string | null; // DATE → string ISO
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
}

// ─────────────────────────────────────────────
// TABLA 4: apartamentos
// ─────────────────────────────────────────────
export interface Apartamento {
  id: number;
  codigo: string;               // Único, ej: 'A-101'
  bloque: string | null;
  etapa: string | null;
  propietario_id: number | null;
  activo: boolean;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;
}

// ─────────────────────────────────────────────
// TABLA 5: conceptos
// ─────────────────────────────────────────────
export interface Concepto {
  id: number;
  nombre: string;               // 'Gas', 'Mantenimiento', 'Penalización', 'Abono'
  tipo: TipoConcepto;
  creado_en: string;
}

// ─────────────────────────────────────────────
// TABLA 6: mediciones_gas
// ─────────────────────────────────────────────
export interface MedicionGas {
  id: number;
  apartamento_id: number;
  fecha_medicion: string;         // DATE
  lectura_anterior: number;
  lectura_actual: number;
  consumo_m3: number;             // GENERATED: lectura_actual - lectura_anterior
  factor_conversion: number;
  consumo_galones: number;        // GENERATED: consumo_m3 * factor_conversion
  precio_galon: number;
  total_gas: number;              // GENERATED: consumo_galones * precio_galon
  foto_url: string | null;
  notas: string | null;
  creado_en: string;
}

// ─────────────────────────────────────────────
// TABLA 7: transacciones
// ─────────────────────────────────────────────
export interface Transaccion {
  id: number;
  apartamento_id: number;
  propietario_id: number | null;
  fecha: string;                  // DATE
  concepto_id: number;
  descripcion: string | null;
  monto: number;
  balance_pendiente: number;
  creado_en: string;
}

// ─────────────────────────────────────────────
// TABLA 8: facturas
// ─────────────────────────────────────────────
export interface Factura {
  id: number;
  numero_factura: string;         // Único, ej: 'FAC-2025-001'
  apartamento_id: number;
  propietario_id: number | null;
  fecha_emision: string;          // DATE
  fecha_cobro_mantenimiento: string | null; // DATE
  subtotal_gas: number;
  subtotal_mantenimiento: number;
  subtotal_penalidades: number;
  descripcion_penalidades: string | null;
  abonos_aplicados: number;
  saldo_anterior: number;
  descripcion_atrasos: string | null;
  total_factura: number;
  medicion_gas_id: number | null;
  pdf_url: string | null;
  enviada_whatsapp: boolean;
  enviada_email: boolean;
  notas: string | null;
  creado_en: string;
}

// ─────────────────────────────────────────────
// TABLA 9: recibos
// ─────────────────────────────────────────────
export interface Recibo {
  id: number;
  numero_recibo: string;          // Único
  apartamento_id: number;
  propietario_id: number | null;
  transaccion_id: number;
  fecha_pago: string;             // DATE
  monto_pagado: number;
  metodo_pago: string;            // 'efectivo', 'transferencia', etc.
  referencia_id: string | null;
  descripcion: string | null;
  cuenta_x_pagar: string | null;
  saldo_pendiente: number | null;
  pdf_url: string | null;
  creado_en: string;
}

// ─────────────────────────────────────────────
// TABLA 10: auditoria
// ─────────────────────────────────────────────
export interface Auditoria {
  id: number;
  accion: string;                 // 'PROPIETARIO_CAMBIADO', 'INSERT', etc.
  tabla_afectada: string | null;
  registro_id: number | null;
  valores_antes: Json | null;
  valores_despues: Json | null;
  ip: string | null;
  user_agent: string | null;
  creado_en: string;
}

// ─────────────────────────────────────────────
// VISTAS
// ─────────────────────────────────────────────

/** Vista: v_apartamentos — Apartamentos activos con propietario y deuda actual */
export interface VApartamento {
  apartamento_id: number;
  apartamento: string;            // codigo
  bloque: string | null;
  etapa: string | null;
  propietario_id: number | null;
  propietario: string | null;     // nombre del propietario
  tipo: TipoPropietario | null;
  telefono: string | null;
  email: string | null;
  fecha_entrada: string | null;
  acuerdos_pago: string | null;   // notas del propietario
  deuda_actual: number;
  ultimo_movimiento: string | null;
}

/** Vista: v_sin_factura_mes_actual — Apartamentos sin factura en el mes actual */
export interface VSinFacturaMes {
  apartamento_id: number;
  apartamento: string;
  bloque: string | null;
  etapa: string | null;
  propietario: string | null;
  telefono: string | null;
  deuda_actual: number;
}

/** Vista: v_resumen_mensual — Resumen de facturación por mes */
export interface VResumenMensual {
  mes: string;                    // 'YYYY-MM'
  total_facturas: number;
  total_facturado: number;
  total_gas: number;
  total_mantenimiento: number;
  total_penalidades: number;
  total_abonos_aplicados: number;
}

/** Vista: v_morosos — Igual que v_apartamentos filtrada por deuda_actual > 0 */
export type VMoroso = VApartamento;

// ─────────────────────────────────────────────
// DATABASE TYPE (para createClient<Database>)
// ─────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      configuracion: {
        Row: Configuracion;
        Insert: Partial<Configuracion>;
        Update: Partial<Configuracion>;
        Relationships: [];
      };
      constantes: {
        Row: Constante;
        Insert: Omit<Constante, 'id'> & { actualizado_en?: string };
        Update: Partial<Constante>;
        Relationships: [];
      };
      propietarios: {
        Row: Propietario;
        Insert: Omit<Propietario, 'id'> & { creado_en?: string; actualizado_en?: string };
        Update: Partial<Propietario>;
        Relationships: [];
      };
      apartamentos: {
        Row: Apartamento;
        Insert: Omit<Apartamento, 'id'> & { creado_en?: string; actualizado_en?: string };
        Update: Partial<Apartamento>;
        Relationships: [
          {
            foreignKeyName: "apartamentos_propietario_id_fkey";
            columns: ["propietario_id"];
            referencedRelation: "propietarios";
            referencedColumns: ["id"];
          }
        ];
      };
      conceptos: {
        Row: Concepto;
        Insert: Omit<Concepto, 'id'> & { creado_en?: string };
        Update: Partial<Concepto>;
        Relationships: [];
      };
      mediciones_gas: {
        Row: MedicionGas;
        Insert: Omit<MedicionGas, 'id' | 'consumo_m3' | 'consumo_galones' | 'total_gas'> & { creado_en?: string };
        Update: Partial<Omit<MedicionGas, 'id' | 'consumo_m3' | 'consumo_galones' | 'total_gas'>>;
        Relationships: [
          {
            foreignKeyName: "mediciones_gas_apartamento_id_fkey";
            columns: ["apartamento_id"];
            referencedRelation: "apartamentos";
            referencedColumns: ["id"];
          }
        ];
      };
      transacciones: {
        Row: Transaccion;
        Insert: Omit<Transaccion, 'id'> & { creado_en?: string };
        Update: Partial<Transaccion>;
        Relationships: [
          {
            foreignKeyName: "transacciones_apartamento_id_fkey";
            columns: ["apartamento_id"];
            referencedRelation: "apartamentos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transacciones_concepto_id_fkey";
            columns: ["concepto_id"];
            referencedRelation: "conceptos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transacciones_propietario_id_fkey";
            columns: ["propietario_id"];
            referencedRelation: "propietarios";
            referencedColumns: ["id"];
          }
        ];
      };
      facturas: {
        Row: Factura;
        Insert: Omit<Factura, 'id'> & { creado_en?: string };
        Update: Partial<Factura>;
        Relationships: [
          {
            foreignKeyName: "facturas_apartamento_id_fkey";
            columns: ["apartamento_id"];
            referencedRelation: "apartamentos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "facturas_medicion_gas_id_fkey";
            columns: ["medicion_gas_id"];
            referencedRelation: "mediciones_gas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "facturas_propietario_id_fkey";
            columns: ["propietario_id"];
            referencedRelation: "propietarios";
            referencedColumns: ["id"];
          }
        ];
      };
      recibos: {
        Row: Recibo;
        Insert: Omit<Recibo, 'id'> & { creado_en?: string };
        Update: Partial<Recibo>;
        Relationships: [
          {
            foreignKeyName: "recibos_apartamento_id_fkey";
            columns: ["apartamento_id"];
            referencedRelation: "apartamentos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recibos_propietario_id_fkey";
            columns: ["propietario_id"];
            referencedRelation: "propietarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recibos_transaccion_id_fkey";
            columns: ["transaccion_id"];
            referencedRelation: "transacciones";
            referencedColumns: ["id"];
          }
        ];
      };
      auditoria: {
        Row: Auditoria;
        Insert: Partial<Auditoria>;
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      v_apartamentos: {
        Row: VApartamento;
      };
      v_sin_factura_mes_actual: {
        Row: VSinFacturaMes;
      };
      v_resumen_mensual: {
        Row: VResumenMensual;
      };
      v_morosos: {
        Row: VMoroso;
      };
    };
    Functions: {
      cambiar_propietario: {
        Args: {
          p_apartamento_id: number;
          p_nombre: string;
          p_cedula?: string;
          p_telefono?: string;
          p_email?: string;
          p_tipo?: TipoPropietario;
          p_fecha_entrada?: string;
          p_notas?: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// ─────────────────────────────────────────────
// HELPERS DE TIPO
// ─────────────────────────────────────────────
export type TableRow<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TableInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type ViewRow<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row'];
