import React from 'react';
import { RpgData, UserProfile, TAXONOMY, MacroArea } from '../types';
import { DataBar, formatMoney } from '../components/UI';

// NOVO: Mini Gráfico de Histórico
const Sparkline = ({ data }: { data: number[] }) => {
  if (!data || data.length < 2) return <div className="h-6 w-16 bg-gray-800 rounded border border-gray-700 flex items-center justify-center text-[8px] text-gray-500">Sem dados</div>;
  const max = 100, min = 0, width = 60, height = 24;
  const points = data.map((d, i) => `${(i / (data.length - 1)) * width},${height - ((d - min) / (max - min)) * height}`).join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-16 h-6 overflow-visible opacity-70">
      <polyline fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

export function DashboardView({ states, usersList, activeEffects }: any) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white border-b border-gray-700 pb-3">Observatório da Nação</h2>
      {states.length === 0 && <p className="text-gray-500 italic">Nenhum Estado fundado. O Mestre deve criar no Admin.</p>}
      
      {states.map((state: RpgData) => {
        const pastasExibidas = Array.from(new Set([...Object.keys(TAXONOMY), ...Object.keys(state.allocatedBudget || {})]));
        const stateEffects = activeEffects?.filter((e: any) => e.stateId === state.id || (state.type === 'federal' && e.stateId === 'federal')) || [];
        
        return (
          <div key={state.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg mb-8">
            <div className="bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center">
               <div><span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{state.type}</span><h3 className="text-2xl font-bold text-white mt-1">{state.name}</h3></div>
               <div className="text-right"><p className="text-sm text-gray-400">Caixa Geral</p><p className="text-xl font-mono text-emerald-400 font-bold">{formatMoney(state.macro?.caixa)}</p></div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pastasExibidas.map((pastaName) => {
                const macroBudget = state.allocatedBudget?.[pastaName] || 0;
                const minister = usersList.find((u:UserProfile) => u.pastaId === pastaName && (u.jurisdictionId === state.id || (u.jurisdictionId === 'federal' && state.type === 'federal')));
                const isFixa = Object.keys(TAXONOMY).includes(pastaName);

                return (
                  <div key={pastaName} className="bg-gray-900 p-5 rounded-lg border border-gray-700 shadow-inner">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                      <h4 className="font-bold text-indigo-300 capitalize text-lg">{pastaName.replace('_', ' ')}</h4>
                      <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 border border-gray-700">Verba: <span className="text-green-400 font-mono font-bold">{formatMoney(macroBudget)}</span></span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Ministro Responsável: <strong className="text-white">{minister?.discordUsername || 'Vago'}</strong></p>
                    
                    <div className="space-y-4">
                      {isFixa ? (
                        TAXONOMY[pastaName as MacroArea].map(micro => {
                          const val = state.indicators?.[pastaName]?.[micro] || 50;
                          const microEffects = stateEffects.filter((e: any) => e.macro === pastaName && e.micro === micro);

                          return (
                            <div key={micro} className="relative">
                              <div className="flex items-end gap-3 mb-1">
                                 <div className="flex-1">
                                    <DataBar label={micro} value={val} color={val > 70 ? 'bg-green-500' : val < 40 ? 'bg-red-500' : 'bg-yellow-500'} />
                                 </div>
                                 <Sparkline data={state.history?.map((h:any) => h.indicators?.[pastaName]?.[micro] || 50) || []} />
                              </div>
                              
                              {microEffects.length > 0 && (
                                <div className="mt-1 ml-2 pl-2 border-l-2 border-indigo-500/50 flex flex-col gap-1">
                                  {microEffects.map((eff: any) => (
                                    <span key={eff.id} className={`text-[11px] font-bold ${eff.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                                      ↳ {eff.isPositive ? '+' : ''}{eff.pointsPerMonth} pts/mês ({eff.remainingMonths}m restantes) — {eff.sourceDocTitle}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-500 italic">Ministério Extraordinário criado via Lei Orçamentária.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
