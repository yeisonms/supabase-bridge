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

              <h3 className="text-lg font-semibold text-foreground">3. Registro, Cuenta y Seguridad</h3>
              <p>
                - Veracidad de la información: Para utilizar el servicio, el usuario debe registrarse creando una cuenta y proporcionando información precisa, actual y completa. <br/>

                - Uso personal e intransferible: La cuenta de RedFit, así como los beneficios de la suscripción, son estrictamente personales e intransferibles. Compartir credenciales de acceso o permitir que terceros utilicen su suscripción para ingresar a un centro aliado es una violación grave que resultará en la suspensión o cancelación inmediata de la cuenta sin derecho a reembolso. <br />

                - Seguridad: El usuario es responsable de mantener la confidencialidad de su contraseña y de todas las actividades que ocurran bajo su cuenta.              </p>

              <h3 className="text-lg font-semibold text-foreground">4. Planes de Suscripción, Accesos y Pagos</h3>
              <p>
                - Ciclo de facturación: Las suscripciones de RedFit se renuevan automáticamente de forma mensual. El cobro se realizará de manera anticipada a través de nuestra pasarela de pagos integrada, utilizando el método de pago proporcionado por el usuario. <br/>

                - Límites de acceso: Cada nivel de suscripción (ej. Lite, Mid, Plus, Unlimited) otorga un número máximo de accesos (check-ins) por mes de facturación. Los accesos no utilizados al final del ciclo mensual caducan y no son acumulables para el mes siguiente. <br/>

                - Gestión de pagos: Al procesar su pago, usted acepta los términos y condiciones del procesador de pagos externo. En caso de que un cobro sea rechazado o la tarjeta expire, RedFit suspenderá temporalmente la capacidad de realizar reservas hasta que se regularice el pago. <br/>

                - Cancelación: El usuario puede cancelar su suscripción en cualquier momento desde su panel de control. La cancelación evitará futuros cobros, pero el usuario mantendrá acceso al servicio hasta que finalice el ciclo de facturación actual. No se emiten reembolsos parciales por días no utilizados.              </p>

              <h3 className="text-lg font-semibold text-foreground">5. Uso Aceptable y Normas de los Centros Aliados</h3>
              <p>
                - Proceso de Check-in: Es obligatorio registrar la asistencia (check-in) a través de la plataforma RedFit antes de utilizar los servicios de cualquier centro aliado. <br/>

                - Cumplimiento de normas internas: Al visitar un centro aliado, el usuario acepta y debe acatar el reglamento interno, los códigos de conducta y las normas de seguridad de dicho establecimiento. <br/>

                - Exención de responsabilidad: RedFit actúa únicamente como facilitador tecnológico. No somos propietarios, operadores ni responsables de las instalaciones, equipos, personal o servicios prestados por los centros aliados. El usuario asume todos los riesgos asociados con la práctica de actividades físicas, eximiendo a RedFit de cualquier responsabilidad por lesiones, accidentes o pérdida de objetos personales que puedan ocurrir dentro de dichas instalaciones.              </p>

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

              <h3 className="text-lg font-semibold text-foreground">4. Condiciones de las Instalaciones y Disponibilidad</h3>
              <p>
                RedFit no garantiza la calidad, disponibilidad, higiene, mantenimiento o seguridad de los equipos, clases, zonas húmedas o personal de los centros aliados. Los horarios de atención, los límites de aforo y la oferta de clases están sujetos exclusivamente a la administración y políticas internas de cada centro. Cualquier queja o reclamo directamente relacionado con el estado de las instalaciones o el servicio presencial debe dirigirse y resolverse con la administración del centro deportivo involucrado, eximiendo a RedFit de cualquier mediación legal.              </p>

              <h3 className="text-lg font-semibold text-foreground">5. Indemnidad (Indemnización)</h3>
              <p>
