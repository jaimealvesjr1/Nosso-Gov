import React, { useState, useEffect } from 'react';
import { Activity, FileText, DollarSign, Scale, Settings, LogOut, Landmark, Clock } from 'lucide-react';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';

import { auth, db, APP_ID } from './config/firebase';
import { UserProfile, RpgData, RpgProject, StfDecision, DocTemplate, RpgDecree, GameTime, GameEffect, LegSession, TermoPosse, ProjectArticle, LoaArticle, TAXONOMY, DecreeAction } from './types';
import { NavButton, formatRole } from './components/UI';

import { DashboardView } from './pages/Dashboard';
import { ExecutivoView } from './pages/Executivo';
import { LegislativoView } from './pages/Legislativo';
import { JudiciarioView } from './pages/Judiciario';
import { AdminView } from './pages/Admin';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  
  // Data States
  const [states, setStates] = useState<RpgData[]>([]);
  const [projects, setProjects] = useState<RpgProject[]>([]);
  const [decrees, setDecrees] = useState<RpgDecree[]>([]);
  const [decisions, setDecisions] = useState<StfDecision[]>([]);
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const [gameTime, setGameTime] = useState<GameTime>({ month: 1, year: 2026 });
  const [activeEffects, setActiveEffects] = useState<GameEffect[]>([]);
  
  // Novos States para as novas mecânicas
  const [liveSession, setLiveSession] = useState<LegSession | null>(null);
  const [posses, setPosses] = useState<TermoPosse[]>([]);

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
    if (!user) return;
    const unsubUsers = onSnapshot(collection(db, 'artifacts', APP_ID, 'users'), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
      setUsersList(data);
      setProfile(data.find(p => p.id === user.uid) || null);
      setLoading(false);
    });
    const unsubStates = onSnapshot(collection(db, 'artifacts', APP_ID, 'states'), snap => setStates(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgData))));
    const unsubProjects = onSnapshot(collection(db, 'artifacts', APP_ID, 'projects'), snap => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgProject)).sort((a,b) => b.sequentialNumber - a.sequentialNumber)));
    const unsubDecrees = onSnapshot(collection(db, 'artifacts', APP_ID, 'decrees'), snap => setDecrees(snap.docs.map(d => ({ id: d.id, ...d.data() } as RpgDecree)).sort((a,b) => b.sequentialNumber - a.sequentialNumber)));
    const unsubDecisions = onSnapshot(collection(db, 'artifacts', APP_ID, 'judiciary'), snap => setDecisions(snap.docs.map(d => ({ id: d.id, ...d.data() } as StfDecision)).sort((a:any, b:any) => b.createdAt - a.createdAt)));
    const unsubTemplates = onSnapshot(collection(db, 'artifacts', APP_ID, 'templates'), snap => setTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as DocTemplate))));
    const unsubTime = onSnapshot(doc(db, 'artifacts', APP_ID, 'system', 'time'), doc => { if(doc.exists()) setGameTime(doc.data() as GameTime); });
    const unsubEffects = onSnapshot(collection(db, 'artifacts', APP_ID, 'effects'), snap => setActiveEffects(snap.docs.map(d => ({ id: d.id, ...d.data() } as GameEffect))));
    
    // Listeners das Novas Funcionalidades
    const unsubSession = onSnapshot(doc(db, 'artifacts', APP_ID, 'system', 'live_session'), doc => { if(doc.exists()) setLiveSession(doc.data() as LegSession); else setLiveSession(null); });
    const unsubPosses = onSnapshot(collection(db, 'artifacts', APP_ID, 'posses'), snap => setPosses(snap.docs.map(d => ({ id: d.id, ...d.data() } as TermoPosse)).sort((a,b) => b.sequentialNumber - a.sequentialNumber)));

    return () => { unsubUsers(); unsubStates(); unsubProjects(); unsubDecrees(); unsubDecisions(); unsubTemplates(); unsubTime(); unsubEffects(); unsubSession(); unsubPosses(); };
  }, [user]);

  const showToast = (msg: string) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 4000); };
  const generateSystemEmail = (discordId: string) => `${discordId.toLowerCase().replace(/[^a-z0-9]/g, '')}@rpg.local`;
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discordName || !password) return showToast("Preencha Discord e senha!");
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, generateSystemEmail(discordName), password);
      } else {
        if (password.length < 6) return showToast("Mínimo 6 caracteres.");
        if (usersList.some(u => u.discordUsername.toLowerCase() === discordName.toLowerCase())) return showToast("Discord já registrado!");
        const cred = await createUserWithEmailAndPassword(auth, generateSystemEmail(discordName), password);
        await setDoc(doc(db, 'artifacts', APP_ID, 'users', cred.user.uid), { id: cred.user.uid, discordUsername: discordName, role: usersList.length === 0 ? 'admin' : 'espectador', jurisdictionId: 'federal' });
        if(usersList.length === 0) await setDoc(doc(db, 'artifacts', APP_ID, 'system', 'time'), { month: 1, year: 2026 });
      }
      showToast("Acesso Liberado!");
    } catch (err) { showToast("Erro na Autenticação."); }
  };

  // ==========================================
  // O GRANDE MOTOR DE AÇÕES DO RPG
  // ==========================================
  const gameActions = {
    
    // --- LEGISLATIVO (PROTOCOLOS E EMENDAS) ---
    protocolProject: async (formData: any, artigos: ProjectArticle[], loaArtigos: LoaArticle[]) => {
      if(!profile) return;
      const nextNum = projects.length > 0 ? Math.max(...projects.map(p => p.sequentialNumber)) + 1 : 1;
      const template = templates.find(t => t.id === formData.templateId);
      const cat = template?.category || 'pl';

      const newProject: any = {
        sequentialNumber: nextNum, title: formData.title, category: cat,
        templateName: template?.name || 'Projeto', templateAbbreviation: template?.abbreviation || 'PROJ',
        templateBodyText: template?.bodyText || '',
        artigos: artigos.filter(a => (a.text || '').trim() !== ''),
        justificativa: formData.justificativa || '', 
        intendedMacro: formData.intendedMacro || '', 
        hiddenIntent: formData.hiddenIntent || null,
        apurado: false,
        authorId: profile.id, authorName: profile.discordUsername, 
        status: 'protocolado',
        votes: {}, createdAt: serverTimestamp(),
        amendments: [], year: gameTime.year
      };

      if (cat === 'loa') {
        newProject.loaDetails = { 
          stateId: profile.jurisdictionId || 'federal', 
          artigos: loaArtigos.map((a: any) => ({ pastaName: a.pastaName === 'outro' ? (a.customName || 'Reserva') : a.pastaName, percentage: a.percentage }))
        };
      }
      await setDoc(doc(db, 'artifacts', APP_ID, 'projects', generateId()), newProject);
      showToast("Projeto Protocolado com Sucesso!");
    },

    changeStatus: async (projectId: string, newStatus: string) => {
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: newStatus });
      showToast("Status Atualizado.");
    },

    proporEmenda: async (projectId: string, text: string) => {
      if(!profile) return;
      const p = projects.find(x => x.id === projectId);
      if(!p) return;
      const newAmendment: any = { id: generateId(), authorName: profile.discordUsername, text, status: 'proposta', votes: {} };
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { amendments: [...(p.amendments || []), newAmendment] });
      showToast("Emenda Protocolada!");
    },

    // --- LEGISLATIVO (SESSÃO AO VIVO) ---
    abrirSessao: async () => {
      if (profile?.role !== 'presidente_congresso' && profile?.role !== 'admin') return;
      await setDoc(doc(db, 'artifacts', APP_ID, 'system', 'live_session'), {
        id: generateId(), status: 'aberta_presenca', presentDeputies: [], currentProjectVotingId: null, ata: [], createdAt: serverTimestamp()
      });
      showToast("Sessão Legislativa Aberta! Aguardando Quórum.");
    },

    marcarPresenca: async () => {
      if (!profile || !liveSession) return;
      if (liveSession.presentDeputies.includes(profile.id)) return;
      await updateDoc(doc(db, 'artifacts', APP_ID, 'system', 'live_session'), { presentDeputies: [...liveSession.presentDeputies, profile.id] });
      showToast("Presença Confirmada.");
    },

    confirmarQuorum: async () => {
      if (!liveSession || (profile?.role !== 'presidente_congresso' && profile?.role !== 'admin')) return;
      await updateDoc(doc(db, 'artifacts', APP_ID, 'system', 'live_session'), { status: 'em_curso' });
      showToast("Quórum Confirmado! Sessão em curso.");
    },

    iniciarVotacaoProjeto: async (projectId: string) => {
      if (!liveSession) return;
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: 'em_votacao', votes: {} });
      await updateDoc(doc(db, 'artifacts', APP_ID, 'system', 'live_session'), { currentProjectVotingId: projectId });
      showToast("Votação Aberta no Plenário!");
    },

    votarAoVivo: async (projectId: string, vote: string, isAmendment: boolean = false, amendmentId?: string) => {
      if (!profile) return;
      const p = projects.find(x => x.id === projectId);
      if (!p) return;

      if (isAmendment && amendmentId) {
        const updatedAmendments = (p.amendments || []).map((am: any) => {
          if (am.id === amendmentId) return { ...am, votes: { ...am.votes, [profile.id]: vote } };
          return am;
        });
        await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { amendments: updatedAmendments });
      } else {
        await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { votes: { ...p.votes, [profile.id]: vote } });
      }
    },

    encerrarVotacaoProjetoAoVivo: async (projectId: string) => {
      const p = projects.find(x => x.id === projectId);
      if (!p || !liveSession) return;

      const sim = Object.values(p.votes || {}).filter(v => v === 'sim').length;
      const nao = Object.values(p.votes || {}).filter(v => v === 'nao').length;
      
      const updatedAmendments = (p.amendments || []).map((am: any) => {
        const amSim = Object.values(am.votes || {}).filter(v => v === 'sim').length;
        const amNao = Object.values(am.votes || {}).filter(v => v === 'nao').length;
        return { ...am, status: amSim > amNao ? 'aprovada' : 'rejeitada' };
      });

      let aprovado = false;
      if (p.category === 'pec') {
        const requiredVotes = Math.max(1, Math.ceil(liveSession.presentDeputies.length * 0.6));
        aprovado = sim >= requiredVotes;
      } else {
        aprovado = sim > nao;
      }

      const novoStatus = aprovado ? 'sancao' : 'arquivo';
      const novaAtaEntry = { projectId: p.id, title: p.title, result: aprovado ? 'aprovado' : 'rejeitado' };

      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: novoStatus, amendments: updatedAmendments });
      await updateDoc(doc(db, 'artifacts', APP_ID, 'system', 'live_session'), { currentProjectVotingId: null, ata: [...(liveSession.ata || []), novaAtaEntry] });
      showToast(aprovado ? "Aprovado! Enviado à Sanção." : "Rejeitado e Arquivado.");
    },

    encerrarSessao: async () => {
      if (!liveSession) return;
      await setDoc(doc(db, 'artifacts', APP_ID, 'historico_sessoes', generateId()), { ...liveSession, status: 'encerrada', closedAt: serverTimestamp(), year: gameTime.year });
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'system', 'live_session'));
      showToast("Sessão Encerrada com Sucesso.");
    },

    // --- ADMIN E SISTEMA DE DELEÇÃO/TESOURO ---
    deleteDocument: async (collectionName: string, id: string) => {
      if (profile?.role !== 'admin' && profile?.role !== 'moderador') return;
      await deleteDoc(doc(db, 'artifacts', APP_ID, collectionName, id));
      showToast("Documento excluído pela Moderação.");
    },

    adjustBudget: async (stateId: string, pastaName: string, amount: number, isSubtrair: boolean) => {
      if (profile?.role !== 'admin' && profile?.role !== 'moderador') return;
      if (!amount || amount <= 0) return showToast("Valor inválido.");
      const state = states.find(s => s.id === stateId);
      if (!state) return;

      if (pastaName === 'caixa_geral') {
        const current = state.macro.caixa || 0;
        const finalAmount = isSubtrair ? current - amount : current + amount;
        await updateDoc(doc(db, 'artifacts', APP_ID, 'states', stateId), { 'macro.caixa': Math.max(0, finalAmount) });
      } else {
        const current = state.allocatedBudget?.[pastaName] || 0;
        const finalAmount = isSubtrair ? current - amount : current + amount;
        const newBudget = { ...state.allocatedBudget, [pastaName]: Math.max(0, finalAmount) };
        await updateDoc(doc(db, 'artifacts', APP_ID, 'states', stateId), { allocatedBudget: newBudget });
      }
      showToast(`R$ ${amount.toLocaleString('pt-BR')} ${isSubtrair ? 'cobrados' : 'injetados'} com sucesso!`);
    },

    // --- NOVO HARD RESET (Limpa TODAS as coleções e sessões) ---
    hardReset: async (data: { countryName: string, startMonth: number, startYear: number }) => {
      if (profile?.role !== 'admin' && profile?.role !== 'moderador') return;
      
      const collectionsToClear = ['projects', 'decrees', 'judiciary', 'effects', 'states', 'posses', 'historico_sessoes'];
      
      for (const colName of collectionsToClear) {
        const snap = await getDocs(collection(db, 'artifacts', APP_ID, colName));
        snap.forEach(d => deleteDoc(doc(db, 'artifacts', APP_ID, colName, d.id)));
      }

      await deleteDoc(doc(db, 'artifacts', APP_ID, 'system', 'live_session'));

      const initialIndicators: any = {};
      Object.entries(TAXONOMY).forEach(([macro, micros]) => { 
        initialIndicators[macro] = {}; 
        micros.forEach(m => initialIndicators[macro][m] = 50); 
      });
      
      await setDoc(doc(db, 'artifacts', APP_ID, 'states', generateId()), {
        name: data.countryName, type: 'federal', 
        macro: { populacao: 0, pib: 0, aprovacao: 50, caixa: 100000000 },
        indicators: initialIndicators, allocatedBudget: {}, history: []
      });

      for (const u of usersList) {
        if (u.role !== 'admin' && u.role !== 'moderador') {
          await updateDoc(doc(db, 'artifacts', APP_ID, 'users', u.id), { role: 'espectador', jurisdictionId: 'federal', pastaId: null });
        }
      }

      await setDoc(doc(db, 'artifacts', APP_ID, 'system', 'time'), { month: Number(data.startMonth), year: Number(data.startYear) });
      showToast("HARD RESET CONCLUÍDO COM SUCESSO!");
    },

    // --- AVANÇO DE TEMPO (Agora guarda Histórico dos Gráficos) ---
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
      
      for (const s of updatedStates) { 
        if (s.indicators !== undefined) {
          const snapshot = { month: gameTime.month, year: gameTime.year, indicators: JSON.parse(JSON.stringify(s.indicators)) };
          const newHistory = [...(s.history || []), snapshot];
          await updateDoc(doc(db, 'artifacts', APP_ID, 'states', s.id), { indicators: s.indicators, history: newHistory }); 
        }
      }
      
      await updateDoc(doc(db, 'artifacts', APP_ID, 'system', 'time'), { month: nextMonth, year: nextYear });
      showToast(`Tempo avançado para Mês ${nextMonth}/${nextYear}!`);
    },

    // --- FUNÇÕES DO EXECUTIVO E JUDICIÁRIO RESTAURADAS ---
    publishDecreto: async (data: any, actionsList: DecreeAction[]) => {
      if (!profile) return;
      const targetStateId = data.stateId || profile.jurisdictionId || 'federal';
      for (const act of actionsList) {
        if (act.type === 'nomeacao') await updateDoc(doc(db, 'artifacts', APP_ID, 'users', act.userId), { role: 'ministro', jurisdictionId: targetStateId, pastaId: act.pastaName });
        else if (act.type === 'exoneracao') await updateDoc(doc(db, 'artifacts', APP_ID, 'users', act.userId), { role: 'espectador', pastaId: null });
      }
      const nextNum = decrees.length > 0 ? Math.max(...decrees.map(d => d.sequentialNumber)) + 1 : 1;
      await setDoc(doc(db, 'artifacts', APP_ID, 'decrees', generateId()), {
        sequentialNumber: nextNum, title: data.title || "Documento Executivo", content: data.content || "",
        category: data.category || 'decreto', actions: actionsList || [], justificativa: data.justificativa || '', intendedMacro: data.intendedMacro || '',
        hiddenIntent: data.hiddenIntent || null,
        apurado: false, authorName: profile.discordUsername, jurisdictionId: targetStateId, year: gameTime.year, createdAt: serverTimestamp()
      });
      showToast(`Documento publicado!`);
    },

    analisarSancao: async (projectId: string, artigosVetadosIds: number[]) => {
      const p = projects.find(x => x.id === projectId);
      if (!p) return;
      const hasAnyVeto = artigosVetadosIds.length > 0;
      const novosArtigos = p.artigos.map((art:any) => ({ ...art, isVetoed: artigosVetadosIds.includes(art.id) }));
      let finalStatus = hasAnyVeto ? 'vetado' : 'sancionado';

      if (finalStatus === 'sancionado' && p.category === 'loa' && p.loaDetails) {
        const targetState = states.find(s => s.id === p.loaDetails!.stateId);
        if (targetState) {
          const updatedBudget = { ...(targetState.allocatedBudget || {}) };
          p.loaDetails.artigos.forEach((art:any) => {
            const amount = (targetState.macro.caixa * art.percentage) / 100;
            updatedBudget[art.pastaName] = (updatedBudget[art.pastaName] || 0) + amount;
          });
          await updateDoc(doc(db, 'artifacts', APP_ID, 'states', targetState.id), { allocatedBudget: updatedBudget });
        }
      }
      await updateDoc(doc(db, 'artifacts', APP_ID, 'projects', projectId), { status: finalStatus, artigos: novosArtigos });
      showToast(hasAnyVeto ? "Veto aplicado!" : "Sancionado!");
    },

    emitirSentenca: async (data: {title: string, content: string}) => {
      if(!profile) return;
      const nextNum = decisions.length > 0 ? Math.max(...decisions.map((d:any) => d.sequentialNumber || 0)) + 1 : 1;
      await setDoc(doc(db, 'artifacts', APP_ID, 'judiciary', generateId()), { 
        sequentialNumber: nextNum, year: gameTime.year,
        authorName: profile.discordUsername, title: `${data.title} Nº ${nextNum}/${gameTime.year}`, 
        content: data.content, createdAt: serverTimestamp() 
      });
      showToast("Sentença Publicada!");
    },

    diplomar: async (data: { startMonth: number, startYear: number, endMonth: number, endYear: number, eleitos: any[] }) => {
      if(!data.eleitos || data.eleitos.length === 0) return showToast("Lista vazia!");
      const nextNum = posses.length > 0 ? Math.max(...posses.map((p:any) => p.sequentialNumber || 0)) + 1 : 1;
      
      for (const item of data.eleitos) {
        await updateDoc(doc(db, 'artifacts', APP_ID, 'users', item.userId), { role: item.role, jurisdictionId: item.jurisdictionId, pastaId: null });
      }

      await setDoc(doc(db, 'artifacts', APP_ID, 'posses', generateId()), { 
        sequentialNumber: nextNum, year: gameTime.year,
        startMonth: data.startMonth, startYear: data.startYear,
        endMonth: data.endMonth, endYear: data.endYear,
        eleitos: data.eleitos,
        createdAt: serverTimestamp() 
      });
      showToast("Posse Registrada e Jogadores Atualizados!");
    },

    apurarDocumento: async (col: 'projects'|'decrees', docId: string, effectData: any) => {
      if(effectData.pointsPerMonth !== 0) await setDoc(doc(db, 'artifacts', APP_ID, 'effects', generateId()), { ...effectData, isPositive: effectData.pointsPerMonth > 0 });
      await updateDoc(doc(db, 'artifacts', APP_ID, col, docId), { apurado: true }); 
      showToast("Efeito Apurado!");
    },

    createState: async (data: any) => {
      const initialIndicators: any = {};
      Object.entries(TAXONOMY).forEach(([macro, micros]) => { initialIndicators[macro] = {}; micros.forEach(m => initialIndicators[macro][m] = 50); });
      await setDoc(doc(db, 'artifacts', APP_ID, 'states', generateId()), { name: data.name, type: data.type, macro: { populacao: Number(data.populacao), pib: Number(data.pib), aprovacao: 50, caixa: Number(data.budget) }, indicators: initialIndicators, allocatedBudget: {}, history: [] });
      showToast("Entidade Fundada!");
    },
    saveTemplate: async (data: any) => { await setDoc(doc(db, 'artifacts', APP_ID, 'templates', data.id || generateId()), data); showToast("Modelo Salvo!"); },
    deleteTemplate: async (id: string) => { await deleteDoc(doc(db, 'artifacts', APP_ID, 'templates', id)); showToast("Modelo removido."); },
    updateUser: async (userId: string, newRole: string, newJurisdiction: string, newPasta: string) => { await updateDoc(doc(db, 'artifacts', APP_ID, 'users', userId), { role: newRole, jurisdictionId: newJurisdiction || 'federal', pastaId: newPasta || null }); showToast("Jogador atualizado!"); }
  };
  // ==========================================

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-900 text-white">Carregando Nosso Governo...</div>;
  
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 px-4">
        <div className="bg-gray-800 p-8 rounded-xl max-w-md w-full shadow-2xl">
          <div className="flex justify-center mb-6"><Landmark className="w-16 h-16 text-indigo-500" /></div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">Acesso Restrito</h2>
          <p className="text-gray-400 text-center text-sm mb-6">Nosso Governo Virtual</p>
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
      
      {/* NAVEGAÇÃO SUPER SIMPLIFICADA DAS 5 ABAS */}
      <nav className="w-full md:w-64 bg-gray-800 border-r border-gray-700 flex flex-col fixed bottom-0 md:relative z-20">
        <div className="hidden md:flex flex-col items-center justify-center py-4 border-b border-gray-700">
           <div className="flex items-center text-center"><Landmark className="w-6 h-6 text-indigo-400 mr-2" /><h1 className="text-lg font-bold">Nosso Governo</h1></div>
           <div className="mt-3 bg-gray-900 border border-gray-700 px-4 py-1.5 rounded-full flex items-center shadow-inner">
             <Clock className="w-4 h-4 text-emerald-400 mr-2"/>
             <span className="font-mono font-bold text-sm text-emerald-100">{monthNames[gameTime.month]} / {gameTime.year}</span>
           </div>
        </div>

        {profile && (
          <div className="hidden md:block p-4 border-b border-gray-700 bg-gray-900/50">
            <p className="text-sm text-gray-400">Logado como:</p>
            <p className="font-bold text-indigo-300">{profile.discordUsername}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-gray-700 text-xs rounded-full uppercase border border-gray-600">{formatRole(profile.role)}</span>
          </div>
        )}

        <div className="flex md:flex-col overflow-x-auto p-2 gap-2 flex-1">
          <NavButton icon={Activity} label="1. Dados Gerais" active={activeTab === 'dados'} onClick={() => setActiveTab('dados')} />
          <NavButton icon={DollarSign} label="2. Executivo" active={activeTab === 'executivo'} onClick={() => setActiveTab('executivo')} />
          <NavButton icon={FileText} label="3. Legislativo" active={activeTab === 'legislativo'} onClick={() => setActiveTab('legislativo')} />
          <NavButton icon={Scale} label="4. Judiciário" active={activeTab === 'judiciario'} onClick={() => setActiveTab('judiciario')} />
          
          {/* Aba Admin Visível a quem tem poderes */}
          {['admin', 'moderador'].includes(profile?.role || '') && (
            <NavButton icon={Settings} label="5. Admin (Moderação)" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          )}
        </div>

        <div className="hidden md:block p-4 border-t border-gray-700">
          <button onClick={() => signOut(auth)} className="flex items-center text-red-400 hover:bg-gray-700 w-full p-2 rounded transition"><LogOut className="w-5 h-5 mr-3"/> Sair</button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
          {activeTab === 'dados' && <DashboardView states={states} usersList={usersList} activeEffects={activeEffects} />}
          {activeTab === 'executivo' && <ExecutivoView profile={profile} states={states} decrees={decrees} projects={projects} templates={templates} usersList={usersList} gameTime={gameTime} showToast={showToast} actions={gameActions} />}
          {activeTab === 'legislativo' && <LegislativoView profile={profile} projects={projects} liveSession={liveSession} templates={templates} gameTime={gameTime} showToast={showToast} actions={gameActions} />}
          {activeTab === 'judiciario' && <JudiciarioView profile={profile} decisions={decisions} posses={posses} usersList={usersList} states={states} templates={templates} gameTime={gameTime} showToast={showToast} actions={gameActions} />}
          {activeTab === 'admin' && ['admin', 'moderador'].includes(profile?.role || '') && <AdminView profile={profile} usersList={usersList} states={states} projects={projects} decrees={decrees} decisions={decisions} activeEffects={activeEffects} templates={templates} gameTime={gameTime} showToast={showToast} actions={gameActions} />}
        </div>
      </main>

      {toastMessage && <div className="fixed bottom-24 md:bottom-10 right-4 md:right-10 bg-indigo-600 px-6 py-4 rounded-lg shadow-2xl z-50 font-bold border border-indigo-400">{toastMessage}</div>}
    </div>
  );
}
