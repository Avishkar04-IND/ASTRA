import React from 'react';
import { useMetrics } from '../hooks/useMetrics';
import { StatCard, GlassCard } from '../components/GlassCard';
import { Activity, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';

export const Overview = () => {
  const metrics = useMetrics();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 className="text-2xl" style={{ fontWeight: 600 }}>Overview</h2>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Real-time metrics and system health</p>
      </div>

      {metrics.error && (
        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', color: '#ef4444' }}>
          Error loading metrics: {metrics.error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-6">
        <GlassCard style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.75rem', color: 'var(--color-accent)' }}>
            <Activity size={28} />
          </div>
          <StatCard label="Total Autofills" value={metrics.totalAutofills} loading={metrics.loading} />
        </GlassCard>

        <GlassCard style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.75rem', color: 'var(--color-success)' }}>
            <ShieldCheck size={28} />
          </div>
          <StatCard label="Active Consents" value={metrics.activeConsents} loading={metrics.loading} />
        </GlassCard>

        <GlassCard style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.75rem', color: 'var(--color-warning)' }}>
            <FileText size={28} />
          </div>
          <StatCard label="Pending Apps" value={metrics.applicationsPending} loading={metrics.loading} />
        </GlassCard>

        <GlassCard style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.75rem', color: 'var(--color-danger)' }}>
            <AlertTriangle size={28} />
          </div>
          <StatCard label="Open Grievances" value={metrics.totalGrievances} loading={metrics.loading} />
        </GlassCard>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <GlassCard style={{ gridColumn: 'span 2' }}>
          <h3 className="text-xl mb-4" style={{ fontWeight: 600 }}>Recent Audit Activity</h3>
          <p className="text-muted">Supabase audit logs would be mapped here (e.g., recent field access events, consent grants).</p>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '0.5rem', marginTop: '1rem' }}>
            <span className="text-muted">Activity Chart Placeholder</span>
          </div>
        </GlassCard>
        
        <GlassCard>
          <h3 className="text-xl mb-4" style={{ fontWeight: 600 }}>System Status</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li className="flex items-center justify-between">
              <span className="text-muted">DigiLocker Integration</span>
              <span className="badge success">Healthy</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">API Setu Mock Server</span>
              <span className="badge success">Healthy</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Supabase Vault</span>
              <span className="badge success">Online</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Extension Sync</span>
              <span className="badge warning">Degraded</span>
            </li>
          </ul>
        </GlassCard>
      </div>
    </div>
  );
};
