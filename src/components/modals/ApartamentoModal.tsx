'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Propietario } from '@/types/db';

interface ApartamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // If editing, we pass the raw table record or the view record.
  // We only need the basic fields to edit the table `apartamentos`.
  apartamento?: {
    id: number;
    codigo: string;
    bloque: string | null;
    etapa: string | null;
    propietario_id: number | null;
  } | null;
}

export default function ApartamentoModal({ isOpen, onClose, onSuccess, apartamento }: ApartamentoModalProps) {
  const [loading, setLoading] = useState(false);
  const [propietarios, setPropietarios] = useState<Propietario[]>([]);
  
  // Form state
  const [codigo, setCodigo] = useState('');
  const [bloque, setBloque] = useState('');
  const [etapa, setEtapa] = useState('');
  const [propietarioId, setPropietarioId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPropietarios();
      if (apartamento) {
        setCodigo(apartamento.codigo || '');
        setBloque(apartamento.bloque || '');
        setEtapa(apartamento.etapa || '');
        setPropietarioId(apartamento.propietario_id ? apartamento.propietario_id.toString() : '');
      } else {
        resetForm();
      }
    }
  }, [isOpen, apartamento]);

  const loadPropietarios = async () => {
    const { data, error } = await supabase
      .from('propietarios')
      .select('id, nombre, tipo')
      .order('nombre');
    
    if (data && !error) {
      setPropietarios(data as Propietario[]);
    }
  };

  const resetForm = () => {
    setCodigo('');
    setBloque('');
    setEtapa('');
    setPropietarioId('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        codigo: codigo.trim(),
        bloque: bloque.trim() || null,
        etapa: etapa.trim() || null,
        propietario_id: propietarioId ? parseInt(propietarioId) : null,
      };

      if (apartamento) {
        // Update
        const { error: updateError } = await supabase
          .from('apartamentos')
          .update(payload)
          .eq('id', apartamento.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('apartamentos')
          .insert(payload);
        
        if (insertError) {
          // Handle unique constraint error
          if (insertError.code === '23505') {
            throw new Error('Ya existe un apartamento con este código.');
          }
          throw insertError;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el apartamento.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{apartamento ? 'Editar Apartamento' : 'Nuevo Apartamento'}</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '5px' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body section-gap">
            {error && (
              <div className="alert alert-warning text-sm py-2 px-3">
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Código del Apartamento <span className="text-orange">*</span></label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Ej. A-101"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label className="form-label">Bloque / Edificio</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. B"
                  value={bloque}
                  onChange={(e) => setBloque(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Etapa / Fase</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej. 1"
                  value={etapa}
                  onChange={(e) => setEtapa(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Residente / Propietario Asignado</label>
              <select 
                className="form-input" 
                value={propietarioId}
                onChange={(e) => setPropietarioId(e.target.value)}
              >
                <option value="">-- Sin asignar --</option>
                {propietarios.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.tipo === 'propietario' ? 'Propietario' : 'Inquilino'})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Selecciona un residente de la lista o déjalo sin asignar.</p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !codigo.trim()}>
              <Save size={16} style={{ marginRight: '8px' }} />
              {loading ? 'Guardando...' : 'Guardar Apartamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
