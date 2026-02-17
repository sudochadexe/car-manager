'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase, Vehicle, PipelineStage, StageCompletion } from '@/lib/supabase';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [completions, setCompletions] = useState<StageCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  async function fetchData() {
    setLoading(true);
    try {
      const [vehiclesRes, stagesRes, completionsRes] = await Promise.all([
        supabase.from('vehicles').select('*').eq('archived', false),
        supabase.from('pipeline_stages').select('*').order('order'),
        supabase.from('stage_completions').select('*')
      ]);

      if (vehiclesRes.data) setVehicles(vehiclesRes.data);
      if (stagesRes.data) setStages(stagesRes.data);
      if (completionsRes.data) setCompletions(completionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getCurrentStatus = useCallback((vehicleId: string): string => {
    const vehicleCompletions = completions.filter(c => c.vehicle_id === vehicleId);
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);
    
    for (const stage of sortedStages) {
      const completion = vehicleCompletions.find(c => c.stage_id === stage.id);
      if (!completion || !completion.completion_value || completion.cleared_at) {
        return stage.stage_name;
      }
    }
    return sortedStages.find(s => s.is_terminal)?.stage_name || 'Pending';
  }, [stages, completions]);

  const getAge = useCallback((inSystemDate: string): number => {
    const inDate = new Date(inSystemDate);
    const now = new Date();
    return Math.floor((now.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
  }, []);

  // Calculate stage metrics
  const getStageMetrics = () => {
    const metrics: { stage: PipelineStage; count: number; avgAge: number; overdue: number }[] = [];
    const sortedStages = [...stages].sort((a, b) => a.order - b.order);

    for (const stage of sortedStages) {
      const stageVehicles = vehicles.filter(v => getCurrentStatus(v.id) === stage.stage_name);
      const avgAge = stageVehicles.length > 0 
        ? Math.round(stageVehicles.reduce((sum, v) => sum + getAge(v.in_system_date), 0) / stageVehicles.length)
        : 0;
      const overdue = stageVehicles.filter(v => getAge(v.in_system_date) > stage.target_hours / 24).length;

      metrics.push({ stage, count: stageVehicles.length, avgAge, overdue });
    }

    return metrics;
  };

  // Calculate SLA compliance
  const getSLACompliance = () => {
    const total = vehicles.length;
    if (total === 0) return 100;
    
    let onTime = 0;
    for (const vehicle of vehicles) {
      const status = getCurrentStatus(vehicle.id);
      const stage = stages.find(s => s.stage_name === status);
      if (stage && getAge(vehicle.in_system_date) <= stage.target_hours / 24) {
        onTime++;
      }
    }
    
    return Math.round((onTime / total) * 100);
  };

  // Role breakdown
  const getRoleMetrics = () => {
    const roles = ['Manager', 'Service', 'Detail', 'Sales'];
    return roles.map(role => {
      const roleStages = stages.filter(s => s.role === role || s.role === 'Manager');
      const count = vehicles.filter(v => {
        const status = getCurrentStatus(v.id);
        return roleStages.some(s => s.stage_name === status);
      }).length;
      return { role, count };
    });
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#94a3b8' }}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stageMetrics = getStageMetrics();
  const slaCompliance = getSLACompliance();
  const roleMetrics = getRoleMetrics();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ backgroundColor: '#1e293b', padding: '16px', borderBottom: '1px solid #334155', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>📊 Dashboard</h1>
          <button onClick={() => router.push('/')} style={{ backgroundColor: '#475569', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', fontSize: '14px', cursor: 'pointer' }}>← Back</button>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        {/* Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>TOTAL VEHICLES</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{vehicles.length}</div>
          </div>
          <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>SLA COMPLIANCE</div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: slaCompliance >= 80 ? '#22c55e' : slaCompliance >= 50 ? '#eab308' : '#ef4444' }}>{slaCompliance}%</div>
          </div>
        </div>

        {/* SLA Gauge */}
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>SLA Performance</h2>
          <div style={{ height: '20px', backgroundColor: '#334155', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${slaCompliance}%`, height: '100%', backgroundColor: slaCompliance >= 80 ? '#22c55e' : slaCompliance >= 50 ? '#eab308' : '#ef4444', transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Role Breakdown */}
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>By Role</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {roleMetrics.map(r => (
              <div key={r.role} style={{ backgroundColor: '#334155', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{r.count}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{r.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Breakdown */}
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Pipeline Overview</h2>
          <div style={{ display: 'grid', gap: '8px' }}>
            {stageMetrics.map(m => (
              <div key={m.stage.id} style={{ backgroundColor: '#334155', padding: '12px', borderRadius: '8px', borderLeft: `4px solid ${m.stage.stage_color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{m.stage.stage_name}</span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{m.count} vehicles</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: m.avgAge > 7 ? '#ef4444' : '#94a3b8' }}>Avg: {m.avgAge} days</span>
                  <span style={{ color: m.overdue > 0 ? '#ef4444' : '#22c55e' }}>{m.overdue} overdue</span>
                </div>
                {m.count > 0 && (
                  <div style={{ marginTop: '8px', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${Math.min(100, (m.avgAge / (m.stage.target_hours / 24)) * 100)}%`, 
                      height: '100%', 
                      backgroundColor: m.avgAge > m.stage.target_hours / 24 ? '#ef4444' : m.stage.stage_color,
                      transition: 'width 0.5s'
                    }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Aging Report */}
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', marginTop: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Aging Report</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
            <div style={{ backgroundColor: '#22c55e20', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>{vehicles.filter(v => getAge(v.in_system_date) <= 3).length}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>0-3 days</div>
            </div>
            <div style={{ backgroundColor: '#eab30820', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#eab308' }}>{vehicles.filter(v => getAge(v.in_system_date) > 3 && getAge(v.in_system_date) <= 7).length}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>4-7 days</div>
            </div>
            <div style={{ backgroundColor: '#f9731620', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f97316' }}>{vehicles.filter(v => getAge(v.in_system_date) > 7 && getAge(v.in_system_date) <= 14).length}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>8-14 days</div>
            </div>
            <div style={{ backgroundColor: '#ef444420', padding: '12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>{vehicles.filter(v => getAge(v.in_system_date) > 14).length}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>15+ days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
