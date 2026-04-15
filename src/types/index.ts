export type Role = 'admin' | 'presidente_republica' | 'presidente_congresso' | 'deputado' | 'governador' | 'ministro' | 'ministro_tse' | 'stf' | 'espectador';
export type MacroArea = 'educacao' | 'saude' | 'seguranca' | 'economia' | 'infraestrutura' | 'meio_ambiente';

export const TAXONOMY: Record<MacroArea, string[]> = {
  educacao: ['Infantil', 'Fundamental', 'Médio', 'Superior', 'Profissionalizante'],
  saude: ['Atenção Básica', 'Especializada', 'Urgência e Emergência', 'Vigilância Sanitária', 'Fármacos e Insumos'],
  seguranca: ['Policiamento Ostensivo', 'Investigação', 'Sistema Prisional', 'Fronteiras', 'Inteligência'],
  economia: ['Geração de Emprego', 'Indústria', 'Comércio', 'Agropecuária', 'Serviços'],
  infraestrutura: ['Rodovias', 'Saneamento Básico', 'Matriz Energética', 'Habitação', 'Telecomunicações'],
  meio_ambiente: ['Conservação', 'Fiscalização', 'Gestão de Resíduos', 'Recursos Hídricos', 'Prevenção Climática']
};

export interface UserProfile { id: string; discordUsername: string; role: Role; jurisdictionId?: string; pastaId?: string | null; }

export interface RpgData {
  id: string; type: 'federal' | 'estadual'; name: string; 
  macro: { populacao: number; pib: number; aprovacao: number; caixa: number; };
  indicators: Record<string, Record<string, number>>;
  allocatedBudget: Record<string, number>;
}

export interface GameTime { month: number; year: number; }

export interface GameEffect {
  id: string; sourceDocTitle: string; stateId: string; macro: string; micro: string;
  pointsPerMonth: number; remainingMonths: number; isPositive: boolean;
}

export interface DocTemplate { 
  id: string; branch: 'legislativo' | 'executivo' | 'judiciario'; 
  category: 'loa' | 'pec' | 'pl' | 'decreto_legislativo' | 'decreto' | 'portaria' | 'sentenca'; 
  name: string; abbreviation: string; isBudget: boolean; bodyText: string; 
}

export interface LoaArticle { pastaName: string; percentage: number; customName?: string; }
export interface ProjectArticle { id: number; text: string; isVetoed: boolean; }

export interface ProjectAmendment {
  id: string; authorName: string; text: string;
  status: 'proposta' | 'aprovada' | 'rejeitada';
  votes: Record<string, 'sim' | 'nao' | 'abstencao'>;
  loaChange?: { pastaName: string; customName?: string; newPercentage: number; }; 
}

export interface BaseDocument { justificativa: string; intendedMacro: string; apurado: boolean; year?: number; }

export interface RpgProject extends BaseDocument {
  id: string; sequentialNumber: number; 
  category: 'loa' | 'pec' | 'pl' | 'decreto_legislativo' | 'geral';
  templateName?: string; 
  templateAbbreviation?: string; 
  templateBodyText?: string;
  loaDetails?: { stateId: string; artigos: LoaArticle[]; };
  title: string; artigos: ProjectArticle[]; 
  authorId: string; authorName: string;
  status: 'proposto' | 'pauta' | 'votacao' | 'redacao_final' | 'sancao' | 'sancionado' | 'vetado' | 'votacao_veto' | 'promulgado' | 'arquivo';
  votes: Record<string, 'sim' | 'nao' | 'abstencao'>; 
  amendments: ProjectAmendment[];
  createdAt: any;
}

export interface DecreeAction { type: 'nomeacao' | 'exoneracao'; pastaName: string; userId: string; }

export interface RpgDecree extends BaseDocument {
  id: string; sequentialNumber: number; title: string; content: string;
  category?: string; actions: DecreeAction[];
  authorName: string; jurisdictionId: string; createdAt: any;
}

export interface RpgEvent { id: string; title: string; description: string; impact: string; createdAt: any; }
export interface StfDecision { id: string; sequentialNumber?: number; year?: number; authorName: string; title: string; content: string; createdAt: any; }
