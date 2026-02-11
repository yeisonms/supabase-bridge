import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const res = await fetch(
          'https://vztlkrnqwyvkdxviusmj.supabase.co/rest/v1/?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6dGxrcm5xd3l2a2R4dml1c21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjgyNjgsImV4cCI6MjA4NjQwNDI2OH0.wUeY1R8nhv6jMRsEJj9LImH5V8VyvLhE_K7U5N3i6Dc',
          { headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();
        // Extract table definitions
        const definitions = data.definitions || {};
        const tables: any = {};
        for (const [name, def] of Object.entries(definitions) as any) {
          if (name === 'spatial_ref_sys' || name === 'geometry_columns' || name === 'geography_columns') continue;
          tables[name] = {
            columns: def.properties ? Object.entries(def.properties).map(([col, info]: any) => ({
              name: col,
              type: info.format || info.type || 'unknown',
              description: info.description || '',
              default: info.default,
            })) : [],
            required: def.required || [],
          };
        }
        setSchema(tables);
      } catch (e) {
        console.error('Failed to fetch schema:', e);
      }
      setLoading(false);
    };
    fetchSchema();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Database Schema</h1>
      {loading ? (
        <p>Loading schema...</p>
      ) : !schema ? (
        <p>Failed to load schema</p>
      ) : (
        <div className="space-y-6">
          {Object.entries(schema).map(([tableName, tableInfo]: any) => (
            <div key={tableName} className="border rounded p-4">
              <h2 className="text-lg font-semibold mb-2">{tableName}</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-1">Column</th>
                    <th className="py-1">Type</th>
                    <th className="py-1">Required</th>
                    <th className="py-1">Default</th>
                    <th className="py-1">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {tableInfo.columns.map((col: any) => (
                    <tr key={col.name} className="border-b border-muted">
                      <td className="py-1 font-mono">{col.name}</td>
                      <td className="py-1">{col.type}</td>
                      <td className="py-1">{tableInfo.required.includes(col.name) ? '✓' : ''}</td>
                      <td className="py-1 text-xs">{col.default || ''}</td>
                      <td className="py-1 text-xs text-muted-foreground">{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Index;
