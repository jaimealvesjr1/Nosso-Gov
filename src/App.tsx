import React, { useState, useEffect } from 'react';
import { Landmark, FileText, DollarSign, Scale, Megaphone, Settings, LogOut } from 'lucide-react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

import { app, auth, db, APP_ID } from './config/firebase';
import { UserProfile, RpgData, RpgProject, RpgEvent, StfDecision, LoaArticle, DocTemplate, RpgDecree } from './types';
import { LegislativoView, ExecutivoView, JudiciarioView, AdminView, NavButton } from './pages/Views';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [states, setStates] = useState<RpgData[]>([]);
  const [projects, setProjects] = useState<RpgProject[]>([]);
  const [decrees, setDecrees] = useState<RpgDecree[]>([]);
  const [events, setEvents] = useState<RpgEvent[]>([]);
  const [decisions, setDecisions] = useState<StfDecision[]>([]);
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('legislativo');
  const [toastMessage, setToastMessage] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [discordName, setDiscordName] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, u => { setUser(u); if (!u) setLoading(false); });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'artifacts', APP_ID, 'users'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      setUsersList(data);
      if (user) setProfile(data.find(p => p.id === user.uid) || null);
      setLoading(false);
    });
    if (!user) return () => unsubUsers();

    const unsubStates = onSnapshot(collection(db, 'artifacts', APP_ID, 'states'), snap => setStates(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgData))));
    const unsubProjects = onSnapshot(collection(db, 'artifacts', APP_ID, 'projects'), snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgProject)).sort((a,b) => b.sequentialNumber - a.sequentialNumber)));
    const unsubDecrees = onSnapshot(collection(db, 'artifacts', APP_ID, 'decrees'), snap => setDecrees(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgDecree)).sort((a,b) => b.sequentialNumber - a.sequentialNumber)));
    const unsubEvents = onSnapshot(collection(db, 'artifacts', APP_ID, 'events'), snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgEvent))));
    const unsubDecisions = onSnapshot(collection(db, 'artifacts', APP_ID, 'judiciary'), snap => setDecisions(snap.docs.map(d => ({ id: d.id, ...d.data() } as StfDecision)).sort((a:any, b:any) => b.createdAt - a.createdAt)));
    const unsubTemplates = onSnapshot(collection(db, 'artifacts', APP_ID, 'templates'), snap => setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocTemplate))));

    return () => { unsubUsers(); unsubStates(); unsubProjects(); unsubDecrees(); unsubEvents(); unsubDecisions(); unsubTemplates(); };
  }, [user]);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 4000); };
  const generateId = () => Math.random().toString(36).substr(2, 9);
  const generateSystemEmail = (discordId: string) => `${discordId.toLowerCase().replace(/[^a-z0-9]/g, '')}@rpg.local`;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordName || !password) return showToast("Preencha Discord e senha!");
    const fakeEmail = generateSystemEmail(discordName);
    try {
      if (isLoginMode) await signInWithEmailAndPassword(auth, fakeEmail, password);
      else {
        if (password.length < 6) return showToast("Mínimo 6 caracteres.");
        if (usersList.some(u => u.discordUsername.toLowerCase() === discordName.toLowerCase())) return showToast("Discord já registrado!");
        const cred = await createUserWithEmailAndPassword(auth, fakeEmail, password);
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', cred.user.uid), { id: cred.user.uid, discordUsername: discordName, role: usersList.length === 0 ? 'admin' : 'espectador', jurisdictionId: 'federal' });
      }
      showToast("Acesso Liberado!");
    } catch (err: any) { showToast("Erro na Autenticação."); }
  };

  const gameActions = {
    // LEGISLATIVO
    protocolProject: async (formData: any, loaArtigos: LoaArticle[]) => {
      if(!profile) return;
      const nextNum = projects.length > 0 ? Math.max(...projects.map(p => p.sequentialNumber)) + 1 : 1;
      const template = templates.find(t => t.id === formData.templateId);
      
      const newProject: any = {
        sequentialNumber: nextNum, title: formData.title, description: formData.description,
        category: formData.category, templateName: template?.name || 'Projeto', templateAbbreviation: template?.abbreviation || 'PROJ',
        authorId: profile.id, authorName: profile.discordUsername, status: 'proposto', votes: {}, createdAt: serverTimestamp()
      };
      
      if (formData.category === 'loa') newProject.loaDetails = { stateId: profile.jurisdictionId || 'federal', artigos: loaArtigos.filter(a => a.pastaName) };
      await setDoc(doc(db, 'artifacts', APP_ID, 'projects', generateId()), newProject);
      showToast("Documento Protocolado na Mesa!");
    },
    vote: async (id: string, vote: string) => {
      if (!profile) return;
      const p = projects.find(x => x.id === id);
      if (p) await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', id), { votes: { ...p.votes, [profile.id]: vote } });
    },
    changeStatus: async (projectId: string, newStatus: string) => {
      const p = projects.find(x => x.id === projectId);
      if (!p) return;
      
      if (newStatus === 'sancionado' && p.category === 'loa' && p.loaDetails) {
        const targetState = states.find(s => s.id === p.loaDetails!.stateId);
        if (targetState) {
          const updatedPastas = { ...(targetState.dynamicPastas || {}) };
          p.loaDetails.artigos.forEach(art => {
            const amount = (targetState.totalBudget * art.percentage) / 100;
            if (updatedPastas[art.pastaName]) updatedPastas[art.pastaName].orcamento += amount;
            else updatedPastas[art.pastaName] = { orcamento: amount, dados: 50 };
          });
          await updateDoc(doc(db, 'artifacts', APP_ID, 'states', targetState.id), { dynamicPastas: updatedPastas });
          showToast("LOA Sancionada! O Orçamento foi injetado.");
        }
      } else { showToast(`Status alterado para: ${newStatus}`); }
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: newStatus });
    },

    // EXECUTIVO
    publishDecreto: async (data: {targetUserId: string, stateId: string, pastaName: string, title: string, content: string}) => {
      if (!profile) return;
      
      // Se for uma nomeação real (não apenas um decreto de texto)
      if (data.targetUserId && data.pastaName) {
        await updateDoc(doc(db, 'artifacts', APP_ID, 'users', data.targetUserId), { role: 'ministro', jurisdictionId: data.stateId, pastaId: data.pastaName });
      }
      
      // Salva o Decreto Oficialmente
      const nextNum = decrees.length > 0 ? Math.max(...decrees.map(d => d.sequentialNumber)) + 1 : 1;
      await setDoc(doc(db, 'artifacts', APP_ID, 'decrees', generateId()), {
        sequentialNumber: nextNum, title: data.title, content: data.content,
        authorName: profile.discordUsername, jurisdictionId: data.stateId, createdAt: serverTimestamp()
      });
      showToast(`Decreto Publicado no Diário Oficial!`);
    },
    invest: async (stateId: string, pastaName: string) => {
      const state = states.find(s => s.id === stateId);
      if (!state || !state.dynamicPastas[pastaName] || state.dynamicPastas[pastaName].orcamento < 100000) return showToast("Verba Insuficiente.");
      const novasPastas = { ...state.dynamicPastas };
      novasPastas[pastaName].orcamento -= 100000;
      novasPastas[pastaName].dados = Math.min(100, novasPastas[pastaName].dados + 2);
      await updateDoc(doc(db, 'artifacts', APP_ID, 'states', stateId), { dynamicPastas: novasPastas });
      showToast("Investimento efetuado.");
    },

    // JUDICIÁRIO & TSE
    diplomar: async (data: {userId: string, role: string, jurisdictionId: string}) => {
      if(!data.userId) return;
      const electedUser = usersList.find(u => u.id === data.userId);
      const targetState = states.find(s => s.id === data.jurisdictionId);
      const userName = electedUser ? electedUser.discordUsername : 'Cidadão';
      const stateName = targetState ? targetState.name : 'União Federal';
      const roleFormatted = data.role.replace('_', ' ').toUpperCase();

      await updateDoc(doc(db, 'artifacts', APP_ID, 'users', data.userId), { role: data.role, jurisdictionId: data.jurisdictionId, pastaId: null });
      await setDoc(doc(db, 'artifacts', APP_ID, 'judiciary', generateId()), {
        authorName: 'TSE', title: `DIPLOMAÇÃO OFICIAL - ${roleFormatted}`,
        content: `A Justiça Eleitoral certifica que ${userName} foi legitimamente diplomado(a) para o cargo de ${roleFormatted} sob a jurisdição de ${stateName}.`,
        createdAt: serverTimestamp()
      });
      showToast("Diplomação Oficial do TSE concluída!");
    },
    emitirSentenca: async (data: {title: string, content: string}) => {
      if(!profile) return;
      await setDoc(doc(db, 'artifacts', APP_ID, 'judiciary', generateId()), {
        authorName: profile.discordUsername, title: data.title, content: data.content, createdAt: serverTimestamp()
      });
      showToast("Sentença/Súmula Publicada!");
    },

    // ADMIN (Eventos, Usuários e TEMPLATES)
    createEvent: async (data: any) => {
      await setDoc(doc(db, 'artifacts', APP_ID, 'events', generateId()), { ...data, createdAt: serverTimestamp() });
      showToast("Evento global lançado!");
    },
    updateUser: async (userId: string, newRole: string, newJurisdiction: string, newPasta: string) => {
      await updateDoc(doc(db, 'artifacts', APP_ID, 'users', userId), { role: newRole, jurisdictionId: newJurisdiction || 'federal', pastaId: newPasta || null });
      showToast("Jogador atualizado!");
    },
    createState: async (data: any) => {
      if(!data.name) return;
      await setDoc(doc(db, 'artifacts', APP_ID, 'states', generateId()), { name: data.name, type: data.type || 'estadual', totalBudget: Number(data.budget) || 1000000, dynamicPastas: {} });
      showToast("Entidade criada!");
    },
    saveTemplate: async (data: any) => {
      if(!data.name || !data.abbreviation) return;
      await setDoc(doc(db, 'artifacts', APP_ID, 'templates', data.id || generateId()), data);
      showToast("Modelo de Documento Salvo!");
    },
    deleteTemplate: async (id: string) => {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'templates', id));
      showToast("Modelo removido.");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Carregando República...</div>;

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 px-4">
        <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full border border-gray-700 shadow-2xl">
          <div className="flex justify-center mb-6"><Landmark className="w-16 h-16 text-indigo-500" /></div>
          <h2 className="text-2xl font-bold text-center text-white mb-6">Acesso Restrito</h2>
          <div className="flex mb-6 border-b border-gray-700">
            <button onClick={() => setIsLoginMode(true)} className={`flex-1 pb-2 font-bold ${isLoginMode ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}>Entrar</button>
            <button onClick={() => setIsLoginMode(false)} className={`flex-1 pb-2 font-bold ${!isLoginMode ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}>Criar Conta</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="text" placeholder="Seu ID Discord (Ex: Jogador#1234)" value={discordName} onChange={e => setDiscordName(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded" required/>
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded" required/>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded mt-2">{isLoginMode ? "Acessar" : "Registrar"}</button>
          </form>
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
          <NavButton icon={FileText} label="Congresso" active={activeTab === 'legislativo'} onClick={() => setActiveTab('legislativo')} />
          <NavButton icon={DollarSign} label="Governo" active={activeTab === 'executivo'} onClick={() => setActiveTab('executivo')} />
          <NavButton icon={Scale} label="Justiça / TSE" active={activeTab === 'judiciario'} onClick={() => setActiveTab('judiciario')} />
          {profile?.role === 'admin' && <NavButton icon={Settings} label="Mestre (Admin)" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
        </div>
        <div className="hidden md:block p-4 border-t border-gray-700">
          <button onClick={() => signOut(auth)} className="flex items-center text-red-400 hover:bg-gray-700 w-full p-2 rounded"><LogOut className="w-5 h-5 mr-3"/> Sair</button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0"><div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        {activeTab === 'legislativo' && <LegislativoView profile={profile} projects={projects} states={states} templates={templates} actions={gameActions} />}
        {activeTab === 'executivo' && <ExecutivoView profile={profile} states={states} usersList={usersList} decrees={decrees} templates={templates} actions={gameActions} />}
        {activeTab === 'judiciario' && <JudiciarioView profile={profile} decisions={decisions} states={states} usersList={usersList} templates={templates} actions={gameActions} />}
        {activeTab === 'admin' && profile?.role === 'admin' && <AdminView profile={profile} usersList={usersList} states={states} events={events} templates={templates} actions={gameActions} />}
      </div></main>
      
      {toastMessage && <div className="fixed bottom-24 md:bottom-10 right-4 md:right-10 bg-indigo-600 px-6 py-4 rounded-lg shadow-2xl z-50 font-bold border border-indigo-400">{toastMessage}</div>}
    </div>
  );
}
