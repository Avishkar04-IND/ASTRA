import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { mockApplications } from '../mocks/mockApplications';
import { CheckCircle, XCircle, Search } from 'lucide-react';

export const Applications = () => {
  const [apps, setApps] = useState(mockApplications);

  const handleApprove = (id) => {
    setApps(apps.map(app => app.id === id ? { ...app, status: 'approved' } : app));
  };

  const handleReject = (id) => {
    setApps(apps.map(app => app.id === id ? { ...app, status: 'rejected' } : app));
  };

  const renderStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="badge success">Approved</span>;
      case 'rejected': return <span className="badge danger">Rejected</span>;
      case 'in_review': return <span className="badge warning">In Review</span>;
      default: return <span className="badge info">Pending</span>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl" style={{ fontWeight: 600 }}>Applications Queue</h2>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>Review and manage citizen applications</p>
        </div>
        
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input type="text" className="input-field" placeholder="Search applications..." style={{ paddingLeft: '2.5rem', width: '300px' }} />
        </div>
      </div>

      <GlassCard className="glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Citizen Name</th>
              <th>Department & Service</th>
              <th>Submitted</th>
              <th>Fields Provided</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id}>
                <td style={{ fontWeight: 500 }}>{app.id}</td>
                <td>{app.citizenName}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{app.service}</div>
                  <div className="text-sm text-muted">{app.department}</div>
                </td>
                <td className="text-sm text-muted">{new Date(app.submittedAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', maxWidth: '200px' }}>
                    {app.fieldsProvided.map(field => (
                      <span key={field} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                        {field}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{renderStatusBadge(app.status)}</td>
                <td>
                  {app.status === 'pending' || app.status === 'in_review' ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(app.id)} style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.1)', color: 'var(--color-success)', borderRadius: '0.5rem', transition: 'all 150ms' }} title="Approve">
                        <CheckCircle size={20} />
                      </button>
                      <button onClick={() => handleReject(app.id)} style={{ padding: '0.5rem', background: 'rgba(239,68,68,0.1)', color: 'var(--color-danger)', borderRadius: '0.5rem', transition: 'all 150ms' }} title="Reject">
                        <XCircle size={20} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted text-sm">Reviewed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};
