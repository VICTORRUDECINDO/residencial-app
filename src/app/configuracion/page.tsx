'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Configuracion, Constante, Auditoria } from '@/types/db';
import { 
  Key,
  Plus,
  Trash2,
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Database,
  Search,
  Sliders,
  DollarSign
} from 'lucide-react';

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<'ajustes' | 'tarifas' | 'auditoria'>('ajustes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // States for database values
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [constantes, setConstantes] = useState<Constante[]>([]);
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);
  const [searchAuditoria, setSearchAuditoria] = useState('');

  // Form state for new constante
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newConstante, setNewConstante] = useState({
    clave: '',
    valor: 0,
    descripcion: '',
    unidad: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch configuracion (since id=1 check exists, try to get id: 1)
      const { data: configData, error: configError } = await supabase
        .from('configuracion')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (configError) throw configError;

      if (configData) {
        setConfig(configData);
      } else {
        // If it doesn't exist, create a default one
        const defaultConfig = {
          id: 1,
          nombre_residencial: 'Residencial',
          logo_url: '',
          telefono: '',
          email: '',
          direccion: '',
          banco_nombre: '',
          banco_cuenta: '',
          banco_tipo: '',
          banco_titular: '',
          cedula_titular: '',
          forma_pago_detalle: '',
          descripcion_gas: '',
          usuario_acceso: 'admin',
          password_hash: '123456', // Default PIN/Password
        };
        setConfig(defaultConfig as any);
      }

      // 2. Fetch constantes
      const { data: constantesData, error: constError } = await supabase
        .from('constantes')
        .select('*')
        .order('clave', { ascending: true });

      if (constError) throw constError;
      setConstantes(constantesData || []);

      // 3. Fetch auditorias
      const { data: auditData, error: auditError } = await supabase
        .from('auditoria')
        .select('*')
        .order('creado_en', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;
      setAuditorias(auditData || []);

    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos de configuración.');
    } finally {
      setLoading(false);
    }
  };

  // Save Access settings (PIN and recovery email)
  const handleSaveAjustes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: saveError } = await (supabase.from('configuracion') as any)
        .upsert({
          id: 1,
          nombre_residencial: config.nombre_residencial || 'Residencial',
          email: config.email, // Recovery email
          password_hash: config.password_hash, // PIN de acceso
          usuario_acceso: config.usuario_acceso || 'admin',
          actualizado_en: new Date().toISOString()
        });

      if (saveError) throw saveError;
      setSuccess('Ajustes del sistema guardados correctamente.');
    } catch (err: any) {
      setError(err.message || 'Error al guardar los ajustes.');
    } finally {
      setSaving(false);
    }
  };

  // Update an existing constant value
  const handleUpdateConstante = async (id: number, nuevoValor: number) => {
    setError(null);
    setSuccess(null);
    try {
      const { error: updateError } = await (supabase.from('constantes') as any)
        .update({ valor: nuevoValor, actualizado_en: new Date().toISOString() })
        .eq('id', id);

      if (updateError) throw updateError;
      
      setConstantes(prev => prev.map(c => c.id === id ? { ...c, valor: nuevoValor } : c));
      setSuccess('Constante actualizada correctamente.');
    } catch (err: any) {
      setError(err.message || 'Error al actualizar constante.');
    }
  };

  // Create a new constant
  const handleAddConstante = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const { data, error: insertError } = await (supabase.from('constantes') as any)
        .insert([
          {
            clave: newConstante.clave,
            valor: Number(newConstante.valor),
            descripcion: newConstante.descripcion,
            unidad: newConstante.unidad,
            actualizado_en: new Date().toISOString()
          }
        ])
        .select();

      if (insertError) throw insertError;

      if (data && data.length > 0) {
        setConstantes(prev => [...prev, data[0]].sort((a, b) => a.clave.localeCompare(b.clave)));
      }
      setIsModalOpen(false);
      setNewConstante({ clave: '', valor: 0, descripcion: '', unidad: '' });
      setSuccess('Nueva constante añadida correctamente.');
    } catch (err: any) {
      setError(err.message || 'Error al añadir constante.');
    } finally {
      setSaving(false);
    }
  };

  // Delete a constant
  const handleDeleteConstante = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta constante?')) return;
    setError(null);
    setSuccess(null);

    try {
      const { error: deleteError } = await supabase
        .from('constantes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setConstantes(prev => prev.filter(c => c.id !== id));
      setSuccess('Constante eliminada correctamente.');
    } catch (err: any) {
      setError(err.message || 'Error al eliminar constante.');
    }
  };

  const filteredAuditorias = auditorias.filter(a => {
    const term = searchAuditoria.toLowerCase();
    return (
      (a.accion || '').toLowerCase().includes(term) ||
      (a.tabla_afectada || '').toLowerCase().includes(term) ||
      (a.registro_id?.toString() || '').includes(term)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-subtitle">Ajustes de acceso, control de tarifas y registro de auditoría.</p>
        </div>
      </div>

      <div className="page-body section-gap">
        {/* Alerts */}
        {error && (
          <div className="alert alert-warning">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('ajustes')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'ajustes'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sliders size={16} />
            Ajustes del Sistema
          </button>
          <button
            onClick={() => setActiveTab('tarifas')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'tarifas'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <DollarSign size={16} />
            Constantes y Tarifas
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`flex items-center gap-2 py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'auditoria'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database size={16} />
            Auditoría
          </button>
        </div>

        {/* Tab Content: Ajustes del Sistema */}
        {activeTab === 'ajustes' && config && (
          <form onSubmit={handleSaveAjustes} className="section-gap">
            <div className="card">
              <div className="card-header">
                <span className="card-title flex items-center gap-2">
                  <Key size={16} className="text-gray-400" />
                  Seguridad y Recuperación
                </span>
              </div>
              <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">PIN / Código de Acceso</label>
                  <input
                    type="password"
                    required
                    value={config.password_hash}
                    onChange={e => setConfig({ ...config, password_hash: e.target.value })}
                    className="form-input"
                    placeholder="PIN numérico o contraseña"
                  />
                  <span className="text-muted text-xs">Clave requerida para iniciar sesión o autorizar transacciones.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico de Recuperación</label>
                  <input
                    type="email"
                    required
                    value={config.email || ''}
                    onChange={e => setConfig({ ...config, email: e.target.value })}
                    className="form-input"
                    placeholder="ejemplo@correo.com"
                  />
                  <span className="text-muted text-xs">Este correo se utilizará para recuperar el PIN de acceso en caso de olvido.</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Guardar Ajustes
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab Content: Constantes y Tarifas */}
        {activeTab === 'tarifas' && (
          <div className="section-gap">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Gestión de Tarifas</h3>
                <p className="text-xs text-gray-500">Defina constantes como precio_galon, factor_conversion_m3, etc.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} />
                Añadir Constante
              </button>
            </div>

            <div className="card">
              <div className="card-body p-0">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Clave</th>
                        <th>Descripción</th>
                        <th>Unidad</th>
                        <th style={{ width: '180px' }}>Valor</th>
                        <th style={{ width: '150px' }}>Última Actualización</th>
                        <th style={{ width: '80px', textAlign: 'center' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {constantes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            No hay constantes configuradas. Añada una para comenzar.
                          </td>
                        </tr>
                      ) : (
                        constantes.map(c => (
                          <tr key={c.id}>
                            <td className="font-semibold text-gray-900 font-mono">{c.clave}</td>
                            <td className="text-gray-500 text-xs">{c.descripcion}</td>
                            <td>
                              <span className="badge badge-gray">{c.unidad || '—'}</span>
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.000001"
                                defaultValue={Number(c.valor)}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val !== Number(c.valor)) {
                                    handleUpdateConstante(c.id, val);
                                  }
                                }}
                                className="form-input text-right font-mono"
                                style={{ padding: '4px 8px', width: '130px' }}
                              />
                            </td>
                            <td className="text-sm text-gray-500 font-mono">
                              {new Date(c.actualizado_en).toLocaleDateString('es-DO')}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteConstante(c.id)}
                                className="btn btn-ghost text-orange hover:bg-orange-light p-1 rounded"
                                title="Eliminar constante"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Auditoría */}
        {activeTab === 'auditoria' && (
          <div className="section-gap">
            <div className="flex items-center gap-2 max-w-md bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm">
              <Search className="text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por acción, tabla o ID..."
                value={searchAuditoria}
                onChange={e => setSearchAuditoria(e.target.value)}
                className="w-full text-sm outline-none border-none bg-transparent text-gray-700"
              />
            </div>

            <div className="card">
              <div className="card-header">
                <span className="card-title">
                  Historial de Auditoría
                </span>
              </div>
              <div className="card-body p-0">
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha / Hora</th>
                        <th>Acción</th>
                        <th>Tabla</th>
                        <th>ID Reg</th>
                        <th>Valores Anteriores</th>
                        <th>Valores Nuevos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditorias.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="empty-state">
                            No se encontraron registros de auditoría.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditorias.map(a => (
                          <tr key={a.id}>
                            <td className="text-xs font-mono text-gray-500 whitespace-nowrap">
                              {new Date(a.creado_en).toLocaleString('es-DO')}
                            </td>
                            <td>
                              <span className={`badge ${
                                a.accion.includes('CAMBIADO') || a.accion.includes('UPDATE')
                                  ? 'badge-orange' 
                                  : a.accion.includes('INSERT') || a.accion.includes('CREATE')
                                  ? 'badge-green' 
                                  : 'badge-gray'
                              }`}>
                                {a.accion}
                              </span>
                            </td>
                            <td className="font-semibold text-xs">{a.tabla_afectada || '—'}</td>
                            <td className="font-mono text-xs">{a.registro_id ?? '—'}</td>
                            <td className="text-xs font-mono text-gray-500 max-w-[200px] truncate" title={JSON.stringify(a.valores_antes)}>
                              {a.valores_antes ? JSON.stringify(a.valores_antes) : '—'}
                            </td>
                            <td className="text-xs font-mono text-gray-500 max-w-[200px] truncate" title={JSON.stringify(a.valores_despues)}>
                              {a.valores_despues ? JSON.stringify(a.valores_despues) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Añadir Constante */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title font-bold">Añadir Nueva Constante</span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddConstante}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Clave / Nombre Único</label>
                  <input
                    type="text"
                    required
                    pattern="[a-zA-Z0-9_]+"
                    placeholder="ej: precio_galon_gas"
                    value={newConstante.clave}
                    onChange={e => setNewConstante({ ...newConstante, clave: e.target.value })}
                    className="form-input"
                  />
                  <span className="text-xs text-gray-400">Solo letras, números y guión bajo (_).</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor Inicial</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={newConstante.valor}
                    onChange={e => setNewConstante({ ...newConstante, valor: parseFloat(e.target.value) || 0 })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unidad de Medida</label>
                  <input
                    type="text"
                    placeholder="ej: DOP, DOP/galón, galones/m3"
                    value={newConstante.unidad}
                    onChange={e => setNewConstante({ ...newConstante, unidad: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    placeholder="Escriba el propósito de esta constante..."
                    value={newConstante.descripcion}
                    onChange={e => setNewConstante({ ...newConstante, descripcion: e.target.value })}
                    className="form-textarea"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary btn-sm"
                >
                  {saving ? 'Guardando...' : 'Crear Constante'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
