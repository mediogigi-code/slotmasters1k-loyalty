'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// 🛡️ RELLENA ESTO: Pon tu ID de Discord para que solo tú entres
const ADMIN_DISCORD_ID = 'TU_ID_AQUI'; 

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPoints, setEditPoints] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  
  const [pollQuestion, setPollQuestion] = useState('');
  const [isPollActive, setIsPollActive] = useState(false);

  useEffect(() => {
    checkAuth();
    loadUsers();
  }, []);

  // Verifica si eres tú quien intenta entrar
  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata?.provider_id === ADMIN_DISCORD_ID) {
      setAuthorized(true);
    }
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  // 💰 FUNCIÓN: Lluvia de puntos masiva
  async function handleLluvia(cantidad: number) {
    if (!confirm(`¿Repartir +${cantidad} puntos a todos los usuarios registrados?`)) return;
    setSaving(true);

    const updates = users.map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + cantidad,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase.upsert(updates);
    if (!error) alert(`✅ Éxito: +${cantidad} puntos repartidos.`);
    setSaving(false);
    loadUsers();
  }

  async function handleSave(userId: string) {
    setSaving(true);
    await supabase
      .from('users')
      .update({ 
        kick_username: editUsername.toLowerCase().trim(),
        points_balance: editPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    setEditing(null);
    setSaving(false);
    loadUsers();
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Cargando...</div>;
  
  // Bloqueo de seguridad
  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Acceso Denegado</h1>
        <p>Solo el administrador de SlotMasters1K puede ver esta página.</p>
        <button onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord' })} className="mt-4 bg-indigo-600 px-6 py-2 rounded">Iniciar Sesión</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8 border-b border-purple-500/20 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Panel Admin - SlotMasters1K</h1>
            <p className="text-gray-400">Control de Balance y Premios</p>
          </div>
        </div>

        {/* 💰 SECCIÓN: LLUVIA DE PUNTOS */}
        <div className="mb-8 bg-green-900/20 p-6 rounded-2xl border border-green-500/30">
          <h2 className="text-xl font-bold text-green-400 mb-4">💰 Lluvia de Puntos (Masivo)</h2>
          <div className="flex flex-wrap gap-3">
            {[10, 20, 30, 40, 50].map((c) => (
              <button 
                key={c}
                disabled={saving}
                onClick={() => handleLluvia(c)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-transform active:scale-95"
              >
                +{c} Puntos
              </button>
            ))}
          </div>
        </div>

        {/* ⚙️ GESTIÓN DE POLL */}
        <div className="mb-12 bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-6 rounded-2xl border border-blue-500/30">
          <h2 className="text-2xl font-bold text-white mb-4 text-center md:text-left">⚙️ Gestión de Poll (A / B)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="¿Qué quieres preguntar en Kick?" 
              className="bg-gray-900 border border-gray-700 p-3 rounded-lg text-white"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPollActive(true)}
                className={`px-6 py-2 rounded-lg font-bold flex-1 ${isPollActive ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              >
                {isPollActive ? 'Poll en Curso...' : 'Lanzar Poll'}
              </button>
              <button onClick={() => setIsPollActive(false)} className="bg-red-600/20 text-red-400 border border-red-600/50 px-6 py-2 rounded-lg font-bold">
                Finalizar
              </button>
            </div>
          </div>
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="bg-gray-800/50 rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 text-left">Usuario Discord</th>
                  <th className="px-6 py-4 text-left">Kick Username</th>
                  <th className="px-6 py-4 text-left">Puntos (Balance)</th>
                  <th className="px-6 py-4 text-left">Sub</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-white">{user.discord_username || 'Sin Discord'}</td>
                    <td className="px-6 py-4">
                      {editing === user.id ? (
                        <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="bg-gray-700 text-white px-2 py-1 rounded w-full border border-purple-500" />
                      ) : (
                        <span className={user.kick_username ? "text-green-400" : "text-yellow-500"}>
                          {user.kick_username ? `@${user.kick_username}` : '❌ Sin vincular'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editing === user.id ? (
                        <input type="number" value={editPoints} onChange={(e) => setEditPoints(Number(e.target.value))} className="bg-gray-700 text-purple-400 font-bold px-2 py-1 rounded w-24 border border-purple-500" />
                      ) : (
                        <span className="text-purple-400 font-bold">{user.points_balance || 0}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{user.is_subscriber ? '⭐ Sí' : 'No'}</td>
                    <td className="px-6 py-4 text-center">
                      {editing === user.id ? (
                        <button onClick={() => handleSave(user.id)} className="bg-green-600 px-3 py-1 rounded text-xs text-white">Guardar</button>
                      ) : (
                        <button onClick={() => { setEditing(user.id); setEditUsername(user.kick_username || ''); setEditPoints(user.points_balance || 0); }} className="bg-blue-600 px-4 py-1 rounded text-xs text-white">Editar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}