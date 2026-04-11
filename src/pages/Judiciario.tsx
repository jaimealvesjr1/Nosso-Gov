import React, { useState } from 'react';
import { Gavel, ShieldCheck, Trash2 } from 'lucide-react';
import { StfDecision, DocTemplate } from '../types';

export function JudiciarioView({ profile, decisions, usersList, states, templates, actions }: any) {
  const [modalTse, setModalTse] = useState(false);
  const [modalJud, setModalJud] = useState(false);
  
  // Novos estados para a lista de Diplomados
  const [diplomados, setDiplomados] = useState<any[]>([]);
  const [diplomaItem, setDiplomaItem] = useState({ userId: '', role: 'deputado', jurisdictionId: 'federal' });
  const [sentenca, setSentenca] = useState({ title: '', content: '' });

  const judTemplates = templates.filter((t: DocTemplate) => t.branch === 'judiciario');

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row gap-4 mb-6">
         {(profile?.role === 'stf' || profile?.role === 'admin') && <button onClick={() => setModalJud(true)} className="bg-yellow-600 hover:bg-yellow-500 px-4 py-3 rounded text-white flex justify-center items-center shadow-lg transition"><Gavel className="w-4 h-4 mr-2"/> Emitir Documento Judicial</button>}
         {(profile?.role === 'ministro_tse' || profile?.role === 'admin') && <button onClick={() => setModalTse(true)} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-3 rounded text-white flex justify-center items-center shadow-lg transition"><ShieldCheck className="w-4 h-4 mr-2"/> Diplomar Eleitos em Lote</button>}
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
             <h3 className="text-xl font-bold mb-4 text-emerald-400 border-b border-gray-700 pb-2">Cerimônia de Diplomação TSE</h3>
             
             {/* LISTA DINÂMICA DE ELEITOS */}
             {diplomados.length > 0 && (
               <div className="mb-4 bg-gray-900 p-3 rounded border border-gray-700">
                 <p className="text-xs font-bold text-gray-400 uppercase mb-2">Pauta de Diplomação:</p>
                 {diplomados.map((d, idx) => (
                   <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-800 py-2 last:border-0">
                     <span className="text-gray-300 font-bold">{usersList.find((u:any)=>u.id===d.userId)?.discordUsername} <span className="text-emerald-400 font-normal ml-1">({d.role.replace('_',' ')})</span></span>
                     <button onClick={() => setDiplomados(diplomados.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 transition"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 ))}
               </div>
             )}

             <select value={diplomaItem.userId} onChange={e => setDiplomaItem({...diplomaItem, userId: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-2 outline-none focus:border-emerald-500">
                <option value="">Selecione o Jogador Eleito...</option>
                {usersList.map((u:any) => <option key={u.id} value={u.id}>{u.discordUsername}</option>)}
             </select>
             
             <div className="flex gap-2 mb-4">
               <select value={diplomaItem.role} onChange={e => setDiplomaItem({...diplomaItem, role: e.target.value})} className="flex-1 bg-gray-900 border border-gray-700 text-white p-3 rounded outline-none focus:border-emerald-500">
                  <option value="deputado">Deputado(a)</option><option value="presidente_republica">Presidente da Rep.</option><option value="presidente_congresso">Pres. Congresso</option><option value="governador">Governador(a)</option><option value="stf">Ministro do STF</option><option value="ministro_tse">Ministro do TSE</option>
               </select>
               <select value={diplomaItem.jurisdictionId} onChange={e => setDiplomaItem({...diplomaItem, jurisdictionId: e.target.value})} className="flex-1 bg-gray-900 border border-gray-700 text-white p-3 rounded outline-none focus:border-emerald-500">
                  <option value="federal">União Federal</option>
                  {states.filter((s:any)=>s.type === 'estadual').map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>
             </div>

             <button onClick={() => {
               if(diplomaItem.userId) { setDiplomados([...diplomados, diplomaItem]); setDiplomaItem({...diplomaItem, userId: ''}); }
             }} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded font-bold mb-6 transition border border-gray-600">+ Inserir na Cerimônia</button>

             <div className="flex gap-2">
                <button onClick={() => { setModalTse(false); setDiplomados([]); }} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
                <button onClick={() => { actions.diplomar(diplomados); setModalTse(false); setDiplomados([]); }} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded font-bold shadow-lg transition">Emitir Documento Final</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
