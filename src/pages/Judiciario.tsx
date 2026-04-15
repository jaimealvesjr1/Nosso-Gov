import React, { useState } from 'react';
import { Gavel, ShieldCheck, Trash2, Calendar, UserPlus } from 'lucide-react';
import { StfDecision, DocTemplate, TermoPosse, UserProfile, RpgData } from '../types';
import { formatRole } from '../components/UI';

export function JudiciarioView({ profile, decisions, posses, usersList, states, templates, gameTime, showToast, actions }: any) {
  const [subTab, setSubTab] = useState<'stf' | 'tse' | 'historico'>('stf');
  const [modalJud, setModalJud] = useState(false);
  const [modalTse, setModalTse] = useState(false);
  
  // Estados para Diplomação do TSE
  const [diplomados, setDiplomados] = useState<any[]>([]);
  const [posseData, setPosseData] = useState({ 
    startMonth: gameTime.month, startYear: gameTime.year, 
    endMonth: gameTime.month, endYear: gameTime.year + 1 
  });
  const [diplomaItem, setDiplomaItem] = useState({ userId: '', role: 'deputado', jurisdictionId: 'federal' });

  const [sentenca, setSentenca] = useState({ title: '', userText: '', templateBody: '' });
  const judTemplates = templates.filter((t: DocTemplate) => t.branch === 'judiciario');

  return (
    <div className="space-y-6">
      {/* Navegação Interna */}
      <div className="flex gap-2 bg-gray-800 p-2 rounded-xl border border-gray-700">
        <button onClick={() => setSubTab('stf')} className={`flex-1 py-2 rounded text-sm font-bold transition ${subTab === 'stf' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>STF (Decisões)</button>
        <button onClick={() => setSubTab('tse')} className={`flex-1 py-2 rounded text-sm font-bold transition ${subTab === 'tse' ? 'bg-emerald-900/40 text-emerald-400' : 'text-gray-400 hover:text-white'}`}>TSE (Diplomação)</button>
        <button onClick={() => setSubTab('historico')} className={`flex-1 py-2 rounded text-sm font-bold transition ${subTab === 'historico' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Atas de Posse</button>
      </div>

      {/* SUB-ABA: STF */}
      {subTab === 'stf' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Jurisprudência da Suprema Corte</h3>
            {['stf', 'admin', 'moderador'].includes(profile?.role) && (
              <button onClick={() => setModalJud(true)} className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded text-white text-sm font-bold flex items-center shadow-lg transition">
                <Gavel className="w-4 h-4 mr-2"/> Nova Sentença
              </button>
            )}
          </div>
          {decisions.map((dec: StfDecision) => (
            <div key={dec.id} className="bg-gray-800 p-6 border-l-4 border-yellow-500 rounded-lg shadow-md relative group">
              {profile?.role === 'admin' && (
                <button onClick={() => actions.deleteDocument('judiciary', dec.id)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={18}/></button>
              )}
              <h3 className="font-bold text-lg text-white font-serif">{dec.title}</h3>
              <p className="text-gray-300 mt-3 whitespace-pre-wrap leading-relaxed">{dec.content}</p>
              <p className="text-xs text-yellow-500 mt-4 text-right font-mono uppercase">— Ministro: {dec.authorName}</p>
            </div>
          ))}
        </div>
      )}

      {/* SUB-ABA: TSE (Ação) */}
      {subTab === 'tse' && (
        <div className="bg-gray-800 p-8 rounded-xl border border-emerald-700 shadow-xl text-center">
          <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-4"/>
          <h2 className="text-2xl font-bold text-white mb-2">Tribunal Superior Eleitoral</h2>
          <p className="text-gray-400 max-w-md mx-auto mb-8">O TSE é responsável por diplomar os eleitos, garantindo a legitimidade dos mandatos e a transição de poder.</p>
          
          {['ministro_tse', 'admin', 'moderador'].includes(profile?.role) ? (
            <button onClick={() => setModalTse(true)} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-full text-white font-bold shadow-lg transition transform hover:scale-105">
              Iniciar Cerimônia de Diplomação
            </button>
          ) : (
            <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 italic text-gray-500">
              Apenas Ministros do TSE podem diplomar novos membros.
            </div>
          )}
        </div>
      )}

      {/* SUB-ABA: Histórico de Posses */}
      {subTab === 'historico' && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Registros de Diplomação</h3>
          {posses.map((p: TermoPosse) => (
            <div key={p.id} className="bg-gray-800 p-5 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-emerald-400 font-bold">Ata de Posse N° {p.sequentialNumber}/{p.createdAt?.toDate().getFullYear() || gameTime.year}</h4>
                <span className="text-xs bg-gray-900 px-2 py-1 rounded text-gray-500 border border-gray-700 flex items-center">
                  <Calendar className="w-3 h-3 mr-1"/> {p.startMonth}/{p.startYear} — {p.endMonth}/{p.endYear}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {p.eleitos.map((el, i) => (
                  <div key={i} className="bg-gray-900 p-2 rounded text-sm flex justify-between">
                    <span className="text-white font-bold">{usersList.find((u:any)=>u.id===el.userId)?.discordUsername}</span>
                    <span className="text-gray-400">{formatRole(el.role)} ({states.find((s:any)=>s.id===el.jurisdictionId)?.name || 'Federal'})</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Redação Judiciária (STF) */}
      {modalJud && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-yellow-600">
             <h3 className="text-xl font-bold mb-4 text-yellow-400">Nova Sentença</h3>
             <select onChange={e => {
                const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
                if(tpl) setSentenca({ title: tpl.name, templateBody: tpl.bodyText || "{{TEXTO_JOGADOR}}", userText: '' });
             }} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none">
                <option value="">-- Escolha o Modelo --</option>
                {judTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name}</option>)}
             </select>
             {sentenca.templateBody && (
               <>
                 <textarea rows={6} placeholder="Digite a decisão..." value={sentenca.userText} onChange={e => setSentenca({...sentenca, userText: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded mb-4 outline-none" />
                 <div className="flex gap-2">
                    <button onClick={() => setModalJud(false)} className="flex-1 py-2 text-gray-400">Cancelar</button>
                    <button onClick={() => {
                       const content = sentenca.templateBody.replace('{{TEXTO_JOGADOR}}', sentenca.userText).replace(/\\n/g, '\n');
                       actions.emitirSentenca({ title: sentenca.title, content });
                       setModalJud(false);
                    }} className="flex-1 bg-yellow-600 text-white py-2 rounded font-bold">Publicar</button>
                 </div>
               </>
             )}
          </div>
        </div>
      )}

      {/* MODAL: Cerimônia TSE */}
      {modalTse && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md border border-emerald-600 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-emerald-400 border-b border-gray-700 pb-2">Cerimônia de Diplomação</h3>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Início Mandato</label>
                  <div className="flex gap-1">
                    <input type="number" value={posseData.startMonth} onChange={e=>setPosseData({...posseData, startMonth: Number(e.target.value)})} className="w-full bg-gray-900 text-white p-2 rounded text-sm border border-gray-700"/>
                    <input type="number" value={posseData.startYear} onChange={e=>setPosseData({...posseData, startYear: Number(e.target.value)})} className="w-full bg-gray-900 text-white p-2 rounded text-sm border border-gray-700"/>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Fim Mandato</label>
                  <div className="flex gap-1">
                    <input type="number" value={posseData.endMonth} onChange={e=>setPosseData({...posseData, endMonth: Number(e.target.value)})} className="w-full bg-gray-900 text-white p-2 rounded text-sm border border-gray-700"/>
                    <input type="number" value={posseData.endYear} onChange={e=>setPosseData({...posseData, endYear: Number(e.target.value)})} className="w-full bg-gray-900 text-white p-2 rounded text-sm border border-gray-700"/>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 mb-4">
              <label className="text-xs text-gray-400 font-bold mb-2 block uppercase">Adicionar Eleito</label>
              <select value={diplomaItem.userId} onChange={e=>setDiplomaItem({...diplomaItem, userId: e.target.value})} className="w-full bg-gray-800 text-white p-2 rounded mb-2 outline-none">
                <option value="">Selecione o Jogador...</option>
                {usersList.map((u:any)=><option key={u.id} value={u.id}>{u.discordUsername}</option>)}
              </select>
              <div className="flex gap-2 mb-2">
                <select value={diplomaItem.role} onChange={e=>setDiplomaItem({...diplomaItem, role: e.target.value})} className="flex-1 bg-gray-800 text-white p-2 rounded text-sm">
                  <option value="deputado">Deputado</option><option value="presidente_republica">Presidente</option><option value="governador">Governador</option><option value="stf">STF</option><option value="ministro_tse">TSE</option>
                </select>
                <select value={diplomaItem.jurisdictionId} onChange={e=>setDiplomaItem({...diplomaItem, jurisdictionId: e.target.value})} className="flex-1 bg-gray-800 text-white p-2 rounded text-sm">
                  <option value="federal">Federal</option>
                  {states.filter((s:any)=>s.type==='estadual').map((s:any)=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button onClick={() => { if(diplomaItem.userId) { setDiplomados([...diplomados, diplomaItem]); setDiplomaItem({...diplomaItem, userId: ''}); } }} className="w-full bg-emerald-900/40 text-emerald-400 py-2 rounded text-xs font-bold border border-emerald-900/50 hover:bg-emerald-900/60 transition">
                + Incluir no Termo
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {diplomados.map((d, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-900 p-2 rounded border border-gray-800">
                  <span className="text-xs text-white"><strong>{usersList.find((u:any)=>u.id===d.userId)?.discordUsername}</strong> ➔ {formatRole(d.role)}</span>
                  <button onClick={()=>setDiplomados(diplomados.filter((_,idx)=>idx!==i))} className="text-red-500"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
               <button onClick={() => setModalTse(false)} className="flex-1 py-3 text-gray-400">Cancelar</button>
               <button onClick={() => {
                 actions.diplomar({ ...posseData, eleitos: diplomados });
                 setModalTse(false); setDiplomados([]);
               }} className="flex-1 bg-emerald-600 text-white py-3 rounded font-bold shadow-lg">Finalizar e Dar Posse</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
