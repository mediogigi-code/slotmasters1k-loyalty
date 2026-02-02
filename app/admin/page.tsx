'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// 🛡️ ADMINISTRADOR AUTORIZADO
const ADMIN_USERNAME = 'dark6666'; 

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

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    // Verifica si el usuario logueado es dark6666
    if (user?.user_metadata?.full_name === ADMIN_USERNAME || user?.user_metadata?.name === ADMIN_USERNAME || user?.user_metadata?.custom_claims?.global_name === ADMIN_USERNAME) {
      setAuthorized(true);
    }
    // Nota: Si al loguear no te deja entrar, dímelo y lo ajustamos al ID numérico que es infalible.
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  async function handleLluvia(cantidad: number) {
    if (!confirm(`¿Repartir +${cantidad} puntos a todos?`)) return;
    setSaving(true);

    const updates = users.map(user => ({
      id: user.id,
      points_balance: (user.points_balance || 0) + cantidad,
      updated_at: new Date().toISOString()
    }));

    // ✅ CORRECCIÓN CRÍTICA PARA EL ERROR DE RAILWAY
    const { error } = await supabase
      .from('users') 
      .upsert(updates); 

    if (!error) {
      alert(`✅ Lluvia de +${cantidad} puntos completada.`);
    } else {
      alert("❌ Error al repartir: " + error.message);
    }
    
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

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">Verificando Credenciales de dark6666...</div>;
  
  if (!authorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">ACCESO RESTRINGIDO</h1>
        <p className="text-gray-400 mb-8">Esta zona es exclusiva para dark6666.</p>
        <button 
          onClick={() => supabase.auth.signInWithOAuth({ provider: 'discord' })} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-black tracking-widest transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
        >
          LOGUEAR CON DISCORD
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 border-b border-purple-500/20 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">S1K CONTROL PANEL</h1>
            <p className="text-purple-400 font-mono text-sm">ADMIN: {ADMIN_USERNAME}</p>
          </div>
          <button onClick={() => supabase.auth.signOut()} className="text-xs text-gray-500 hover:text-white underline">Cerrar Sesión</button>
        </div>

        {/* LLUVIA DE PUNTOS */}
        <div className="mb-8 bg-green-500/10 p-6 rounded-2xl border border-green-500/30">
          <h2 className="text-xl font-bold text-green-400 mb-4 tracking-tighter uppercase">Lluvia de Puntos Masiva</h2>
          <div className="flex flex-wrap gap-4">
            {[10, 20, 30, 40, 50].map((c) => (
              <button 
                key={c}
                disabled={saving}
                onClick={() => handleLluvia(c)}
                className="bg-green-600 hover:bg-green-500 text-white font-black py-3 px-8 rounded-xl transition-all active:scale-90"
              >
                +{c}
              </button>
            ))}
          </div>
        </div>

        {/* POLL SYSTEM */}
        <div className="mb-12 bg-purple-600/10 p-6 rounded-2xl border border-purple-500/30">
          <h2 className="text-xl font-bold text-purple-400 mb-4 uppercase tracking-tighter">Sistema de Poll KICK</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="¿Qué quieres preguntar?" 
              className="bg-gray-900 border border-gray-700 p-4 rounded-xl text-white focus:border-purple-500 outline-none"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
            />
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPollActive(true)}
                className={`px-8 rounded-xl font-bold flex-1 transition-all ${isPollActive ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}
              >
                {isPollActive ? 'POLL ACTIVA' : 'LANZAR POLL'}
              </button>
              <button onClick={() => setIsPollActive(false)} className="bg-red-900/20 text-red-500 border border-red-500/50 px-8 rounded-xl font-bold hover:bg-red-500 hover:text-white">
                OFF
              </button>
            </div>
          </div>
        </div>

        {/* TABLA DE USUARIOS */}
        <div className="bg-gray-900/80 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-md">
          <table className="w-full">
            <thead className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-[0.2em]">
              <tr>
                <th className="px-6 py-5 text-left font-medium">Usuario Discord</th>
                <th className="px-6 py-5 text-left font-medium">Kick Username</th>
                <th className="px-6 py-5 text-left font-medium">Puntos Balance</th>
                <th className="px-6 py-5 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5 text-white font-bold">{user.discord_username}</td>
                  <td className="px-6 py-5 font-mono text-sm">
                    {editing === user.id ? (
                      <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} className="bg-gray-800 text-white px-3 py-1 rounded-lg border border-purple-500 outline-none w-full" />
                    ) : (
                      <span className={user.kick_username ? "text-blue-400" : "text-gray-600"}>{user.kick_username || '---'}</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {editing === user.id ? (
                      <input type="number" value={editPoints} onChange={(e) => setEditPoints(Number(e.target.value))} className="bg-gray-800 text-green-400 font-bold px-3 py-1 rounded-lg border border-purple-500 outline-none w-24" />
                    ) : (
                      <span className="text-green-400 font-mono font-bold">{user.points_balance}</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    {editing === user.id ? (
                      <button onClick={() => handleSave(user.id)} className="bg-white text-black px-4 py-1 rounded-full text-xs font-black uppercase">Save</button>
                    ) : (
                      <button onClick={() => { setEditing(user.id); setEditUsername(user.kick_username || ''); setEditPoints(user.points_balance || 0); }} className="text-white/40 hover:text-white text-xs uppercase tracking-widest font-bold">Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}