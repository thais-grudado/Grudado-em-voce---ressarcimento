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

export type RefundStatus = 'Pendente' | 'Pago' | 'Negado';

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
  monthYear: string;
  slaFilter: 'all' | 'overdue' | 'due_today' | 'on_track';
  tab: 'all' | 'pending' | 'overdue' | 'paid' | 'denied';
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
  overdueCount: number;
  dueTodayCount: number;
  recoveryRate: number; // percentage (paid / total)
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
