import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Configuración del sistema de puntos
const BASE_POINTS = 5;
const CHAT_BONUS = 2;
const SUBSCRIBER_MULTIPLIER = 2;

export async function POST(request: Request) {
  try {
    const { user_id, chat_active, timestamp } = await request.json();

    // Validar datos
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID es requerido' },
        { status: 400 }
      );
    }

    // Obtener usuario desde Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, points_balance, is_subscriber, last_points_update, kick_username')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que no haya reclamado hace menos de 9 minutos (anti-spam)
    if (user.last_points_update) {
      const lastUpdate = new Date(user.last_points_update);
      const now = new Date();
      const minutesSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;

      if (minutesSinceLastUpdate < 9) {
        return NextResponse.json(
          {
            error: 'Debes esperar 10 minutos entre reclamaciones',
            next_claim_in: Math.ceil(10 - minutesSinceLastUpdate)
          },
          { status: 429 }
        );
      }
    }

    // Calcular puntos ganados
    let pointsEarned = BASE_POINTS;

    // Bonus por actividad en chat
    if (chat_active) {
      pointsEarned += CHAT_BONUS;
    }

    // Multiplicador para suscriptores
    if (user.is_subscriber) {
      pointsEarned *= SUBSCRIBER_MULTIPLIER;
    }

    const newBalance = (user.points_balance || 0) + pointsEarned;

    // Actualizar puntos en Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({
        points_balance: newBalance,
        last_points_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error actualizando puntos:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar puntos' },
        { status: 500 }
      );
    }

    // Log para tracking (opcional)
    console.log(`✅ Puntos reclamados: ${user.kick_username || user_id} +${pointsEarned} pts (Total: ${newBalance})`);

    return NextResponse.json({
      success: true,
      points_earned: pointsEarned,
      total_points: newBalance,
      message: 'Puntos reclamados exitosamente'
    });

  } catch (error) {
    console.error('Error en /api/points/claim:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Opcionalmente, permite GET para verificar estado
export async function GET(request: Request) {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/points/claim',
    method: 'POST',
    description: 'Endpoint para reclamar puntos de lealtad'
  });
}
