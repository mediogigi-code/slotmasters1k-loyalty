'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { formatPoints } from '@/lib/utils';
import { Coins, TrendingUp, Award } from 'lucide-react';
import type { User } from '@/types';

interface PointsCardProps {
  user: User;
  recentEarnings?: number;
}

export function PointsCard({ user, recentEarnings = 0 }: PointsCardProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-full">
              <Coins className="w-8 h-8" />
            </div>
            <div>
              <p className="text-blue-100 text-sm">Saldo Total</p>
              <h2 className="text-4xl font-bold">
                {formatPoints(user.points_balance)}
              </h2>
              <p className="text-xs text-blue-200 mt-1">puntos</p>
            </div>
          </div>
          
          {user.is_subscriber && (
            <div className="flex flex-col items-end">
              <Award className="w-8 h-8 text-yellow-300 mb-2" />
              <span className="text-xs bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-300/30">
                SUSCRIPTOR
              </span>
            </div>
          )}
        </div>
        
        {recentEarnings > 0 && (
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="flex items-center gap-2 text-green-300">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">
                +{formatPoints(recentEarnings)} en las últimas 24h
              </span>
            </div>
          </div>
        )}
        
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold">{user.is_subscriber ? '2x' : '1x'}</p>
            <p className="text-xs text-blue-200">Multiplicador</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-blue-200">Base / 10min</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
