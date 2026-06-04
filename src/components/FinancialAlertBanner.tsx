import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const FinancialAlertBanner = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [needsFinancials, setNeedsFinancials] = useState(false);
  const [loading, setLoading] = useState(true);

  // Don't show the banner on the settings page to avoid redundancy,
  // or show it but with a different message. Let's hide it if they are already on settings.
  const isSettingsPage = location.pathname.includes('/partner/settings');

  useEffect(() => {
    const checkFinancials = async () => {
      if (!user) return;
      
      // First get the partner id
      const { data: partnerData } = await supabase
        .from('partners')
        .select('id')
        .eq('admin_user_id', user.id)
        .maybeSingle();

      if (partnerData) {
        // Check if financials exist
        const { data: financials } = await supabase
          .from('partner_financials')
          .select('id')
          .eq('partner_id', partnerData.id)
          .maybeSingle();
          
        if (!financials) {
          setNeedsFinancials(true);
        } else {
          setNeedsFinancials(false);
        }
      }
      setLoading(false);
    };

    checkFinancials();
  }, [user, location.pathname]); // Re-check if location changes (e.g., they just saved)

  if (loading || !needsFinancials || isSettingsPage) return null;

  return (
    <div className="bg-amber-100 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800">
      <div className="container px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 text-amber-800 dark:text-amber-300">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-sm font-medium">
            ¡Importante! Aún no has configurado tus datos bancarios. Necesitamos esta información para transferirte tus ganancias mensuales.
          </p>
        </div>
        <Link 
          to="/partner/settings#billing" 
          className="shrink-0 text-sm font-bold flex items-center gap-1 text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 transition-colors bg-amber-200/50 dark:bg-amber-800/50 px-3 py-1.5 rounded-md"
        >
          Completar datos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default FinancialAlertBanner;
