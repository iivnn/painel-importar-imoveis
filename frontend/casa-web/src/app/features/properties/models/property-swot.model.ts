export interface PropertySwotAnalysis {
  propertyId: number;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  score: number | null;
  swotStatus: 'Novo' | 'EmAnalise' | 'Visitado' | 'Proposta' | 'Descartado' | 'Favorito';
}

export interface SavePropertySwotRequest {
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  score: number | null;
}
