import React, { useState } from 'react';
import { Plus, Check, X, FileSignature, Gavel, ShieldCheck, FileBadge, Building, Trash2 } from 'lucide-react';
import { RpgData, RpgProject, UserProfile, StfDecision, LoaArticle, DocTemplate, RpgDecree } from '../types';

const formatMoney = (val: number) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const getYear = () => new Date().getFullYear();

// ==========================================
// 1. LEGISLATIVO 
// ==========================================
export function LegislativoView({ profile, projects, states, templates, actions }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ category: 'geral' });
  const [loaArtigos, setLoaArtigos] = useState<{pastaName: string, percentage: number}[]>([{ pastaName: '', percentage: 0 }]);

  const legTemplates = templates.filter((t: DocTemplate) => t.branch === 'legislativo');
  const myJurisdiction = states.find((s:any) => s.id === profile?.jurisdictionId) || { id: 'federal', name: 'União Federal', totalBudget: 10000000 };
  const canPropose = ['deputado', 'presidente_republica', 'governador', 'admin'].includes(profile?.role);
  const nextNum = projects.length > 0 ? Math.max(...projects.map((p: any) => p.sequentialNumber)) + 1 : 1;
  const totalPercentage = loaArtigos.reduce((acc, art) => acc + (art.percentage || 0), 0);

  const handleTemplateChange = (e: any) => {
    const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
    if(tpl) setFormData({...formData, templateId: tpl.id, title: `${tpl.name} N° ${nextNum}/${getYear()}`, description: tpl.bodyText, category: tpl.isBudget ? 'loa' : 'geral'});
  };

  return (
    <div className="space-y-4">
      {canPropose && <button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white flex items-center shadow-lg"><Plus className="w-4 h-4 mr-2" /> Redigir Documento Oficial</button>}

      {projects.map((p: RpgProject) => (
        <div key={p.id} className="bg-gray-800 p-5 border border-gray-700 rounded-lg flex flex-col md:flex-row gap-4 shadow-md">
          <div className="flex-1">
            <span className="text-xs font-bold text-gray-400 uppercase bg-gray-900 px-2 py-1 rounded mr-2">{p.status.replace('_', ' ')}</span>
            {p.category === 'loa' && <span className="text-xs font-bold text-green-400 uppercase bg-green-900/30 px-2 py-1 rounded border border-green-900/50">LOA Orçamentária</span>}
            <h3 className="text-xl font-bold text-white mt-2 mb-2 font-serif">{p.templateAbbreviation || 'PL'} N° {p.sequentialNumber}/{getYear()} - {p.title}</h3>
            <p className="text-sm text-gray-300 mb-2 whitespace-pre-wrap">{p.description}</p>
            <p className="text-xs text-gray-500 font-mono">Autoria: {p.authorName}</p>
            
            {p.category === 'loa' && p.loaDetails && (
              <div className="bg-gray-900 p-4 rounded border border-gray-700 mt-3 text-sm">
                <strong className="text-green-400 border-b border-gray-700 pb-2 block mb-3">Distribuição do Orçamento Anual</strong>
                {p.loaDetails.artigos.map((art, idx) => (
                  <div key={idx} className="flex justify-between text-gray-300 py-1 border-b border-gray-800 last:border-0">
                    <span className="capitalize flex items-center"><Check className="w-3 h-3 mr-2 text-green-500"/> {art.pastaName}</span>
                    <span className="font-mono text-green-400 font-bold">Percentual Baseado no Arrecadado</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 min-w-[200px] justify-center border-t md:border-t-0 md:border-l border-gray-700 pt-4 md:pt-0 md:pl-4">
             {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'proposto' && <button onClick={() => actions.changeStatus(p.id, 'pauta')} className="bg-gray-700 py-2 rounded text-sm text-white">Colocar em Pauta</button>}
             {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'pauta' && <button onClick={() => actions.changeStatus(p.id, 'votacao')} className="bg-indigo-600 py-2 rounded text-sm text-white shadow-lg">Abrir Votação</button>}
             {(profile?.role === 'presidente_congresso' || profile?.role === 'admin') && p.status === 'votacao' && <button onClick={() => actions.changeStatus(p.id, 'aprovado_congresso')} className="bg-green-600 py-2 rounded text-sm text-white shadow-lg">Aprovar no Plenário</button>}
             
             {profile?.role === 'deputado' && p.status === 'votacao' && (
                <div className="flex gap-1 bg-gray-900 p-1 rounded shadow-inner">
                  <button onClick={() => actions.vote(p.id, 'sim')} className={`flex-1 py-2 rounded ${p.votes[profile.id] === 'sim' ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-green-900'}`}><Check className="w-4 h-4 mx-auto"/></button>
                  <button onClick={() => actions.vote(p.id, 'nao')} className={`flex-1 py-2 rounded ${p.votes[profile.id] === 'nao' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-red-900'}`}><X className="w-4 h-4 mx-auto"/></button>
                  <button onClick={() => actions.vote(p.id, 'abstencao')} className={`flex-1 py-2 rounded font-bold ${p.votes[profile.id] === 'abstencao' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:bg-yellow-900'}`}>-</button>
                </div>
             )}
             
             {(profile?.role === 'presidente_republica' || profile?.role === 'governador' || profile?.role === 'admin') && p.status === 'aprovado_congresso' && (
                <><button onClick={() => actions.changeStatus(p.id, 'sancionado')} className="bg-green-600 py-2 rounded text-sm font-bold flex justify-center items-center text-white"><FileSignature className="w-4 h-4 mr-2"/> Sancionar</button><button onClick={() => actions.changeStatus(p.id, 'vetado')} className="bg-red-600 py-2 rounded text-sm text-white">Vetar</button></>
             )}
          </div>
        </div>
      ))}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-gray-600 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-3">Redação Legislativa Oficial</h3>
            
            <div className="bg-gray-900 p-3 rounded mb-4 border border-gray-700">
               <span className="text-xs text-gray-400 block uppercase">Jurisdição Auto-Detectada:</span>
               <span className="font-bold text-indigo-300">{myJurisdiction.name}</span>
            </div>

            <select onChange={handleTemplateChange} className="w-full bg-gray-900 border border-gray-700 p-3 rounded text-white mb-4 outline-none focus:border-indigo-500">
              <option value="">-- Selecione o Tipo de Documento --</option>
              {legTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name} ({t.abbreviation})</option>)}
            </select>

            {formData.templateId && (
              <>
                <input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded mb-4 font-serif" />
                <textarea rows={5} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded mb-4" />
                
                {formData.category === 'loa' && (
                  <div className="bg-gray-900 p-4 rounded border border-gray-700 mb-4">
                    <p className="text-sm font-bold text-green-400 mb-3 border-b border-gray-800 pb-2">Artigos (Distribuição Percentual - {formatMoney(myJurisdiction.totalBudget)})</p>
                    {loaArtigos.map((art, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <input placeholder="Ex: Min. da Saúde" value={art.pastaName} onChange={e => { const n = [...loaArtigos]; n[idx].pastaName = e.target.value; setLoaArtigos(n); }} className="flex-1 bg-gray-800 border border-gray-700 text-white p-2 rounded text-sm"/>
                        <div className="w-1/3 relative">
                           <input type="number" placeholder="%" max="100" min="0" value={art.percentage || ''} onChange={e => { const n = [...loaArtigos]; n[idx].percentage = Number(e.target.value); setLoaArtigos(n); }} className="w-full bg-gray-800 border border-gray-700 text-white p-2 pr-6 rounded text-sm"/>
                           <span className="absolute right-2 top-2 text-gray-400 text-sm">%</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center mt-3">
                       <button onClick={() => setLoaArtigos([...loaArtigos, {pastaName:'', percentage:0}])} className="text-xs bg-gray-800 px-2 py-1 rounded text-indigo-400 font-bold">+ Novo Artigo</button>
                       <span className={`text-sm font-bold ${totalPercentage === 100 ? 'text-green-500' : 'text-red-500'}`}>Alocado: {totalPercentage}% / 100%</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded">Cancelar</button>
                  <button onClick={() => { actions.protocolProject(formData, loaArtigos); setModalOpen(false); }} className="flex-1 bg-indigo-600 text-white py-3 rounded font-bold">Protocolar à Mesa</button>
                </div>
              </>
            )}
            {!formData.templateId && <button onClick={() => setModalOpen(false)} className="w-full mt-4 py-3 text-gray-400 hover:bg-gray-700 rounded">Cancelar</button>}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. EXECUTIVO (Agora exibe o Diário Oficial de Decretos)
// ==========================================
export function ExecutivoView({ profile, states, usersList, decrees, templates, actions }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [decreto, setDecreto] = useState<any>({ targetUserId: '', pastaName: '' });

  const execTemplates = templates.filter((t: DocTemplate) => t.branch === 'executivo');
  const myJurisdiction = states.find((s:any) => s.id === profile?.jurisdictionId) || { id: 'federal', name: 'União Federal' };
  const canDecree = ['presidente_republica', 'governador', 'admin'].includes(profile?.role);
  const nextNum = decrees.length > 0 ? Math.max(...decrees.map((d: any) => d.sequentialNumber)) + 1 : 1;

  const handleTemplateChange = (e: any) => {
    const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
    if(tpl) setDecreto({...decreto, templateId: tpl.id, stateId: myJurisdiction.id, title: `${tpl.name} N° ${nextNum}/${getYear()}`, content: tpl.bodyText});
  };

  return (
    <div className="space-y-6">
      {canDecree && <button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white flex items-center shadow-lg"><FileBadge className="w-4 h-4 mr-2"/> Publicar no Diário Oficial</button>}

      {/* Lista de Decretos Oficiais */}
      {decrees.map((dec: RpgDecree) => (
        <div key={dec.id} className="bg-gray-800 p-5 border-l-4 border-blue-500 rounded-lg shadow-md">
           <h3 className="text-xl font-bold text-white font-serif">{dec.title}</h3>
           <p className="text-gray-300 mt-2 whitespace-pre-wrap">{dec.content}</p>
           <p className="text-xs text-gray-500 mt-3 font-mono uppercase">Assinado por: {dec.authorName}</p>
        </div>
      ))}

      <div className="pt-6 border-t border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6">Controle de Pastas & Tesouro</h2>
        {states.filter((s:any) => s.id === profile?.jurisdictionId || profile?.role === 'admin' || profile?.role === 'espectador').map((state: RpgData) => {
          const isMin = profile?.role === 'ministro' && profile?.jurisdictionId === state.id;
          const pastasArray = Object.entries(state.dynamicPastas || {});
          
          return (
            <div key={state.id} className="bg-gray-800 p-6 border border-gray-700 rounded-xl mb-6 shadow-lg">
              <h3 className="text-xl font-bold text-white flex items-center mb-4"><Building className="w-5 h-5 mr-3 text-gray-400"/> {state.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastasArray.map(([pastaName, data]: any) => {
                  const dono = usersList.find((u:UserProfile) => u.pastaId === pastaName && u.jurisdictionId === state.id);
                  return (
                    <div key={pastaName} className="bg-gray-900 p-4 border border-gray-700 rounded-lg">
                      <h4 className="capitalize font-bold text-lg text-blue-300 mb-1">{pastaName}</h4>
                      <p className="text-xs text-gray-400 mb-3 border-b border-gray-800 pb-2">Resp: {dono?.discordUsername || 'Vago'}</p>
                      <div className="flex justify-between mb-2"><span className="text-sm text-gray-400">Caixa:</span><span className="text-green-400 font-mono font-bold">{formatMoney(data.orcamento)}</span></div>
                      {isMin && profile?.pastaId === pastaName && <button onClick={() => actions.invest(state.id, pastaName)} className="w-full bg-blue-600 hover:bg-blue-500 py-2 rounded text-sm font-bold text-white mt-2">Investir R$ 100k</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-gray-600 shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Publicar Decreto Executivo</h3>
            <div className="bg-gray-900 p-3 rounded mb-4 border border-gray-700"><span className="text-xs text-gray-400 block uppercase">Jurisdição Auto-Detectada:</span><span className="font-bold text-blue-300">{myJurisdiction.name}</span></div>

            <select onChange={handleTemplateChange} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 outline-none">
              <option value="">-- Selecione o Tipo de Documento --</option>
              {execTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name} ({t.abbreviation})</option>)}
            </select>

            {decreto.templateId && (
              <>
                <input value={decreto.title} onChange={e => setDecreto({...decreto, title: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 font-serif" />
                <textarea rows={6} value={decreto.content} onChange={e => setDecreto({...decreto, content: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4" />
                
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded mb-4">
                   <p className="text-sm text-blue-300 mb-2 font-bold">Ação de Nomeação (Opcional)</p>
                   <select onChange={e => setDecreto({...decreto, pastaName: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded mb-2 text-sm outline-none">
                     <option value="">Selecione a Pasta/Ministério...</option>
                     {Object.keys(myJurisdiction.dynamicPastas || {}).map(pasta => <option key={pasta} value={pasta}>{pasta}</option>)}
                   </select>
                   <select onChange={e => setDecreto({...decreto, targetUserId: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded text-sm outline-none">
                     <option value="">Selecione o Jogador Eleito...</option>
                     {usersList.map((u:any) => <option key={u.id} value={u.id}>{u.discordUsername}</option>)}
                   </select>
                </div>
                
                <div className="flex gap-2">
                   <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded">Cancelar</button>
                   <button onClick={() => { actions.publishDecreto(decreto); setModalOpen(false); }} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold">Assinar Oficialmente</button>
                </div>
              </>
            )}
            {!decreto.templateId && <button onClick={() => setModalOpen(false)} className="w-full mt-4 py-3 text-gray-400 hover:bg-gray-700 rounded">Cancelar</button>}
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
  const handleTemplateChange = (e: any) => {
    const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
    if(tpl) setSentenca({ title: `${tpl.name}`, content: tpl.bodyText });
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row gap-4 mb-6">
         {(profile?.role === 'stf' || profile?.role === 'admin') && <button onClick={() => setModalJud(true)} className="bg-yellow-600 hover:bg-yellow-500 px-4 py-3 rounded text-white flex justify-center items-center shadow-lg"><Gavel className="w-4 h-4 mr-2"/> Emitir Documento Judicial</button>}
         {(profile?.role === 'ministro_tse' || profile?.role === 'admin') && <button onClick={() => setModalTse(true)} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-3 rounded text-white flex justify-center items-center shadow-lg"><ShieldCheck className="w-4 h-4 mr-2"/> Diplomar Eleito (TSE)</button>}
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
             <select onChange={handleTemplateChange} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none">
                <option value="">-- Selecione o Tipo de Documento --</option>
                {judTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
             {sentenca.title && (
               <>
                 <input value={sentenca.title} onChange={e => setSentenca({...sentenca, title: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded mb-4 font-serif" />
                 <textarea rows={8} value={sentenca.content} onChange={e => setSentenca({...sentenca, content: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded mb-4" />
                 <div className="flex gap-2">
                    <button onClick={() => setModalJud(false)} className="flex-1 py-3 text-gray-400">Cancelar</button>
                    <button onClick={() => { actions.emitirSentenca(sentenca); setModalJud(false); }} className="flex-1 bg-yellow-600 text-white py-3 rounded font-bold">Publicar Sentença</button>
                 </div>
               </>
             )}
             {!sentenca.title && <button onClick={() => setModalJud(false)} className="w-full py-3 text-gray-400">Cancelar</button>}
           </div>
         </div>
       )}

      {modalTse && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-emerald-600 shadow-2xl">
             {/* Componente idêntico ao de cima, omitido para simplificar a leitura. */}
             <h3 className="text-xl font-bold mb-4 text-emerald-400 border-b border-gray-700 pb-2">Diplomação Oficial TSE</h3>
             <select onChange={e => setDiploma({...diploma, userId: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none">
                <option value="">1. Selecione o Jogador Eleito...</option>
                {usersList.map((u:any) => <option key={u.id} value={u.id}>{u.discordUsername}</option>)}
             </select>
             <select value={diploma.role} onChange={e => setDiploma({...diploma, role: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none">
                <option value="deputado">Deputado(a)</option><option value="presidente_republica">Presidente da República</option><option value="presidente_congresso">Presidente do Congresso</option><option value="governador">Governador(a)</option>
             </select>
             <select value={diploma.jurisdictionId} onChange={e => setDiploma({...diploma, jurisdictionId: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-6 outline-none">
                <option value="federal">Governo Federal (União)</option>
                {states.filter((s:any)=>s.type === 'estadual').map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
             <div className="flex gap-2">
                <button onClick={() => setModalTse(false)} className="flex-1 py-3 text-gray-400">Cancelar</button>
                <button onClick={() => { actions.diplomar(diploma); setModalTse(false); }} className="flex-1 bg-emerald-600 text-white py-3 rounded font-bold">Emitir Diploma</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. ADMIN VIEW (Agora com Gestor de Templates)
// ==========================================
export function AdminView({ usersList, states, templates, actions }: any) {
  const [modalTpl, setModalTpl] = useState(false);
  const [tplData, setTplData] = useState<any>({ branch: 'legislativo', isBudget: false });

  return (
    <div className="space-y-8">
      
      <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-bold text-white">Modelos de Documentos Oficiais</h3>
           <button onClick={() => {setTplData({ branch: 'legislativo', isBudget: false }); setModalTpl(true);}} className="bg-indigo-600 px-4 py-2 rounded text-white text-sm font-bold">+ Criar Modelo</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {templates.map((t: DocTemplate) => (
             <div key={t.id} className="bg-gray-900 p-4 rounded border border-gray-700 relative group">
                <button onClick={() => actions.deleteTemplate(t.id)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4"/></button>
                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded uppercase">{t.branch}</span>
                <h4 className="text-white font-bold mt-2">{t.name} ({t.abbreviation})</h4>
                {t.isBudget && <span className="text-xs text-green-400 mt-1 block">Modelo Orçamentário</span>}
             </div>
           ))}
           {templates.length === 0 && <p className="text-gray-500 text-sm">Nenhum modelo criado. Crie PLs, Decretos, etc.</p>}
        </div>
      </div>

      <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl overflow-x-auto shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-white">Controle de Jogadores Rápidos</h3>
        <table className="w-full text-left text-sm whitespace-nowrap text-white">
          <thead className="bg-gray-900 text-gray-400"><tr><th className="p-3">Jogador</th><th className="p-3">Cargo Real</th><th className="p-3">Jurisdição</th></tr></thead>
          <tbody>{usersList.map((u: any) => (
            <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-750">
              <td className="p-3 font-bold">{u.discordUsername}</td>
              <td className="p-3"><select value={u.role} onChange={e => actions.updateUser(u.id, e.target.value, u.jurisdictionId, u.pastaId)} className="bg-gray-700 border border-gray-600 p-2 rounded outline-none"><option value="espectador">Espectador</option><option value="deputado">Deputado</option><option value="presidente_republica">Presidente</option><option value="governador">Governador</option><option value="admin">Admin</option></select></td>
              <td className="p-3"><select value={u.jurisdictionId || 'federal'} onChange={e => actions.updateUser(u.id, u.role, e.target.value, u.pastaId)} className="bg-gray-700 border border-gray-600 p-2 rounded outline-none"><option value="federal">Governo Federal</option>{states.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {modalTpl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-gray-600 shadow-2xl">
             <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Novo Modelo de Documento</h3>
             
             <label className="text-xs text-gray-400 uppercase font-bold">Poder / Aba</label>
             <select value={tplData.branch} onChange={e => setTplData({...tplData, branch: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded mt-1 mb-4 outline-none">
                <option value="legislativo">Legislativo (Projetos de Lei)</option>
                <option value="executivo">Executivo (Decretos / Medidas)</option>
                <option value="judiciario">Judiciário (Sentenças / Súmulas)</option>
             </select>

             <div className="flex gap-2 mb-4">
               <div className="flex-1">
                 <label className="text-xs text-gray-400 uppercase font-bold">Nome (Ex: Proj. Lei Complementar)</label>
                 <input onChange={e => setTplData({...tplData, name: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded mt-1 outline-none" />
               </div>
               <div className="w-1/3">
                 <label className="text-xs text-gray-400 uppercase font-bold">Sigla (Ex: PLP)</label>
                 <input onChange={e => setTplData({...tplData, abbreviation: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded mt-1 outline-none" />
               </div>
             </div>

             {tplData.branch === 'legislativo' && (
               <label className="flex items-center text-sm text-green-400 mb-4 cursor-pointer bg-gray-900 p-3 rounded">
                  <input type="checkbox" checked={tplData.isBudget} onChange={e => setTplData({...tplData, isBudget: e.target.checked})} className="mr-3 w-4 h-4" />
                  Este modelo ativa o sistema de Orçamento Financeiro (LOA)
               </label>
             )}

             <label className="text-xs text-gray-400 uppercase font-bold">Corpo Padrão (Texto que vem pré-preenchido)</label>
             <textarea rows={6} placeholder="Art 1° - Fica decretado que..." onChange={e => setTplData({...tplData, bodyText: e.target.value})} className="w-full bg-gray-900 text-white p-3 rounded mt-1 mb-6 outline-none font-serif" />

             <div className="flex gap-2">
                <button onClick={() => setModalTpl(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
                <button onClick={() => { actions.saveTemplate(tplData); setModalTpl(false); }} className="flex-1 bg-indigo-600 text-white py-3 rounded font-bold shadow-lg transition">Salvar Modelo</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function NavButton({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex md:flex-row flex-col items-center justify-center md:justify-start p-3 rounded-lg flex-1 md:flex-none transition-colors ${active ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>
      <Icon className="w-6 h-6 md:w-5 md:h-5 md:mr-3 mb-1 md:mb-0" /><span className="text-xs md:text-sm font-medium">{label}</span>
    </button>
  );
}
export function DataBar({ label, value, icon: Icon, color }: any) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1"><span className="flex items-center text-gray-300"><Icon className="w-4 h-4 mr-2" /> {label}</span><span className="font-bold">{value}/100</span></div>
      <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700"><div style={{ width: `${Math.min(100, Math.max(0, value))}%` }} className={`h-full ${color} transition-all duration-1000`}></div></div>
    </div>
  );
}
