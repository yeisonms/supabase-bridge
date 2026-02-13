import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Plan } from '@/types/database';

const AdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [editing, setEditing] = useState<Record<number, { price: string; description: string }>>({});
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    const { data } = await supabase.from('plans').select('*').order('access_level');
    if (data) {
      setPlans(data);
      const editState: Record<number, { price: string; description: string }> = {};
      data.forEach((p) => { editState[p.id] = { price: String(p.price), description: p.description ?? '' }; });
      setEditing(editState);
    }
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const savePlan = async (plan: Plan) => {
    const edit = editing[plan.id];
    if (!edit) return;
    const price = parseFloat(edit.price);
    if (isNaN(price) || price < 0) { toast.error('Precio inválido'); return; }

    const { error } = await supabase
      .from('plans')
      .update({ price, description: edit.description })
      .eq('id', plan.id);

    if (error) { toast.error('Error al guardar'); return; }
    toast.success(`Plan "${plan.name}" actualizado`);
    fetchPlans();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Configuración de Planes</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-32 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Configuración de Planes</h2>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                {plan.name}
                <span className="text-xs text-muted-foreground">Nivel {plan.access_level}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Precio (COP)</Label>
                <Input
                  type="number"
                  value={editing[plan.id]?.price ?? ''}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], price: e.target.value } }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={editing[plan.id]?.description ?? ''}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [plan.id]: { ...prev[plan.id], description: e.target.value } }))}
                  rows={3}
                />
              </div>
              <Button onClick={() => savePlan(plan)} className="w-full">
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminPlans;
