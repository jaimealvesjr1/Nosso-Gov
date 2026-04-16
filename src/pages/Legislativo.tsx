import React, { useState } from 'react';
import { Plus, Gavel, Trash2, Users, CheckCircle, XCircle } from 'lucide-react';
import { RpgProject, DocTemplate, ProjectArticle, TAXONOMY, MacroArea } from '../types';

export function LegislativoView({ profile, projects, liveSession, templates, gameTime, showToast, actions, usersList }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ category: 'pl', hiddenIntent: { targetMacro: 'economia', targetMicro: '', description: '' } });
  const [artigosText, setArtigosText] = useState<ProjectArticle[]>([{ id: 1, text: '', isVetoed: false }]);
  
  const [subTab, setSubTab] = useState<'protocolos' | 'tramitacao' | 'sessao' | 'historico'>('protocolos');
  const [emendaText, setEmendaText] = useState('');

  const legTemplates = templates.filter((t: DocTemplate) => t.branch === 'legislativo');
  const isPresCongresso = profile?.role === 'presidente_congresso' || profile?.role === 'admin';
  const isDeputado = profile?.role === 'deputado' || isPresCongresso;

  const handleProtocol = () => {
    if (!formData.hiddenIntent.description) return showToast("A Intenção Oculta é obrigatória para a Moderação!");
    const finalArtigos = artigosText.filter(a => (a.text || '').trim() !== '');
    actions.protocolProject(formData, finalArtigos, []); // Simplificado sem LOA dinâmica nesta vista por agora
    setModalOpen(false); 
    setFormData({ category: 'pl', hiddenIntent: { targetMacro: 'economia', targetMicro: '', description: '' } }); 
    setArtigosText([{ id: 1, text: '', isVetoed: false }]);
  };

  // Filtragem de Projetos por Sub-Aba
  const projsProtocolados = projects.filter((p: RpgProject) => p.status === 'protocolado');
  const projsTramitacao = projects.filter((p: RpgProject) => p.status === 'pauta');
  const projsHistorico = projects.filter((p: RpgProject) => ['sancionado', 'promulgado', 'arquivo', 'sancao'].includes(p.status));

  // O Projeto que está a ser votado AGORA no Plenário
  const currentVotingProject = liveSession?.currentProjectVotingId ? projects.find((p:RpgProject) => p.id === liveSession.currentProjectVotingId) : null;

  const renderProjectCard = (p: RpgProject, listType: string) => (
    <div key={p.id} className="bg-gray-800 p-5 border border-gray-700 rounded-lg shadow-md mb-4 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <span className="text-xs font-bold text-gray-400 uppercase bg-gray-900 px-2 py-1 rounded border border-gray-700">{p.status.replace('_', ' ')}</span>
        <h3 className="text-lg font-bold text-white mt-2 font-serif">{p.templateAbbreviation} N° {p.sequentialNumber}/{p.year} - {p.title}</h3>
        <p className="text-xs text-gray-500 font-mono mb-3">Autoria: {p.authorName}</p>
        
        <div className="bg-gray-900/40 p-3 rounded border border-gray-700 text-sm text-gray-300 font-serif whitespace-pre-wrap">
          {p.templateBodyText && <p className="mb-2 text-gray-500 font-bold">{p.templateBodyText}</p>}
          {p.artigos?.map(art => <p key={art.id} className="mb-1"><strong>Art. {art.id}º</strong> - {art.text}</p>)}
        </div>

        {/* Emendas na Tramitação */}
        {p.amendments?.length > 0 && (
          <div className="mt-4 border-t border-gray-700 pt-3">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">{listType === 'tramitacao' ? 'Emendas Propostas:' : 'Emendas Aprovadas/Em Votação:'}</p>
            {p.amendments?.map(am => {
              if (listType === 'historico' && am.status !== 'aprovada') return null;
              return (
                <p key={am.id} className="text-sm text-gray-400 bg-gray-900 p-2 rounded mb-1 border border-gray-800">
                  {listType !== 'tramitacao' && <span className={am.status === 'aprovada' ? 'text-green-400 mr-2 font-bold' : 'text-yellow-400 mr-2 font-bold'}>[{am.status.toUpperCase()}]</span>}
                  <strong>{am.authorName}:</strong> {am.text}
                </p>
              )
            })}
            
            {listType === 'tramitacao' && isDeputado && (
              <div className="flex gap-2 mt-3">
                 <input value={emendaText} onChange={e => setEmendaText(e.target.value)} placeholder="Propor emenda..." className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none"/>
                 <button onClick={() => { actions.proporEmenda(p.id, emendaText); setEmendaText(''); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-bold transition">Adicionar Emenda</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-gray-700 pt-4 md:pt-0 pl-0 md:pl-4 min-w-[180px]">
         {listType === 'protocolos' && isPresCongresso && <button onClick={() => actions.changeStatus(p.id, 'pauta')} className="bg-blue-600 hover:bg-blue-500 py-2 rounded text-sm text-white font-bold transition">Colocar em Pauta</button>}
         {listType === 'protocolos' && profile?.id === p.authorId && <button onClick={() => actions.deleteDocument('projects', p.id)} className="bg-red-900/50 hover:bg-red-800 py-2 rounded text-sm text-red-200 transition">Retirar de Pauta</button>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navegação Interna */}
      <div className="flex flex-wrap gap-2 bg-gray-800 p-2 rounded-xl border border-gray-700">
        <button onClick={() => setSubTab('protocolos')} className={`flex-1 py-2 rounded text-sm font-bold transition ${subTab === 'protocolos' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Protocolos ({projsProtocolados.length})</button>
        <button onClick={() => setSubTab('tramitacao')} className={`flex-1 py-2 rounded text-sm font-bold transition ${subTab === 'tramitacao' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Em Tramitação ({projsTramitacao.length})</button>
        <button onClick={() => setSubTab('sessao')} className={`flex-1 py-2 rounded text-sm font-bold transition flex justify-center items-center ${subTab === 'sessao' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
          <Gavel className="w-4 h-4 mr-2"/> Sessão Plenária {liveSession ? '🔴' : ''}
        </button>
        <button onClick={() => setSubTab('historico')} className={`flex-1 py-2 rounded text-sm font-bold transition ${subTab === 'historico' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>Histórico</button>
      </div>

      <div className="flex justify-end">
         {isDeputado && <button onClick={() => setModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white font-bold shadow-lg transition flex items-center"><Plus className="w-4 h-4 mr-2"/> Redigir Documento</button>}
      </div>

      {/* ABA: Protocolos */}
      {subTab === 'protocolos' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">Projetos aguardando despacho do Presidente do Congresso para entrarem em tramitação.</p>
          {projsProtocolados.length === 0 && <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">Nenhum projeto protocolado.</div>}
          {projsProtocolados.map((p: RpgProject) => renderProjectCard(p, 'protocolos'))}
        </div>
      )}

      {/* ABA: Tramitação */}
      {subTab === 'tramitacao' && (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm mb-4">Projetos em pauta. Deputados podem debater e propor emendas antes da sessão de votação.</p>
          {projsTramitacao.length === 0 && <div className="text-center py-10 text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">A pauta está limpa.</div>}
          {projsTramitacao.map((p: RpgProject) => renderProjectCard(p, 'tramitacao'))}
        </div>
      )}

      {/* ABA: Sessão Plenária (O Coração do Legislativo) */}
      {subTab === 'sessao' && (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
          <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center"><Gavel className="w-6 h-6 mr-3 text-indigo-400"/> Plenário da Câmara</h2>
            {!liveSession && isPresCongresso && <button onClick={actions.abrirSessao} className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-white font-bold shadow-lg transition">Abrir Sessão Legislativa</button>}
          </div>

          {!liveSession && <div className="text-center py-12 text-gray-500"><p className="text-lg">Não há nenhuma sessão em curso.</p><p className="text-sm">Aguarde a convocação pelo Presidente do Congresso.</p></div>}

          {/* SESSÃO: Aberta para Presenças */}
          {liveSession?.status === 'aberta_presenca' && (
            <div className="text-center py-8">
              <h3 className="text-xl font-bold text-yellow-400 mb-2 animate-pulse">Sessão Aberta - Chamada Nominal</h3>
              <p className="text-gray-400 mb-6">Parlamentares, confirmem a vossa presença no plenário.</p>
              
              <div className="flex justify-center mb-8">
                <div className="bg-gray-900 px-6 py-4 rounded-lg border border-gray-700 inline-block">
                  <span className="text-3xl font-bold text-white flex items-center justify-center"><Users className="w-8 h-8 mr-3 text-indigo-400"/> {liveSession.presentDeputies.length}</span>
                  <span className="text-xs text-gray-500 uppercase mt-1 block">Presentes</span>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                {isDeputado && !liveSession.presentDeputies.includes(profile.id) && (
                  <button onClick={actions.marcarPresenca} className="bg-green-600 hover:bg-green-500 px-8 py-3 rounded text-white font-bold shadow-lg transition text-lg">Marcar Presença</button>
                )}
                {isPresCongresso && (
                  <button onClick={actions.confirmarQuorum} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded text-white font-bold shadow-lg transition text-lg">Confirmar Quórum</button>
                )}
              </div>
            </div>
          )}

          {/* SESSÃO: Em Curso (Votações) */}
          {liveSession?.status === 'em_curso' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-indigo-900/20 p-4 rounded-lg border border-indigo-900/50">
                <span className="text-indigo-300 font-bold flex items-center"><Users className="w-5 h-5 mr-2"/> Quórum: {liveSession.presentDeputies.length} Parlamentares</span>
                {isPresCongresso && <button onClick={actions.encerrarSessao} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white text-sm font-bold transition">Encerrar Sessão (Gerar Ata)</button>}
              </div>

              {/* Se o Presidente ainda NÃO selecionou um projeto */}
              {!currentVotingProject && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Projetos na Ordem do Dia (Pauta)</h3>
                  {projsTramitacao.length === 0 && <p className="text-gray-500 italic">Não há projetos em pauta para votar.</p>}
                  <div className="grid gap-3">
                    {projsTramitacao.map((p: RpgProject) => (
                      <div key={p.id} className="bg-gray-900 p-4 rounded flex justify-between items-center border border-gray-700">
                        <span className="text-white font-bold">{p.templateAbbreviation} {p.sequentialNumber}/{p.year} - {p.title}</span>
                        {isPresCongresso && <button onClick={() => actions.iniciarVotacaoProjeto(p.id)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded text-white text-sm font-bold transition">Iniciar Votação</button>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Se um Projeto ESTÁ A SER VOTADO AGORA */}
              {currentVotingProject && (
                <div className="bg-gray-900 border-2 border-indigo-500 rounded-xl p-6 shadow-2xl relative">
                  <div className="absolute -top-3 right-6 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase animate-pulse">Em Votação</div>
                  
                  <h3 className="text-2xl font-bold text-white font-serif mb-2">{currentVotingProject.title}</h3>
                  <div className="bg-gray-950 p-4 rounded text-sm text-gray-300 font-serif mb-6 whitespace-pre-wrap border border-gray-800">
                    {currentVotingProject.artigos?.map((art:any) => <p key={art.id} className="mb-1"><strong>Art. {art.id}º</strong> - {art.text}</p>)}
                  </div>

                  {/* Votação Principal */}
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
                    <p className="text-sm font-bold text-gray-400 uppercase text-center mb-3">Votação do Texto Principal</p>
                    <div className="flex gap-2 justify-center max-w-md mx-auto">
                      <button onClick={() => actions.votarAoVivo(currentVotingProject.id, 'sim')} className={`flex-1 py-3 rounded font-bold transition ${currentVotingProject.votes?.[profile.id] === 'sim' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-green-900/50'}`}><CheckCircle className="w-5 h-5 mx-auto mb-1"/> SIM</button>
                      <button onClick={() => actions.votarAoVivo(currentVotingProject.id, 'nao')} className={`flex-1 py-3 rounded font-bold transition ${currentVotingProject.votes?.[profile.id] === 'nao' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-red-900/50'}`}><XCircle className="w-5 h-5 mx-auto mb-1"/> NÃO</button>
                    </div>
                    {isPresCongresso && (
                      <p className="text-center mt-3 text-xs text-gray-500">Parcial: {Object.values(currentVotingProject.votes||{}).filter(v=>v==='sim').length} Sim / {Object.values(currentVotingProject.votes||{}).filter(v=>v==='nao').length} Não</p>
                    )}
                  </div>

                  {/* NOVO: Painel de Votos em Tempo Real */}
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 mb-6">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Painel do Plenário (Ao Vivo)</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {usersList?.filter((u:any) => u.role === 'deputado' || u.role === 'presidente_congresso').map((dep:any) => {
                         const isInSession = liveSession.presentDeputies.includes(dep.id);
                         const vote = currentVotingProject.votes?.[dep.id];
                         return (
                           <div key={dep.id} className={`p-2 rounded text-xs border ${!isInSession ? 'bg-gray-900/50 border-gray-800 text-gray-600' : 'bg-gray-800 border-gray-600 text-white'}`}>
                             <span className="font-bold">{dep.discordUsername}</span>
                             <span className="block mt-1">
                               {!isInSession ? 'Ausente' : vote === 'sim' ? '✅ SIM' : vote === 'nao' ? '❌ NÃO' : '⏳ Aguardando'}
                             </span>
                           </div>
                         );
                      })}
                    </div>
                  </div>

                  {/* Votação das Emendas */}
                  {currentVotingProject.amendments?.length > 0 && (
                    <div className="space-y-3 mb-6">
                      <p className="text-sm font-bold text-gray-400 uppercase">Votação das Emendas Destaque</p>
                      {currentVotingProject.amendments.map((am:any) => (
                        <div key={am.id} className="bg-gray-950 p-4 rounded border border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                          <p className="text-sm text-gray-300 flex-1"><strong className="text-indigo-400">Emenda ({am.authorName}):</strong> {am.text}</p>
                          <div className="flex gap-1 min-w-[150px]">
                            <button onClick={() => actions.votarAoVivo(currentVotingProject.id, 'sim', true, am.id)} className={`flex-1 py-2 rounded text-xs font-bold border ${am.votes?.[profile.id] === 'sim' ? 'bg-green-600 text-white border-green-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>SIM</button>
                            <button onClick={() => actions.votarAoVivo(currentVotingProject.id, 'nao', true, am.id)} className={`flex-1 py-2 rounded text-xs font-bold border ${am.votes?.[profile.id] === 'nao' ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}>NÃO</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isPresCongresso && (
                    <div className="flex justify-center border-t border-gray-700 pt-6">
                      <button onClick={() => actions.encerrarVotacaoProjetoAoVivo(currentVotingProject.id)} className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-full font-bold shadow-[0_0_15px_rgba(202,138,4,0.5)] transition"><Gavel className="w-5 h-5 inline mr-2"/> Encerrar Votação Deste Projeto</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ABA: Histórico */}
      {subTab === 'historico' && (
        <div className="space-y-4">
           <h3 className="text-lg font-bold text-white mb-4">Arquivo e Leis Finalizadas</h3>
           {projsHistorico.map((p: RpgProject) => renderProjectCard(p, 'historico'))}
        </div>
      )}

      {/* MODAL REDIGIR COM INTENÇÃO OCULTA */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-600 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-gray-700 pb-2">Gabinete Parlamentar</h3>
            
            <select onChange={e => {
               const tpl = templates.find((t: DocTemplate) => t.id === e.target.value);
               if(tpl) { setFormData({...formData, templateId: tpl.id, title: `${tpl.name}`, category: tpl.category}); setArtigosText([{ id: 1, text: tpl.bodyText || '', isVetoed: false }]); }
            }} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded mb-4 outline-none">
              <option value="">Selecione o Modelo do Projeto...</option>
              {legTemplates.map((t: DocTemplate) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            {formData.templateId && (
              <>
                <input placeholder="Ementa / Título do Projeto" onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-900 border border-gray-700 p-3 text-white rounded mb-4 font-serif outline-none" />
                
                {/* A INTENÇÃO OCULTA (Só o Mestre e o Autor veem) */}
                <div className="bg-indigo-950/50 border border-indigo-900/80 p-4 rounded-lg mb-6 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                   <div className="flex items-center mb-2"><span className="text-sm font-bold text-indigo-300">Intenção Oculta (Mecânica de Jogo)</span><span className="ml-2 text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded-full uppercase">Secreto</span></div>
                   <p className="text-xs text-gray-400 mb-3">Preencha qual o dado que você quer alterar no jogo com esta lei. Isto será avaliado pelos moderadores.</p>
                   
                   <div className="flex gap-2 mb-2">
                     <select onChange={e => setFormData({...formData, hiddenIntent: {...formData.hiddenIntent, targetMacro: e.target.value}})} className="flex-1 bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm outline-none">
                        {Object.keys(TAXONOMY).map(m => <option key={m} value={m} className="capitalize">{m.replace('_', ' ')}</option>)}
                     </select>
                     <select onChange={e => setFormData({...formData, hiddenIntent: {...formData.hiddenIntent, targetMicro: e.target.value}})} className="flex-1 bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm outline-none">
                        <option value="">-- Micro Dado --</option>
                        {TAXONOMY[formData.hiddenIntent.targetMacro as MacroArea]?.map((micro: string) => <option key={micro} value={micro}>{micro}</option>)}
                     </select>
                   </div>
                   <textarea rows={2} placeholder="Descreva à Moderação o efeito prático que você deseja. Ex: 'Quero que esta lei aumente +5 pontos em Policiamento nos estados'." onChange={e => setFormData({...formData, hiddenIntent: {...formData.hiddenIntent, description: e.target.value}})} className="w-full bg-gray-900 border border-gray-700 p-2 text-white rounded text-sm outline-none" />
                </div>

                <div className="space-y-3 mb-6">
                   <p className="text-sm font-bold text-white uppercase border-b border-gray-700 pb-1">Texto da Lei</p>
                   {artigosText.map((art, idx) => (
                     <div key={art.id} className="flex gap-2 items-start">
                       <span className="text-gray-500 font-bold mt-3">Art. {art.id}º</span>
                       <textarea rows={2} value={art.text} onChange={e => { const n = [...artigosText]; n[idx].text = e.target.value; setArtigosText(n); }} className="flex-1 bg-gray-900 border border-gray-700 text-white p-3 rounded text-sm outline-none"/>
                       {artigosText.length > 1 && <button onClick={() => setArtigosText(artigosText.filter(a => a.id !== art.id))} className="mt-3 text-red-500 hover:text-red-400"><Trash2 className="w-5 h-5"/></button>}
                     </div>
                   ))}
                   <button onClick={() => setArtigosText([...artigosText, {id: artigosText.length + 1, text: '', isVetoed: false}])} className="text-xs bg-gray-800 border border-gray-700 px-3 py-2 rounded text-indigo-400 font-bold hover:bg-gray-700 transition">+ Adicionar Artigo</button>
                </div>
                
                <div className="flex gap-2 mt-4">
                   <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:bg-gray-700 rounded transition">Cancelar</button>
                   <button onClick={handleProtocol} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded font-bold shadow-lg transition">Protocolar Projeto</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
