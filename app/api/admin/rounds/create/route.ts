import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // TODO: Añadir autenticación de admin aquí
    // Verificar que el usuario sea admin antes de crear ronda

    // Cerrar rondas anteriores que quedaron abiertas
    await supabase
      .from('bet_rounds')
      .update({ status: 'closed' })
      .eq('status', 'open');

    // Crear nueva ronda
    const { data: round, error } = await supabase
      .from('bet_rounds')
      .insert({
        status: 'open',
        total_a: 0,
        total_b: 0
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      round,
      message: 'Nueva ronda creada'
    });

  } catch (error) {
    console.error('Error en /api/admin/rounds/create:', error);
    return NextResponse.json(
      { error: 'Error al crear ronda' },
      { status: 500 }
    );
  }
}
