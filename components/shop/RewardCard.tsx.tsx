'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatPoints, formatEuro } from '@/lib/utils';
import { Gift, Wallet, Package, CheckCircle, XCircle } from 'lucide-react';
import type { Reward } from '@/types';

interface RewardCardProps {
  reward: Reward;
  userPoints: number;
  onRedeem: (reward: Reward) => void;
  isProcessing?: boolean;
}

export function RewardCard({ reward, userPoints, onRedeem, isProcessing = false }: RewardCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const canAfford = userPoints >= reward.points_cost;
  const isAvailable = reward.current_stock > 0 && reward.is_active;
  const canRedeem = canAfford && isAvailable;
  
  const handleRedeem = () => {
    if (showConfirm) {
      onRedeem(reward);
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <Card hover className={!isAvailable ? 'opacity-60' : ''}>
      <CardContent className="p-6">
        {/* Header con tipo de entrega */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              {reward.delivery_type === 'USDT' ? (
                <Wallet className="w-6 h-6 text-blue-600" />
              ) : (
                <Gift className="w-6 h-6 text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">
                {reward.reward_name}
              </h3>
              <p className="text-sm text-gray-500">
                {reward.delivery_type === 'USDT' ? 'USDT Wallet' : 'Código Digital'}
              </p>
            </div>
          </div>
          
          {isAvailable ? (
            <Badge variant="success">Disponible</Badge>
          ) : (
            <Badge variant="error">Agotado</Badge>
          )}
        </div>

        {/* Valor y puntos */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatEuro(reward.value_eur)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-blue-600">
            <Package className="w-4 h-4" />
            <span className="font-semibold">
              {formatPoints(reward.points_cost)} puntos
            </span>
          </div>
        </div>

        {/* Stock disponible */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Stock Disponible</span>
            <span className="font-semibold text-gray-900">
              {reward.current_stock} / {reward.initial_stock}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(reward.current_stock / reward.initial_stock) * 100}%`
              }}
            />
          </div>
        </div>

        {/* Indicador de si puede canjear */}
        {!canAfford && isAvailable && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            <XCircle className="w-4 h-4" />
            <span>Te faltan {formatPoints(reward.points_cost - userPoints)} puntos</span>
          </div>
        )}
        
        {canAfford && isAvailable && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            <span>Puedes canjear esta recompensa</span>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {showConfirm ? (
          <div className="w-full space-y-2">
            <p className="text-sm text-center text-gray-600 mb-2">
              ¿Confirmar canje de {formatPoints(reward.points_cost)} puntos?
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleRedeem}
                disabled={isProcessing}
              >
                {isProcessing ? 'Procesando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="w-full"
            variant={canRedeem ? 'primary' : 'outline'}
            disabled={!canRedeem || isProcessing}
            onClick={handleRedeem}
          >
            {!isAvailable ? 'Agotado' : canAfford ? 'Canjear Ahora' : 'Puntos Insuficientes'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
