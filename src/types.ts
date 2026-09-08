export interface GoogleSheetConfig {
  url: string;
  spreadsheetId: string;
  sheetName?: string;
  autoSync: boolean;
  syncIntervalMinutes: number; // 1, 2, 5, 10, 15
  lastSyncTime?: string;
  lastSyncStatus?: 'success' | 'error' | 'syncing' | 'idle';
  lastSyncCount?: number;
  lastErrorMessage?: string;
}

export const GRUDADO_BRAND = {
  amarelo: '#F9E547',
  verde: '#8EDD65',
  rosa: '#EF426F',
  azulClaro: '#05C3DE',
  laranja: '#FF6A39',
  azulEscuro: '#253746',
} as const;

export type CarrierName = 'Correios' | 'Jadlog' | 'J&T' | string;

export type ProblemType = 
  | 'Atraso na entrega'
  | 'Extravio'
  | 'Avaria'
  | 'Roubo de carga'
  | string;

export type ResolutionStatus = 'Em análise' | 'Sim' | 'Não';

export type RefundStatus = 'Pendente' | 'Pago' | 'Negado' | 'Não se aplica';

export interface Claim {
  id: string;
  orderNumber: string;
  trackingCode: string;
  carrier: CarrierName;
  invoiceNumber: string;
  shippingDate: string; // YYYY-MM-DD or DD/MM/YYYY
  amount: number;
  ticketDate: string; // YYYY-MM-DD
  problemType: ProblemType;
  slaDays: number;
  estimatedReturnDate: string; // YYYY-MM-DD
  resolution: ResolutionStatus;
  refundStatus: RefundStatus;
  monthYear: string; // e.g. 'agosto/2026', 'setembro/2026'
  protocolNumber?: string;
  ticketStatus?: string; // Status da ocorrência/chamado (ex: "Em análise", "Entregue com atraso", "Aguardando transportadora", etc.)
  isRefundEligible?: boolean; // Indica se é plausível de ressarcimento (false quando é apenas acompanhamento de atraso/rastreio)
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SLAStatus = 'overdue' | 'due_today' | 'on_track' | 'completed';

export interface FilterState {
  search: string;
  carrier: string;
  problemType: string;
  refundStatus: string;
  resolution: string;
  ticketStatus?: string;
  monthYear: string;
  slaFilter: 'all' | 'overdue' | 'due_today' | 'on_track';
  tab: 'all' | 'pending' | 'overdue' | 'paid' | 'denied' | 'not_applicable';
}

export interface ClaimStats {
  totalCount: number;
  totalAmount: number;
  pendingAmount: number;
  pendingCount: number;
  paidAmount: number;
  paidCount: number;
  deniedAmount: number;
  deniedCount: number;
  notApplicableCount: number;
  notApplicableAmount: number;
  overdueCount: number;
  dueTodayCount: number;
  recoveryRate: number; // percentage (paid / total eligible)
  carrierDistribution: {
    name: string;
    count: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
  }[];
  problemDistribution: {
    name: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }[];
  monthlyEvolution: {
    monthYear: string;
    totalAmount: number;
    pendingAmount: number;
    paidAmount: number;
    count: number;
  }[];
}
