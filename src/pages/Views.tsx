import React, { useState } from 'react';
import { Plus, Check, X, FileSignature, Gavel, ShieldCheck, FileBadge, Building, Trash2, Activity, Users, DollarSign, TrendingUp, Target, Clock, Zap } from 'lucide-react';
import { RpgData, RpgProject, UserProfile, StfDecision, LoaArticle, DocTemplate, RpgDecree, ProjectArticle, TAXONOMY, MacroArea } from '../types';

const formatMoney = (val: number) => Number(val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const formatNum = (val: number) => Number(val || 0).toLocaleString('pt-BR');
const getYear = () => new Date().getFullYear();

// ==========================================
// 0. ABA DE DADOS (Matriz de Macro e Micro Dados)
// ==========================================
export function DashboardView({ states, usersList }: any) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white border-b border-gray-700 pb-3">Observatório da Nação</h2>
      {states.length === 0 && <p className="text-gray-500 italic">Nenhum Estado fundado. O Mestre deve criar no Admin.</p>}
      
      {states.map((state: RpgData) => (
        <div key={state.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center">
             <div><span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{state.type}</span><h3 className="text-2xl font-bold text-white mt-1">{state.name}</h3></div>
             <div className="text-right"><p className="text-sm text-gray-400">Caixa Geral</p><p className="text-xl font-mono text-emerald-400 font-bold">{formatMoney(state.macro?.caixa)}</p></div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(Object.keys(TAXONOMY) as MacroArea[]).map(macro => {
              const macroBudget = state.allocatedBudget?.[macro] || 0;
              const minister = usersList.find((u:UserProfile) => u.pastaId === macro && u.jurisdictionId === state.id);
              
              return (
                <div key={macro} className="bg-gray-900 p-5 rounded-lg border border-gray-700 shadow-inner">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                    <h4 className="font-bold text-indigo-300 capitalize text-lg">{macro.replace('_', ' ')}</h4>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 border border-gray-700">Verba: <span className="text-green-400 font-mono font-bold">{formatMoney(macroBudget)}</span></span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Ministro Responsável: <strong className="text-white">{minister?.discordUsername || 'Vago'}</strong></p>
                  
                  <div className="space-y-3">
                    {TAXONOMY[macro].map(micro => {
                      const val = state.indicators?.[macro]?.[micro] || 50;
                      return <DataBar key={micro} label={micro} value={val} color={val > 70 ? 'bg-green-500' : val < 40 ? 'bg-red-500' : 'bg-yellow-500'} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// 1. LEGISLATIVO (Com Justificativa e Intenção)
// ==========================================
export function LegislativoView({ profile, projects, states, templates, actions }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ category: 'geral' });
  const [artigosText, setArtigosText] = useState<ProjectArticle[]>([{ id: 1, text: '', isVetoed: false }]);
  const [loaArtigos, setLoaArtigos] = useState<LoaArticle[]>([{ pastaName: 'saude', percentage: 0 }]);
  const [filterTab, setFilterTab] = useState<'tramitacao' | 'historico'>('tramitacao');

  const legTemplates = templates.filter((t: DocTemplate) => t.branch === 'legislativo');
  const myJurisdiction = states.find((s:any) => s.id === profile?.jurisdictionId) || { id: 'federal', name: 'União Federal', macro: {caixa: 1000000} };

  // CORREÇÃO: Variável trazida para o escopo correto do componente
  const totalPercentage = loaArtigos.reduce((acc, art) => acc + (art.percentage || 0), 0);
  const nextNum = projects.length > 0 ? Math.max(...projects.map((p: any) => p.sequentialNumber)) + 1 : 1;

  const handleProtocol = () => {
    actions.protocolProject(formData, artigosText, formData.category === 'loa' ? loaArtigos : []);
    setModalOpen(false); setFormData({ category: 'geral' }); setArtigosText([{ id: 1, text: '', isVetoed: false }]);
    setLoaArtigos([{ pastaName: 'saude', percentage: 0 }]);
  };

  const filteredProjects = projects.filter((p: RpgProject) => {
    if (filterTab === 'tramitacao') return ['proposto', 'pauta', 'votacao', 'sancao', 'vetado', 'votacao_veto'].includes(p.status);
    return ['sancionado', 'promulgado', 'arquivo'].includes(p.status);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-6">
         {['deputado', 'presidente_republica', 'governador', 'admin'].includes(profile?.role) && <button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white font-bold shadow-lg transition"><Plus className="w-4 h-4 inline mr-2"/> Redigir Documento</button>}
         <div className="flex bg-gray-800 rounded p-1 border border-gray-700">
           <button onClick={() => setFilterTab('tramitacao')} className={`px-4 py-1 rounded text-sm transition-colors ${filterTab==='tramitacao'?'bg-gray-700 text-white font-bold':'text-gray-400'}`}>Tramitação</button>
           <button onClick={() => setFilterTab('historico')} className={`px-4 py-1 rounded text-sm transition-colors ${filterTab==='historico'?'bg-gray-700 text-white font-bold':'text-gray-400'}`}>Histórico</button>
         </div>
      </div>

      {filteredProjects.length === 0 && <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">Nenhum projeto encontrado nesta secção.</div>}

      {filteredProjects.map((p: RpgProject) => {
        return (
          <div key={p.id} className="bg-gray-800 p-5 border border-gray-700 rounded-lg flex flex-col md:flex-row gap-6 shadow-md mb-4">
             <div className="flex-1">
                <span className="text-xs font-bold text-gray-400 uppercase bg-gray-900 px-2 py-1 rounded mr-2 border border-gray-700">{p.status.replace('_', ' ')}</span>
                {p.category === 'loa' && <span className="text-xs font-bold text-green-400 uppercase bg-green-900/30 px-2 py-1 rounded border border-green-900/50">LOA Orçamentária</span>}
                <h3 className="text-xl font-bold text-white mt-3 mb-2 font-serif">{p.templateAbbreviation} N° {p.sequentialNumber}/{getYear()} - {p.title}</h3>
                
                {p.justificativa && (
                  <div className="bg-gray-900/50 p-3 rounded border border-gray-700 mb-3 shadow-inner">
                     <p className="text-xs text-indigo-400 font-bold uppercase mb-1"><Target className="w-3 h-3 inline mr-1"/> Justificativa & Intenção (Foco: {p.intendedMacro?.replace('_',' ') || 'Geral'})</p>
                     <p className="text-sm text-gray-300 italic">"{p.justificativa}"</p>
                  </div>
                )}
                
                <div className="space-y-2 mb-4">
                   {p.artigos?.map((art) => (
                     <p key={art.id} className={`text-sm ${art.isVetoed ? 'text-red-400 line-through opacity-70' : 'text-gray-300'}`}>
                       <strong>Art. {art.id}º</strong> - {art.text}
                     </p>
                   ))}
                </div>
                <p className="text-xs text-gray-500 font-mono">Autoria: {p.authorName}</p>
             </div>
             
             <div className="flex flex-col gap-2 min-w-[200px] border-t md:border-t-0 md:border-l border-gray-700 pt-4 md:pt-0 pl-0 md:pl-4 justify-center">
                {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'proposto' && <button onClick={() => actions.changeStatus(p.id, 'pauta')} className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm text-white transition">Colocar em Pauta</button>}
                {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'pauta' && <button onClick={() => actions.changeStatus(p.id, 'votacao')} className="bg-indigo-600 hover:bg-indigo-500 py-2 rounded text-sm text-white shadow-lg transition">Abrir Votação</button>}
                {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'votacao' && <button onClick={() => actions.encerrarVotacao(p.id, false)} className="bg-emerald-600 hover:bg-emerald-500 py-2 rounded text-sm text-white shadow-lg transition"><Gavel className="w-4 h-4 inline mr-2"/>Encerrar Votação</button>}
                {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'votacao_veto' && <button onClick={() => actions.encerrarVotacao(p.id, true)} className="bg-orange-600 hover:bg-orange-500 py-2 rounded text-sm text-white shadow-lg transition"><Gavel className="w-4 h-4 inline mr-2"/>Encerrar Votação (Veto)</button>}
                
                {profile?.role === 'deputado' && (p.status === 'votacao' || p.status === 'votacao_veto') && (
                  <div className="flex flex-col gap-1 bg-gray-900 p-2 rounded border border-gray-700">
                    <p className="text-xs text-center font-bold text-gray-400 uppercase mb-1">{p.status === 'votacao_veto' ? 'Derrubar o Veto?' : 'Seu Voto'}</p>
                    <div className="flex gap-1">
                      <button onClick={() => actions.vote(p.id, 'sim')} className={`flex-1 py-2 rounded transition-colors ${p.votes[profile.id] === 'sim' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-green-900 hover:text-green-400'}`}>S</button>
                      <button onClick={() => actions.vote(p.id, 'nao')} className={`flex-1 py-2 rounded transition-colors ${p.votes[profile.id] === 'nao' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-red-900 hover:text-red-400'}`}>N</button>
                      <button onClick={() => actions.vote(p.id, 'abstencao')} className={`flex-1 py-2 rounded transition-colors ${p.votes[profile.id] === 'abstencao' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-yellow-900 hover:text-yellow-400'}`}>-</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )
      })}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-600 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Redação Oficial</h3>
            
            <select onChange={e => {
               const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
               if(tpl) { setFormData({...formData, templateId: tpl.id, title: `${tpl.name}`, category: tpl.isBudget ? 'loa' : 'geral'}); setArtigosText([{ id: 1, text: tpl.bodyText, isVetoed: false }]); }
            }} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded mb-4 outline-none focus:border-indigo-500">
              <option value="">Selecione o Modelo...</option>
              {legTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {formData.templateId && (
              <>
                <input placeholder="Ementa" onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded mb-4 font-serif outline-none" />
                
                <div className="bg-indigo-900/20 border border-indigo-900/50 p-4 rounded mb-4">
                   <p className="text-sm font-bold text-indigo-300 mb-2">Justificativa & Intenção Estratégica (Para o Admin)</p>
                   <textarea rows={2} placeholder="Descreva qual o seu objetivo prático com este projeto para o Estado..." onChange={e => setFormData({...formData, justificativa: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded text-sm mb-2 outline-none" />
                   <select onChange={e => setFormData({...formData, intendedMacro: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm outline-none">
                      <option value="">Em qual área espera impacto?</option>
                      {Object.keys(TAXONOMY).map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
                   </select>
                </div>

                <div className="space-y-3 mb-6">
                   {artigosText.map((art, idx) => (
                     <div key={art.id} className="flex gap-2 items-start">
                       <span className="text-gray-500 font-bold mt-3">Art. {art.id}º</span>
                       <textarea rows={2} value={art.text} onChange={e => { const n = [...artigosText]; n[idx].text = e.target.value; setArtigosText(n); }} className="flex-1 bg-gray-900 border border-gray-700 text-white p-3 rounded text-sm outline-none"/>
                       {artigosText.length > 1 && <button onClick={() => setArtigosText(artigosText.filter(a => a.id !== art.id))} className="mt-3 text-red-500 hover:text-red-400"><Trash2 className="w-5 h-5"/></button>}
                     </div>
                   ))}
                   <button onClick={() => setArtigosText([...artigosText, {id: artigosText.length + 1, text: '', isVetoed: false}])} className="text-xs bg-gray-800 border border-gray-700 px-3 py-2 rounded text-indigo-400 font-bold hover:bg-gray-700 transition">+ Adicionar Artigo</button>
                </div>
                
                {formData.category === 'loa' && (
                  <div className="bg-gray-900 p-4 rounded border border-gray-700 mb-4">
                    <p className="text-sm font-bold text-green-400 mb-3">Distribuição do Orçamento (Baseado na Arrecadação)</p>
                    {loaArtigos.map((art, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <select value={art.pastaName} onChange={e => { const n = [...loaArtigos]; n[idx].pastaName = e.target.value; setLoaArtigos(n); }} className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded text-sm outline-none">
                          {Object.keys(TAXONOMY).map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
                        </select>
                        <div className="w-1/3 relative">
                          <input type="number" placeholder="%" value={art.percentage || ''} onChange={e => { const n = [...loaArtigos]; n[idx].percentage = Number(e.target.value); setLoaArtigos(n); }} className="w-full bg-gray-800 border border-gray-700 text-white p-2 pr-6 rounded text-sm outline-none"/>
                          <span className="absolute right-2 top-2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center mt-3">
                       <button onClick={() => setLoaArtigos([...loaArtigos, {pastaName:'saude', percentage:0}])} className="text-xs bg-gray-800 border border-gray-700 px-3 py-1 rounded text-green-400 font-bold hover:bg-gray-700 transition">+ Adicionar Destino</button>
                       <span className={`text-sm font-bold ${totalPercentage === 100 ? 'text-green-500' : 'text-red-500'}`}>Alocado: {totalPercentage}% / 100%</span>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 mt-4">
                   <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
                   <button onClick={handleProtocol} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded font-bold shadow-lg transition">Protocolar</button>
                </div>
              </>
            )}
            {!formData.templateId && <button onClick={() => setModalOpen(false)} className="w-full mt-4 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar Operação</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. EXECUTIVO (Sanção/Veto e Investimentos)
// ==========================================
export function ExecutivoView({ profile, states, usersList, decrees, templates, projects, actions }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSancao, setModalSancao] = useState<RpgProject | null>(null);
  const [artigosVetados, setArtigosVetados] = useState<number[]>([]);
  
  const [decreto, setDecreto] = useState<any>({ targetUserId: '', pastaName: '' });
  const [investAmount, setInvestAmount] = useState<Record<string, number>>({});

  const execTemplates = templates.filter((t: DocTemplate) => t.branch === 'executivo');
  const myJurisdiction = states.find((s:any) => s.id === profile?.jurisdictionId) || { id: 'federal', name: 'União Federal' };
  const canDecree = ['presidente_republica', 'governador', 'admin'].includes(profile?.role);
  const nextNum = decrees.length > 0 ? Math.max(...decrees.map((d: any) => d.sequentialNumber)) + 1 : 1;

  const projetosAguardando = projects.filter((p: RpgProject) => p.status === 'sancao');

  return (
    <div className="space-y-8">
      {/* MESA DO PRESIDENTE (Projetos aguardando Sanção) */}
      {canDecree && projetosAguardando.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-yellow-500 flex items-center mb-4"><FileSignature className="w-5 h-5 mr-2"/> Projetos Aguardando Sanção Presidencial</h2>
          <div className="space-y-3">
            {projetosAguardando.map((p: RpgProject) => (
              <div key={p.id} className="bg-gray-900 p-4 rounded border border-yellow-900/50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-lg">{p.templateAbbreviation} N° {p.sequentialNumber}/{getYear()}</h4>
                  <p className="text-sm text-gray-400">{p.title}</p>
                </div>
                <button onClick={() => {setModalSancao(p); setArtigosVetados([]);}} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded font-bold transition">Analisar & Sancionar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decretos Oficiais */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-white">Diário Oficial do Executivo</h2>
           {canDecree && <button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white flex items-center shadow-lg transition"><FileBadge className="w-4 h-4 mr-2"/> Publicar Decreto</button>}
         </div>
         <div className="space-y-4">
            {decrees.map((dec: RpgDecree) => (
              <div key={dec.id} className="bg-gray-900 p-5 border-l-4 border-blue-500 rounded-lg">
                 <h3 className="text-xl font-bold text-white font-serif">{dec.title}</h3>
                 <p className="text-gray-300 mt-2 whitespace-pre-wrap">{dec.content}</p>
                 <p className="text-xs text-gray-500 mt-3 font-mono uppercase">Assinado por: {dec.authorName}</p>
              </div>
            ))}
            {decrees.length === 0 && <p className="text-gray-500 text-sm">Nenhum decreto publicado.</p>}
         </div>
      </div>

      {/* CONTROLE DE PASTAS (Investimentos) */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Controle de Pastas & Tesouro</h2>
        {states.filter((s:any) => s.id === profile?.jurisdictionId || profile?.role === 'admin' || profile?.role === 'espectador').map((state: RpgData) => {
          const isMin = profile?.role === 'ministro' && profile?.jurisdictionId === state.id;
          const pastasArray = Object.keys(TAXONOMY);
          
          return (
            <div key={state.id} className="mb-6">
              <h3 className="text-xl font-bold text-white flex items-center mb-4"><Building className="w-5 h-5 mr-3 text-gray-400"/> {state.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pastasArray.map((pastaName: string) => {
                  const dono = usersList.find((u:UserProfile) => u.pastaId === pastaName && u.jurisdictionId === state.id);
                  const data = state.allocatedBudget?.[pastaName] || 0;
                  
                  return (
                    <div key={pastaName} className="bg-gray-900 p-4 border border-gray-700 rounded-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600/50"></div>
                      <h4 className="capitalize font-bold text-lg text-indigo-300 mb-1">{pastaName.replace('_', ' ')}</h4>
                      <p className="text-xs text-gray-400 mb-3 border-b border-gray-800 pb-2">Resp: <span className="text-white font-bold">{dono?.discordUsername || 'Vago'}</span></p>
                      
                      <div className="flex justify-between items-center mb-2 bg-gray-800 p-2 rounded">
                         <span className="text-sm text-gray-400">Em Caixa:</span>
                         <span className="text-green-400 font-mono font-bold">{formatMoney(data)}</span>
                      </div>
                      
                      {isMin && profile?.pastaId === pastaName && (
                        <div className="mt-3 bg-gray-800 p-2 rounded border border-gray-700">
                          <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Investimento</label>
                          <div className="flex gap-2">
                            <input type="number" placeholder="Valor R$" value={investAmount[pastaName] || ''} onChange={e => setInvestAmount({...investAmount, [pastaName]: Number(e.target.value)})} className="w-full bg-gray-900 text-white px-2 py-1.5 rounded text-sm outline-none border border-gray-600 focus:border-indigo-500" />
                            <button onClick={() => { actions.invest(state.id, pastaName, investAmount[pastaName]); setInvestAmount({...investAmount, [pastaName]: 0}); }} className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-sm font-bold text-white transition-colors">Aplicar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Sanção/Veto */}
      {modalSancao && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl border border-yellow-600 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-2 text-yellow-500 border-b border-gray-700 pb-3">Análise de Sanção e Vetos</h3>
            <p className="text-white font-bold text-lg mb-1 mt-4">{modalSancao.templateAbbreviation} N° {modalSancao.sequentialNumber}/{getYear()}</p>
            <p className="text-gray-400 text-sm mb-6">{modalSancao.title}</p>

            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mb-6">
               <p className="text-sm font-bold text-gray-300 uppercase mb-3 border-b border-gray-800 pb-2">Texto Aprovado no Congresso</p>
               <div className="space-y-3">
                 {modalSancao.artigos?.map((art) => (
                   <label key={art.id} className={`flex items-start p-3 rounded cursor-pointer border transition-colors ${artigosVetados.includes(art.id) ? 'bg-red-900/20 border-red-900/50' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>
                      <input 
                        type="checkbox" 
                        checked={artigosVetados.includes(art.id)} 
                        onChange={(e) => {
                          if (e.target.checked) setArtigosVetados([...artigosVetados, art.id]);
                          else setArtigosVetados(artigosVetados.filter(id => id !== art.id));
                        }}
                        className="mt-1 mr-3 w-5 h-5 accent-red-500"
                      />
                      <div>
                        <span className={`font-bold block text-sm ${artigosVetados.includes(art.id) ? 'text-red-400' : 'text-gray-400'}`}>Art. {art.id}º {artigosVetados.includes(art.id) && '(VETADO)'}</span>
                        <p className={`text-sm ${artigosVetados.includes(art.id) ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{art.text}</p>
                      </div>
                   </label>
                 ))}
               </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setModalSancao(null)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Adiar Decisão</button>
              <button onClick={() => { actions.analisarSancao(modalSancao.id, artigosVetados); setModalSancao(null); }} className={`flex-1 py-3 rounded font-bold shadow-lg transition text-white ${artigosVetados.length > 0 ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
                {artigosVetados.length === modalSancao.artigos?.length ? 'Aplicar VETO TOTAL' : artigosVetados.length > 0 ? 'Sancionar com VETO PARCIAL' : 'SANCIONAR PROJETO'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Decreto Executivo */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-gray-600 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Publicar Decreto Executivo</h3>
            <select onChange={(e) => {
               const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
               if(tpl) setDecreto({...decreto, templateId: tpl.id, stateId: myJurisdiction.id, title: `${tpl.name} N° ${nextNum}/${getYear()}`, content: tpl.bodyText});
            }} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 outline-none focus:border-indigo-500">
              <option value="">-- Selecione o Tipo de Documento --</option>
              {execTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name} ({t.abbreviation})</option>)}
            </select>
            {decreto.templateId && (
              <>
                <input value={decreto.title} onChange={e => setDecreto({...decreto, title: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 font-serif outline-none" />
                
                {/* Justificativa e Intenção no Executivo */}
                <div className="bg-indigo-900/20 border border-indigo-900/50 p-4 rounded mb-4">
                   <p className="text-sm font-bold text-indigo-300 mb-2">Justificativa & Intenção Estratégica</p>
                   <textarea rows={2} placeholder="Descreva qual o seu objetivo com esta ação..." onChange={e => setDecreto({...decreto, justificativa: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded text-sm mb-2 outline-none" />
                   <select onChange={e => setDecreto({...decreto, intendedMacro: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm outline-none">
                      <option value="">Em qual área espera impacto?</option>
                      {Object.keys(TAXONOMY).map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
                   </select>
                </div>

                <textarea rows={4} value={decreto.content} onChange={e => setDecreto({...decreto, content: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 outline-none" />
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded mb-4">
                   <p className="text-sm text-blue-300 mb-2 font-bold">Ação de Nomeação (Opcional)</p>
                   <select onChange={e => setDecreto({...decreto, pastaName: e.target.value})} className="w-full bg-gray-800 text-white border border-gray-700 p-2 rounded mb-2 text-sm outline-none"><option value="">Selecione a Pasta/Ministério...</option>{Object.keys(TAXONOMY).map(pasta => <option key={pasta} value={pasta} className="capitalize">{pasta.replace('_', ' ')}</option>)}</select>
                   <select onChange={e => setDecreto({...decreto, targetUserId: e.target.value})} className="w-full bg-gray-800 text-white border border-gray-700 p-2 rounded text-sm outline-none"><option value="">Selecione o Jogador Eleito...</option>{usersList.map((u:any) => <option key={u.id} value={u.id}>{u.discordUsername}</option>)}</select>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
                   <button onClick={() => { actions.publishDecreto(decreto); setModalOpen(false); }} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-500 transition">Assinar Oficialmente</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. JUDICIÁRIO & TSE 
// ==========================================
export function JudiciarioView({ profile, decisions, usersList, states, templates, actions }: any) {
  const [modalTse, setModalTse] = useState(false);
  const [modalJud, setModalJud] = useState(false);
  const [diploma, setDiploma] = useState({ userId: '', role: 'deputado', jurisdictionId: 'federal' });
  const [sentenca, setSentenca] = useState({ title: '', content: '' });

  const judTemplates = templates.filter((t: DocTemplate) => t.branch === 'judiciario');

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row gap-4 mb-6">
         {(profile?.role === 'stf' || profile?.role === 'admin') && <button onClick={() => setModalJud(true)} className="bg-yellow-600 hover:bg-yellow-500 px-4 py-3 rounded text-white flex justify-center items-center shadow-lg transition"><Gavel className="w-4 h-4 mr-2"/> Emitir Documento Judicial</button>}
         {(profile?.role === 'ministro_tse' || profile?.role === 'admin') && <button onClick={() => setModalTse(true)} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-3 rounded text-white flex justify-center items-center shadow-lg transition"><ShieldCheck className="w-4 h-4 mr-2"/> Diplomar Eleito (TSE)</button>}
       </div>

       {decisions.map((dec: StfDecision) => (
         <div key={dec.id} className="bg-gray-800 p-6 border-l-4 border-yellow-500 rounded-lg shadow-md">
            <h3 className="font-bold text-lg text-white font-serif">{dec.title}</h3>
            <p className="text-gray-300 mt-3 whitespace-pre-wrap leading-relaxed">{dec.content}</p>
            <p className="text-xs text-yellow-500 mt-4 text-right font-mono uppercase">— Assinado: {dec.authorName}</p>
         </div>
       ))}

       {modalJud && (
         <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
           <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-yellow-600 shadow-2xl">
             <h3 className="text-xl font-bold mb-4 text-yellow-400 border-b border-gray-700 pb-2">Redação Judicial</h3>
             <select onChange={e => {
                const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
                if(tpl) setSentenca({ title: `${tpl.name}`, content: tpl.bodyText });
             }} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none">
                <option value="">-- Selecione o Tipo de Documento --</option>
                {judTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
             {sentenca.title && (
               <>
                 <input value={sentenca.title} onChange={e => setSentenca({...sentenca, title: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 font-serif outline-none" />
                 <textarea rows={8} value={sentenca.content} onChange={e => setSentenca({...sentenca, content: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none" />
                 <div className="flex gap-2">
                    <button onClick={() => setModalJud(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
                    <button onClick={() => { actions.emitirSentenca(sentenca); setModalJud(false); }} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-3 rounded font-bold shadow-lg transition">Publicar Sentença</button>
                 </div>
               </>
             )}
           </div>
         </div>
       )}

      {modalTse && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-emerald-600 shadow-2xl">
             <h3 className="text-xl font-bold mb-4 text-emerald-400 border-b border-gray-700 pb-2">Diplomação Oficial TSE</h3>
             <select onChange={e => setDiploma({...diploma, userId: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none">
                <option value="">1. Selecione o Jogador Eleito...</option>
                {usersList.map((u:any) => <option key={u.id} value={u.id}>{u.discordUsername}</option>)}
             </select>
             <select value={diploma.role} onChange={e => setDiploma({...diploma, role: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none">
                <option value="deputado">Deputado(a)</option><option value="presidente_republica">Presidente da República</option><option value="presidente_congresso">Presidente do Congresso</option><option value="governador">Governador(a)</option><option value="stf">Ministro do STF</option><option value="ministro_tse">Ministro do TSE</option>
             </select>
             <select value={diploma.jurisdictionId} onChange={e => setDiploma({...diploma, jurisdictionId: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-6 outline-none">
                <option value="federal">Governo Federal (União)</option>
                {states.filter((s:any)=>s.type === 'estadual').map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
             <div className="flex gap-2">
                <button onClick={() => setModalTse(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
                <button onClick={() => { actions.diplomar(diploma); setModalTse(false); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded font-bold shadow-lg transition">Emitir Diploma</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. ADMIN VIEW (COMPLETO: Tempo, Apuração, Templates e Jogadores)
// ==========================================
export function AdminView({ usersList, states, templates, projects, decrees, gameTime, activeEffects, actions }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState(false);
  const [modalTpl, setModalTpl] = useState(false);
  const [stateData, setStateData] = useState({ name: '', budget: '', populacao: '', pib: '', type: 'estadual' });
  const [tplData, setTplData] = useState<any>({ branch: 'legislativo', isBudget: false });

  const [apuracaoModal, setApuracaoModal] = useState<any>(null);
  const [effectForm, setEffectForm] = useState({ stateId: '', macro: 'saude', micro: '', pointsPerMonth: 0, remainingMonths: 1 });

  // CORREÇÃO: Assegurando que a tipagem do RpgProject e RpgDecree é respeitada nas chamadas do map
  const filteredUsers = usersList.filter((u: any) => u.discordUsername.toLowerCase().includes(searchTerm.toLowerCase()));
  const docsToApurar = [
    ...projects.filter((p: RpgProject) => ['sancionado', 'promulgado'].includes(p.status) && !p.apurado).map((p: RpgProject) => ({...p, docType: 'projects'})),
    ...decrees.filter((d: RpgDecree) => !d.apurado).map((d: RpgDecree) => ({...d, docType: 'decrees'}))
  ];

  return (
    <div className="space-y-8">
      
      {/* O MOTOR DO TEMPO */}
      <div className="bg-emerald-900/20 border border-emerald-700 rounded-xl p-6 shadow-lg flex justify-between items-center">
         <div>
           <h3 className="text-2xl font-bold text-emerald-400 flex items-center"><Clock className="w-6 h-6 mr-3"/> Relógio do Jogo</h3>
           <p className="text-gray-300 mt-1">Efeitos Ativos: <strong className="text-white">{activeEffects.length}</strong> influenciando os dados estaduais.</p>
         </div>
         <button onClick={actions.advanceTime} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-4 rounded-lg text-white font-bold text-lg shadow-xl transition transform hover:scale-105">
           Avançar para Mês {gameTime.month === 12 ? 1 : gameTime.month + 1}
         </button>
      </div>

      {/* PAINEL DE APURAÇÃO DO MESTRE */}
      <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-indigo-400"/> Central de Apuração (Mestre)</h3>
        <p className="text-sm text-gray-400 mb-6">Julgue as intenções dos jogadores nos documentos finalizados e defina o impacto mecânico no jogo.</p>
        
        <div className="space-y-4">
           {docsToApurar.map((doc: any) => (
             <div key={doc.id} className="bg-gray-900 p-4 rounded border border-gray-700 flex justify-between items-center shadow-sm">
                <div>
                  <span className="text-xs font-bold uppercase bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700">{doc.docType === 'projects' ? 'Lei Aprovada' : 'Decreto/Portaria'}</span>
                  <h4 className="font-bold text-white mt-3 font-serif text-lg">{doc.title}</h4>
                  <p className="text-sm text-indigo-300 italic mt-1 bg-indigo-900/20 p-2 rounded border border-indigo-900/50">Intenção: {doc.intendedMacro?.replace('_', ' ') || 'Geral'} - "{doc.justificativa || 'Sem justificativa'}"</p>
                </div>
                <button onClick={() => { 
                  setApuracaoModal(doc); 
                  setEffectForm({
                    ...effectForm, 
                    macro: doc.intendedMacro || 'saude',
                    stateId: doc.jurisdictionId || doc.loaDetails?.stateId || (states.length > 0 ? states[0].id : '')
                  }); 
                }} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-sm text-white font-bold shadow-lg transition ml-4">
                  Julgar Efeito
                </button>
             </div>
           ))}
           {docsToApurar.length === 0 && <p className="text-gray-500 italic border-2 border-dashed border-gray-700 p-8 rounded-lg text-center">Nenhum documento aguardando julgamento no momento.</p>}
        </div>
      </div>

      {/* TEMPLATES / MODELOS */}
      <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
           <h3 className="text-xl font-bold text-white">Modelos de Documentos Oficiais</h3>
           <button onClick={() => {setTplData({ branch: 'legislativo', isBudget: false }); setModalTpl(true);}} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white text-sm font-bold shadow-lg transition">+ Criar Modelo</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {templates.map((t: DocTemplate) => (
             <div key={t.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 relative group shadow-sm">
                <button onClick={() => actions.deleteTemplate(t.id)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4"/></button>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded uppercase border border-gray-700">{t.branch}</span>
                <h4 className="text-white font-bold mt-3">{t.name} ({t.abbreviation})</h4>
                {t.isBudget && <span className="text-xs font-bold text-green-400 mt-2 block bg-green-900/30 px-2 py-1 rounded w-max border border-green-900/50">Modelo Orçamentário (LOA)</span>}
             </div>
           ))}
        </div>
      </div>

      {/* CONTROLE DE JOGADORES */}
      <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl overflow-x-auto shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
           <h3 className="text-xl font-bold text-white">Controle de Jogadores Rápidos</h3>
           <input type="text" placeholder="🔍 Buscar jogador..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded-full text-sm outline-none focus:border-indigo-500 w-full sm:w-64 shadow-inner"/>
        </div>
        <table className="w-full text-left text-sm whitespace-nowrap text-white">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="p-3 rounded-tl border-b border-gray-700">Jogador</th>
              <th className="p-3 border-b border-gray-700">Cargo Real</th>
              <th className="p-3 border-b border-gray-700">Jurisdição</th>
              <th className="p-3 rounded-tr border-b border-gray-700">Pasta Ministerial</th>
            </tr>
          </thead>
          <tbody>{filteredUsers.map((u: any) => (
            <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
              <td className="p-3 font-bold text-indigo-300">{u.discordUsername}</td>
              <td className="p-3">
                {/* CORREÇÃO DO CARGO: Presidente do Congresso incluído na lista */}
                <select value={u.role} onChange={e => actions.updateUser(u.id, e.target.value, u.jurisdictionId, u.pastaId)} className="bg-gray-700 border border-gray-600 p-2 rounded outline-none w-full">
                  <option value="espectador">Espectador</option>
                  <option value="deputado">Deputado</option>
                  <option value="presidente_congresso">Presidente do Congresso</option>
                  <option value="presidente_republica">Presidente da República</option>
                  <option value="governador">Governador</option>
                  <option value="ministro_tse">Ministro TSE</option>
                  <option value="stf">Ministro do STF</option>
                  <option value="ministro">Ministro</option>
                  <option value="admin">Admin (Mestre)</option>
                </select>
              </td>
              <td className="p-3">
                <select value={u.jurisdictionId || 'federal'} onChange={e => actions.updateUser(u.id, u.role, e.target.value, u.pastaId)} className="bg-gray-700 border border-gray-600 p-2 rounded outline-none w-full">
                  <option value="federal">Governo Federal (União)</option>
                  {states.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </td>
              <td className="p-3">
                <select value={u.pastaId || ''} onChange={e => actions.updateUser(u.id, u.role, u.jurisdictionId, e.target.value)} className="bg-gray-700 border border-gray-600 p-2 rounded outline-none w-full" disabled={u.role !== 'ministro'}>
                  <option value="">Nenhuma / Não Aplicável</option>
                  {Object.keys(TAXONOMY).map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
                </select>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="pt-4 border-t border-gray-700">
        <button onClick={() => setModalState(true)} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white font-bold shadow-lg transition">Criar Entidade / Estado</button>
      </div>

      {/* MODAL: JULGAMENTO / APURAÇÃO */}
      {apuracaoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-indigo-600 shadow-2xl">
            <h3 className="text-xl font-bold text-indigo-400 mb-4 border-b border-gray-700 pb-2">Aplicar Efeito Mecânico</h3>
            <p className="text-white mb-4">Doc: <strong className="font-serif">{apuracaoModal.title}</strong></p>
            
            <div className="bg-gray-900 p-4 rounded mb-4 border border-gray-700">
              
              {/* NOVA MELHORIA: Admin escolhe/confirma qual Estado sofre o efeito */}
              <label className="text-xs text-gray-400 uppercase font-bold">Estado Alvo do Impacto</label>
              <select value={effectForm.stateId} onChange={e => setEffectForm({...effectForm, stateId: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 mb-4 outline-none">
                 {states.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                 <option value="federal">União Federal (Geral)</option>
              </select>

              <label className="text-xs text-gray-400 uppercase font-bold">Macro Área</label>
              <select value={effectForm.macro} onChange={e => setEffectForm({...effectForm, macro: e.target.value as MacroArea})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 mb-4 outline-none">
                 {Object.keys(TAXONOMY).map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
              </select>
              
              <label className="text-xs text-gray-400 uppercase font-bold">Micro Dado Específico</label>
              <select value={effectForm.micro} onChange={e => setEffectForm({...effectForm, micro: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 mb-4 outline-none">
                 <option value="">-- Selecione o dado que vai alterar --</option>
                 {TAXONOMY[effectForm.macro as MacroArea]?.map(micro => <option key={micro} value={micro}>{micro}</option>)}
              </select>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Pontos por Mês</label>
                  <input type="number" placeholder="Ex: 5 (ou -3)" value={effectForm.pointsPerMonth} onChange={e => setEffectForm({...effectForm, pointsPerMonth: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 font-mono outline-none"/>
                  <span className="text-xs text-gray-500 mt-1 block">Positivo ou Negativo</span>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 uppercase font-bold">Duração (Meses)</label>
                  <input type="number" min="1" value={effectForm.remainingMonths} onChange={e => setEffectForm({...effectForm, remainingMonths: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 font-mono outline-none"/>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
               <button onClick={() => setApuracaoModal(null)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
               <button onClick={() => { 
                 if(!effectForm.micro) return alert("Selecione um Micro Dado!");
                 actions.apurarDocumento(apuracaoModal.docType, apuracaoModal.id, {
                   sourceDocTitle: apuracaoModal.title,
                   stateId: effectForm.stateId,
                   macro: effectForm.macro, 
                   micro: effectForm.micro,
                   pointsPerMonth: effectForm.pointsPerMonth, 
                   remainingMonths: effectForm.remainingMonths
                 }); 
                 setApuracaoModal(null); 
               }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded font-bold shadow-lg transition"><Zap className="w-4 h-4 inline mr-2"/>Decretar Efeito</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR TEMPLATE */}
      {modalTpl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-gray-600 shadow-2xl">
             <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Novo Modelo</h3>
             
             <label className="text-xs text-gray-400 uppercase font-bold">Poder / Aba</label>
             <select value={tplData.branch} onChange={e => setTplData({...tplData, branch: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mt-1 mb-4 outline-none">
               <option value="legislativo">Legislativo (Projetos, PECs, etc)</option>
               <option value="executivo">Executivo (Medidas Provisórias, Portarias)</option>
               <option value="judiciario">Judiciário (Súmulas, Sentenças)</option>
             </select>
             
             <div className="flex gap-2 mb-4">
               <div className="flex-1">
                 <input placeholder="Nome (Ex: Proj. Lei)" onChange={e => setTplData({...tplData, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded outline-none" />
               </div>
               <div className="w-1/3">
                 <input placeholder="Sigla (Ex: PL)" onChange={e => setTplData({...tplData, abbreviation: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded outline-none" />
               </div>
             </div>
             
             {tplData.branch === 'legislativo' && (
               <label className="flex items-center text-sm text-green-400 mb-4 bg-gray-900 border border-gray-700 p-3 rounded cursor-pointer shadow-sm">
                 <input type="checkbox" checked={tplData.isBudget} onChange={e => setTplData({...tplData, isBudget: e.target.checked})} className="mr-3 w-4 h-4 accent-green-500" />
                 Ativar lógica de Distribuição de Orçamento Financeiro (LOA)
               </label>
             )}
             
             <textarea rows={5} placeholder="Corpo Padrão do Documento..." onChange={e => setTplData({...tplData, bodyText: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-6 font-serif outline-none" />
             
             <div className="flex gap-2">
               <button onClick={() => setModalTpl(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
               <button onClick={() => { actions.saveTemplate(tplData); setModalTpl(false); }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded font-bold shadow-lg transition">Salvar Modelo</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR ESTADO */}
      {modalState && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-gray-600 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Nova Entidade / União</h3>
            <select onChange={e => setStateData({...stateData, type: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none">
              <option value="estadual">Estado (Unidade Federativa)</option><option value="federal">União (Governo Federal)</option>
            </select>
            <input placeholder="Nome (Ex: Minas Gerais)" onChange={e => setStateData({...stateData, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none" />
            <input type="number" placeholder="Orçamento Inicial Total (R$)" onChange={e => setStateData({...stateData, budget: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none" />
            <div className="flex gap-2 mb-6">
               <input type="number" placeholder="População" onChange={e => setStateData({...stateData, populacao: e.target.value})} className="w-1/2 bg-gray-900 border border-gray-700 text-white p-3 rounded outline-none" />
               <input type="number" placeholder="PIB Anual (R$)" onChange={e => setStateData({...stateData, pib: e.target.value})} className="w-1/2 bg-gray-900 border border-gray-700 text-white p-3 rounded outline-none" />
            </div>
            <div className="flex gap-2">
               <button onClick={() => setModalState(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
               <button onClick={() => { actions.createState(stateData); setModalState(false); }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded font-bold shadow-lg transition">Fundar Entidade</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function NavButton({ icon: Icon, label, active, onClick }: any) { return ( <button onClick={onClick} className={`flex md:flex-row flex-col items-center justify-center md:justify-start p-3 rounded-lg flex-1 md:flex-none transition-colors ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}> <Icon className="w-6 h-6 md:w-5 md:h-5 md:mr-3 mb-1 md:mb-0" /><span className="text-xs md:text-sm font-medium">{label}</span> </button> ); }
export function DataBar({ label, value, icon: Icon, color }: any) { 
  return ( 
    <div> 
      <div className="flex justify-between text-sm mb-1">
        <span className="flex items-center text-gray-300">
          {Icon && <Icon className="w-4 h-4 mr-2" />} 
          {label}
        </span>
        <span className="font-bold">{Math.floor(value)}/100</span>
      </div> 
      <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
        <div style={{ width: `${Math.min(100, Math.max(0, value))}%` }} className={`h-full ${color} transition-all duration-1000`}></div>
      </div> 
    </div> 
  ); 
}