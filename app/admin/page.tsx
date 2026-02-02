'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPoints, setEditPoints] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  
  // Estados para la Poll
  const [pollQuestion, setPollQuestion] = useState('');
  const [isPollActive, setIsPollActive] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    setUsers(data || []);
    setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center text-white">
        Cargando Panel de Control...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* CABECERA */}
        <div className="mb-8 border-b border-purple-500/20 pb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Panel Admin - SlotMasters1K</h1>
          <p className="text-gray-400 text-lg">Control de Balance Neto y Encuestas</p>
        </div>

        {/* GESTIÓN DE POLL (ENCUESTA) */}
        <div className="mb-12 bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-6 rounded-2xl border border-blue-500/30">
          <h2 className="text-2xl font-bold text-white mb-4">⚙️ Gestión de Poll (A / B)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Pregunta de la encuesta (Ej: ¿Ganaré esta partida?)" 
              className="bg-gray-900 border border-gray-700 p-3 rounded-lg text-white"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPollActive(true)}
                disabled={isPollActive}
                className={`px-6 py-2 rounded-lg font-bold flex-1 ${isPollActive ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
              >
                {isPollActive ? 'Poll en Curso...' : 'Lanzar Poll'}
              </button>
              <button 
                onClick={() => setIsPollActive(false)}
                className="bg-red-600/20 text-red-400 border border-red-600/50 px-6 py-2 rounded-lg font-bold"
              >
                Finalizar
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-blue-300">Respuesta A o B detectada automáticamente por el bot.</p>
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="bg-gray-800/50 rounded-2xl border border-purple-500/30 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
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
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{user.discord_username || 'Sin Discord'}</div>
                      <div className="text-gray-500 text-xs">{user.discord_user_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      {editing === user.id ? (
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="px-2 py-1 bg-gray-700 border border-purple-500 rounded text-white text-sm"
                        />
                      ) : (
                        <span className={user.kick_username ? "text-green-400" : "text-yellow-500"}>
                          {user.kick_username ? `@${user.kick_username}` : '❌ Sin vincular'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editing === user.id ? (
                        <input
                          type="number"
                          value={editPoints}
                          onChange={(e) => setEditPoints(Number(e.target.value))}
                          className="px-2 py-1 bg-gray-700 border border-purple-500 rounded text-purple-400 font-bold text-sm w-24"
                        />
                      ) : (
                        <span className="text-purple-400 font-bold">
                          {user.points_balance?.toLocaleString() || 0}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {user.is_subscriber ? <span className="text-yellow-400">⭐ Sí</span> : <span className="text-gray-500">No</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {editing === user.id ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleSave(user.id)} disabled={saving} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs text-white">
                            {saving ? '...' : 'Guardar'}
                          </button>
                          <button onClick={() => setEditing(null)} className="bg-gray-600 px-3 py-1 rounded text-xs text-white">Cancelar</button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditing(user.id);
                            setEditUsername(user.kick_username || '');
                            setEditPoints(user.points_balance || 0);
                          }}
                          className="bg-blue-600/80 hover:bg-blue-600 px-4 py-1 rounded text-xs text-white transition-all"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-500 text-sm">
            <strong>⚠️ Control de Gastos:</strong> Modifica los puntos solo en caso de error técnico para no desequilibrar el stock de las 30 tarjetas.
          </p>
        </div>

      </div>
    </div>
  );
}