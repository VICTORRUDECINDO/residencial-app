'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Plus, Filter, Edit, Trash2, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import type { VApartamento } from '@/types/db';
import ApartamentoModal from '@/components/modals/ApartamentoModal';

export default function ApartamentosPage() {
  const [apartamentos, setApartamentos] = useState<VApartamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pago' | 'debe'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApartamento, setSelectedApartamento] = useState<any>(null);

  const fetchApartamentos = async () => {
    setLoading(true);
    // Usamos la vista que trae deuda_actual y datos del propietario
    const { data, error } = await supabase
      .from('v_apartamentos')
      .select('*')
      .order('apartamento'); // 'apartamento' es el código en la vista

    if (!error && data) {
      setApartamentos(data as VApartamento[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApartamentos();
  }, []);

  const handleEdit = (apt: VApartamento) => {
    setSelectedApartamento({
      id: apt.apartamento_id,
      codigo: apt.apartamento,
      bloque: apt.bloque,
      etapa: apt.etapa,
      propietario_id: apt.propietario_id
    });
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setSelectedApartamento(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este apartamento?')) return;
    
    // Soft delete: activo = false
    const { error } = await supabase
      .from('apartamentos')
      .update({ activo: false })
      .eq('id', id);

    if (!error) {
      fetchApartamentos();
    } else {
      alert('Error al desactivar el apartamento.');
    }
  };

  // Filtrado en memoria
  const filteredApartamentos = apartamentos.filter(apt => {
    // 1. Search term (by code or owner)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (apt.apartamento?.toLowerCase().includes(searchLower)) ||
      (apt.propietario?.toLowerCase().includes(searchLower)) ||
      (apt.bloque?.toLowerCase().includes(searchLower));

    // 2. Payment status filter
    let matchesPayment = true;
    const debt = Number(apt.deuda_actual ?? 0);
    if (paymentFilter === 'pago') matchesPayment = debt <= 0;
    if (paymentFilter === 'debe') matchesPayment = debt > 0;

    return matchesSearch && matchesPayment;
  });

  return (
    <>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Apartamentos</h1>
          <p className="page-subtitle">Gestión de unidades y propietarios</p>
        </div>
        <button onClick={handleNew} className="btn btn-primary">
          <Plus size={18} />
          Nuevo Apartamento
        </button>
      </div>

      <div className="page-body section-gap">
        {/* Filters Toolbar */}
        <div className="card">
          <div className="card-body flex-between" style={{ padding: '15px 20px', flexWrap: 'wrap', gap: '15px' }}>
            <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '250px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar por código, bloque o propietario..."
                  className="form-input"
                  style={{ paddingLeft: '35px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group flex-center" style={{ margin: 0, gap: '10px' }}>
              <Filter size={18} className="text-muted" />
              <select 
                className="form-input" 
                style={{ width: 'auto' }}
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
              >
                <option value="all">Todos los estados</option>
                <option value="pago">Al Día (Pagados)</option>
                <option value="debe">En Mora (Deben)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Bloque / Etapa</th>
                  <th>Propietario / Residente</th>
                  <th>Estado de Pago</th>
                  <th>Deuda</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px' }}>Cargando apartamentos...</td>
                  </tr>
                ) : filteredApartamentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-muted)' }}>
                      No se encontraron apartamentos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredApartamentos.map((apt) => {
                    const debe = Number(apt.deuda_actual ?? 0) > 0;
                    return (
                      <tr key={apt.apartamento_id}>
                        <td style={{ fontWeight: 600 }}>
                          <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '8px' }}>
                            <Building2 size={16} className="text-muted" />
                            {apt.apartamento}
                          </div>
                        </td>
                        <td>
                          {apt.bloque || '-'} {apt.etapa ? `/ Etapa ${apt.etapa}` : ''}
                        </td>
                        <td>
                          {apt.propietario ? (
                            <div>
                              <div>{apt.propietario}</div>
                              {apt.telefono && <div className="text-xs text-muted">{apt.telefono}</div>}
                            </div>
                          ) : (
                            <span className="text-muted text-sm italic">Sin asignar</span>
                          )}
                        </td>
                        <td>
                          {debe ? (
                            <span className="badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>
                              <AlertCircle size={12} style={{ marginRight: '4px' }} />
                              Pendiente (Debe)
                            </span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }}>
                              <CheckCircle size={12} style={{ marginRight: '4px' }} />
                              Al Día (Pago)
                            </span>
                          )}
                        </td>
                        <td style={{ fontWeight: debe ? 600 : 400, color: debe ? '#ef4444' : 'inherit' }}>
                          ${Number(apt.deuda_actual ?? 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button onClick={() => handleEdit(apt)} className="btn btn-ghost" title="Editar">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(apt.apartamento_id)} className="btn btn-ghost" title="Eliminar / Desactivar">
                            <Trash2 size={16} className="text-orange" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ApartamentoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchApartamentos}
        apartamento={selectedApartamento}
      />
    </>
  );
}
