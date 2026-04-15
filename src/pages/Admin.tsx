import React, { useState } from 'react';
import { Target, Clock, Zap, Trash2, DollarSign, EyeOff, Users, Settings } from 'lucide-react';
import { RpgProject, RpgDecree, DocTemplate, TAXONOMY, MacroArea } from '../types';

export function AdminView({ profile, usersList, states, templates, projects, decrees, gameTime, activeEffects, actions, showToast }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState(false);
  const [modalTpl, setModalTpl] = useState(false);
  const [stateData, setStateData] = useState({ name: '', budget: '', populacao: '', pib: '', type: 'estadual' });
  const [tplData, setTplData] = useState<any>({ branch: 'legislativo', isBudget: false, category: 'pl' });

  const [apuracaoModal, setApuracaoModal] = useState<any>(null);
  const [effectForm, setEffectForm] = useState({ stateId: '', macro: 'saude', micro: '', pointsPerMonth: '' as any, remainingMonths: 1 });

  const [hardResetModal, setHardResetModal] = useState(false);
  const [resetData, setResetData] = useState({ countryName: 'República do Brasil', startMonth: 1, startYear: 2026 });

  const [financeForm, setFinanceForm] = useState({ stateId: states[0]?.id || 'federal', pastaName: 'caixa_geral', amount: 0 });

  const filteredUsers = usersList.filter((u: any) => u.discordUsername.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Filtra documentos que precisam de julgamento (Sancionados ou Decretos novos)
  const docsToApurar = [
    ...projects.filter((p: RpgProject) => ['sancionado', 'promulgado'].includes(p.status) && !p.apurado).map((p: RpgProject) => ({...p, docType: 'projects'})),
    ...decrees.filter((d: any) => !d.apurado).map((d: any) => ({...d, docType: 'decrees'}))
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <h2 className="text-3xl font-bold text-white flex items-center"><Settings className="mr-3 text-gray-400"/> Painel de Moderação</h2>
        <button onClick={() => setHardResetModal(true)} className="bg-red-900/40 hover:bg-red-900 text-red-400 px-4 py-2 rounded text-xs font-bold border border-red-900/50 transition">⚠️ Hard Reset</button>
      </div>
      
      {/* Relógio e Gráficos */}
      <div className="bg-emerald-900/10 border border-emerald-700/50 rounded-xl p-6 flex justify-between items-center shadow-lg">
         <div>
           <h3 className="text-xl font-bold text-emerald-400 flex items-center"><Clock className="w-5 h-5 mr-2"/> Ciclo Temporal</h3>
           <p className="text-sm text-gray-400 mt-1">Ao avançar, os efeitos mensais são aplicados e um snapshot é salvo para o gráfico.</p>
         </div>
         <button onClick={actions.advanceTime} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-lg text-white font-bold shadow-xl transition-all active:scale-95">
           Avançar para {gameTime.month === 12 ? 1 : gameTime.month + 1}/{gameTime.month === 12 ? gameTime.year + 1 : gameTime.year}
         </button>
      </div>

      {/* Central de Moderação (Intenções Ocultas) */}
      <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-indigo-400"/> Fila de Apuração</h3>
        <div className="space-y-4">
           {docsToApurar.map((doc: any) => (
             <div key={doc.id} className="bg-gray-900 p-4 rounded border border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase bg-gray-800 text-gray-500 px-2 py-0.5 rounded border border-gray-700 mb-2 inline-block">
                    {doc.docType === 'projects' ? 'Lei' : 'Decreto'}
                  </span>
                  <h4 className="font-bold text-white font-serif">{doc.title}</h4>
                  
                  {doc.hiddenIntent ? (
                    <div className="mt-3 bg-indigo-950/30 p-3 rounded border border-indigo-500/20">
                       <p className="text-[11px] font-bold text-indigo-400 uppercase flex items-center mb-1"><EyeOff className="w-3 h-3 mr-1"/> Intenção Secreta:</p>
                       <p className="text-sm text-indigo-100 italic">"{doc.hiddenIntent.description}"</p>
                       <p className="text-[10px] text-indigo-500 mt-2 font-mono">ALVO: {doc.hiddenIntent.targetMacro.toUpperCase()} ➔ {doc.hiddenIntent.targetMicro}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic mt-2">Nenhuma intenção oculta declarada.</p>
                  )}
                </div>
                <button onClick={() => { 
                  setApuracaoModal(doc); 
                  setEffectForm({
                    ...effectForm, 
                    macro: doc.hiddenIntent?.targetMacro || 'saude',
                    micro: doc.hiddenIntent?.targetMicro || '',
                    pointsPerMonth: '', 
                    stateId: doc.jurisdictionId || (states.length > 0 ? states[0].id : 'federal')
                  }); 
                }} className="bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded text-sm text-white font-bold transition">Julgar</button>
             </div>
           ))}
           {docsToApurar.length === 0 && <p className="text-gray-600 italic text-center py-6">Nenhuma ação pendente de moderação.</p>}
        </div>
      </div>

      {/* Ajustes Financeiros Rápidos */}
      <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl shadow-lg">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center"><DollarSign className="w-5 h-5 mr-2 text-green-400"/> Tesouro e Cobranças</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
          <select value={financeForm.stateId} onChange={e => setFinanceForm({...financeForm, stateId: e.target.value})} className="bg-gray-800 border border-gray-700 text-white p-2 rounded text-sm outline-none">
             <option value="federal">União Federal</option>
             {states.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={financeForm.pastaName} onChange={e => setFinanceForm({...financeForm, pastaName: e.target.value})} className="bg-gray-800 border border-gray-700 text-white p-2 rounded text-sm outline-none capitalize">
             <option value="caixa_geral">Caixa Geral</option>
             {Object.keys(TAXONOMY).map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
          </select>
          <input type="number" value={financeForm.amount || ''} onChange={e => setFinanceForm({...financeForm, amount: Number(e.target.value)})} className="bg-gray-800 border border-gray-700 text-white p-2 rounded text-sm outline-none" placeholder="Valor R$" />
          <div className="flex gap-2">
            <button onClick={() => actions.adjustBudget(financeForm.stateId, financeForm.pastaName, financeForm.amount, false)} className="flex-1 bg-green-600 text-white rounded font-bold text-xs">+</button>
            <button onClick={() => actions.adjustBudget(financeForm.stateId, financeForm.pastaName, financeForm.amount, true)} className="flex-1 bg-red-600 text-white rounded font-bold text-xs">-</button>
          </div>
        </div>
      </div>

      {/* Gestão de Jogadores */}
      <div className="bg-gray-800 p-6 border border-gray-700 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center"><Users className="w-5 h-5 mr-2 text-blue-400"/> Controle de Jogadores</h3>
          <input type="text" placeholder="Filtrar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="bg-gray-900 border border-gray-700 text-white px-3 py-1.5 rounded-full text-xs outline-none focus:border-blue-500 w-48 shadow-inner"/>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-white">
            <thead className="bg-gray-900 text-gray-500 uppercase">
              <tr>
                <th className="p-3 border-b border-gray-700">Jogador</th>
                <th className="p-3 border-b border-gray-700">Cargo</th>
                <th className="p-3 border-b border-gray-700">Jurisdição</th>
                <th className="p-3 border-b border-gray-700">Pasta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-gray-750 transition-colors">
                  <td className="p-3 font-bold text-blue-300">{u.discordUsername}</td>
                  <td className="p-3">
                    <select value={u.role} onChange={e => actions.updateUser(u.id, e.target.value, u.jurisdictionId, u.pastaId)} className="bg-gray-700 border-none p-1 rounded text-[10px] w-full">
                      <option value="espectador">Espectador</option><option value="deputado">Deputado</option><option value="presidente_republica">Presidente</option><option value="ministro">Ministro</option><option value="stf">STF</option><option value="moderador">Moderador</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <select value={u.jurisdictionId || 'federal'} onChange={e => actions.updateUser(u.id, u.role, e.target.value, u.pastaId)} className="bg-gray-700 border-none p-1 rounded text-[10px] w-full">
                      <option value="federal">Federal</option>
                      {states.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <select value={u.pastaId || ''} onChange={e => actions.updateUser(u.id, u.role, u.jurisdictionId, e.target.value)} className="bg-gray-700 border-none p-1 rounded text-[10px] w-full">
                      <option value="">Nenhuma</option>
                      {Object.keys(TAXONOMY).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Apuração de Efeitos */}
      {apuracaoModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-lg border border-indigo-600 shadow-2xl">
            <h3 className="text-xl font-bold text-indigo-400 mb-4 border-b border-gray-700 pb-2 flex items-center"><Zap className="mr-2"/> Decretar Impacto Mecânico</h3>
            <div className="bg-gray-900 p-4 rounded mb-4 border border-gray-700 space-y-4">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold">Estado Afetado</label>
                <select value={effectForm.stateId} onChange={e => setEffectForm({...effectForm, stateId: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 outline-none text-sm">
                   <option value="federal">União Federal</option>
                   {states.map((s:any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Macro</label>
                  <select value={effectForm.macro} onChange={e => setEffectForm({...effectForm, macro: e.target.value as MacroArea})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 outline-none text-sm capitalize">
                     {Object.keys(TAXONOMY).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Micro</label>
                  <select value={effectForm.micro} onChange={e => setEffectForm({...effectForm, micro: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 outline-none text-sm">
                     <option value="">-- Selecione --</option>
                     {TAXONOMY[effectForm.macro as MacroArea]?.map(micro => <option key={micro} value={micro}>{micro}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Pontos / Mês</label>
                  <input type="text" placeholder="Ex: -5 ou 10" value={effectForm.pointsPerMonth} onChange={e => setEffectForm({...effectForm, pointsPerMonth: e.target.value})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 font-mono outline-none text-sm"/>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase font-bold">Duração (Meses)</label>
                  <input type="number" min="1" value={effectForm.remainingMonths} onChange={e => setEffectForm({...effectForm, remainingMonths: Number(e.target.value)})} className="w-full bg-gray-800 border border-gray-600 text-white p-2 rounded mt-1 font-mono outline-none text-sm"/>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
               <button onClick={() => setApuracaoModal(null)} className="flex-1 py-3 text-gray-400 font-bold">Cancelar</button>
               <button onClick={() => { 
                 if(!effectForm.micro) return alert("Selecione um Micro Dado!");
                 actions.apurarDocumento(apuracaoModal.docType, apuracaoModal.id, {
                   sourceDocTitle: apuracaoModal.title, stateId: effectForm.stateId, macro: effectForm.macro, micro: effectForm.micro, pointsPerMonth: Number(effectForm.pointsPerMonth) || 0, remainingMonths: Number(effectForm.remainingMonths)
                 }); 
                 setApuracaoModal(null); 
               }} className="flex-1 bg-indigo-600 text-white py-3 rounded font-bold shadow-lg transition hover:bg-indigo-500">Decretar Efeito</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Hard Reset */}
      {hardResetModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.3)]">
            <h3 className="text-2xl font-bold mb-4 text-red-500 border-b border-red-900/50 pb-2">⚠️ ATENÇÃO: EXCLUSÃO TOTAL</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">Esta ação irá apagar **todos** os documentos, mandatos, estados e reiniciar o tempo do RPG. É o fim de uma era.</p>
            <input type="text" value={resetData.countryName} onChange={e => setResetData({...resetData, countryName: e.target.value})} className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded mb-4 outline-none" placeholder="Nome do Novo País" />
            <div className="flex gap-2">
               <button onClick={() => setHardResetModal(false)} className="flex-1 py-3 text-gray-400 font-bold">Abortar</button>
               <button onClick={() => { actions.hardReset(resetData); setHardResetModal(false); }} className="flex-1 bg-red-600 text-white py-3 rounded font-bold shadow-lg transition hover:bg-red-500">Destruir e Recriar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
