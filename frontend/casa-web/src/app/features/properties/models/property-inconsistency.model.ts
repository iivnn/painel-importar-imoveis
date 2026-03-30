export interface PropertyInconsistencySummary {
  totalCount: number;
  affectedProperties: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  generatedAtUtc: string;
}

export interface PropertyInconsistencyItem {
  id: string;
  propertyId: number;
  propertyTitle: string;
  severity: 'alta' | 'media' | 'baixa';
  type: string;
  title: string;
  description: string;
  recommendation: string;
}

export interface PropertyInconsistenciesResponse {
  summary: PropertyInconsistencySummary;
  items: PropertyInconsistencyItem[];
}
