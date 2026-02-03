import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

// Configuración del sistema de puntos
const BASE_POINTS = 5;
const CHAT_BONUS = 2;
const SUBSCRIBER_MULTIPLIER = 2;

// Headers CORS específicos para Kick
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://kick.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Manejar preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const { user_id, chat_active, timestamp } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID es requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, points_balance, is_subscriber, last_points_update, kick_username')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Anti-spam: 9 minutos mínimo
    if (user.last_points_update) {
      const lastUpdate = new Date(user.last_points_update);
      const now = new Date();
      const minutesSinceLastUpdate = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;

      if (minutesSinceLastUpdate < 9) {
        return NextResponse.json(
          {
            error: 'Debes esperar 10 minutos',
            next_claim_in: Math.ceil(10 - minutesSinceLastUpdate)
          },
          { status: 429, headers: corsHeaders }
        );
      }
    }

    // Calcular puntos
    let pointsEarned = BASE_POINTS;
    if (chat_active) pointsEarned += CHAT_BONUS;
    if (user.is_subscriber) pointsEarned *= SUBSCRIBER_MULTIPLIER;

    const newBalance = (user.points_balance || 0) + pointsEarned;

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
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`✅ ${user.kick_username || user_id}: +${pointsEarned} pts (Total: ${newBalance})`);

    return NextResponse.json(
      {
        success: true,
        points_earned: pointsEarned,
        total_points: newBalance,
        message: 'Puntos reclamados exitosamente'
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error en /api/points/claim:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      endpoint: '/api/points/claim',
      method: 'POST',
      description: 'Endpoint para reclamar puntos'
    },
    { headers: corsHeaders }
  );
}
