import React, { useState } from 'react';
import { Plus, Check, X, FileSignature, Gavel, Target, Trash2 } from 'lucide-react';
import { RpgProject, LoaArticle, DocTemplate, ProjectArticle, TAXONOMY } from '../types';
import { formatMoney, getYear } from '../components/UI';

export function LegislativoView({ profile, projects, states, templates, actions }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ category: 'geral' });
  const [artigosText, setArtigosText] = useState<ProjectArticle[]>([{ id: 1, text: '', isVetoed: false }]);
  const [loaArtigos, setLoaArtigos] = useState<LoaArticle[]>([{ pastaName: 'saude', percentage: 0 }]);
  const [filterTab, setFilterTab] = useState<'tramitacao' | 'historico'>('tramitacao');

  const legTemplates = templates.filter((t: DocTemplate) => t.branch === 'legislativo');
  const myJurisdiction = states.find((s:any) => s.id === profile?.jurisdictionId) || { id: 'federal', name: 'União Federal', macro: {caixa: 1000000} };

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
