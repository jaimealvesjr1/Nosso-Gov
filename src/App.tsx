import React, { useState, useEffect } from 'react';
import { Landmark, FileText, DollarSign, Scale, Settings, LogOut, Activity, Clock } from 'lucide-react';
import { onAuthStateChanged, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

import { app, auth, db, APP_ID } from './config/firebase';
import { UserProfile, RpgData, RpgProject, RpgEvent, StfDecision, LoaArticle, DocTemplate, RpgDecree, ProjectArticle, TAXONOMY, GameTime, GameEffect } from './types';
import { LegislativoView, ExecutivoView, JudiciarioView, AdminView, DashboardView, NavButton } from './pages/Views';

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
  
  // Novos Estados do Motor de Jogo
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
    const unsubEvents = onSnapshot(collection(db, 'artifacts', APP_ID, 'events'), snap => setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgEvent))));
    const unsubDecisions = onSnapshot(collection(db, 'artifacts', APP_ID, 'judiciary'), snap => setDecisions(snap.docs.map(d => ({ id: d.id, ...d.data() } as StfDecision)).sort((a:any, b:any) => b.createdAt - a.createdAt)));
    const unsubTemplates = onSnapshot(collection(db, 'artifacts', APP_ID, 'templates'), snap => setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocTemplate))));
    
    // Listeners do Sistema de Tempo e Efeitos
    const unsubTime = onSnapshot(doc(db, 'artifacts', APP_ID, 'system', 'time'), doc => { if(doc.exists()) setGameTime(doc.data() as GameTime); });
    const unsubEffects = onSnapshot(collection(db, 'artifacts', APP_ID, 'effects'), snap => setActiveEffects(snap.docs.map(d => ({ id: d.id, ...d.data() } as GameEffect))));

    return () => { unsubUsers(); unsubStates(); unsubProjects(); unsubDecrees(); unsubEvents(); unsubDecisions(); unsubTemplates(); unsubTime(); unsubEffects(); };
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
        // Inicializa o tempo se for o primeiro user
        if(usersList.length === 0) await setDoc(doc(db, 'artifacts', APP_ID, 'system', 'time'), { month: 1, year: 2026 });
      }
      showToast("Acesso Liberado!");
    } catch (err: any) { showToast("Erro na Autenticação."); }
  };

  const gameActions = {
    // ---------------- LEGISLATIVO ----------------
    protocolProject: async (formData: any, artigos: ProjectArticle[], loaArtigos: LoaArticle[]) => {
      if(!profile) return;
      const nextNum = projects.length > 0 ? Math.max(...projects.map(p => p.sequentialNumber)) + 1 : 1;
      const template = templates.find(t => t.id === formData.templateId);
      
      const newProject: any = {
        sequentialNumber: nextNum, title: formData.title, category: formData.category,
        templateName: template?.name || 'Projeto', templateAbbreviation: template?.abbreviation || 'PROJ',
        artigos: artigos.filter(a => a.text.trim() !== ''),
        justificativa: formData.justificativa || '', intendedMacro: formData.intendedMacro || '', apurado: false,
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
    
    encerrarVotacao: async (projectId: string, isVetoVote: boolean = false) => {
      const p = projects.find(x => x.id === projectId);
      if (!p) return;
      const sim = Object.values(p.votes).filter(v => v === 'sim').length;
      const nao = Object.values(p.votes).filter(v => v === 'nao').length;
      
      if (isVetoVote) {
        const newStatus = sim > nao ? 'promulgado' : 'arquivo';
        await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: newStatus, votes: {} });
        showToast(sim > nao ? "Veto Derrubado! Promulgado." : "Veto Mantido! Arquivado.");
      } else {
        const newStatus = sim > nao ? 'sancao' : 'arquivo';
        await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: newStatus, votes: {} });
        showToast(sim > nao ? "Projeto Aprovado! Enviado para Sanção." : "Projeto Rejeitado e Arquivado.");
      }
    },

    changeStatus: async (projectId: string, newStatus: string) => {
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: newStatus });
      showToast(`Status alterado para: ${newStatus.toUpperCase()}`);
    },

    // ---------------- EXECUTIVO ----------------
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
      showToast(hasAnyVeto ? "Veto aplicado! Devolvido ao Congresso." : "Projeto Sancionado!");
    },

    publishDecreto: async (data: any) => {
      if (!profile) return;
      if (data.targetUserId && data.pastaName) await updateDoc(doc(db, 'artifacts', APP_ID, 'users', data.targetUserId), { role: 'ministro', jurisdictionId: data.stateId, pastaId: data.pastaName });
      
      const nextNum = decrees.length > 0 ? Math.max(...decrees.map(d => d.sequentialNumber)) + 1 : 1;
      await setDoc(doc(db, 'artifacts', APP_ID, 'decrees', generateId()), {
        sequentialNumber: nextNum, title: data.title, content: data.content,
        justificativa: data.justificativa || '', intendedMacro: data.intendedMacro || '', apurado: false,
        authorName: profile.discordUsername, jurisdictionId: data.stateId, createdAt: serverTimestamp()
      });
      showToast(`Documento Publicado no Diário Oficial!`);
    },
    
    // ---------------- ADMIN & APURAÇÃO & MOTOR DE TEMPO ----------------
    createState: async (data: any) => {
      if(!data.name) return;
      
      // Cria a matriz inicial de indicadores em 50 para tudo
      const initialIndicators: Record<string, Record<string, number>> = {};
      Object.entries(TAXONOMY).forEach(([macro, micros]) => {
        initialIndicators[macro] = {};
        micros.forEach(m => initialIndicators[macro][m] = 50);
      });

      await setDoc(doc(db, 'artifacts', APP_ID, 'states', generateId()), { 
        name: data.name, type: data.type || 'estadual', 
        macro: { populacao: Number(data.populacao)||0, pib: Number(data.pib)||0, aprovacao: 50, caixa: Number(data.budget)||1000000 },
        indicators: initialIndicators, allocatedBudget: {} 
      });
      showToast("Entidade criada com sucesso!");
    },

    // O Juízo Final: O Admin avalia a justificativa e cria um efeito
    apurarDocumento: async (col: 'projects'|'decrees', docId: string, effectData: any) => {
      // Salva o Efeito
      if(effectData.pointsPerMonth !== 0) {
        await setDoc(doc(db, 'artifacts', APP_ID, 'effects', generateId()), {
          ...effectData, isPositive: effectData.pointsPerMonth > 0
        });
      }
      // Marca o documento como apurado
      await updateDoc(doc(db, 'artifacts', APP_ID, col, docId), { apurado: true });
      showToast("Apuração concluída! Efeitos registrados no sistema.");
    },

    // O Coração do Jogo: Avançar o Mês
    advanceTime: async () => {
      let nextMonth = gameTime.month + 1;
      let nextYear = gameTime.year;
      if (nextMonth > 12) { nextMonth = 1; nextYear++; }

      // Processa os Efeitos em todos os Estados
      const updatedStates = JSON.parse(JSON.stringify(states)); // Deep copy
      
      for (const effect of activeEffects) {
        if (effect.remainingMonths > 0) {
           const targetState = updatedStates.find((s:any) => s.id === effect.stateId);
           if (targetState && targetState.indicators[effect.macro]) {
             // Aplica os pontos garantindo que fique entre 0 e 100
             const currentVal = targetState.indicators[effect.macro][effect.micro] || 50;
             targetState.indicators[effect.macro][effect.micro] = Math.max(0, Math.min(100, currentVal + effect.pointsPerMonth));
           }
           // Reduz a duração do efeito
           const newRemaining = effect.remainingMonths - 1;
           if (newRemaining <= 0) {
             await deleteDoc(doc(db, 'artifacts', APP_ID, 'effects', effect.id)); // Remove se acabou
           } else {
             await updateDoc(doc(db, 'artifacts', APP_ID, 'effects', effect.id), { remainingMonths: newRemaining });
           }
        }
      }

      // Salva os novos dados dos Estados
      for (const s of updatedStates) {
         await updateDoc(doc(db, 'artifacts', APP_ID, 'states', s.id), { indicators: s.indicators });
      }

      // Salva o novo tempo
      await updateDoc(doc(db, 'artifacts', APP_ID, 'system', 'time'), { month: nextMonth, year: nextYear });
      showToast(`Tempo avançado para Mês ${nextMonth}/${nextYear}! Efeitos aplicados.`);
    },

    updateUser: async (userId: string, newRole: string, newJurisdiction: string, newPasta: string) => { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', userId), { role: newRole, jurisdictionId: newJurisdiction || 'federal', pastaId: newPasta || null }); showToast("Jogador atualizado!"); },
    saveTemplate: async (data: any) => { await setDoc(doc(db, 'artifacts', APP_ID, 'templates', data.id || generateId()), data); showToast("Modelo Salvo!"); },
    deleteTemplate: async (id: string) => { await deleteDoc(doc(db, 'artifacts', APP_ID, 'templates', id)); showToast("Modelo removido."); },
    diplomar: async (data: any) => { /* Mantido por brevidade, assuma igual ao anterior */ }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Carregando República...</div>;
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 px-4">
        {/* ... Login (Igual) ... */}
        <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-6"><Landmark className="w-16 h-16 text-indigo-500" /></div>
          <h2 className="text-2xl font-bold text-center text-white mb-6">Acesso Restrito</h2>
          <div className="flex mb-6 border-b border-gray-700">
            <button onClick={() => setIsLoginMode(true)} className={`flex-1 pb-2 font-bold ${isLoginMode ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}>Entrar</button>
            <button onClick={() => setIsLoginMode(false)} className={`flex-1 pb-2 font-bold ${!isLoginMode ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}>Criar Conta</button>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="text" placeholder="Seu ID Discord" value={discordName} onChange={e => setDiscordName(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded" required/>
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-900 text-white p-3 rounded" required/>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded mt-2">{isLoginMode ? "Acessar" : "Registrar"}</button>
          </form>
        </div>
      </div>
    );
  }

  // Mapeamento dos meses para nome
  const monthNames = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 overflow-hidden">
      <nav className="w-full md:w-64 bg-gray-800 border-r border-gray-700 flex flex-col fixed bottom-0 md:relative z-20">
        <div className="hidden md:flex flex-col items-center justify-center py-4 border-b border-gray-700">
           <div className="flex items-center"><Landmark className="w-6 h-6 text-indigo-400 mr-2" /><h1 className="text-xl font-bold">República RPG</h1></div>
           {/* Relógio do Jogo */}
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
