import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Landmark, Save } from 'lucide-react';

type FinancialData = {
  partner_id: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  document_type: string;
  document_number: string;
};

interface Props {
  partnerId: string;
  onSaved?: () => void;
}

const FinancialSettingsForm = ({ partnerId, onSaved }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<FinancialData>>({
    bank_name: '',
    account_type: '',
    account_number: '',
    document_type: '',
    document_number: '',
  });

  useEffect(() => {
    const fetchFinancials = async () => {
      const { data, error } = await supabase
        .from('partner_financials')
        .select('*')
        .eq('partner_id', partnerId)
        .maybeSingle();

      if (!error && data) {
        setFormData({
          bank_name: data.bank_name,
          account_type: data.account_type,
          account_number: data.account_number,
          document_type: data.document_type,
          document_number: data.document_number,
        });
      }
      setLoading(false);
    };

    fetchFinancials();
  }, [partnerId]);

  const handleChange = (field: keyof FinancialData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.bank_name || !formData.account_type || !formData.account_number || !formData.document_type || !formData.document_number) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor completa todos los campos bancarios.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^\d+$/.test(formData.account_number)) {
      toast({
        title: 'Número de cuenta inválido',
        description: 'El número de cuenta solo debe contener números.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^\d+$/.test(formData.document_number)) {
      toast({
        title: 'Documento inválido',
        description: 'El número de documento solo debe contener números.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    
    // Check if it exists to do upsert properly
    const { data: existing } = await supabase
      .from('partner_financials')
      .select('id')
      .eq('partner_id', partnerId)
      .maybeSingle();

    let error;

    if (existing) {
      const { error: updateError } = await supabase
        .from('partner_financials')
        .update({
          bank_name: formData.bank_name,
          account_type: formData.account_type,
          account_number: formData.account_number,
          document_type: formData.document_type,
          document_number: formData.document_number,
        })
        .eq('partner_id', partnerId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('partner_financials')
        .insert({
          partner_id: partnerId,
          bank_name: formData.bank_name,
          account_type: formData.account_type,
          account_number: formData.account_number,
          document_type: formData.document_type,
          document_number: formData.document_number,
        });
      error = insertError;
    }

    setSaving(false);

    if (error) {
      console.error('Error saving financials:', error);
      toast({
        title: 'Error',
        description: 'Hubo un problema al guardar los datos bancarios.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Datos Guardados',
        description: 'Tu información bancaria ha sido actualizada exitosamente.',
      });
      if (onSaved) onSaved();
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 bg-card border rounded-xl p-6" id="billing">
      <div className="flex items-center gap-2 mb-4">
        <Landmark className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Datos de Facturación y Pagos</h2>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Completa esta información para que podamos transferirte tus ganancias mensualmente. Asegúrate de que los datos correspondan al titular de la cuenta o representante legal del centro deportivo.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Banco</label>
          <Select value={formData.bank_name} onValueChange={(val) => handleChange('bank_name', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un banco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bancolombia">Bancolombia</SelectItem>
              <SelectItem value="Davivienda">Davivienda</SelectItem>
              <SelectItem value="Nequi">Nequi</SelectItem>
              <SelectItem value="DaviPlata">DaviPlata</SelectItem>
              <SelectItem value="Banco de Bogotá">Banco de Bogotá</SelectItem>
              <SelectItem value="BBVA">BBVA Colombia</SelectItem>
              <SelectItem value="Banco Caja Social">Banco Caja Social</SelectItem>
              <SelectItem value="Colpatria">Scotiabank Colpatria</SelectItem>
              <SelectItem value="Banco de Occidente">Banco de Occidente</SelectItem>
              <SelectItem value="Otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Tipo de Cuenta</label>
          <Select value={formData.account_type} onValueChange={(val) => handleChange('account_type', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ahorros">Ahorros</SelectItem>
              <SelectItem value="Corriente">Corriente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Número de Cuenta</label>
          <Input
            value={formData.account_number}
            onChange={(e) => handleChange('account_number', e.target.value)}
            placeholder="Solo números"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Tipo de Documento</label>
          <Select value={formData.document_type} onValueChange={(val) => handleChange('document_type', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NIT">NIT (Empresa)</SelectItem>
              <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
              <SelectItem value="CE">Cédula de Extranjería</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-muted-foreground mb-1 block">Número de Documento</label>
          <Input
            value={formData.document_number}
            onChange={(e) => handleChange('document_number', e.target.value)}
            placeholder="Sin guiones ni puntos"
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar Información Bancaria
        </Button>
      </div>
    </div>
  );
};

export default FinancialSettingsForm;
