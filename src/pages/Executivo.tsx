// src/pages/Executivo.tsx
import React, { useState } from 'react';
import { FileSignature, FileBadge, Building, Trash2 } from 'lucide-react'; // Adicionado Trash2
import { RpgData, RpgProject, UserProfile, DocTemplate, RpgDecree, TAXONOMY, DecreeAction } from '../types';
import { formatMoney, getYear } from '../components/UI';

export function ExecutivoView({ profile, states, usersList, decrees, templates, projects, actions }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSancao, setModalSancao] = useState<RpgProject | null>(null);
  const [artigosVetados, setArtigosVetados] = useState<number[]>([]);
  
  const [decreto, setDecreto] = useState<any>({ title: '', content: '', justificativa: '', intendedMacro: '' });
  const [investAmount, setInvestAmount] = useState<Record<string, number>>({});
  const [actionsList, setActionsList] = useState<DecreeAction[]>([]); // Estado para múltiplas nomeações

  const execTemplates = templates.filter((t: DocTemplate) => t.branch === 'executivo');
  const myJurisdiction = states.find((s:any) => s.id === profile?.jurisdictionId) || { id: 'federal', name: 'União Federal' };
  const canDecree = ['presidente_republica', 'governador', 'admin'].includes(profile?.role);
  const nextNum = decrees.length > 0 ? Math.max(...decrees.map((d: any) => d.sequentialNumber)) + 1 : 1;

  const projetosAguardando = projects.filter((p: RpgProject) => p.status === 'sancao');

  const handleTemplateChange = (e: any) => {
    const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
    if(tpl) {
      setDecreto({
        ...decreto,
        templateId: tpl.id, 
        stateId: profile?.jurisdictionId || 'federal',
        title: `${tpl.name} N° ${nextNum}/${getYear()}`, 
        content: tpl.bodyText || ""
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Seção de Sanção (Mantida) */}
      {canDecree && projetosAguardando.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-bold text-yellow-500 flex items-center mb-4"><FileSignature className="w-5 h-5 mr-2"/> Aguardando Sanção</h2>
          <div className="space-y-3">
            {projetosAguardando.map((p: RpgProject) => (
              <div key={p.id} className="bg-gray-900 p-4 rounded border border-yellow-900/50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">{p.templateAbbreviation} N° {p.sequentialNumber}/{getYear()}</h4>
                  <p className="text-sm text-gray-400">{p.title}</p>
                </div>
                <button onClick={() => {setModalSancao(p); setArtigosVetados([]);}} className="bg-yellow-600 text-white px-4 py-2 rounded font-bold transition hover:bg-yellow-500">Analisar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diário Oficial */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
         <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-white">Diário Oficial</h2>
           {canDecree && <button onClick={() => setModalOpen(true)} className="bg-blue-600 px-4 py-2 rounded text-white font-bold shadow-lg hover:bg-blue-500 transition"><FileBadge className="w-4 h-4 mr-2 inline"/> Publicar Decreto</button>}
         </div>
         <div className="space-y-4">
            {decrees.map((dec: RpgDecree) => (
              <div key={dec.id} className="bg-gray-900 p-5 border-l-4 border-blue-500 rounded-lg">
                 <h3 className="text-xl font-bold text-white font-serif">{dec.title}</h3>
                 <p className="text-gray-300 mt-2 whitespace-pre-wrap">{dec.content}</p>
                 {dec.actions && dec.actions.length > 0 && (
                   <div className="mt-2 p-2 bg-black/20 rounded">
                     {dec.actions.map((a, i) => (
                       <p key={i} className="text-xs text-blue-400 uppercase font-bold">• {a.type}: {a.pastaName}</p>
                     ))}
                   </div>
                 )}
                 <p className="text-xs text-gray-500 mt-3 font-mono">Assinado: {dec.authorName}</p>
              </div>
            ))}
         </div>
      </div>

      {/* Modal Novo Decreto com múltiplas ações */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-gray-600 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-white">Redigir Decreto</h3>
            <select onChange={handleTemplateChange} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4">
              <option value="">Selecione o Modelo...</option>
              {execTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {decreto.templateId && (
              <>
                <input value={decreto.title} onChange={e => setDecreto({...decreto, title: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 font-serif outline-none" />
                
                <div className="bg-indigo-900/20 border border-indigo-900/50 p-4 rounded mb-4">
                   <p className="text-sm font-bold text-indigo-300 mb-2">Justificativa</p>
                   <textarea rows={2} placeholder="Sua intenção..." onChange={e => setDecreto({...decreto, justificativa: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded text-sm mb-2 outline-none" />
                   <select onChange={e => setDecreto({...decreto, intendedMacro: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm">
                      <option value="">Foco do Impacto...</option>
                      {Object.keys(TAXONOMY).map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
                   </select>
                </div>

                <textarea rows={4} value={decreto.content} onChange={e => setDecreto({...decreto, content: e.target.value})} className="w-full bg-gray-900 text-white border border-gray-700 p-3 rounded mb-4 outline-none" />
                
                {/* LISTA DE AÇÕES NO MODAL */}
                <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded mb-4">
                   <p className="text-sm text-blue-300 mb-2 font-bold">Atos Administrativos</p>
                   <div className="space-y-2 mb-3">
                     {actionsList.map((act, idx) => (
                       <div key={idx} className="flex justify-between items-center bg-gray-900 p-2 rounded text-xs">
                         <span className="text-white uppercase">{act.type} - {act.pastaName}</span>
                         <button onClick={() => setActionsList(actionsList.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={14}/></button>
                       </div>
                     ))}
                   </div>
                   <div className="flex flex-col gap-2">
                     <div className="flex gap-2">
                       <select id="act-type" className="flex-1 bg-gray-900 text-white text-xs p-2 rounded border border-gray-700">
                         <option value="nomeacao">Nomear</option><option value="exoneracao">Exonerar</option>
                       </select>
                       <select id="act-pasta" className="flex-1 bg-gray-900 text-white text-xs p-2 rounded border border-gray-700">
                         {Object.keys(TAXONOMY).map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                     </div>
                     <select id="act-user" className="w-full bg-gray-900 text-white text-xs p-2 rounded border border-gray-700">
                       <option value="">Selecione o Jogador...</option>
                       {usersList.map((u:any) => <option key={u.id} value={u.id}>{u.discordUsername}</option>)}
                     </select>
                     <button type="button" onClick={() => {
                        const t = (document.getElementById('act-type') as HTMLSelectElement).value;
                        const p = (document.getElementById('act-pasta') as HTMLSelectElement).value;
                        const u = (document.getElementById('act-user') as HTMLSelectElement).value;
                        if(u) setActionsList([...actionsList, { type: t as any, pastaName: p, userId: u }]);
                     }} className="bg-gray-700 text-white py-1 rounded text-xs font-bold hover:bg-gray-600">+ Adicionar Ato</button>
                   </div>
                </div>

                <div className="flex gap-2">
                   <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
                   <button onClick={() => { 
                     actions.publishDecreto(decreto, actionsList); 
                     setModalOpen(false); 
                     setActionsList([]); 
                    }} className="flex-1 bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-500 transition">Assinar e Publicar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Controle de Pastas e Tesouro (Mantido conforme sua versão anterior) */}
    </div>
  );
}
