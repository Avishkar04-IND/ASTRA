import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSession } from '../context/SessionContext';
import { ShieldAlert, ShieldCheck, Clock } from 'lucide-react';

export default function Consents() {
  const { user } = useSession();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConsents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('consents')
      .select('*')
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false });
    
    if (!error && data) {
      setConsents(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadConsents();
  }, []);

  const handleRevoke = async (consent) => {
    if (!window.confirm(`Revoke access for ${consent.site_origin}?`)) return;

    try {
      // Update consent status
      const { error: updateErr } = await supabase
        .from('consents')
        .update({ 
          status: 'revoked',
          revoked_at: new Date().toISOString()
        })
        .eq('id', consent.id);

      if (updateErr) throw updateErr;

      // Write to audit log
      // We must write an audit log row for each field key that was revoked for this site
      const auditRows = consent.field_keys.map(key => ({
        user_id: user.id,
        action: 'consent_revoked',
        field_key: key,
        site_origin: consent.site_origin,
        details: { purpose: consent.purpose }
      }));

      const { error: auditErr } = await supabase.from('audit_log').insert(auditRows);
      
      if (auditErr) throw auditErr;

      // Reload
      loadConsents();
      
    } catch (err) {
      console.error("Revoke error", err);
      alert("Failed to revoke consent: " + err.message);
    }
  };

  const activeConsents = consents.filter(c => c.status === 'active');
  const pastConsents = consents.filter(c => c.status !== 'active');

  const ConsentCard = ({ consent, isActive }) => (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {isActive ? <ShieldCheck className="w-5 h-5 text-emerald-500" /> : <ShieldAlert className="w-5 h-5 text-slate-400" />}
          <h3 className="text-lg font-semibold text-slate-900">{consent.site_origin}</h3>
          {!isActive && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 uppercase">
              {consent.status}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600 mb-2">Purpose: {consent.purpose}</p>
        <div className="flex flex-wrap gap-2 mb-2">
          {consent.field_keys.map(key => (
            <span key={key} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              {key}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 mt-3">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Granted: {new Date(consent.granted_at).toLocaleDateString()}</span>
          {consent.expires_at && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Expires: {new Date(consent.expires_at).toLocaleDateString()}</span>
          )}
          {consent.revoked_at && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Revoked: {new Date(consent.revoked_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>
      
      {isActive && (
        <button
          onClick={() => handleRevoke(consent)}
          className="bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-md text-sm font-medium transition"
        >
          Revoke Access
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">Data Sharing Consents</h1>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading consents...</div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-200 pb-2">Active Approvals</h2>
            {activeConsents.length === 0 ? (
              <p className="text-sm text-slate-500 italic">You have no active data sharing consents.</p>
            ) : (
              <div className="space-y-4">
                {activeConsents.map(c => <ConsentCard key={c.id} consent={c} isActive={true} />)}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-medium text-slate-900 mb-4 border-b border-slate-200 pb-2">Past Approvals (Revoked/Expired)</h2>
            {pastConsents.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No past consents found.</p>
            ) : (
              <div className="space-y-4 opacity-75">
                {pastConsents.map(c => <ConsentCard key={c.id} consent={c} isActive={false} />)}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
