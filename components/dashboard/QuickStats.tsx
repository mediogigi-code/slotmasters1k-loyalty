'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Trophy, Target, Gift, Zap } from 'lucide-react';

interface StatsCardProps {
  totalEarned: number;
  totalBets: number;
  totalRedeemed: number;
  winRate: number;
}

export function QuickStats({ totalEarned, totalBets, totalRedeemed, winRate }: StatsCardProps) {
  const stats = [
    {
      label: 'Total Ganado',
      value: totalEarned.toLocaleString('es-ES'),
      icon: Zap,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100'
    },
    {
      label: 'Apuestas Realizadas',
      value: totalBets,
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    {
      label: 'Puntos Canjeados',
      value: totalRedeemed.toLocaleString('es-ES'),
      icon: Gift,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    },
    {
      label: 'Tasa de Victoria',
      value: `${winRate}%`,
      icon: Trophy,
      color: 'text-green-600',
      bg: 'bg-green-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} hover>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
