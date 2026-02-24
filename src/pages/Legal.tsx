import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const sectionClass = "prose prose-sm max-w-none text-foreground/80 leading-relaxed space-y-4";

const Legal = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>
          <h1 className="text-3xl font-black text-foreground">
            <span className="text-gradient">Red</span>Fit — Legal
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Última actualización: Febrero 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Tabs defaultValue="terms" className="w-full">
          <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 h-auto gap-1 bg-secondary p-1 rounded-xl">
            <TabsTrigger value="terms" className="text-xs md:text-sm">Términos de Servicio</TabsTrigger>
            <TabsTrigger value="liability" className="text-xs md:text-sm">Exención de Responsabilidad</TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs md:text-sm">Política de Privacidad</TabsTrigger>
            <TabsTrigger value="cancellation" className="text-xs md:text-sm">Cancelaciones</TabsTrigger>
          </TabsList>

          {/* Términos de Servicio */}
          <TabsContent value="terms" className="mt-6">
            <div className={sectionClass}>
              <h2 className="text-xl font-bold text-foreground">Términos de Servicio</h2>

              <h3 className="text-lg font-semibold text-foreground">1. Aceptación de los Términos</h3>
              <p>
                Al acceder y utilizar la plataforma RedFit, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.
              </p>

              <h3 className="text-lg font-semibold text-foreground">2. Descripción del Servicio</h3>
              <p>
                RedFit es una plataforma digital que actúa como intermediario tecnológico, conectando a usuarios con centros de bienestar y deporte aliados. RedFit facilita la reserva de cupos y el acceso a instalaciones deportivas mediante planes de suscripción.
              </p>

              <h3 className="text-lg font-semibold text-foreground">3. Registro y Cuenta</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>

              <h3 className="text-lg font-semibold text-foreground">4. Planes y Pagos</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
              </p>

              <h3 className="text-lg font-semibold text-foreground">5. Uso Aceptable</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.
              </p>

              <h3 className="text-lg font-semibold text-foreground">6. Modificaciones</h3>
              <p>
                RedFit se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados a los usuarios registrados y entrarán en vigor a partir de su publicación.
              </p>
            </div>
          </TabsContent>

          {/* Exención de Responsabilidad */}
          <TabsContent value="liability" className="mt-6">
            <div className={sectionClass}>
              <h2 className="text-xl font-bold text-foreground">Exención de Responsabilidad</h2>

              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-destructive">⚠️ Cláusula Importante — Lea con atención</p>
              </div>

              <h3 className="text-lg font-semibold text-foreground">1. Rol de RedFit como Intermediario</h3>
              <p>
                RedFit actúa exclusivamente como una plataforma tecnológica intermediaria que conecta usuarios con centros de bienestar y deporte aliados. RedFit <strong>NO</strong> es propietario, operador ni administrador de ningún centro aliado o instalación listada en la plataforma.
              </p>

              <h3 className="text-lg font-semibold text-foreground">2. Responsabilidad por Lesiones y Accidentes</h3>
              <p>
                RedFit <strong>NO se hace responsable</strong> por lesiones, accidentes, daños físicos, pérdidas materiales ni cualquier otro perjuicio que pudiera ocurrir durante la estancia del usuario en las instalaciones de los centros deportivos aliados. La responsabilidad por la seguridad de las instalaciones, el mantenimiento del equipo y la supervisión de las actividades recae exclusivamente en el centro deportivo correspondiente.
              </p>

              <h3 className="text-lg font-semibold text-foreground">3. Asunción de Riesgo</h3>
              <p>
                El usuario reconoce y acepta que la práctica de actividades deportivas conlleva riesgos inherentes. Al utilizar RedFit para reservar y acceder a centros deportivos, el usuario asume voluntariamente dichos riesgos.
              </p>

              <h3 className="text-lg font-semibold text-foreground">4. Condiciones de las Instalaciones</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>

              <h3 className="text-lg font-semibold text-foreground">5. Indemnización</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>
            </div>
          </TabsContent>

          {/* Política de Privacidad */}
          <TabsContent value="privacy" className="mt-6">
            <div className={sectionClass}>
              <h2 className="text-xl font-bold text-foreground">Política de Privacidad</h2>

              <h3 className="text-lg font-semibold text-foreground">1. Datos que Recopilamos</h3>
              <p>
                Recopilamos información personal proporcionada durante el registro (nombre, apellido, correo electrónico, teléfono) y datos de uso como historial de reservas, ubicación aproximada y preferencias de actividades deportivas.
              </p>

              <h3 className="text-lg font-semibold text-foreground">2. Uso de los Datos</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
              </p>

              <h3 className="text-lg font-semibold text-foreground">3. Almacenamiento y Seguridad</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
              </p>

              <h3 className="text-lg font-semibold text-foreground">4. Compartición con Terceros</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.
              </p>

              <h3 className="text-lg font-semibold text-foreground">5. Derechos del Usuario</h3>
              <p>
                Usted tiene derecho a acceder, rectificar, eliminar y portar sus datos personales. Para ejercer estos derechos, contáctenos a través de los canales disponibles en la plataforma.
              </p>
            </div>
          </TabsContent>

          {/* Reglas de Cancelación */}
          <TabsContent value="cancellation" className="mt-6">
            <div className={sectionClass}>
              <h2 className="text-xl font-bold text-foreground">Reglas de Cancelación y No Asistencia</h2>

              <h3 className="text-lg font-semibold text-foreground">1. Política de No Asistencia (No-Show)</h3>
              <p>
                Si un usuario realiza una reserva y no asiste al centro deportivo sin cancelar con antelación, se aplicarán las penalizaciones descritas a continuación. Esta política existe para garantizar la disponibilidad justa de cupos para todos los usuarios.
              </p>

              <h3 className="text-lg font-semibold text-foreground">2. Penalizaciones</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
              </p>

              <h3 className="text-lg font-semibold text-foreground">3. Cancelación de Reservas</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>

              <h3 className="text-lg font-semibold text-foreground">4. Cancelación de Suscripción</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>

              <h3 className="text-lg font-semibold text-foreground">5. Reembolsos</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Legal;
