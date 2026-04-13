import React, { useState } from 'react';
import { Target, Clock, Zap, Trash2 } from 'lucide-react';
import { RpgProject, RpgDecree, DocTemplate, TAXONOMY, MacroArea } from '../types';
import { formatMoney } from '../components/UI';

export function AdminView({ usersList, states, templates, projects, decrees, gameTime, activeEffects, actions }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState(false);
  const [modalTpl, setModalTpl] = useState(false);
  const [stateData, setStateData] = useState({ name: '', budget: '', populacao: '', pib: '', type: 'estadual' });
  const [tplData, setTplData] = useState<any>({ branch: 'legislativo', isBudget: false });

  const [apuracaoModal, setApuracaoModal] = useState<any>(null);
  const [effectForm, setEffectForm] = useState({ stateId: '', macro: 'saude', micro: '', pointsPerMonth: 0, remainingMonths: 1 });

  const [hardResetModal, setHardResetModal] = useState(false);
  const [resetData, setResetData] = useState({ countryName: 'República do Brasil', startMonth: 1, startYear: 2026 });

  const filteredUsers = usersList.filter((u: any) => u.discordUsername.toLowerCase().includes(searchTerm.toLowerCase()));
  const docsToApurar = [
    ...projects.filter((p: RpgProject) => ['sancionado', 'promulgado'].includes(p.status) && !p.apurado).map((p: RpgProject) => ({...p, docType: 'projects'})),
    ...decrees.filter((d: RpgDecree) => !d.apurado).map((d: RpgDecree) => ({...d, docType: 'decrees'}))
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button onClick={() => setHardResetModal(true)} className="bg-red-900/80 hover:bg-red-800 text-red-200 px-4 py-2 rounded text-xs font-bold border border-red-700 transition">⚠️ Iniciar Nova Temporada (Hard Reset)</button>
      </div>
      
      <div className="bg-emerald-900/20 border border-emerald-700 rounded-xl p-6 shadow-lg flex justify-between items-center">
         <div>
           <h3 className="text-2xl font-bold text-emerald-400 flex items-center"><Clock className="w-6 h-6 mr-3"/> Relógio do Jogo</h3>
           <p className="text-gray-300 mt-1">Efeitos Ativos: <strong className="text-white">{activeEffects.length}</strong> influenciando os dados estaduais.</p>
         </div>
         <button onClick={actions.advanceTime} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-4 rounded-lg text-white font-bold text-lg shadow-xl transition transform hover:scale-105">
           Avançar para Mês {gameTime.month === 12 ? 1 : gameTime.month + 1}
         </button>
      </div>

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
                <select value={u.role} onChange={e => actions.updateUser(u.id, e.target.value, u.jurisdictionId, u.pastaId)} className="bg-gray-700 border border-gray-600 p-2 rounded outline-none w-full">
                  <option value="espectador">Espectador</option><option value="deputado">Deputado</option><option value="presidente_congresso">Presidente do Congresso</option><option value="presidente_republica">Presidente da República</option><option value="governador">Governador</option><option value="ministro_tse">Ministro TSE</option><option value="stf">Ministro do STF</option><option value="ministro">Ministro</option><option value="admin">Admin (Mestre)</option>
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

      {apuracaoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-indigo-600 shadow-2xl">
            <h3 className="text-xl font-bold text-indigo-400 mb-4 border-b border-gray-700 pb-2">Aplicar Efeito Mecânico</h3>
            <p className="text-white mb-4">Doc: <strong className="font-serif">{apuracaoModal.title}</strong></p>
            
            <div className="bg-gray-900 p-4 rounded mb-4 border border-gray-700">
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
                   sourceDocTitle: apuracaoModal.title, stateId: effectForm.stateId, macro: effectForm.macro, micro: effectForm.micro, pointsPerMonth: effectForm.pointsPerMonth, remainingMonths: effectForm.remainingMonths
                 }); 
                 setApuracaoModal(null); 
               }} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded font-bold shadow-lg transition"><Zap className="w-4 h-4 inline mr-2"/>Decretar Efeito</button>
            </div>
          </div>
        </div>
      )}

      {modalTpl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="flex gap-2 mb-4 mt-1">
               <div className="flex-1">
                 <label className="text-xs text-gray-400 uppercase font-bold">Poder / Aba</label>
                 <select value={tplData.branch} onChange={e => setTplData({...tplData, branch: e.target.value})} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded outline-none">
                   <option value="legislativo">Legislativo</option>
                   <option value="executivo">Executivo</option>
                   <option value="judiciario">Judiciário</option>
                 </select>
               </div>
               <div className="flex-1">
                 <label className="text-xs text-gray-400 uppercase font-bold">Categoria (Regras)</label>
                 <select value={tplData.category} onChange={e => {
                    const val = e.target.value;
                    setTplData({...tplData, category: val, isBudget: val === 'loa'});
                 }} className="w-full bg-gray-900 border border-gray-700 text-white p-3 rounded outline-none">
                   <option value="pl">Proj. Lei Ordinária (PL)</option>
                   <option value="pec">Emenda Constitucional (PEC)</option>
                   <option value="loa">Lei Orçamentária (LOA)</option>
                   <option value="decreto_legislativo">Decreto Legislativo</option>
                   <option value="decreto">Decreto Presidencial</option>
                   <option value="portaria">Portaria Ministerial</option>
                   <option value="sentenca">Sentença/Súmula</option>
                 </select>
               </div>
             </div>
        </div>
      )}

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
      {hardResetModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md border-2 border-red-600 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4 text-red-500 border-b border-red-900/50 pb-2">⚠️ ATENÇÃO: HARD RESET</h3>
            <p className="text-gray-300 text-sm mb-6">Esta ação irá apagar TODOS os documentos, projetos, decretos, orçamentos e reiniciar o país. Todos os jogadores perderão os cargos. <strong>Isto é irreversível.</strong></p>
            
            <label className="text-xs text-gray-400 uppercase font-bold">Nome do Novo País/União</label>
            <input type="text" value={resetData.countryName} onChange={e => setResetData({...resetData, countryName: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded mt-1 mb-4 outline-none" />
            
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase font-bold">Mês Inicial</label>
                <input type="number" min="1" max="12" value={resetData.startMonth} onChange={e => setResetData({...resetData, startMonth: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded mt-1 outline-none" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase font-bold">Ano Inicial</label>
                <input type="number" value={resetData.startYear} onChange={e => setResetData({...resetData, startYear: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded mt-1 outline-none" />
              </div>
            </div>

            <div className="flex gap-2">
               <button onClick={() => setHardResetModal(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-800 rounded transition">Cancelar</button>
               <button onClick={() => { actions.hardReset(resetData); setHardResetModal(false); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded font-bold shadow-lg transition">Destruir e Recriar Mundo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
