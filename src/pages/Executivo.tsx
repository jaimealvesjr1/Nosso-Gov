import React, { useState } from 'react';
import { FileSignature, FileBadge, Building, Trash2 } from 'lucide-react';
import { RpgData, RpgProject, UserProfile, DocTemplate, RpgDecree, TAXONOMY, DecreeAction } from '../types';
import { formatMoney, getYear } from '../components/UI';

export function ExecutivoView({ profile, states, usersList, decrees, templates, projects, actions, gameTime }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSancao, setModalSancao] = useState<RpgProject | null>(null);
  const [artigosVetados, setArtigosVetados] = useState<number[]>([]);
  
  // FIX: Estado atualizado para lidar com a minuta (templateBody) e o texto do jogador (userText)
  const [decreto, setDecreto] = useState<any>({ title: '', userText: '', templateBody: '', justificativa: '', intendedMacro: '' });
  const [investAmount, setInvestAmount] = useState<Record<string, number>>({});
  const [actionsList, setActionsList] = useState<DecreeAction[]>([]);

  const execTemplates = templates.filter((t: DocTemplate) => {
    if (t.branch !== 'executivo') return false;
    if (profile?.role === 'ministro' || profile?.role === 'espectador') return t.category === 'portaria';
    return t.category === 'decreto';
  });
  
  const myJurisdiction = states.find((s:any) => s.id === profile?.jurisdictionId) || states.find((s:any) => s.type === 'federal') || { id: 'federal', name: 'União Federal' };
  const canDecree = ['presidente_republica', 'governador', 'admin', 'ministro'].includes(profile?.role);
  const nextNum = decrees.length > 0 ? Math.max(...decrees.map((d: any) => d.sequentialNumber)) + 1 : 1;

  const projetosAguardando = projects.filter((p: RpgProject) => p.status === 'sancao');

  const handleTemplateChange = (e: any) => {
    const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
    if(tpl) {
      setDecreto({ 
        ...decreto, 
        templateId: tpl.id, 
        category: tpl.category, 
        stateId: myJurisdiction.id, 
        title: `${tpl.name} N° ${nextNum}/${gameTime.year || getYear()}`, 
        templateBody: tpl.bodyText || "{{TEXTO_JOGADOR}}", // Guarda a minuta
        userText: '' 
      });
    }
  };

  return (
    <div className="space-y-8">
      {['presidente_republica', 'governador', 'admin'].includes(profile?.role) && projetosAguardando.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-yellow-500 flex items-center mb-4"><FileSignature className="w-5 h-5 mr-2"/> Projetos Aguardando Sanção</h2>
          <div className="space-y-3">
            {projetosAguardando.map((p: RpgProject) => (
              <div key={p.id} className="bg-gray-900 p-4 rounded border border-yellow-900/50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white text-lg">{p.templateAbbreviation} N° {p.sequentialNumber}/{p.year || getYear()}</h4>
                  <p className="text-sm text-gray-400">{p.title}</p>
                </div>
                <button onClick={() => {setModalSancao(p); setArtigosVetados([]);}} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded font-bold transition">Analisar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-white">Diário Oficial do Executivo</h2>
           {canDecree && <button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white flex items-center shadow-lg transition"><FileBadge className="w-4 h-4 mr-2"/> Publicar Documento</button>}
         </div>
         <div className="space-y-4">
            {decrees.map((dec: RpgDecree) => (
              <div key={dec.id} className="bg-gray-900 p-5 border-l-4 border-blue-500 rounded-lg">
                 <h3 className="text-xl font-bold text-white font-serif">{dec.title}</h3>
                 <p className="text-gray-300 mt-2 whitespace-pre-wrap">{dec.content}</p>
                 {dec.actions && dec.actions.length > 0 && (
                   <div className="mt-4 p-3 bg-black/20 rounded border border-gray-700">
                     <p className="text-xs font-bold text-gray-500 uppercase mb-2">Atos Administrativos:</p>
                     {dec.actions.map((a, i) => (
                       <p key={i} className="text-sm text-blue-300 font-bold">• {a.type === 'nomeacao' ? 'NOMEAÇÃO' : 'EXONERAÇÃO'}: <span className="capitalize text-gray-300 font-normal">{a.pastaName.replace('_', ' ')}</span></p>
                     ))}
                   </div>
                 )}
                 <p className="text-xs text-gray-500 mt-3 font-mono uppercase">Assinado por: {dec.authorName}</p>
              </div>
            ))}
            {decrees.length === 0 && <p className="text-gray-500 text-sm">Nenhum decreto ou portaria publicado.</p>}
         </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Controle de Pastas & Tesouro</h2>
        {states.map((state: RpgData) => {
          const isMin = profile?.role === 'ministro' && (profile?.jurisdictionId === state.id || (profile?.jurisdictionId === 'federal' && state.type === 'federal'));
          
          const pastasArray = Array.from(new Set([...Object.keys(TAXONOMY), ...Object.keys(state.allocatedBudget || {})]));
          
          return (
            <div key={state.id} className="mb-6">
              <h3 className="text-xl font-bold text-white flex items-center mb-4"><Building className="w-5 h-5 mr-3 text-gray-400"/> {state.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pastasArray.map((pastaName: string) => {
                  const dono = usersList.find((u:UserProfile) => u.pastaId === pastaName && (u.jurisdictionId === state.id || (u.jurisdictionId === 'federal' && state.type === 'federal')));
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

      {modalSancao && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl border border-yellow-600 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-2 text-yellow-500 border-b border-gray-700 pb-3">Análise de Sanção e Vetos</h3>
            <p className="text-white font-bold text-lg mb-1 mt-4">{modalSancao.templateAbbreviation} N° {modalSancao.sequentialNumber}/{modalSancao.year || getYear()}</p>
            <p className="text-gray-400 text-sm mb-6">{modalSancao.title}</p>

            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mb-6">
               <p className="text-sm font-bold text-gray-300 uppercase mb-3 border-b border-gray-800 pb-2">Texto Aprovado no Congresso</p>
               <div className="space-y-3">
                 {(!modalSancao.artigos || modalSancao.artigos.length === 0) && <p className="text-gray-400 text-sm italic">Projeto sem redação articulada. Clique em Sancionar.</p>}
                 {modalSancao.artigos?.map((art: any) => (
                   <label key={art.id} className={`flex items-start p-3 rounded cursor-pointer border transition-colors ${artigosVetados.includes(art.id) ? 'bg-red-900/20 border-red-900/50' : 'bg-gray-800 border-gray-700 hover:bg-gray-700'}`}>
                      <input type="checkbox" checked={artigosVetados.includes(art.id)} onChange={(e) => { if (e.target.checked) setArtigosVetados([...artigosVetados, art.id]); else setArtigosVetados(artigosVetados.filter(id => id !== art.id)); }} className="mt-1 mr-3 w-5 h-5 accent-red-500" />
                      <div>
                        <span className={`font-bold block text-sm ${artigosVetados.includes(art.id) ? 'text-red-400' : 'text-gray-400'}`}>Art. {art.id}º {artigosVetados.includes(art.id) && '(VETADO)'}</span>
                        <p className={`text-sm whitespace-pre-wrap ${artigosVetados.includes(art.id) ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{art.text}</p>
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
      
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-gray-600 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-white border-b border-gray-700 pb-2">Redigir Documento Oficial</h3>
            <select onChange={handleTemplateChange} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 outline-none focus:border-indigo-500">
              <option value="">-- Selecione o Tipo de Documento --</option>
              {execTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name} ({t.abbreviation})</option>)}
            </select>

            {decreto.templateId && (
              <>
                <input placeholder="Título" value={decreto.title} onChange={e => setDecreto({...decreto, title: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 font-serif outline-none" />
                <div className="bg-indigo-900/20 border border-indigo-900/50 p-4 rounded mb-4">
                   <p className="text-sm font-bold text-indigo-300 mb-2">Justificativa & Intenção Estratégica</p>
                   <textarea rows={2} placeholder="Descreva qual o seu objetivo..." onChange={e => setDecreto({...decreto, justificativa: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded text-sm mb-2 outline-none" />
                   <select onChange={e => setDecreto({...decreto, intendedMacro: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm outline-none">
                      <option value="">Em qual área espera impacto?</option>
                      {Object.keys(TAXONOMY).map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
                   </select>
                </div>
                
                {/* FIX: Caixa de Texto focada apenas na parte editável com o aviso visual */}
                <div className="bg-gray-950 p-3 rounded border border-gray-800 mb-2">
                   <p className="text-xs text-gray-500 uppercase font-bold mb-1">O texto abaixo será inserido automaticamente na minuta oficial.</p>
                </div>
                <textarea rows={6} placeholder="Digite as ordens/artigos do documento aqui..." value={decreto.userText} onChange={e => setDecreto({...decreto, userText: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 outline-none" />
                
                {decreto.category !== 'portaria' && (
                  <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded mb-4">
                     <p className="text-sm text-blue-300 mb-2 font-bold">Atos Administrativos (Opcional)</p>
                     <div className="space-y-2 mb-3">
                       {actionsList.map((act, idx) => (
                         <div key={idx} className="flex justify-between items-center bg-gray-900 p-2 rounded text-xs border border-gray-700">
                           <span className="text-white uppercase font-bold">{act.type} - {act.pastaName.replace('_', ' ')}</span>
                           <button onClick={() => setActionsList(actionsList.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 transition"><Trash2 size={14}/></button>
                         </div>
                       ))}
                     </div>
                     <div className="flex flex-col gap-2 border-t border-blue-900/50 pt-3">
                       <div className="flex gap-2">
                         <select id="act-type" className="flex-1 bg-gray-900 text-white text-xs p-2 rounded border border-gray-700 outline-none">
                           <option value="nomeacao">Nomear Ministro</option><option value="exoneracao">Exonerar Ministro</option>
                         </select>
                         <select id="act-pasta" className="flex-1 bg-gray-900 text-white text-xs p-2 rounded border border-gray-700 outline-none">
                           {Array.from(new Set([...Object.keys(TAXONOMY), ...Object.keys(myJurisdiction.allocatedBudget || {})])).map(m => <option key={m as string} value={m as string} className="capitalize">{(m as string).replace('_', ' ')}</option>)}
                         </select>
                       </div>
                       <select id="act-user" className="w-full bg-gray-900 text-white text-xs p-2 rounded border border-gray-700 outline-none">
                         <option value="">Selecione o Jogador Alvo...</option>
                         {usersList.map((u:any) => <option key={u.id} value={u.id}>{u.discordUsername}</option>)}
                       </select>
                       <button type="button" onClick={() => {
                          const t = (document.getElementById('act-type') as HTMLSelectElement).value;
                          const p = (document.getElementById('act-pasta') as HTMLSelectElement).value;
                          const u = (document.getElementById('act-user') as HTMLSelectElement).value;
                          if(u) setActionsList([...actionsList, { type: t as any, pastaName: p, userId: u }]);
                       }} className="bg-gray-700 text-white py-2 rounded text-xs font-bold hover:bg-gray-600 transition border border-gray-600">+ Adicionar Ato</button>
                     </div>
                  </div>
                )}

                <div className="flex gap-2">
                   <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
                   <button onClick={() => { 
                     // FIX: Substitui a TAG pelo texto do jogador!
                     const finalContent = decreto.templateBody.replace('{{TEXTO_JOGADOR}}', decreto.userText);
                     
                     actions.publishDecreto({...decreto, content: finalContent}, actionsList); 
                     setModalOpen(false); 
                     setActionsList([]); 
                     setDecreto({ title: '', userText: '', templateBody: '', justificativa: '', intendedMacro: '' });
                   }} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-500 shadow-lg transition">Assinar e Publicar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
