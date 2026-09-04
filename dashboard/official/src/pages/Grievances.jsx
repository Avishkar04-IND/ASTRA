import React from 'react';
import { GlassCard } from '../components/GlassCard';
import { mockGrievances } from '../mocks/mockGrievances';

export const Grievances = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h2 className="text-2xl" style={{ fontWeight: 600 }}>Grievances</h2>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Monitor and resolve citizen issues</p>
      </div>

      <GlassCard className="glass-table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Citizen Name</th>
              <th>Department</th>
              <th>Subject</th>
              <th>Submitted</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockGrievances.map((grv) => (
              <tr key={grv.id}>
                <td style={{ fontWeight: 500 }}>{grv.id}</td>
                <td>{grv.citizenName}</td>
                <td>{grv.department}</td>
                <td>{grv.subject}</td>
                <td className="text-sm text-muted">{new Date(grv.submittedAt).toLocaleDateString()}</td>
                <td>
                  <span className={`badge ${grv.priority === 'high' ? 'danger' : grv.priority === 'medium' ? 'warning' : 'info'}`}>
                    {grv.priority}
                  </span>
                </td>
                <td>
                  <span className={`badge ${grv.status === 'resolved' ? 'success' : grv.status === 'open' ? 'danger' : 'warning'}`}>
                    {grv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
};
