import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID es requerido' },
        { status: 400 }
      );
    }

    // Obtener datos del usuario
    const { data: user, error } = await supabase
      .from('users')
      .select('discord_username, kick_username, points_balance, is_subscriber, discord_avatar_url')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        discord_username: user.discord_username || 'Usuario',
        kick_username: user.kick_username || null,
        points_balance: user.points_balance || 0,
        is_subscriber: user.is_subscriber || false,
        avatar_url: user.discord_avatar_url || null
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        }
      }
    );

  } catch (error) {
    console.error('Error en /api/user/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}