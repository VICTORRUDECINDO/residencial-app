'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, Flame, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/lib/supabase';
import type { VMoroso, VResumenMensual } from '@/types/db';

type MorosoRow = Pick<VMoroso, 'deuda_actual'>;
type ResumenRow = Pick<VResumenMensual, 'total_facturado'>;

interface KpiData {
  totalApartamentos: number;
  totalPropietarios: number;
  medicionesEsteMes: number;
  facturasPendientes: number;       // apartamentos sin factura en el mes
  totalDeudaMorosos: number;
  totalFacturadoMes: number;
  apartamentosAlDia: number;
  apartamentosConDeuda: number;
  loading: boolean;
}

export default function DashboardPage() {
  const [kpi, setKpi] = useState<KpiData>({
    totalApartamentos: 0,
    totalPropietarios: 0,
    medicionesEsteMes: 0,
    facturasPendientes: 0,
    totalDeudaMorosos: 0,
    totalFacturadoMes: 0,
    apartamentosAlDia: 0,
    apartamentosConDeuda: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadKpis() {
      const mesActual = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

      const { count: totalApartamentos } = await supabase
        .from('apartamentos')
        .select('id', { count: 'exact', head: true })
        .eq('activo', true);

      const { count: totalPropietarios } = await supabase
        .from('propietarios')
        .select('id', { count: 'exact', head: true });

      const { count: medicionesEsteMes } = await supabase
        .from('mediciones_gas')
        .select('id', { count: 'exact', head: true })
        .gte('fecha_medicion', `${mesActual}-01`)
        .lte('fecha_medicion', `${mesActual}-31`);

      const { count: facturasPendientes } = await supabase
        .from('v_sin_factura_mes_actual')
        .select('apartamento_id', { count: 'exact', head: true });

      const morososRes = await supabase
        .from('v_morosos')
        .select('deuda_actual');
      const morososData = (morososRes.data ?? []) as MorosoRow[];

      const resumenRes = await supabase
        .from('v_resumen_mensual')
        .select('total_facturado')
        .eq('mes', mesActual)
        .maybeSingle();
      const resumenData = resumenRes.data as ResumenRow | null;

      const deudaTotal = (morososData ?? []).reduce(
        (acc, m) => acc + Number(m.deuda_actual ?? 0), 0
      );

      const apartamentosConDeuda = morososData.length;
      const apartamentosAlDia = Math.max(0, (totalApartamentos ?? 0) - apartamentosConDeuda);

      setKpi({
        totalApartamentos: totalApartamentos ?? 0,
        totalPropietarios: totalPropietarios ?? 0,
        medicionesEsteMes: medicionesEsteMes ?? 0,
        facturasPendientes: facturasPendientes ?? 0,
        totalDeudaMorosos: deudaTotal,
        totalFacturadoMes: Number(resumenData?.total_facturado ?? 0),
        apartamentosAlDia,
        apartamentosConDeuda,
        loading: false,
      });
    }

    loadKpis();
  }, []);

  const mesLabel = new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const fmt = (n: number) =>
    n.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const chartData = [
    { name: 'Al Día', value: kpi.apartamentosAlDia, color: '#10b981' }, // Verde esmeralda
    { name: 'En Mora', value: kpi.apartamentosConDeuda, color: '#f59e0b' }, // Naranja
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Resumen del residencial — {mesLabel}</p>
        </div>
      </div>

      <div className="page-body section-gap">
        {/* KPI Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="flex-between">
              <span className="kpi-label">Apartamentos</span>
              <Building2 size={18} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="kpi-value">{kpi.loading ? '—' : kpi.totalApartamentos}</div>
            <div className="kpi-sub">Unidades activas</div>
          </div>

          <div className="kpi-card">
            <div className="flex-between">
              <span className="kpi-label">Propietarios / Inquilinos</span>
              <Users size={18} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="kpi-value">{kpi.loading ? '—' : kpi.totalPropietarios}</div>
            <div className="kpi-sub">Registrados</div>
          </div>

          <div className="kpi-card">
            <div className="flex-between">
              <span className="kpi-label">Mediciones Gas</span>
              <Flame size={18} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="kpi-value">{kpi.loading ? '—' : kpi.medicionesEsteMes}</div>
            <div className="kpi-sub">Registradas este mes</div>
          </div>

          <div className="kpi-card">
            <div className="flex-between">
              <span className="kpi-label">Sin Factura</span>
              <FileText size={18} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="kpi-value" style={{ color: 'var(--color-orange-text)' }}>
              {kpi.loading ? '—' : kpi.facturasPendientes}
            </div>
            <div className="kpi-sub">Apartamentos pendientes</div>
          </div>

          <div className="kpi-card">
            <div className="flex-between">
              <span className="kpi-label">Facturado este Mes</span>
              <TrendingUp size={18} style={{ color: 'var(--color-green)' }} />
            </div>
            <div className="kpi-value text-green">
              {kpi.loading ? '—' : `$${fmt(kpi.totalFacturadoMes)}`}
            </div>
            <div className="kpi-sub">Total emitido</div>
          </div>

          <div className="kpi-card" style={{ borderLeft: '3px solid var(--color-orange)' }}>
            <div className="flex-between">
              <span className="kpi-label">Deuda Total (Mora)</span>
              <AlertTriangle size={18} style={{ color: 'var(--color-orange)' }} />
            </div>
            <div className="kpi-value text-orange">
              {kpi.loading ? '—' : `$${fmt(kpi.totalDeudaMorosos)}`}
            </div>
            <div className="kpi-sub">Balance pendiente acumulado</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Status card */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Estado del Sistema</span>
            </div>
            <div className="card-body">
              <div className="alert alert-success mb-4">
                <Building2 size={16} />
                Sistema de Facturación Residencial v4 — Conectado a Supabase.
              </div>
              <p className="text-sm text-gray-500">
                El sistema está operando con normalidad. Todas las mediciones y registros están actualizados.
              </p>
            </div>
          </div>

          {/* Payment Status Chart */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Estado de Pagos (Apartamentos)</span>
            </div>
            <div className="card-body" style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {kpi.loading ? (
                <div className="text-gray-500">Cargando gráfico...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} Aptos.`, 'Cantidad']}
                      contentStyle={{ borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
