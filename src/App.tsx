import React, { useState, useEffect } from 'react';
import { Landmark, FileText, DollarSign, Scale, Settings, LogOut, Activity, Clock } from 'lucide-react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

import { auth, db, APP_ID } from './config/firebase';
import { 
  UserProfile, RpgData, RpgProject, StfDecision, LoaArticle, 
  DocTemplate, RpgDecree, ProjectArticle, TAXONOMY, GameTime, 
  GameEffect, ProjectAmendment, DecreeAction 
} from './types';
import { NavButton } from './components/UI';

import { DashboardView } from './pages/Dashboard';
import { LegislativoView } from './pages/Legislativo';
import { ExecutivoView } from './pages/Executivo';
import { JudiciarioView } from './pages/Judiciario';
import { AdminView } from './pages/Admin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [states, setStates] = useState<RpgData[]>([]);
  const [projects, setProjects] = useState<RpgProject[]>([]);
  const [decrees, setDecrees] = useState<RpgDecree[]>([]);
  const [decisions, setDecisions] = useState<StfDecision[]>([]);
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  
  const [gameTime, setGameTime] = useState<GameTime>({ month: 1, year: 2026 });
  const [activeEffects, setActiveEffects] = useState<GameEffect[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');
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
    const unsubDecisions = onSnapshot(collection(db, 'artifacts', APP_ID, 'judiciary'), snap => setDecisions(snap.docs.map(d => ({ id: d.id, ...d.data() } as StfDecision)).sort((a:any, b:any) => b.createdAt - a.createdAt)));
    const unsubTemplates = onSnapshot(collection(db, 'artifacts', APP_ID, 'templates'), snap => setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocTemplate))));
    const unsubTime = onSnapshot(doc(db, 'artifacts', APP_ID, 'system', 'time'), doc => { if(doc.exists()) setGameTime(doc.data() as GameTime); });
    const unsubEffects = onSnapshot(collection(db, 'artifacts', APP_ID, 'effects'), snap => setActiveEffects(snap.docs.map(d => ({ id: d.id, ...d.data() } as GameEffect))));

    return () => { unsubUsers(); unsubStates(); unsubProjects(); unsubDecrees(); unsubDecisions(); unsubTemplates(); unsubTime(); unsubEffects(); };
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
        if(usersList.length === 0) await setDoc(doc(db, 'artifacts', APP_ID, 'system', 'time'), { month: 1, year: 2026 });
      }
      showToast("Acesso Liberado!");
    } catch (err: any) { showToast("Erro na Autenticação."); }
  };

  const gameActions = {
    protocolProject: async (formData: any, artigos: ProjectArticle[], loaArtigos: LoaArticle[]) => {
      if(!profile) return;
      const nextNum = projects.length > 0 ? Math.max(...projects.map(p => p.sequentialNumber)) + 1 : 1;
      const template = templates.find(t => t.id === formData.templateId);
      const newProject: any = {
        sequentialNumber: nextNum, title: formData.title, category: formData.category,
        templateName: template?.name || 'Projeto', templateAbbreviation: template?.abbreviation || 'PROJ',
        artigos: artigos.filter(a => (a.text || '').trim() !== ''),
        justificativa: formData.justificativa || '', intendedMacro: formData.intendedMacro || '', apurado: false,
        authorId: profile.id, authorName: profile.discordUsername, status: 'proposto', votes: {}, createdAt: serverTimestamp(),
        amendments: []
      };
      if (formData.category === 'loa') newProject.loaDetails = { stateId: profile.jurisdictionId || 'federal', artigos: loaArtigos.filter(a => a.pastaName) };
      await setDoc(doc(db, 'artifacts', APP_ID, 'projects', generateId()), newProject);
      showToast("Documento Protocolado!");
    },
    
    vote: async (id: string, vote: string) => {
      if (!profile) return;
      const p = projects.find(x => x.id === id);
      if (p) await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', id), { votes: { ...p.votes, [profile.id]: vote } });
    },
    
    encerrarVotacao: async (projectId: string, isVetoVote: boolean = false) => {
      const p = projects.find(x => x.id === projectId);
      if (!p) return;
      const sim = Object.values(p.votes).filter(v => v === 'sim').length;
      const nao = Object.values(p.votes).filter(v => v === 'nao').length;
      const newStatus = isVetoVote ? (sim > nao ? 'promulgado' : 'arquivo') : (sim > nao ? 'sancao' : 'arquivo');
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: newStatus, votes: {} });
      showToast("Votação Encerrada!");
    },

    changeStatus: async (projectId: string, newStatus: string) => {
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: newStatus });
    },

    proporEmenda: async (projectId: string, text: string) => {
      if(!profile) return;
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const newAmendment: ProjectAmendment = {
        id: Math.random().toString(36).substr(2, 9),
        authorName: profile.discordUsername, text, status: 'proposta', votes: {}
      };
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { amendments: [...(p.amendments || []), newAmendment] });
      showToast("Emenda Protocolada!");
    },

    decidirEmenda: async (projectId: string, amendaId: string, approved: boolean) => {
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const updated = p.amendments.map(am => {
        if(am.id === amendaId) return { ...am, status: approved ? 'aprovada' : 'rejeitada' as any };
        return am;
      });
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { amendments: updated });
    },

    publishDecreto: async (data: any, actionsList: DecreeAction[]) => {
      if (!profile) return;
      
      const targetStateId = data.stateId || profile.jurisdictionId || 'federal';

      for (const act of actionsList) {
        if (act.type === 'nomeacao') {
          await updateDoc(doc(db, 'artifacts', APP_ID, 'users', act.userId), { 
            role: 'ministro', 
            jurisdictionId: targetStateId,
            pastaId: act.pastaName 
          });
        } else if (act.type === 'exoneracao') {
          await updateDoc(doc(db, 'artifacts', APP_ID, 'users', act.userId), { 
            role: 'espectador', 
            pastaId: null 
          });
        }
      }
      
      const nextNum = decrees.length > 0 ? Math.max(...decrees.map(d => d.sequentialNumber)) + 1 : 1;
      await setDoc(doc(db, 'artifacts', APP_ID, 'decrees', generateId()), {
        sequentialNumber: nextNum,
        title: data.title || "Decreto Executivo",
        content: data.content || "",
        actions: actionsList || [],
        justificativa: data.justificativa || '',
        intendedMacro: data.intendedMacro || '',
        apurado: false,
        authorName: profile.discordUsername,
        jurisdictionId: targetStateId,
        createdAt: serverTimestamp()
      });
      showToast(`Decreto nº ${nextNum} publicado com sucesso!`);
    },

    analisarSancao: async (projectId: string, artigosVetadosIds: number[]) => {
      const p = projects.find(x => x.id === projectId);
      if (!p) return;
      const hasAnyVeto = artigosVetadosIds.length > 0;
      const novosArtigos = p.artigos.map(art => ({ ...art, isVetoed: artigosVetadosIds.includes(art.id) }));
      let finalStatus = hasAnyVeto ? 'vetado' : 'sancionado';

      if (finalStatus === 'sancionado' && p.category === 'loa' && p.loaDetails) {
        const targetState = states.find(s => s.id === p.loaDetails!.stateId);
        if (targetState) {
          const updatedBudget = { ...(targetState.allocatedBudget || {}) };
          p.loaDetails.artigos.forEach(art => {
            const amount = (targetState.macro.caixa * art.percentage) / 100;
            updatedBudget[art.pastaName] = (updatedBudget[art.pastaName] || 0) + amount;
          });
          await updateDoc(doc(db, 'artifacts', APP_ID, 'states', targetState.id), { allocatedBudget: updatedBudget });
        }
      }
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: finalStatus, artigos: novosArtigos });
      showToast(hasAnyVeto ? "Veto aplicado!" : "Sancionado!");
    },
    
    invest: async (stateId: string, pastaName: string, amount: number) => {
      if (!amount || amount <= 0) return showToast("Valor inválido.");
      const state = states.find(s => s.id === stateId);
      const currentBudget = state?.allocatedBudget?.[pastaName] || 0;
      if (!state || currentBudget < amount) return showToast("Verba Insuficiente.");
      const newBudget = { ...state.allocatedBudget, [pastaName]: currentBudget - amount };
      const newIndicators = JSON.parse(JSON.stringify(state.indicators));
      const totalPoints = Math.floor(amount / 100000) * 2;
      const micros = Object.keys(newIndicators[pastaName] || {});
      if (micros.length > 0 && totalPoints > 0) {
        const pointsPerMicro = Math.max(1, Math.floor(totalPoints / micros.length));
        micros.forEach(micro => { newIndicators[pastaName][micro] = Math.min(100, (newIndicators[pastaName][micro] || 50) + pointsPerMicro); });
      }
      await updateDoc(doc(db, 'artifacts', APP_ID, 'states', stateId), { allocatedBudget: newBudget, indicators: newIndicators });
      showToast(`Investimento efetuado!`);
    },

    diplomar: async (listaDiplomados: any[]) => {
      if(!listaDiplomados || listaDiplomados.length === 0) return showToast("Lista vazia!");
      let content = "Justiça Eleitoral - Diplomação Oficial:\n\n";
      for (let i = 0; i < listaDiplomados.length; i++) {
        const item = listaDiplomados[i];
        const electedUser = usersList.find(u => u.id === item.userId);
        const targetState = states.find(s => s.id === item.jurisdictionId);
        await updateDoc(doc(db, 'artifacts', APP_ID, 'users', item.userId), { role: item.role, jurisdictionId: item.jurisdictionId, pastaId: null });
        content += `Art. ${i + 1}º - ${electedUser?.discordUsername} assume como ${item.role.toUpperCase()} em ${targetState?.name}.\n`;
      }
      await setDoc(doc(db, 'artifacts', APP_ID, 'judiciary', generateId()), { authorName: 'TSE', title: `DIPLOMAÇÃO GERAL`, content, createdAt: serverTimestamp() });
      showToast("Eleitos Diplomados!");
    },

    advanceTime: async () => {
      let nextMonth = gameTime.month + 1;
      let nextYear = gameTime.year;
      if (nextMonth > 12) { nextMonth = 1; nextYear++; }
      const updatedStates = JSON.parse(JSON.stringify(states));
      for (const effect of activeEffects) {
        if (effect.remainingMonths > 0) {
           const targetState = updatedStates.find((s:any) => s.id === effect.stateId);
           if (targetState && targetState.indicators && targetState.indicators[effect.macro]) {
             const currentVal = targetState.indicators[effect.macro][effect.micro] || 50;
             targetState.indicators[effect.macro][effect.micro] = Math.max(0, Math.min(100, currentVal + effect.pointsPerMonth));
           }
           const newRemaining = effect.remainingMonths - 1;
           if (newRemaining <= 0) await deleteDoc(doc(db, 'artifacts', APP_ID, 'effects', effect.id));
           else await updateDoc(doc(db, 'artifacts', APP_ID, 'effects', effect.id), { remainingMonths: newRemaining });
        }
      }
      for (const s of updatedStates) { if (s.indicators !== undefined) await updateDoc(doc(db, 'artifacts', APP_ID, 'states', s.id), { indicators: s.indicators }); }
      await updateDoc(doc(db, 'artifacts', APP_ID, 'system', 'time'), { month: nextMonth, year: nextYear });
      showToast(`Mês ${nextMonth}/${nextYear}!`);
    },

    emitirSentenca: async (data: {title: string, content: string}) => {
      if(!profile) return;
      await setDoc(doc(db, 'artifacts', APP_ID, 'judiciary', generateId()), { authorName: profile.discordUsername, title: data.title, content: data.content, createdAt: serverTimestamp() });
    },
    updateUser: async (userId: string, newRole: string, newJurisdiction: string, newPasta: string) => { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', userId), { role: newRole, jurisdictionId: newJurisdiction || 'federal', pastaId: newPasta || null }); },
    createState: async (data: any) => {
      if(!data.name) return;
      const initialIndicators: any = {};
      Object.entries(TAXONOMY).forEach(([macro, micros]) => { initialIndicators[macro] = {}; micros.forEach(m => initialIndicators[macro][m] = 50); });
      await setDoc(doc(db, 'artifacts', APP_ID, 'states', generateId()), { 
        name: data.name, type: data.type || 'estadual', 
        macro: { populacao: Number(data.populacao)||0, pib: Number(data.pib)||0, aprovacao: 50, caixa: Number(data.budget)||1000000 },
        indicators: initialIndicators, allocatedBudget: {} 
      });
    },
    saveTemplate: async (data: any) => { await setDoc(doc(db, 'artifacts', APP_ID, 'templates', data.id || generateId()), data); },
    deleteTemplate: async (id: string) => { await deleteDoc(doc(db, 'artifacts', APP_ID, 'templates', id)); },
    apurarDocumento: async (col: 'projects'|'decrees', docId: string, effectData: any) => {
      if(effectData.pointsPerMonth !== 0) await setDoc(doc(db, 'artifacts', APP_ID, 'effects', generateId()), { ...effectData, isPositive: effectData.pointsPerMonth > 0 });
      await updateDoc(doc(db, 'artifacts', APP_ID, col, docId), { apurado: true });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Carregando Nosso Governo...</div>;
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 px-4">
        <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-6"><Landmark className="w-16 h-16 text-indigo-500" /></div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">Acesso Restrito</h2>
          <p className="text-gray-400 text-sm mb-6">Nosso Governo Virtual</p>
          <div className="flex mb-6 border-b border-gray-700">
            <button onClick={() => setIsLoginMode(true)} className={`flex-1 pb-2 font-bold ${isLoginMode ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}>Entrar</button>
            <button onClick={() => setIsLoginMode(false)} className={`flex-1 pb-2 font-bold ${!isLoginMode ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}>Criar Conta</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="text" placeholder="Seu ID Discord" value={discordName} onChange={e => setDiscordName(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded outline-none focus:border-indigo-500" required/>
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded outline-none focus:border-indigo-500" required/>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded mt-2 hover:bg-indigo-500 transition">{isLoginMode ? "Acessar" : "Registrar"}</button>
          </form>
        </div>
      </div>
    );
  }

  const monthNames = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <nav className="w-full md:w-64 bg-gray-800 border-r border-gray-700 flex flex-col fixed bottom-0 md:relative z-20">
        <div className="hidden md:flex flex-col items-center justify-center py-4 border-b border-gray-700">
           <div className="flex items-center text-center"><Landmark className="w-6 h-6 text-indigo-400 mr-2" /><h1 className="text-lg font-bold">Nosso Governo<br/>Virtual</h1></div>
           <div className="mt-3 bg-gray-900 border border-gray-700 px-4 py-1.5 rounded-full flex items-center shadow-inner">
             <Clock className="w-4 h-4 text-emerald-400 mr-2"/>
             <span className="font-mono font-bold text-sm text-emerald-100">{monthNames[gameTime.month]} / {gameTime.year}</span>
           </div>
        </div>

        {profile && (
          <div className="hidden md:block p-4 border-b border-gray-700 bg-gray-900/50">
            <p className="text-sm text-gray-400">Logado como:</p>
            <p className="font-bold text-indigo-300">{profile.discordUsername}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-700 text-xs rounded-full uppercase border border-gray-600">{profile.role.replace('_', ' ')}</span>
          </div>
        )}
        <div className="flex md:flex-col overflow-x-auto p-2 gap-2 flex-1">
          <NavButton icon={Activity} label="Dados & Nação" active={activeTab === 'dados'} onClick={() => setActiveTab('dados')} />
          <NavButton icon={FileText} label="Congresso" active={activeTab === 'legislativo'} onClick={() => setActiveTab('legislativo')} />
          <NavButton icon={DollarSign} label="Governo Exec." active={activeTab === 'executivo'} onClick={() => setActiveTab('executivo')} />
          <NavButton icon={Scale} label="Justiça / TSE" active={activeTab === 'judiciario'} onClick={() => setActiveTab('judiciario')} />
          {profile?.role === 'admin' && <NavButton icon={Settings} label="Mestre (Admin)" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />}
        </div>
        <div className="hidden md:block p-4 border-t border-gray-700">
          <button onClick={() => signOut(auth)} className="flex items-center text-red-400 hover:bg-gray-700 w-full p-2 rounded transition"><LogOut className="w-5 h-5 mr-3"/> Sair</button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0"><div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
        {activeTab === 'dados' && <DashboardView states={states} usersList={usersList} />}
        {activeTab === 'legislativo' && <LegislativoView profile={profile} projects={projects} states={states} templates={templates} actions={gameActions} />}
        {activeTab === 'executivo' && <ExecutivoView profile={profile} states={states} usersList={usersList} decrees={decrees} templates={templates} projects={projects} actions={gameActions} />}
        {activeTab === 'judiciario' && <JudiciarioView profile={profile} decisions={decisions} states={states} usersList={usersList} templates={templates} actions={gameActions} />}
        {activeTab === 'admin' && profile?.role === 'admin' && <AdminView profile={profile} usersList={usersList} states={states} templates={templates} projects={projects} decrees={decrees} gameTime={gameTime} activeEffects={activeEffects} actions={gameActions} />}
      </div></main>
      
      {toastMessage && <div className="fixed bottom-24 md:bottom-10 right-4 md:right-10 bg-indigo-600 px-6 py-4 rounded-lg shadow-2xl z-50 font-bold border border-indigo-400">{toastMessage}</div>}
    </div>
  );
}
