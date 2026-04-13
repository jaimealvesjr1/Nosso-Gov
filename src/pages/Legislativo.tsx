import React, { useState } from 'react';
import { Plus, Check, X, Gavel, Target, Trash2 } from 'lucide-react';
import { RpgProject, LoaArticle, DocTemplate, ProjectArticle, TAXONOMY } from '../types';
import { getYear } from '../components/UI';

export function LegislativoView({ profile, projects, states, templates, actions }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ category: 'geral' });
  const [artigosText, setArtigosText] = useState<ProjectArticle[]>([{ id: 1, text: '', isVetoed: false }]);
  const [loaArtigos, setLoaArtigos] = useState<LoaArticle[]>([{ pastaName: 'saude', percentage: 0 }]);
  const [filterTab, setFilterTab] = useState<'tramitacao' | 'historico'>('tramitacao');
  
  const [emendaText, setEmendaText] = useState('');
  const [emendaLoa, setEmendaLoa] = useState({ pastaName: 'saude', percentage: 0, customName: '' });

  const legTemplates = templates.filter((t: DocTemplate) => t.branch === 'legislativo');
  const myJurisdiction = states.find((s:any) => s.id === profile?.jurisdictionId) || { id: 'federal', name: 'União Federal', macro: {caixa: 1000000} };

  const totalPercentage = loaArtigos.reduce((acc, art) => acc + (art.percentage || 0), 0);
  const nextNum = projects.length > 0 ? Math.max(...projects.map((p: any) => p.sequentialNumber)) + 1 : 1;

  const toRoman = (num: number) => {
    const roman = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
    return roman[num] || String(num);
  };

  const handleProtocol = () => {
    let finalArtigos = artigosText.filter(a => (a.text || '').trim() !== '');
    
    // FIX Fase 1.1: Numeração Romana Automática na Criação da LOA
    if (formData.category === 'loa' && finalArtigos.length === 0) {
      const distributionText = loaArtigos.map((a, i) => `${toRoman(i+1)}. ${(a.pastaName === 'outro' ? (a.customName || 'RESERVA') : a.pastaName).toUpperCase()} - ${a.percentage}%`).join('\n');
      finalArtigos = [{ id: 1, text: `Fica aprovado o Orçamento com a seguinte distribuição:\n${distributionText}`, isVetoed: false }];
    }
    
    actions.protocolProject(formData, finalArtigos, formData.category === 'loa' ? loaArtigos : []);
    setModalOpen(false); setFormData({ category: 'geral' }); setArtigosText([{ id: 1, text: '', isVetoed: false }]);
    setLoaArtigos([{ pastaName: 'saude', percentage: 0 }]);
  };

  const filteredProjects = projects.filter((p: RpgProject) => {
    if (filterTab === 'tramitacao') return ['proposto', 'pauta', 'votacao', 'sancao', 'vetado', 'votacao_veto'].includes(p.status);
    return ['sancionado', 'promulgado', 'arquivo'].includes(p.status);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
         {['deputado', 'presidente_republica', 'governador', 'admin'].includes(profile?.role) && <button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white font-bold shadow-lg transition"><Plus className="w-4 h-4 inline mr-2"/> Redigir Documento</button>}
         <div className="flex bg-gray-800 rounded p-1 border border-gray-700">
           <button onClick={() => setFilterTab('tramitacao')} className={`px-4 py-1 rounded text-sm transition-colors ${filterTab==='tramitacao'?'bg-gray-700 text-white font-bold':'text-gray-400'}`}>Tramitação</button>
           <button onClick={() => setFilterTab('historico')} className={`px-4 py-1 rounded text-sm transition-colors ${filterTab==='historico'?'bg-gray-700 text-white font-bold':'text-gray-400'}`}>Histórico</button>
         </div>
      </div>

      {filteredProjects.length === 0 && <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">Nenhum projeto encontrado.</div>}

      {filteredProjects.map((p: RpgProject) => {
        const vSim = Object.values(p.votes || {}).filter(v => v === 'sim').length;
        const vNao = Object.values(p.votes || {}).filter(v => v === 'nao').length;
        const vAbs = Object.values(p.votes || {}).filter(v => v === 'abstencao').length;

        return (
          <div key={p.id} className="bg-gray-800 p-5 border border-gray-700 rounded-lg shadow-md mb-4">
             <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                   <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-gray-400 uppercase bg-gray-900 px-2 py-1 rounded border border-gray-700">{p.status.replace('_', ' ')}</span>
                      
                      {['votacao', 'votacao_veto', 'sancao', 'sancionado', 'vetado', 'promulgado', 'arquivo'].includes(p.status) && (
                        <div className="flex gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-gray-600">
                          <span className="text-xs font-bold text-green-400">SIM: {vSim}</span>
                          <span className="text-xs font-bold text-red-400">NÃO: {vNao}</span>
                          <span className="text-xs font-bold text-yellow-400">ABS: {vAbs}</span>
                        </div>
                      )}
                   </div>
                   
                   <h3 className="text-xl font-bold text-white mt-3 mb-2 font-serif">{p.templateAbbreviation} N° {p.sequentialNumber}/{getYear()} - {p.title}</h3>
                   <p className="text-xs text-gray-500 font-mono mb-4">Autoria: {p.authorName}</p>
                   
                   {p.justificativa && (
                     <div className="bg-gray-900/50 p-3 rounded border border-gray-700 mb-3 shadow-inner">
                        <p className="text-xs text-indigo-400 font-bold uppercase mb-1"><Target className="w-3 h-3 inline mr-1"/> Justificativa & Intenção (Foco: {p.intendedMacro?.replace('_',' ') || 'Geral'})</p>
                        <p className="text-sm text-gray-300 italic">"{p.justificativa}"</p>
                     </div>
                   )}
                   
                   <div className="bg-gray-900/40 p-4 rounded mt-4 border border-gray-700 font-serif leading-relaxed whitespace-pre-wrap">
                      {p.artigos?.map((art) => (
                        <p key={art.id} className={`text-sm mb-2 ${art.isVetoed ? 'text-red-500 line-through opacity-50' : 'text-gray-200'}`}>
                          <strong>Art. {art.id}º</strong> - {art.text}
                        </p>
                      ))}
                      {p.amendments?.filter(am => am.status === 'aprovada').map(am => (
                        <p key={am.id} className="text-sm mb-2 text-indigo-300 border-l-2 border-indigo-500 pl-3">
                          <strong>Emenda ({am.authorName}):</strong> {am.text}
                        </p>
                      ))}
                   </div>

                   {/* PAINEL DE EMENDAS */}
                   {p.status === 'pauta' && (
                     <div className="mt-4 border-t border-gray-700 pt-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Emendas em Debate:</p>
                        {p.amendments?.map(am => {
                          const emSim = Object.values(am.votes || {}).filter(v => v === 'sim').length;
                          const emNao = Object.values(am.votes || {}).filter(v => v === 'nao').length;
                          return (
                            <div key={am.id} className="bg-gray-900 p-3 rounded mb-2 flex flex-col text-sm border border-gray-800">
                               <span className={am.status === 'proposta' ? 'text-yellow-400' : am.status === 'aprovada' ? 'text-green-400' : 'text-red-400'}>
                                 [{am.status.toUpperCase()}] <strong className="text-gray-300">{am.authorName}</strong>: {am.text}
                               </span>
                               
                               {am.status === 'proposta' && (
                                 <div className="flex justify-between items-center mt-3 border-t border-gray-800 pt-2">
                                    <div className="flex gap-4 items-center">
                                       <span className="text-xs text-gray-500">Votos: <span className="text-green-400 font-bold">S:{emSim}</span> | <span className="text-red-400 font-bold">N:{emNao}</span></span>
                                       {['deputado', 'presidente_congresso'].includes(profile?.role) && (
                                         <div className="flex gap-1">
                                           <button onClick={() => actions.voteEmenda(p.id, am.id, 'sim')} className="px-2 py-1 bg-gray-800 border border-gray-700 text-green-400 rounded text-xs hover:bg-green-900/50">Sim</button>
                                           <button onClick={() => actions.voteEmenda(p.id, am.id, 'nao')} className="px-2 py-1 bg-gray-800 border border-gray-700 text-red-400 rounded text-xs hover:bg-red-900/50">Não</button>
                                         </div>
                                       )}
                                    </div>
                                    {profile?.role === 'presidente_congresso' && (
                                      <div className="flex gap-2">
                                        <button onClick={() => actions.decidirEmenda(p.id, am.id, true)} className="text-green-500 hover:bg-green-900/50 px-2 py-1 rounded text-xs flex items-center border border-green-900/50"><Check size={14} className="mr-1"/> Aprovar</button>
                                        <button onClick={() => actions.decidirEmenda(p.id, am.id, false)} className="text-red-500 hover:bg-red-900/50 px-2 py-1 rounded text-xs flex items-center border border-red-900/50"><X size={14} className="mr-1"/> Rejeitar</button>
                                      </div>
                                    )}
                                 </div>
                               )}
                            </div>
                          )
                        })}
                        
                        {/* FIX Fase 1.2: Presidente do Congresso não pode propor emendas */}
                        {['deputado', 'presidente_republica'].includes(profile?.role) && (
                          <div className="flex flex-col gap-2 mt-3 p-3 bg-gray-950 rounded border border-gray-800">
                             <div className="flex gap-2">
                                <input value={emendaText} onChange={e => setEmendaText(e.target.value)} placeholder="Propor alterar, adicionar ou suprimir artigo..." className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none"/>
                                <button onClick={() => { actions.proporEmenda(p.id, emendaText); setEmendaText(''); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-bold transition">Protocolar Texto</button>
                             </div>
                             
                             {/* NOVA FUNCIONALIDADE: EMENDA ORÇAMENTÁRIA INTELIGENTE */}
                             {p.category === 'loa' && (
                               <div className="flex gap-2 items-center mt-2 border-t border-gray-800 pt-2">
                                  <span className="text-xs text-gray-500 font-bold uppercase">Emenda de Orçamento:</span>
                                  <select value={emendaLoa.pastaName} onChange={e => setEmendaLoa({...emendaLoa, pastaName: e.target.value})} className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none">
                                     {Object.keys(TAXONOMY).map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                                     <option value="outro">Outro/Reserva...</option>
                                  </select>
                                  {emendaLoa.pastaName === 'outro' && <input placeholder="Nome" value={emendaLoa.customName} onChange={e=>setEmendaLoa({...emendaLoa, customName: e.target.value})} className="bg-gray-900 border border-gray-700 rounded w-24 px-2 py-1 text-xs text-white outline-none"/>}
                                  <input type="number" placeholder="%" value={emendaLoa.percentage || ''} onChange={e => setEmendaLoa({...emendaLoa, percentage: Number(e.target.value)})} className="w-16 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none"/>
                                  <button onClick={() => {
                                    const pName = emendaLoa.pastaName === 'outro' ? (emendaLoa.customName || 'Nova Pasta') : emendaLoa.pastaName;
                                    const txt = `Altera a dotação orçamentária da pasta ${pName.toUpperCase()} para ${emendaLoa.percentage}%.`;
                                    actions.proporEmenda(p.id, txt, { pastaName: emendaLoa.pastaName, customName: emendaLoa.customName, newPercentage: emendaLoa.percentage });
                                    setEmendaLoa({ pastaName: 'saude', percentage: 0, customName: '' });
                                  }} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-bold transition">Propor Valores</button>
                               </div>
                             )}
                          </div>
                        )}
                     </div>
                   )}
                </div>

                <div className="flex flex-col gap-2 min-w-[200px] border-t md:border-t-0 md:border-l border-gray-700 pt-4 md:pt-0 pl-0 md:pl-4 justify-center">
                   {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'proposto' && <button onClick={() => actions.changeStatus(p.id, 'pauta')} className="bg-gray-700 hover:bg-gray-600 py-2 rounded text-sm text-white transition">Colocar em Pauta</button>}
                   {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'pauta' && <button onClick={() => actions.changeStatus(p.id, 'votacao')} className="bg-indigo-600 hover:bg-indigo-500 py-2 rounded text-sm text-white shadow-lg transition">Abrir Votação (PL)</button>}
                   {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'votacao' && <button onClick={() => actions.encerrarVotacao(p.id, false)} className="bg-emerald-600 hover:bg-emerald-500 py-2 rounded text-sm text-white shadow-lg transition"><Gavel className="w-4 h-4 inline mr-2"/>Encerrar Votação</button>}
                   {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'votacao_veto' && <button onClick={() => actions.encerrarVotacao(p.id, true)} className="bg-orange-600 hover:bg-orange-500 py-2 rounded text-sm text-white shadow-lg transition"><Gavel className="w-4 h-4 inline mr-2"/>Encerrar Votação (Veto)</button>}
                   
                   {profile?.role === 'deputado' && (p.status === 'votacao' || p.status === 'votacao_veto') && (
                     <div className="flex flex-col gap-1 bg-gray-900 p-2 rounded border border-gray-700">
                       <p className="text-xs text-center font-bold text-gray-400 uppercase mb-1">{p.status === 'votacao_veto' ? 'Derrubar o Veto?' : 'Seu Voto no PL'}</p>
                       <div className="flex gap-1">
                         <button onClick={() => actions.vote(p.id, 'sim')} className={`flex-1 py-2 rounded transition-colors ${p.votes?.[profile.id] === 'sim' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-green-900'}`}>S</button>
                         <button onClick={() => actions.vote(p.id, 'nao')} className={`flex-1 py-2 rounded transition-colors ${p.votes?.[profile.id] === 'nao' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-red-900'}`}>N</button>
                         <button onClick={() => actions.vote(p.id, 'abstencao')} className={`flex-1 py-2 rounded transition-colors ${p.votes?.[profile.id] === 'abstencao' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-yellow-900'}`}>-</button>
                       </div>
                     </div>
                   )}
                </div>
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
                   <p className="text-sm font-bold text-indigo-300 mb-2">Justificativa & Intenção Estratégica</p>
                   <textarea rows={2} placeholder="Descreva o objetivo prático..." onChange={e => setFormData({...formData, justificativa: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded text-sm mb-2 outline-none" />
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
                   <button onClick={() => setArtigosText([...artigosText, {id: artigosText.length + 1, text: '', isVetoed: false}])} className="text-xs bg-gray-800 border border-gray-700 px-3 py-2 rounded text-indigo-400 font-bold hover:bg-gray-700 transition">+ Adicionar Artigo (Texto)</button>
                </div>
                
                {formData.category === 'loa' && (
                  <div className="bg-gray-900 p-4 rounded border border-gray-700 mb-4">
                    <p className="text-sm font-bold text-green-400 mb-3">Distribuição do Orçamento</p>
                    {loaArtigos.map((art: any, idx) => (
                      <div key={idx} className="flex flex-col gap-2 mb-3 bg-gray-950 p-2 rounded border border-gray-800">
                        <div className="flex w-full gap-2 items-center">
                          <select value={art.pastaName} onChange={e => { const n = [...loaArtigos]; n[idx].pastaName = e.target.value; if(e.target.value !== 'outro') n[idx].customName = ''; setLoaArtigos(n); }} className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded text-sm outline-none capitalize">
                            {Object.keys(TAXONOMY).map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                            <option value="outro">Outro (Novo Ministério/Reserva)...</option>
                          </select>
                          <div className="w-1/3 relative">
                            <input type="number" placeholder="%" value={art.percentage || ''} onChange={e => { const n = [...loaArtigos]; n[idx].percentage = Number(e.target.value); setLoaArtigos(n); }} className="w-full bg-gray-800 border border-gray-700 text-white p-2 pr-6 rounded text-sm outline-none"/>
                            <span className="absolute right-2 top-2 text-gray-400 text-sm">%</span>
                          </div>
                          {loaArtigos.length > 1 && (
                            <button onClick={() => setLoaArtigos(loaArtigos.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 ml-1"><Trash2 size={16}/></button>
                          )}
                        </div>
                        {art.pastaName === 'outro' && (
                          <input type="text" placeholder="Nome da nova pasta (ex: Ministério do Futuro)" value={art.customName || ''} onChange={e => { const n = [...loaArtigos]; n[idx].customName = e.target.value; setLoaArtigos(n); }} className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded text-sm outline-none"/>
                        )}
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
          </div>
        </div>
      )}
    </div>
  );
}
