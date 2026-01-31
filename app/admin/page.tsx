'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

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
        kick_username: editValue.toLowerCase().trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    setEditing(null);
    setEditValue('');
    setSaving(false);
    loadUsers();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Panel Admin</h1>
          <p className="text-gray-400">Gestiona los usuarios y sus usernames de Kick</p>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-purple-500/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Discord</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Username Kick</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Puntos</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Sub</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.discord_avatar_url && (
                          <img 
                            src={user.discord_avatar_url} 
                            alt={user.discord_username}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <div className="text-white font-medium">{user.discord_username || 'Sin Discord'}</div>
                          <div className="text-gray-500 text-xs">{user.discord_user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editing === user.id ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                          autoFocus
                          disabled={saving}
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          {user.kick_username ? (
                            <span className="text-green-400">@{user.kick_username}</span>
                          ) : (
                            <span className="text-yellow-400">❌ Sin vincular</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-purple-400 font-bold">
                        {user.points_balance?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_subscriber ? (
                        <span className="text-yellow-400">⭐ Sí</span>
                      ) : (
                        <span className="text-gray-500">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editing === user.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSave(user.id)}
                            disabled={saving}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50"
                          >
                            {saving ? '...' : 'Guardar'}
                          </button>
                          <button
                            onClick={() => {
                              setEditing(null);
                              setEditValue('');
                            }}
                            disabled={saving}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditing(user.id);
                            setEditValue(user.kick_username || '');
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
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

          {users.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay usuarios registrados todavía
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-500/10 border border-blue-500 rounded-lg p-4">
          <p className="text-blue-400 text-sm">
            <strong>💡 Tip:</strong> Aquí puedes vincular el username de Kick de cada usuario. El bot usará este username para darles puntos cuando estén activos en el chat.
          </p>
        </div>
      </div>
    </div>
  );
}
