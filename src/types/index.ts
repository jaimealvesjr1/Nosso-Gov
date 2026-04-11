export type Role = 'admin' | 'presidente_republica' | 'presidente_congresso' | 'deputado' | 'governador' | 'ministro' | 'ministro_tse' | 'stf' | 'espectador';

export interface UserProfile {
  id: string; discordUsername: string; role: Role; jurisdictionId?: string; pastaId?: string;
}

export interface RpgData {
  id: string; type: 'federal' | 'estadual'; name: string; totalBudget: number;
  dynamicPastas: Record<string, { orcamento: number; dados: number }>;
}

export interface DocTemplate {
  id: string; branch: 'legislativo' | 'executivo' | 'judiciario';
  name: string; abbreviation: string; isBudget: boolean; bodyText: string;
}

export interface LoaArticle { pastaName: string; percentage: number; }

export interface RpgProject {
  id: string; sequentialNumber: number; category: 'geral' | 'loa';
  templateName?: string; templateAbbreviation?: string; // Ex: "PEC", "PLP"
  loaDetails?: { stateId: string; artigos: LoaArticle[]; };
  title: string; description: string; authorId: string; authorName: string;
  status: 'proposto' | 'pauta' | 'votacao' | 'aprovado_congresso' | 'rejeitado' | 'sancionado' | 'vetado';
  votes: Record<string, 'sim' | 'nao' | 'abstencao'>; createdAt: any;
}

export interface RpgDecree {
  id: string; sequentialNumber: number; title: string; content: string;
  authorName: string; jurisdictionId: string; createdAt: any;
}

export interface RpgEvent { id: string; title: string; description: string; impact: string; createdAt: any; }
export interface StfDecision { id: string; authorName: string; title: string; content: string; createdAt: any; }
