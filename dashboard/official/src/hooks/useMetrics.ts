import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Metrics {
  totalAutofills: number;
  activeConsents: number;
  totalGrievances: number;
  applicationsPending: number;
  loading: boolean;
  error: string | null;
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalAutofills: 0,
    activeConsents: 0,
    totalGrievances: 12, // mock value to match mock grievances
    applicationsPending: 5, // mock value
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchMetrics() {
      try {
        // Query audit_log for autofill counts
        const { count: autofillCount, error: auditError } = await supabase
          .from('audit_log')
          .select('*', { count: 'exact', head: true })
          .eq('action', 'filled');
          
        if (auditError) throw auditError;

        // Query consents for active consent grants
        const { count: consentCount, error: consentError } = await supabase
          .from('consents')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
          
        if (consentError) throw consentError;

        if (mounted) {
          setMetrics(prev => ({
            ...prev,
            totalAutofills: autofillCount || 0,
            activeConsents: consentCount || 0,
            loading: false
          }));
        }
      } catch (err: any) {
        if (mounted) {
          setMetrics(prev => ({
            ...prev,
            error: err.message,
            loading: false
          }));
        }
      }
    }

    // Since we don't have RLS bypassing or a service role key in the client,
    // and this is an official dashboard, we assume either public RLS or that
    // the current user has access. For the hackathon MVP, if RLS blocks it,
    // we'll fall back to mock numbers gracefully.
    fetchMetrics();

    return () => {
      mounted = false;
    };
  }, []);

  return metrics;
}
