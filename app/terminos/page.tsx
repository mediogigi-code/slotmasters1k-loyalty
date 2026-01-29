'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Términos y Condiciones
        </h1>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-8">
          
          {/* Última actualización */}
          <div className="text-sm text-gray-500">
            Última actualización: {new Date().toLocaleDateString('es-ES', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>

          {/* Intro */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Aceptación de los Términos
            </h2>
            <p className="text-gray-700 leading-relaxed">
              Al acceder y utilizar el sistema de lealtad de SlotMasters1K ("la Comunidad"), aceptas estar legalmente vinculado por estos términos y condiciones. Si no estás de acuerdo con alguna parte de estos términos, no debes usar este servicio.
            </p>
          </section>

          {/* Naturaleza del Servicio */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Naturaleza del Servicio
            </h2>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                SlotMasters1K Comunidad es un <strong>sistema de recompensas y fidelización gratuito</strong> diseñado para la comunidad de espectadores del canal de Kick "slotmasters1k".
              </p>
              <p className="leading-relaxed">
                <strong>IMPORTANTE:</strong> Los "puntos" acumulados en este sistema:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>NO constituyen dinero real</li>
                <li>NO tienen valor monetario intrínseco</li>
                <li>NO son transferibles ni canjeables por dinero</li>
                <li>Son ÚNICAMENTE canjeables por las recompensas especificadas en la tienda</li>
                <li>NO generan ningún derecho de propiedad sobre SlotMasters1K</li>
              </ul>
            </div>
          </section>

          {/* Sistema de Puntos */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Sistema de Puntos
            </h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-semibold text-gray-900">3.1 Cómo se Ganan Puntos</h3>
              <p>Los usuarios pueden ganar puntos de las siguientes formas:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Visualización de Streams:</strong> 5 puntos base cada 10 minutos mientras el stream está en vivo</li>
                <li><strong>Bonus de Actividad:</strong> +2 puntos adicionales si escribiste en el chat en los últimos 10 minutos</li>
                <li><strong>Multiplicador de Suscriptor:</strong> x2 multiplicador total si eres suscriptor del canal</li>
                <li><strong>Apuestas Ganadas:</strong> Puntos variables según las cuotas de las apuestas en vivo</li>
                <li><strong>Bonos CPA:</strong> Bonificaciones por depósitos verificados en casinos afiliados</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">3.2 Ejemplo de Cálculo</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p><strong>Usuario normal viendo stream:</strong> 5 puntos / 10 min</p>
                <p><strong>Usuario normal activo en chat:</strong> 7 puntos / 10 min (5 + 2)</p>
                <p><strong>Suscriptor viendo stream:</strong> 10 puntos / 10 min (5 × 2)</p>
                <p><strong>Suscriptor activo en chat:</strong> 14 puntos / 10 min ((5 + 2) × 2)</p>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">3.3 Pérdida de Puntos</h3>
              <p>Los puntos se deducen al:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Canjear recompensas en la tienda</li>
                <li>Realizar apuestas en las predicciones en vivo</li>
                <li>Perder apuestas realizadas</li>
              </ul>
            </div>
          </section>

          {/* Recompensas */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Sistema de Recompensas
            </h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-semibold text-gray-900">4.1 Stock Limitado</h3>
              <p>Las recompensas tienen un <strong>stock limitado semanal</strong> que se resetea cada lunes a las 00:00 (hora española).</p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-4">4.2 Presupuesto Máximo</h3>
              <p>El presupuesto total de recompensas es de <strong>200€ por semana</strong>. Una vez agotado el stock, no habrá más recompensas disponibles hasta el próximo reset.</p>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">4.3 Tipos de Recompensa</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Códigos Digitales:</strong> Tarjetas regalo entregadas por código (Mini, Bronze, Silver)</li>
                <li><strong>USDT:</strong> Criptomoneda enviada a tu wallet (Gold, Epic)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">4.4 Procesamiento de Canjes</h3>
              <p>Los canjes pueden tardar hasta <strong>24-48 horas</strong> en procesarse. SlotMasters1K se reserva el derecho de:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Verificar la legitimidad de los puntos acumulados</li>
                <li>Rechazar canjes sospechosos de fraude</li>
                <li>Solicitar información adicional antes de procesar</li>
              </ul>
            </div>
          </section>

          {/* Descargo de Responsabilidad */}
          <section className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ⚠️ 5. DESCARGO DE RESPONSABILIDAD IMPORTANTE
            </h2>
            <div className="space-y-4 text-gray-800">
              <h3 className="text-lg font-semibold text-gray-900">5.1 Sobre el Contenido del Canal</h3>
              <p className="leading-relaxed">
                SlotMasters1K es un canal de entretenimiento que transmite contenido relacionado con casinos online y juegos de azar. <strong>ADVERTENCIA:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 font-semibold">
                <li>El juego puede crear ADICCIÓN</li>
                <li>Solo para MAYORES DE 18 AÑOS</li>
                <li>Juega de forma RESPONSABLE</li>
                <li>NO apuestes más de lo que puedas permitirte perder</li>
                <li>El contenido mostrado es ENTRETENIMIENTO, no asesoramiento financiero</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">5.2 Sin Garantías</h3>
              <p className="leading-relaxed">
                Este sistema de lealtad se proporciona <strong>"tal cual"</strong> sin garantías de ningún tipo. SlotMasters1K NO garantiza:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Disponibilidad ininterrumpida del servicio</li>
                <li>Que las recompensas estarán siempre disponibles</li>
                <li>Que los puntos se mantendrán indefinidamente</li>
                <li>Corrección de errores técnicos que afecten al saldo de puntos</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-6">5.3 Limitación de Responsabilidad</h3>
              <p className="leading-relaxed">
                En ningún caso SlotMasters1K, sus operadores, afiliados o socios serán responsables de:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Pérdida de puntos por errores técnicos</li>
                <li>Daños directos o indirectos derivados del uso del sistema</li>
                <li>Problemas con terceros (Kick, casinos afiliados, proveedores de wallets)</li>
                <li>Decisiones de juego tomadas por los usuarios</li>
              </ul>
            </div>
          </section>

          {/* Uso Aceptable */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Uso Aceptable y Prohibiciones
            </h2>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">Queda ESTRICTAMENTE PROHIBIDO:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Uso de múltiples cuentas para acumular puntos (multi-accounting)</li>
                <li>Uso de bots o scripts para automatizar la acumulación de puntos</li>
                <li>Compartir cuentas con otros usuarios</li>
                <li>Manipular el sistema de puntos de cualquier forma</li>
                <li>Vender, transferir o comerciar puntos con terceros</li>
                <li>Usar VPNs o proxies para evadir restricciones</li>
                <li>Comportamiento abusivo, acoso o spam en el chat</li>
              </ul>
              <p className="mt-4 font-semibold text-red-600">
                La violación de estas reglas resultará en la suspensión inmediata de la cuenta y pérdida de todos los puntos acumulados.
              </p>
            </div>
          </section>

          {/* Privacidad */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Privacidad y Datos Personales
            </h2>
            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-semibold text-gray-900">7.1 Datos Recopilados</h3>
              <p>Al usar este servicio, recopilamos:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Usuario y avatar de Kick (público)</li>
                <li>Estado de suscripción al canal</li>
                <li>Dirección IP (para prevención de fraude)</li>
                <li>Dirección de wallet USDT (opcional, solo si canjeas recompensas en cripto)</li>
                <li>Actividad en el chat y tiempo de visualización</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">7.2 Uso de los Datos</h3>
              <p>Utilizamos tus datos ÚNICAMENTE para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Operar el sistema de puntos y recompensas</li>
                <li>Prevenir fraude y multi-accounting</li>
                <li>Procesar canjes de recompensas</li>
                <li>Mejorar la experiencia del usuario</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mt-4">7.3 Compartición de Datos</h3>
              <p>NO vendemos ni compartimos tus datos con terceros, excepto:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Proveedores de infraestructura (Supabase, hosting)</li>
                <li>Cuando sea requerido por ley</li>
              </ul>
            </div>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Modificaciones del Servicio
            </h2>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                SlotMasters1K se reserva el derecho de:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modificar estos términos en cualquier momento</li>
                <li>Cambiar el valor de los puntos o las recompensas</li>
                <li>Suspender o terminar el servicio sin previo aviso</li>
                <li>Ajustar el stock semanal o el presupuesto de recompensas</li>
                <li>Añadir o eliminar formas de ganar/gastar puntos</li>
              </ul>
              <p className="mt-4">
                Los cambios entrarán en vigor inmediatamente tras su publicación en esta página.
              </p>
            </div>
          </section>

          {/* Suspensión de Cuentas */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Suspensión y Terminación
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>SlotMasters1K puede suspender o terminar tu cuenta si:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violas estos términos y condiciones</li>
                <li>Realizas actividades fraudulentas</li>
                <li>Usas el sistema de forma abusiva</li>
                <li>Eres baneado del canal de Kick</li>
              </ul>
              <p className="mt-4 font-semibold">
                La suspensión resultará en la pérdida de todos los puntos acumulados, sin derecho a compensación.
              </p>
            </div>
          </section>

          {/* Jurisdicción */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Ley Aplicable y Jurisdicción
            </h2>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                Estos términos se regirán e interpretarán de acuerdo con las leyes de España. Cualquier disputa relacionada con estos términos estará sujeta a la jurisdicción exclusiva de los tribunales de Madrid, España.
              </p>
            </div>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Contacto
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>Para preguntas sobre estos términos, contacta:</p>
              <p>
                <strong>Email:</strong> soporte@slotmasters1k.net<br />
                <strong>Discord:</strong> SlotMasters1K Community<br />
                <strong>Kick:</strong> @slotmasters1k
              </p>
            </div>
          </section>

          {/* Disclaimer Juego Responsable */}
          <section className="bg-red-50 border-2 border-red-400 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-red-900 mb-4">
              🚨 JUEGO RESPONSABLE
            </h2>
            <div className="space-y-3 text-red-900">
              <p className="font-semibold text-lg">
                Si crees que tienes un problema con el juego, busca ayuda inmediatamente:
              </p>
              <ul className="space-y-2">
                <li><strong>Jugarbien.es</strong> - Teléfono: 900 200 225</li>
                <li><strong>Federación Española de Jugadores de Azar Rehabilitados</strong></li>
                <li><strong>Tu médico de cabecera</strong></li>
              </ul>
              <p className="mt-4 font-bold">
                El juego debe ser una forma de entretenimiento, no una fuente de ingresos.
              </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Al continuar usando SlotMasters1K Comunidad, aceptas estos términos y condiciones.</p>
          <p className="mt-2">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              Volver al inicio
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
