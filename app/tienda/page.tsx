'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RewardCard } from '@/components/shop/RewardCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TiendaPage() {
  const [rewards, setRewards] = useState([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // Obtenemos el usuario directamente de Supabase sin hooks externos
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setUser(userData);
    }

    const { data: rewardsData } = await supabase
      .from('rewards_stock')
      .select('*')
      .eq('is_active', true)
      .order('value_eur', { ascending: true });

    if (rewardsData) setRewards(rewardsData);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Cargando tienda...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/dashboard" className="text-blue-400 flex items-center gap-2 mb-6 hover:underline">
          <ArrowLeft size={20} /> Volver al Dashboard
        </Link>
        
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-black mb-2">TIENDA SEMANAL</h1>
          <p className="text-gray-400">Canjea tus puntos por premios. Máximo 1 por semana.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward: any) => (
            <RewardCard 
              key={reward.id} 
              reward={reward} 
              userPoints={user?.points_balance || 0}
              onRedeem={() => {}} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}