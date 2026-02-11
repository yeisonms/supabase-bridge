import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const test = async () => {
      // Test RPC function
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_nearby_partners', {
        user_lat: 0,
        user_lng: 0,
        radius_km: 10000
      });
      
      // Test tables
      const { data: plans } = await supabase.from('plans').select('*');
      const { data: partners } = await supabase.from('partners').select('*');
      
      setResults({
        rpc: { data: rpcData, error: rpcError?.message },
        plans,
        partners,
      });
      setLoading(false);
    };
    test();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Connection Test</h1>
      {loading ? <p>Testing...</p> : (
        <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-[80vh]">
          {JSON.stringify(results, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default Index;
