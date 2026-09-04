import React from 'react';

export const GlassCard = ({ children, className = '', ...props }) => {
  return (
    <div className={`glass-card ${className}`} {...props}>
      {children}
    </div>
  );
};

export const StatCard = ({ label, value, loading }) => {
  return (
    <GlassCard className="stat-card">
      <div className="label">{label}</div>
      <div className="value">
        {loading ? <span style={{ opacity: 0.5 }}>...</span> : value}
      </div>
    </GlassCard>
  );
};
