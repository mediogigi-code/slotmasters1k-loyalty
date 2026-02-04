'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

// Forzamos que la página no se cachee para ver los puntos en tiempo real
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [betAmount, setBetAmount] = useState(50);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [message, setMessage] = useState('');

  // Función para cargar datos de usuario (Ingresos Totales / Empresa)
  const loadUserData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`/api/user/${session.user.id}`, { cache: 'no-store' });
      const data = await res.json();
      setUserData(data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }, [session?.user?.id]);

  // Función para cargar la ronda (Estado de la Casa)
  const loadCurrentRound = useCallback(async () => {
    try {
      const res = await fetch('/api/bets/current', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setCurrentRound(data.round);
      } else {
        setCurrentRound(null);
      }
    } catch (error) {
      console.error('Error cargando ronda:', error);
      setCurrentRound(null);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/'); // Usamos replace para no dejar rastro en el historial
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      loadUserData();
      loadCurrentRound();
      
      // Auto-actualizar ronda cada 10 segundos para ver apuestas de otros
      const interval = setInterval(loadCurrentRound, 10000);
      return () => clearInterval(interval);
    }
  }, [session, loadUserData, loadCurrentRound]);

  async function placeBet(option: 'A' | 'B') {
    if (!session?.user?.id || !currentRound) return;
    if (betAmount > (userData?.points_balance || 0)) {
      setMessage('❌ No tienes suficientes puntos');
      return;
    }

    setIsPlacingBet(true);
    setMessage('');

    try {
      const res = await fetch('/api/bets/place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.user.id,
          option,
          amount: betAmount
        })
      });

      const data = await res.json();

      if (data.success) {
        setMessage(`✅ Apuesta de ${betAmount} pts en ${option} realizada`);
        await loadUserData(); // Actualiza Balance Neto inmediatamente
        await loadCurrentRound();
      } else {
        setMessage(`❌ ${data.error || 'Error al apostar'}`);
      }
    } catch (error) {
      setMessage('❌ Error de conexión al servidor');
    } finally {
      setIsPlacingBet(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4 mx-auto"></div>
          <p className="text-xl font-bold">CARGANDO SISTEMA 2026.1...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header con Avatar */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20 shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-400 shadow-2xl bg-slate-800">
              <Image 
                src={session.user?.image || "/avatar.png"} 
                alt="Avatar"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                ¡Bienvenido, {userData?.discord_username || session.user?.name || 'Usuario'}!
              </h1>
              <p className="text-blue-300 font-medium">Panel de Control SlotMasters1K • Versión 2026.1</p>
            </div>
          </div>
        </div>

        {/* Stats Grid - TUS BALANCES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-xl border border-blue-400/30">
            <div className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-2">Ingresos Totales</div>
            <div className="text-4xl font-black text-white">{userData?.points_balance || 0}</div>
            <div className="text-blue-200/60 text-xs mt-1">Puntos disponibles en cuenta</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-xl border border-purple-400/30">
            <div className="text-purple-100 text-sm font-bold uppercase tracking-wider mb-2">Estado Suscripción</div>
            <div className="text-2xl font-black text-white uppercase">
              {userData?.is_subscriber ? '⭐ VIP PREMIUM' : '👤 USUARIO ESTÁNDAR'}
            </div>
            <div className="text-purple-200/60 text-xs mt-1">Beneficios activos según rango</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 shadow-xl border border-emerald-400/30">
            <div className="text-emerald-100 text-sm font-bold uppercase tracking-wider mb-2">Cuenta Vinculada</div>
            <div className="text-2xl font-black text-white truncate">
              {userData?.kick_username ? `KICK: ${userData.kick_username}` : '❌ NO VINCULADA'}
            </div>
            <div className="text-emerald-200/60 text-xs mt-1">Sincronizado con streaming</div>
          </div>
        </div>

        {/* Sección de Apuestas - GASTOS CASA */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/10 shadow-inner">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-black text-white uppercase tracking-tighter">🎲 Apuestas en Vivo</h2>
             {currentRound && (
               <span className="bg-green-500 text-green-900 text-xs font-black px-3 py-1 rounded-full animate-pulse">
                 RONDA ACTIVA
               </span>
             )}
          </div>

          {currentRound ? (
            currentRound.status === 'open' ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => placeBet('A')}
                    disabled={isPlacingBet || (userData?.points_balance || 0) < 10}
                    className="group relative overflow-hidden bg-red-600 hover:bg-red-500 text-white rounded-2xl p-8 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="relative z-10 text-3xl font-black italic">APOSTAR A</span>
                    <div className="text-red-200 font-bold mt-2">Bote: {currentRound.totalA || 0} pts</div>
                  </button>

                  <button
                    onClick={() => placeBet('B')}
                    disabled={isPlacingBet || (userData?.points_balance || 0) < 10}
                    className="group relative overflow-hidden bg-blue-600 hover:bg-blue-500 text-white rounded-2xl p-8 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <span className="relative z-10 text-3xl font-black italic">APOSTAR B</span>
                    <div className="text-blue-200 font-bold mt-2">Bote: {currentRound.totalB || 0} pts</div>
                  </button>
                </div>

                <div className="max-w-md mx-auto">
                  <label className="text-white/70 text-xs font-bold uppercase mb-2 block text-center">Cantidad del Gasto</label>
                  <div className="flex gap-2">
                    {[50, 100, 500].map(amt => (
                      <button 
                        key={amt} 
                        onClick={() => setBetAmount(amt)}
                        className={`flex-1 py-2 rounded-lg font-bold transition-all ${betAmount === amt ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}
                      >
                        {amt}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(10, Number(e.target.value)))}
                    className="w-full mt-4 bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-2xl font-bold focus:border-yellow-500 transition-colors"
                  />
                </div>

                {message && (
                  <div className={`text-center p-4 rounded-xl font-bold animate-bounce ${message.includes('✅') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {message}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 bg-black/20 rounded-2xl border border-white/5">
                <p className="text-xl text-white/50 font-bold uppercase italic tracking-widest">Esperando Resultado de la Ronda...</p>
              </div>
            )
          ) : (
            <div className="text-center py-10">
              <p className="text-white/30 font-bold">NO HAY RONDAS ABIERTAS POR EL ADMIN</p>
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => window.open('https://slotmasters1k.net/', '_blank')} className="bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-bold border border-white/10 transition-all">PÁGINA OFICIAL</button>
          <button onClick={() => router.push('/tienda')} className="bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-black transition-all">TIENDA DE RECOMPENSAS</button>
          <button onClick={() => router.push('/')} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 py-4 rounded-xl font-bold border border-red-500/20 transition-all">CERRAR SESIÓN</button>
        </div>
      </div>
    </div>
  );
}
