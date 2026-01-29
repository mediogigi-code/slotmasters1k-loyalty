'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatPoints } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown, 
  Trophy, 
  Gift, 
  DollarSign,
  ArrowRight 
} from 'lucide-react';
import type { Transaction } from '@/types';

interface RecentActivityProps {
  transactions: Transaction[];
}

const typeIcons = {
  earn: TrendingUp,
  bet_win: Trophy,
  bet_loss: TrendingDown,
  redeem: Gift,
  cpa_bonus: DollarSign
};

const typeLabels = {
  earn: 'Minado',
  bet_win: 'Apuesta ganada',
  bet_loss: 'Apuesta perdida',
  redeem: 'Canje',
  cpa_bonus: 'Bonus CPA'
};

const typeColors = {
  earn: 'text-green-600',
  bet_win: 'text-yellow-600',
  bet_loss: 'text-red-600',
  redeem: 'text-purple-600',
  cpa_bonus: 'text-blue-600'
};

export function RecentActivity({ transactions }: RecentActivityProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No hay actividad reciente</p>
            <p className="text-sm mt-2">Tus transacciones aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((tx) => {
            const Icon = typeIcons[tx.type];
            const isPositive = tx.type === 'earn' || tx.type === 'bet_win' || tx.type === 'cpa_bonus';
            
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full bg-white ${typeColors[tx.type]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900">
                      {typeLabels[tx.type]}
                    </p>
                    {tx.description && (
                      <p className="text-sm text-gray-500 mt-0.5">
                        {tx.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(tx.created_at), "d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : '-'}{formatPoints(Math.abs(tx.amount))}
                  </p>
                  <Badge variant={tx.status === 'completed' ? 'success' : 'warning'}>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        <button className="w-full mt-6 flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          Ver todo el historial
          <ArrowRight className="w-4 h-4" />
        </button>
      </CardContent>
    </Card>
  );
}
