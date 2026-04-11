import React from 'react';
import { Building, Activity, Users, DollarSign, TrendingUp } from 'lucide-react';
import { RpgData, UserProfile, TAXONOMY, MacroArea } from '../types';
import { DataBar, formatMoney, formatNum } from '../components/UI';

export function DashboardView({ states, usersList }: any) {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-white border-b border-gray-700 pb-3">Observatório da Nação</h2>
      {states.length === 0 && <p className="text-gray-500 italic">Nenhum Estado fundado. O Mestre deve criar no Admin.</p>}
      
      {states.map((state: RpgData) => (
        <div key={state.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-gray-900 p-6 border-b border-gray-700 flex justify-between items-center">
             <div><span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{state.type}</span><h3 className="text-2xl font-bold text-white mt-1">{state.name}</h3></div>
             <div className="text-right"><p className="text-sm text-gray-400">Caixa Geral</p><p className="text-xl font-mono text-emerald-400 font-bold">{formatMoney(state.macro?.caixa)}</p></div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(Object.keys(TAXONOMY) as MacroArea[]).map(macro => {
              const macroBudget = state.allocatedBudget?.[macro] || 0;
              const minister = usersList.find((u:UserProfile) => u.pastaId === macro && u.jurisdictionId === state.id);
              
              return (
                <div key={macro} className="bg-gray-900 p-5 rounded-lg border border-gray-700 shadow-inner">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                    <h4 className="font-bold text-indigo-300 capitalize text-lg">{macro.replace('_', ' ')}</h4>
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400 border border-gray-700">Verba: <span className="text-green-400 font-mono font-bold">{formatMoney(macroBudget)}</span></span>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Ministro Responsável: <strong className="text-white">{minister?.discordUsername || 'Vago'}</strong></p>
                  
                  <div className="space-y-3">
                    {TAXONOMY[macro].map(micro => {
                      const val = state.indicators?.[macro]?.[micro] || 50;
                      return <DataBar key={micro} label={micro} value={val} color={val > 70 ? 'bg-green-500' : val < 40 ? 'bg-red-500' : 'bg-yellow-500'} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
