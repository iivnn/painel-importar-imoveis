export type PropertyAttachmentKind = 'Foto' | 'Print';

export interface PropertyAttachment {
  id: number;
  kind: PropertyAttachmentKind;
  originalFileName: string;
  fileUrl: string;
  contentType: string;
  createdAtUtc: string;
}

export interface PropertyDetails {
  propertyId: number;
  title: string;
  category: string;
  source: string;
  originalUrl: string;
  swotStatus: string;
  price: number | null;
  condoFee: number | null;
  iptu: number | null;
  insurance: number | null;
  serviceFee: number | null;
  upfrontCost: number | null;
  monthlyTotalCost: number | null;
  addressLine: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  hasExactLocation: boolean;
  strengths: string;
  weaknesses: string;
  opportunities: string;
  threats: string;
  score: number | null;
  notes: string;
  discardReason: string;
  isFavorite: boolean;
  createdAtUtc: string;
  attachments: PropertyAttachment[];
  statusHistory: PropertyStatusHistory[];
}

export interface PropertyStatusHistory {
  id: number;
  previousStatus: string | null;
  newStatus: string;
  reason: string;
  changedAtUtc: string;
}
