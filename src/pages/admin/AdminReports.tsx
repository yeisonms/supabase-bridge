import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const AdminReports = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reportes</h2>
      <Card>
        <CardContent className="p-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Módulo de reportes en desarrollo</p>
          <p className="text-sm text-muted-foreground mt-1">Próximamente: exportación CSV, reportes de ingresos y análisis de retención.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;
