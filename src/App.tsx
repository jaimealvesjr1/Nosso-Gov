import React, { useState, useEffect } from 'react';
import {
  Users, FileText, Gavel, Settings, Plus, Trash2, Check, X,
  AlertTriangle, Landmark, FileSignature, Activity, Shield, BookOpen,
  DollarSign, Megaphone, Scale, LogIn
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

// === COLOQUE SUAS CHAVES AQUI ===
const firebaseConfig = {
  apiKey: "AIzaSyASs6rkZ50mfQAoGEIHpSh_G7_Ae1rZyoA",
  authDomain: "nosso-gov.firebaseapp.com",
  projectId: "nosso-gov",
  storageBucket: "nosso-gov.firebasestorage.app",
  messagingSenderId: "410358387557",
  appId: "1:410358387557:web:d06f88b16383aebec4478c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'rpg-politico-app'; // ID fixo para o banco de dados local

// --- TIPAGENS ---
type Role = 'admin' | 'presidente_republica' | 'presidente_congresso' | 'deputado' | 'governador' | 'ministro' | 'stf' | 'espectador';

interface UserProfile {
  id: string;
  discordUsername: string;
  role: Role;
  jurisdictionId?: string;
  pastaId?: 'saude' | 'educacao' | 'seguranca';
}

interface RpgData {
  id: string;
  name: string;
  totalBudget: number;
  stats: { saude: number; educacao: number; seguranca: number; };
  allocatedBudget: { saude: number; educacao: number; seguranca: number; };
}

interface RpgProject {
  id: string;
  sequentialNumber: number;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  status: 'proposto' | 'pauta' | 'votacao' | 'aprovado_congresso' | 'rejeitado' | 'sancionado' | 'vetado';
  votes: Record<string, 'sim' | 'nao' | 'abstencao'>;
}

interface RpgEvent {
  id: string; title: string; description: string; impact: string; createdAt: any;
}

interface StfDecision {
  id: string; authorName: string; title: string; content: string; createdAt: any;
}

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [states, setStates] = useState<RpgData[]>([]);
  const [projects, setProjects] = useState<RpgProject[]>([]);
  const [events, setEvents] = useState<RpgEvent[]>([]);
  const [decisions, setDecisions] = useState<StfDecision[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'legislativo' | 'executivo' | 'judiciario' | 'eventos' | 'admin'>('dashboard');
  const [toastMessage, setToastMessage] = useState('');

  const [loginName, setLoginName] = useState('');
  const [modalType, setModalType] = useState<'none' | 'newProject' | 'newEvent' | 'newDecision' | 'newState'>('none');
  const [formData, setFormData] = useState<any>({});

  // --- EFEITOS ---
  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'users'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      setUsersList(data);
      setProfile(data.find(p => p.id === user.uid) || null);
      setLoading(false);
    });

    const unsubStates = onSnapshot(collection(db, 'artifacts', appId, 'states'), snap => {
      setStates(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgData)));
    });

    const unsubProjects = onSnapshot(collection(db, 'artifacts', appId, 'projects'), snap => {
      setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgProject)).sort((a,b) => b.sequentialNumber - a.sequentialNumber));
    });

    const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'events'), snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgEvent)));
    });

    const unsubDecisions = onSnapshot(collection(db, 'artifacts', appId, 'judiciary'), snap => {
      setDecisions(snap.docs.map(d => ({ id: d.id, ...d.data() } as StfDecision)));
    });

    return () => { unsubUsers(); unsubStates(); unsubProjects(); unsubEvents(); unsubDecisions(); };
  }, [user]);

  // --- FUNÇÕES ---
  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleSimulatedLogin = async () => {
    if (!loginName || !user) return;
    const isFirstUser = usersList.length === 0;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid), {
      id: user.uid, discordUsername: loginName, role: isFirstUser ? 'admin' : 'espectador', jurisdictionId: 'federal'
    });
    showToast(`Bem-vindo, ${loginName}!`);
  };

  const handleUpdateUserRole = async (userId: string, newRole: Role, newJurisdiction?: string, newPasta?: string) => {
    await updateDoc(doc(db, 'artifacts', appId, 'users', userId), { 
      role: newRole, jurisdictionId: newJurisdiction || 'federal', pastaId: newPasta || null
    });
    showToast("Cargo atualizado!");
  };

  const handleSaveState = async () => {
    if(!formData.name) return;
    await setDoc(doc(db, 'artifacts', appId, 'states', generateId()), {
      name: formData.name, totalBudget: Number(formData.budget) || 1000000,
      stats: { saude: 50, educacao: 50, seguranca: 50 }, allocatedBudget: { saude: 0, educacao: 0, seguranca: 0 }
    });
    setModalType('none'); setFormData({}); showToast("Estado/Unidade criada!");
  };

  const handleProtocolProject = async () => {
    if (!formData.title || !profile) return;
    const nextNum = projects.length > 0 ? Math.max(...projects.map(p => p.sequentialNumber)) + 1 : 1;
    await setDoc(doc(db, 'artifacts', appId, 'projects', generateId()), {
      sequentialNumber: nextNum, title: formData.title, description: formData.description,
      authorId: profile.id, authorName: profile.discordUsername, status: 'proposto', votes: {}
    });
    setModalType('none'); setFormData({}); showToast("Projeto protocolado!");
  };

  const handleChangeProjectStatus = async (projectId: string, newStatus: RpgProject['status']) => {
    await updateDoc(doc(db, 'artifacts', appId, 'projects', projectId), { status: newStatus });
    showToast(`Status alterado para: ${newStatus}`);
  };

  const handleVote = async (projectId: string, vote: 'sim' | 'nao' | 'abstencao') => {
    if (!profile || profile.role !== 'deputado') return;
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    await updateDoc(doc(db, 'artifacts', appId, 'projects', projectId), { votes: { ...project.votes, [profile.id]: vote } });
    showToast("Voto computado!");
  };

  const handleAllocateBudget = async (stateId: string, pasta: keyof RpgData['allocatedBudget'], amount: number) => {
    const state = states.find(s => s.id === stateId);
    if (!state) return;
    const currentAllocated = state.allocatedBudget.saude + state.allocatedBudget.educacao + state.allocatedBudget.seguranca;
    if (currentAllocated - state.allocatedBudget[pasta] + amount > state.totalBudget) return showToast("Orçamento insuficiente!");
    await updateDoc(doc(db, 'artifacts', appId, 'states', stateId), { allocatedBudget: { ...state.allocatedBudget, [pasta]: amount } });
  };

  const handleInvest = async (stateId: string, pasta: keyof RpgData['stats']) => {
    const state = states.find(s => s.id === stateId);
    if (!state || state.allocatedBudget[pasta] < 100000) return showToast("Recursos insuficientes! Necessário 100k.");
    await updateDoc(doc(db, 'artifacts', appId, 'states', stateId), { 
      allocatedBudget: { ...state.allocatedBudget, [pasta]: state.allocatedBudget[pasta] - 100000 },
      stats: { ...state.stats, [pasta]: Math.min(100, state.stats[pasta] + 2) }
    });
    showToast(`Investimento realizado em ${pasta}!`);
  };

  const handleSaveDecision = async () => {
    if(!profile) return;
    await setDoc(doc(db, 'artifacts', appId, 'judiciary', generateId()), {
      authorName: profile.discordUsername, title: formData.title, content: formData.content, createdAt: serverTimestamp()
    });
    setModalType('none'); setFormData({}); showToast("Decisão publicada!");
  };

  const handleSaveEvent = async () => {
    await setDoc(doc(db, 'artifacts', appId, 'events', generateId()), {
      title: formData.title, description: formData.description, impact: formData.impact, createdAt: serverTimestamp()
    });
    setModalType('none'); setFormData({}); showToast("Evento lançado!");
  };

  // --- RENDER ---
  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Carregando...</div>;

  if (!profile && user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full border border-gray-700">
          <div className="flex justify-center mb-6"><Landmark className="w-16 h-16 text-indigo-500" /></div>
          <h2 className="text-2xl font-bold text-center text-white mb-6">Login Integrado</h2>
          <input type="text" placeholder="Discord Username (Ex: Jogador#1234)" value={loginName} onChange={e => setLoginName(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-white mb-4" />
          <button onClick={handleSimulatedLogin} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded flex items-center justify-center"><LogIn className="w-5 h-5 mr-2" /> Acessar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <nav className="w-full md:w-64 bg-gray-800 border-r border-gray-700 flex flex-col fixed bottom-0 md:relative z-20">
        <div className="hidden md:flex items-center justify-center h-16 border-b border-gray-700"><Landmark className="w-6 h-6 text-indigo-400 mr-2" /><h1 className="text-xl font-bold">República RPG</h1></div>
        {profile && (
          <div className="hidden md:block p-4 border-b border-gray-700 bg-gray-900/50">
            <p className="text-sm text-gray-400">Logado como:</p>
            <p className="font-bold text-indigo-300">{profile.discordUsername}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-700 text-xs rounded-full uppercase">{profile.role.replace('_', ' ')}</span>
          </div>
        )}
        <div className="flex md:flex-col overflow-x-auto p-2 gap-2 flex-1">
          <NavButton icon={Activity} label="Dados" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={FileText} label="Legislativo" active={activeTab === 'legislativo'} onClick={() => setActiveTab('legislativo')} />
          <NavButton icon={DollarSign} label="Executivo" active={activeTab === 'executivo'} onClick={() => setActiveTab('executivo')} />
          <NavButton icon={Scale} label="Judiciário" active={activeTab === 'judiciario'} onClick={() => setActiveTab('judiciario')} />
          <NavButton icon={Megaphone} label="Eventos" active={activeTab === 'eventos'} onClick={() => setActiveTab('eventos')} />
          {profile?.role === 'admin' && <NavButton icon={Settings} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0"><div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {states.map(state => (
              <div key={state.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold text-indigo-400 mb-4">{state.name}</h3>
                <div className="space-y-4">
                  <DataBar label="Saúde" value={state.stats.saude} icon={Activity} color="bg-green-500" />
                  <DataBar label="Educação" value={state.stats.educacao} icon={BookOpen} color="bg-blue-500" />
                  <DataBar label="Segurança" value={state.stats.seguranca} icon={Shield} color="bg-red-500" />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'legislativo' && (
          <div className="space-y-4">
            <button onClick={() => { setFormData({}); setModalType('newProject'); }} className="bg-indigo-600 px-4 py-2 rounded text-white flex items-center mb-4"><Plus className="w-4 h-4 mr-2" /> Protocolar</button>
            {projects.map(project => (
              <div key={project.id} className="bg-gray-800 p-5 border border-gray-700 rounded-lg flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-gray-400 uppercase">{project.status.replace('_', ' ')}</span>
                  <h3 className="text-xl font-bold text-white mb-2">PL {project.sequentialNumber} - {project.title}</h3>
                  <p className="text-sm text-gray-400">{project.description}</p>
                </div>
                <div className="flex flex-col gap-2 min-w-[200px]">
                  {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && project.status === 'proposto' && <button onClick={() => handleChangeProjectStatus(project.id, 'pauta')} className="bg-gray-700 py-2 rounded text-sm">Pautar</button>}
                  {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && project.status === 'pauta' && <button onClick={() => handleChangeProjectStatus(project.id, 'votacao')} className="bg-indigo-600 py-2 rounded text-sm">Abrir Votação</button>}
                  {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && project.status === 'votacao' && <button onClick={() => handleChangeProjectStatus(project.id, 'aprovado_congresso')} className="bg-green-600 py-2 rounded text-sm">Aprovar</button>}
                  
                  {profile?.role === 'deputado' && project.status === 'votacao' && (
                    <div className="flex gap-1"><button onClick={() => handleVote(project.id, 'sim')} className="flex-1 bg-green-600 py-2 rounded">S</button><button onClick={() => handleVote(project.id, 'nao')} className="flex-1 bg-red-600 py-2 rounded">N</button></div>
                  )}
                  
                  {(profile?.role === 'presidente_republica' || profile?.role === 'admin') && project.status === 'aprovado_congresso' && (
                    <><button onClick={() => handleChangeProjectStatus(project.id, 'sancionado')} className="bg-green-600 py-2 rounded text-sm">Sancionar</button><button onClick={() => handleChangeProjectStatus(project.id, 'vetado')} className="bg-red-600 py-2 rounded text-sm">Vetar</button></>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'executivo' && (
          <div className="space-y-6">
            {states.map(state => {
              const isExec = profile?.role === 'admin' || profile?.role === 'presidente_republica' || (profile?.role === 'governador' && profile?.jurisdictionId === state.id);
              const isMin = profile?.role === 'ministro' && (profile.jurisdictionId === state.id || profile.jurisdictionId === 'federal');
              return (
                <div key={state.id} className="bg-gray-800 p-6 border border-gray-700 rounded-xl mb-6">
                  <h3 className="text-2xl font-bold mb-4">{state.name} <span className="text-sm text-green-400 ml-4">Disponível: R$ {((state.totalBudget - state.allocatedBudget.saude - state.allocatedBudget.educacao - state.allocatedBudget.seguranca)/1000).toFixed(0)}k</span></h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(['saude', 'educacao', 'seguranca'] as const).map(pasta => (
                      <div key={pasta} className="bg-gray-900 p-4 border border-gray-700 rounded-lg">
                        <h4 className="capitalize font-bold">{pasta}</h4>
                        <p className="text-sm text-green-400 mb-2">Caixa: R$ {(state.allocatedBudget[pasta]/1000).toFixed(0)}k</p>
                        {isExec && <div className="flex gap-2 mb-2"><button onClick={() => handleAllocateBudget(state.id, pasta, state.allocatedBudget[pasta] + 100000)} className="bg-gray-700 p-1 flex-1 rounded">+</button><button onClick={() => handleAllocateBudget(state.id, pasta, Math.max(0, state.allocatedBudget[pasta] - 100000))} className="bg-gray-700 p-1 flex-1 rounded">-</button></div>}
                        {isMin && profile?.pastaId === pasta && <button onClick={() => handleInvest(state.id, pasta)} className="w-full bg-indigo-600 py-2 rounded text-sm mt-2">Investir 100k</button>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'judiciario' && (
          <div className="space-y-4">
             {(profile?.role === 'stf' || profile?.role === 'admin') && <button onClick={() => { setFormData({}); setModalType('newDecision'); }} className="bg-yellow-600 px-4 py-2 rounded text-white flex items-center mb-4">Emitir Sentença</button>}
             {decisions.map(dec => (
               <div key={dec.id} className="bg-gray-800 p-6 border-l-4 border-yellow-500 rounded-lg"><h3 className="font-bold">{dec.title}</h3><p className="text-gray-300 mt-2">{dec.content}</p><p className="text-sm text-yellow-500 mt-4 text-right">Min. {dec.authorName}</p></div>
             ))}
          </div>
        )}

        {activeTab === 'eventos' && (
          <div className="space-y-4">
             {profile?.role === 'admin' && <button onClick={() => { setFormData({}); setModalType('newEvent'); }} className="bg-red-600 px-4 py-2 rounded text-white flex items-center mb-4">Novo Evento</button>}
             {events.map(ev => (
               <div key={ev.id} className="bg-red-900/20 p-5 border border-red-900/50 rounded-lg"><h3 className="font-bold text-red-400">{ev.title}</h3><p className="text-sm mt-2">{ev.description}</p><span className="text-xs text-red-300 mt-2 block">Impacto: {ev.impact}</span></div>
             ))}
          </div>
        )}

        {activeTab === 'admin' && profile?.role === 'admin' && (
          <div className="space-y-6">
            <button onClick={() => {setFormData({}); setModalType('newState');}} className="bg-indigo-600 px-4 py-2 rounded text-white">Criar Estado</button>
            <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900 text-gray-400"><tr><th className="p-3">Jogador</th><th className="p-3">Cargo</th><th className="p-3">Jurisdição</th><th className="p-3">Pasta</th></tr></thead>
                <tbody>{usersList.map(u => (
                  <tr key={u.id} className="border-b border-gray-700">
                    <td className="p-3">{u.discordUsername}</td>
                    <td className="p-3"><select value={u.role} onChange={e => handleUpdateUserRole(u.id, e.target.value as Role, u.jurisdictionId, u.pastaId)} className="bg-gray-700 p-1 rounded w-full"><option value="espectador">Espectador</option><option value="deputado">Deputado</option><option value="presidente_congresso">Pres. Congresso</option><option value="presidente_republica">Pres. República</option><option value="governador">Governador</option><option value="ministro">Ministro</option><option value="stf">STF</option><option value="admin">Admin</option></select></td>
                    <td className="p-3"><select value={u.jurisdictionId || 'federal'} onChange={e => handleUpdateUserRole(u.id, u.role, e.target.value, u.pastaId)} className="bg-gray-700 p-1 rounded w-full"><option value="federal">Federal</option>{states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
                    <td className="p-3"><select value={u.pastaId || ''} onChange={e => handleUpdateUserRole(u.id, u.role, u.jurisdictionId, e.target.value)} className="bg-gray-700 p-1 rounded w-full"><option value="">Nenhuma</option><option value="saude">Saúde</option><option value="educacao">Educação</option><option value="seguranca">Segurança</option></select></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

      </div></main>

      {/* MODALS */}
      {modalType !== 'none' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-gray-600">
            {modalType === 'newState' && <><input placeholder="Nome Estado" onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-900 p-3 rounded mb-4" /><input type="number" placeholder="Orçamento (Ex: 1000000)" onChange={e => setFormData({...formData, budget: e.target.value})} className="w-full bg-gray-900 p-3 rounded mb-4" /><button onClick={handleSaveState} className="w-full bg-indigo-600 py-3 rounded">Salvar</button></>}
            {modalType === 'newProject' && <><input placeholder="Título PL" onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 p-3 rounded mb-4" /><textarea placeholder="Descrição" onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-900 p-3 rounded mb-4" /><button onClick={handleProtocolProject} className="w-full bg-indigo-600 py-3 rounded">Protocolar</button></>}
            {modalType === 'newDecision' && <><input placeholder="Ementa" onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 p-3 rounded mb-4" /><textarea placeholder="Decisão..." onChange={e => setFormData({...formData, content: e.target.value})} className="w-full bg-gray-900 p-3 rounded mb-4" /><button onClick={handleSaveDecision} className="w-full bg-yellow-600 py-3 rounded">Sentenciar</button></>}
            {modalType === 'newEvent' && <><input placeholder="Título Evento" onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 p-3 rounded mb-4" /><textarea placeholder="Descrição" onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-900 p-3 rounded mb-4" /><input placeholder="Impacto (-10 Saúde)" onChange={e => setFormData({...formData, impact: e.target.value})} className="w-full bg-gray-900 p-3 rounded mb-4" /><button onClick={handleSaveEvent} className="w-full bg-red-600 py-3 rounded">Lançar Evento</button></>}
            <button onClick={() => setModalType('none')} className="w-full text-gray-400 py-3 mt-2">Cancelar</button>
          </div>
        </div>
      )}
      
      {toastMessage && <div className="fixed bottom-10 right-10 bg-indigo-600 px-6 py-3 rounded-lg z-50 animate-bounce">{toastMessage}</div>}
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: React.ElementType, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex md:flex-row flex-col items-center p-3 rounded-lg flex-1 md:flex-none ${active ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
      <Icon className="w-5 h-5 md:mr-3 mb-1 md:mb-0" /><span className="text-sm font-medium hidden sm:inline-block">{label}</span>
    </button>
  );
}

function DataBar({ label, value, icon: Icon, color }: { label: string, value: number, icon: React.ElementType, color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1"><span className="flex items-center text-gray-300"><Icon className="w-4 h-4 mr-2" /> {label}</span><span className="font-bold">{value}/100</span></div>
      <div className="w-full h-3 bg-gray-900 rounded-full"><div style={{ width: `${Math.min(100, Math.max(0, value))}%` }} className={`h-full ${color}`}></div></div>
    </div>
  );
}