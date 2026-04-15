import React, { useState } from 'react';
import { FileSignature, FileBadge, Building, Trash2, EyeOff } from 'lucide-react';
import { RpgProject, DocTemplate, RpgDecree, TAXONOMY, DecreeAction, MacroArea } from '../types';
import { formatMoney, getYear } from '../components/UI';

export function ExecutivoView({ profile, states, usersList, decrees, projects, templates, actions, gameTime, showToast }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSancao, setModalSancao] = useState<RpgProject | null>(null);
  const [artigosVetados, setArtigosVetados] = useState<number[]>([]);
  
  const [decreto, setDecreto] = useState<any>({ 
    title: '', userText: '', templateBody: '', justificativa: '', 
    hiddenIntent: { targetMacro: 'economia', targetMicro: '', description: '' } 
  });
  const [investAmount, setInvestAmount] = useState<Record<string, number>>({});
  const [actionsList, setActionsList] = useState<DecreeAction[]>([]);

  const execTemplates = templates.filter((t: DocTemplate) => {
    if (t.branch !== 'executivo') return false;
    if (profile?.role === 'ministro') return t.category === 'portaria';
    return t.category === 'decreto';
  });
  
  const myJurisdiction = states.find((s:any) => s.id === profile?.jurisdictionId) || { id: 'federal', name: 'União Federal' };
  const canDecree = ['presidente_republica', 'governador', 'admin', 'moderador', 'ministro'].includes(profile?.role);
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
        templateBody: tpl.bodyText || "{{TEXTO_JOGADOR}}",
        userText: '' 
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Seção de Sanção de Projetos */}
      {['presidente_republica', 'governador', 'admin', 'moderador'].includes(profile?.role) && projetosAguardando.length > 0 && (
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

      {/* Diário Oficial do Executivo */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-white">Diário Oficial do Executivo</h2>
           {canDecree && <button onClick={() => setModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white flex items-center shadow-lg transition"><FileBadge className="w-4 h-4 mr-2"/> Publicar Atos</button>}
         </div>
         <div className="space-y-4">
            {decrees.map((dec: any) => (
              <div key={dec.id} className="bg-gray-900 p-5 border-l-4 border-blue-500 rounded-lg relative group">
                 {profile?.role === 'admin' && (
                   <button onClick={() => actions.deleteDocument('decrees', dec.id)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={18}/></button>
                 )}
                 <h3 className="text-xl font-bold text-white font-serif">{dec.title}</h3>
                 <p className="text-gray-300 mt-2 whitespace-pre-wrap">{dec.content}</p>
                 <p className="text-xs text-gray-500 mt-3 font-mono uppercase">Assinado por: {dec.authorName} | {states.find((s:any)=>s.id === dec.jurisdictionId)?.name || 'Federal'}</p>
              </div>
            ))}
         </div>
      </div>

      {/* Modal de Sanção com Exibição de Emendas */}
      {modalSancao && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl border border-yellow-600 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-2xl font-bold mb-2 text-yellow-500 border-b border-gray-700 pb-3">Análise de Sanção</h3>
            
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mb-4">
               <p className="text-sm font-bold text-gray-300 uppercase mb-3">Texto Original e Artigos</p>
               <div className="space-y-3">
                 {modalSancao.artigos?.map((art: any) => (
                   <label key={art.id} className={`flex items-start p-3 rounded cursor-pointer border transition-colors ${artigosVetados.includes(art.id) ? 'bg-red-900/20 border-red-900/50' : 'bg-gray-800 border-gray-700'}`}>
                      <input type="checkbox" checked={artigosVetados.includes(art.id)} onChange={(e) => { if (e.target.checked) setArtigosVetados([...artigosVetados, art.id]); else setArtigosVetados(artigosVetados.filter(id => id !== art.id)); }} className="mt-1 mr-3 w-5 h-5 accent-red-500" />
                      <div>
                        <span className="font-bold block text-sm">Art. {art.id}º</span>
                        <p className={`text-sm ${artigosVetados.includes(art.id) ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{art.text}</p>
                      </div>
                   </label>
                 ))}
               </div>
            </div>

            {/* Exibição das Emendas Aprovadas no Legislativo */}
            {modalSancao.amendments?.filter((am:any) => am.status === 'aprovada').length > 0 && (
              <div className="bg-green-900/10 p-4 rounded-lg border border-green-900/30 mb-6">
                <p className="text-sm font-bold text-green-400 uppercase mb-2">Emendas Incorporadas pelo Congresso:</p>
                {modalSancao.amendments.filter((am:any) => am.status === 'aprovada').map((am:any) => (
                  <p key={am.id} className="text-sm text-gray-300 italic border-l-2 border-green-500 pl-2 mb-2">"{am.text}" — <span className="text-gray-500 font-normal">{am.authorName}</span></p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setModalSancao(null)} className="flex-1 py-3 text-gray-400">Adiar</button>
              <button onClick={() => { actions.analisarSancao(modalSancao.id, artigosVetados); setModalSancao(null); }} className="flex-1 bg-green-600 text-white py-3 rounded font-bold">Sancionar / Vetar</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Redação do Executivo com Intenção Oculta */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-gray-600 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-white">Redigir Ato Oficial</h3>
            <select onChange={handleTemplateChange} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 outline-none">
              <option value="">-- Selecione o Modelo --</option>
              {execTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name} ({t.abbreviation})</option>)}
            </select>

            {decreto.templateId && (
              <>
                <input placeholder="Título do Ato" value={decreto.title} onChange={e => setDecreto({...decreto, title: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 font-serif outline-none" />
                
                {/* Intenção Oculta para os Moderadores */}
                <div className="bg-indigo-950/50 border border-indigo-900/80 p-4 rounded-lg mb-4 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                   <div className="flex items-center mb-2"><span className="text-sm font-bold text-indigo-300">Intenção Oculta</span><span className="ml-2 text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded-full uppercase">Moderadores</span></div>
                   <div className="flex gap-2 mb-2">
                     <select onChange={e => setDecreto({...decreto, hiddenIntent: {...decreto.hiddenIntent, targetMacro: e.target.value}})} className="flex-1 bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm">
                        {Object.keys(TAXONOMY).map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
                     </select>
                     <select onChange={e => setDecreto({...decreto, hiddenIntent: {...decreto.hiddenIntent, targetMicro: e.target.value}})} className="flex-1 bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm">
                        <option value="">-- Micro Dado --</option>
                        {TAXONOMY[decreto.hiddenIntent.targetMacro as MacroArea]?.map(micro => <option key={micro} value={micro}>{micro}</option>)}
                     </select>
                   </div>
                   <textarea rows={2} placeholder="Descreva o impacto desejado para a moderação..." onChange={e => setDecreto({...decreto, hiddenIntent: {...decreto.hiddenIntent, description: e.target.value}})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm outline-none" />
                </div>

                <textarea rows={6} placeholder="Conteúdo do Ato..." value={decreto.userText} onChange={e => setDecreto({...decreto, userText: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 outline-none" />

                <div className="flex gap-2">
                   <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-gray-400">Cancelar</button>
                   <button onClick={() => { 
                     const templateLimpo = decreto.templateBody.replace(/\\n/g, '\n');
                     const finalContent = templateLimpo.replace('{{TEXTO_JOGADOR}}', decreto.userText);
                     actions.publishDecreto({...decreto, content: finalContent}, actionsList); 
                     setModalOpen(false); 
                     setDecreto({ title: '', userText: '', templateBody: '', justificativa: '', hiddenIntent: { targetMacro: 'economia', targetMicro: '', description: '' } });
                   }} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold shadow-lg">Assinar e Publicar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
