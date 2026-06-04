import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, ArrowUpRight, ArrowDownRight, Search, PlusCircle, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Transaction = {
  id: number;
  transaction_date: string;
  transaction_type: 'ingreso' | 'egreso';
  category: string;
  amount: number;
  description: string;
  created_at?: string;
};

const CATEGORIES_EGRESO = ['Servicios', 'Mantenimiento', 'Nómina', 'Marketing', 'Insumos', 'Pago Partners', 'Otros'];
const CATEGORIES_INGRESO = ['Suscripción Manual', 'Venta Externa', 'Inversión', 'Otros'];

export default function AdminFinances() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'ingreso' | 'egreso'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionType, setTransactionType] = useState<'egreso' | 'ingreso'>('egreso');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error cargando transacciones:', error);
      toast.error('No se pudo cargar el libro mayor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('El monto debe ser mayor a cero');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        transaction_date: date,
        transaction_type: transactionType,
        category,
        amount: numAmount,
        description: description || null,
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success('Transacción registrada correctamente');
      setAmount('');
      setDescription('');
      setCategory('');
      fetchTransactions();
    } catch (error) {
      console.error('Error guardando transacción:', error);
      toast.error('Ocurrió un error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.transaction_type !== filterType) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        t.category?.toLowerCase().includes(search) || 
        t.description?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const formatCOP = (val: number) => `$${val.toLocaleString('es-CO')}`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">Finanzas</h2>
          <p className="text-muted-foreground mt-1">Control de caja menor y libro mayor de transacciones.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CAJA MENOR (Formulario) */}
        <div className="lg:col-span-1">
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-primary" />
                Nueva Transacción
              </CardTitle>
              <CardDescription>Registra un ingreso o egreso manual.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Movimiento</Label>
                  <Tabs value={transactionType} onValueChange={(v) => {
                    setTransactionType(v as any);
                    setCategory('');
                  }}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="egreso" className="data-[state=active]:text-destructive">Egreso</TabsTrigger>
                      <TabsTrigger value="ingreso" className="data-[state=active]:text-emerald-600">Ingreso</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="date" 
                      type="date" 
                      className="pl-9" 
                      value={date} 
                      onChange={(e) => setDate(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Monto (COP)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input 
                      id="amount" 
                      type="number" 
                      step="1" 
                      className="pl-8" 
                      placeholder="0" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {(transactionType === 'egreso' ? CATEGORIES_EGRESO : CATEGORIES_INGRESO).map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción / Motivo</Label>
                  <Input 
                    id="description" 
                    placeholder="Detalles de la transacción..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                  />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                  ) : (
                    'Guardar Transacción'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* LIBRO MAYOR (Tabla) */}
        <div className="lg:col-span-2">
          <Card className="border-border shadow-sm h-full flex flex-col">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Libro Mayor</CardTitle>
                  <CardDescription>Historial de todas las transacciones manuales.</CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative w-full sm:w-48">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar..." 
                      className="pl-9 h-9" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                  <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                    <SelectTrigger className="w-full sm:w-[140px] h-9">
                      <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Filtro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ingreso">Solo Ingresos</SelectItem>
                      <SelectItem value="egreso">Solo Egresos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">No hay transacciones</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mt-1">
                    No se encontraron registros que coincidan con tu búsqueda o aún no hay movimientos.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                      <tr>
                        <th className="px-6 py-3 font-medium">Fecha</th>
                        <th className="px-6 py-3 font-medium">Categoría</th>
                        <th className="px-6 py-3 font-medium">Descripción</th>
                        <th className="px-6 py-3 font-medium text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTransactions.map((t) => {
                        const isIncome = t.transaction_type === 'ingreso';
                        return (
                          <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                              {format(new Date(t.transaction_date), 'dd/MM/yyyy')}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                                {t.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="truncate max-w-[200px] block" title={t.description || ''}>
                                {t.description || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-medium whitespace-nowrap">
                              <div className={`flex items-center justify-end gap-1 ${isIncome ? 'text-emerald-600' : 'text-destructive'}`}>
                                {isIncome ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                {formatCOP(t.amount)}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
