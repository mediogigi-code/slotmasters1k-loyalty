'use client';

import React, { useEffect, useState } from 'react';
import { RewardCard } from '@/components/shop/RewardCard';
import { WeeklyReset } from '@/components/shop/WeeklyReset';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth'; // O como se llame tu hook de usuario

export default function TiendaPage() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  async function fetchRewards() {
    const { data, error } = await supabase
      .from('rewards_stock')
      .select('*')
      .eq('is_active', true)
      .order('points_cost', { ascending: true });

    if (!error) setRewards(data);
    setLoading(false);
  }

  async function handleRedeem(reward: any) {
    if (!user) return alert('Debes iniciar sesión');

    const { data, error } = await supabase.from('withdrawals').insert([
      {
        user_id: user.id,
        reward_id: reward.id,
        points_spent: reward.points_cost,
        wallet_address: user.wallet_address,
        status: 'pending'
      }
    ]);

    if (error) {
      alert(error.message); // Aquí saltará el mensaje "Solo una tarjeta por semana, jefe"
    } else {
      alert('¡Canje realizado con éxito! Espera a que el admin verifique el pago.');
      fetchRewards(); // Recargar stock
    }
  }

  if (loading) return <div className="p-10 text-center">Cargando tienda...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tienda de Recompensas</h1>
          <p className="text-gray-500">Canjea tus puntos por USDT cada semana</p>
        </div>
        <WeeklyReset />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            userPoints={user?.points_balance || 0}
            onRedeem={handleRedeem}
          />
        ))}
      </div>
    </div>
  );
}