El usuario acepta defender, indemnizar y mantener indemne a RedFit (incluyendo a sus directores, empleados, agentes y afiliados) contra cualquier reclamación, demanda, daño, obligación, pérdida, costo o gasto (incluyendo honorarios razonables de abogados) que surja directa o indirectamente de: (a) su uso de la plataforma o su asistencia a los centros aliados; (b) su violación de cualquiera de estos Términos o de las reglas internas de los gimnasios; (c) lesiones a terceros o daños a la propiedad causados por el usuario dentro de las instalaciones; o (d) la violación de cualquier ley aplicable.              </p>
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
                Utilizamos su información personal exclusivamente para:<br/>

                - Crear, gestionar y mantener activa su cuenta de RedFit. <br/>

                - Procesar los pagos recurrentes de su suscripción a través de nuestra pasarela segura. <br/>

                - Facilitar y validar sus reservas y accesos físicos en los centros deportivos aliados. <br/>

                - Enviarle notificaciones importantes sobre su cuenta, confirmaciones de pago, cambios en los términos o alertas de seguridad. <br/>

                - Analizar métricas de uso para mejorar la experiencia, rendimiento y diseño de la plataforma.                Utilizamos la información recopilada para gestionar su suscripción, facilitar el proceso de check-in en los centros aliados, personalizar la experiencia en la plataforma, enviar comunicaciones relacionadas con el servicio y mejorar continuamente la oferta de valor de RedFit. Sus datos no serán vendidos ni cedidos a terceros para fines comerciales ajenos a la operación de la plataforma.              </p>

              <h3 className="text-lg font-semibold text-foreground">3. Almacenamiento y Seguridad</h3>
              <p>
              RedFit implementa estrictas medidas de seguridad técnicas y organizativas para proteger sus datos contra accesos no autorizados, alteración o destrucción. Toda la información se almacena en bases de datos en la nube (proveedores de nivel global) con cifrado estándar de la industria.
              <strong>Nota financiera importante:</strong> RedFit <strong>NO almacena </strong>  ni procesa directamente los números completos de sus tarjetas de crédito o débito. Todo el procesamiento financiero es gestionado de forma independiente por nuestra pasarela de pagos certificada, la cual cumple con los más altos estándares de seguridad bancaria (PCI-DSS).                Sus datos personales se almacenan de forma segura en servidores protegidos y se procesan de acuerdo con las normativas de protección de datos vigentes. Implementamos medidas técnicas y organizativas para garantizar la confidencialidad e integridad de la información.              </p>

              <h3 className="text-lg font-semibold text-foreground">4. Compartición con Terceros</h3>
              <p>
              RedFit respeta profundamente su privacidad y NO vende, alquila ni comercializa sus datos personales a agencias de publicidad o terceros no relacionados. Sin embargo, para poder operar y prestarle el servicio, compartimos información estrictamente necesaria con:<br/>

              <strong>Centros Aliados:</strong> Al realizar un check-in o reserva, compartimos su nombre, foto de perfil (si aplica) y estado de suscripción con el gimnasio o centro deportivo correspondiente, única y exclusivamente para fines de control de acceso y validación de identidad.<br/>

              <strong>Proveedores Tecnológicos:</strong> Compartimos datos cifrados con proveedores de infraestructura (servidores, envío de correos, pasarelas de pago) que nos ayudan a mantener la plataforma en línea, los cuales operan bajo estrictos acuerdos de confidencialidad y protección de datos.              </p>

              <h3 className="text-lg font-semibold text-foreground">5. Derechos del Usuario</h3>
              <p>
              Usted es el dueño de su información. Tiene derecho a conocer, actualizar, rectificar, solicitar la eliminación y portar sus datos personales en cualquier momento. Para ejercer estos derechos, o si tiene dudas sobre el manejo de su información, contáctenos enviando un correo electrónico a soporte (o al canal de atención oficial dispuesto en la plataforma)             
              </p>
            </div>
          </TabsContent>

          {/* Reglas de Cancelación */}
          <TabsContent value="cancellation" className="mt-6">
            <div className={sectionClass}>
              <h2 className="text-xl font-bold text-foreground">Reglas de Cancelación y No Asistencia</h2>

              <h3 className="text-lg font-semibold text-foreground">1. Política de No Asistencia (No-Show)</h3>
              <p>
              Si un usuario realiza una reserva y no asiste al centro deportivo sin cancelar con antelación, se aplicarán las penalizaciones descritas a continuación. Esta política existe para garantizar la disponibilidad justa de cupos para todos los usuarios y mantener una excelente relación con nuestros centros aliados.
              </p>

              <h3 className="text-lg font-semibold text-foreground">2. Penalizaciones por No Asistencia</h3>
              <p>
              En caso de registrar un "No-Show" (ausencia sin cancelación previa), se aplicará de forma estricta la siguiente regla: El usuario perderá de forma irrecuperable el acceso (check-in) correspondiente a dicha reserva, el cual será descontado automáticamente de su límite de accesos permitidos en su ciclo mensual actual. RedFit se reserva el derecho de suspender temporalmente la capacidad de reservar a los usuarios que acumulen múltiples ausencias injustificadas en un mismo mes.
              </p>

              <h3 className="text-lg font-semibold text-foreground">3. Cancelación de Reservas en Centros Aliados</h3>
              <p>
                Para evitar penalizaciones y devolver el cupo al sistema, el usuario debe cancelar su reserva directamente a través de la plataforma RedFit con un mínimo de dos (2) horas de antelación a la hora programada de la clase o acceso. Si la cancelación se realiza dentro de este margen permitido, el acceso (check-in) no será descontado y el usuario podrá utilizarlo en otro momento. Las cancelaciones fuera de este tiempo límite serán consideradas como No Asistencia.
              </p>

              <h3 className="text-lg font-semibold text-foreground">4. Cancelación de Suscripción (Plan Mensual)</h3>
              <p>
                El usuario tiene el control total sobre su membresía y puede cancelar la renovación automática de su suscripción en cualquier momento desde su panel de perfil en la aplicación. Para evitar el cobro del siguiente ciclo, la cancelación debe realizarse antes de su fecha de corte o fecha de renovación automática. Al cancelar, el usuario mantendrá el derecho de utilizar los accesos restantes de su plan hasta el último día del ciclo de facturación vigente.
              </p>

              <h3 className="text-lg font-semibold text-foreground">5. Política de Reembolsos</h3>
              <p>
                Todos los pagos realizados en RedFit son definitivos. No se emitirán reembolsos totales ni parciales bajo ninguna circunstancia, incluyendo, pero sin limitarse a: olvido de cancelación de la suscripción antes de la fecha de corte, falta de uso de la plataforma, o inconformidad con los servicios de un centro aliado. Asimismo, los accesos (check-ins) no consumidos al finalizar el ciclo de facturación mensual expiran automáticamente y no son acumulables, transferibles, ni reembolsables en dinero.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Legal;
