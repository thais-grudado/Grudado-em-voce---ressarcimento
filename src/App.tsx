import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2 } from 'lucide-react';
import { Claim, FilterState, ClaimStats, ResolutionStatus, RefundStatus, GoogleSheetConfig, AppUser } from './types';
import { INITIAL_CLAIMS } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardMetrics } from './components/DashboardMetrics';
import { ClaimsTable } from './components/ClaimsTable';
import { ClaimModal } from './components/ClaimModal';
import { QuickCobranceModal } from './components/QuickCobranceModal';
import { ImportExportModal } from './components/ImportExportModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PinAuthScreen } from './components/PinAuthScreen';
import { ManagePinsModal } from './components/ManagePinsModal';
import { AdminAuthPromptModal } from './components/AdminAuthPromptModal';
import { getStoredSession, setStoredSession, clearStoredSession, getRolePermissions } from './utils/auth';
import { fetchGoogleSheetCSV, parseClaimsFromCSV, normalizeCarrierName } from './services/googleSheetsService';
import { exportClaimsToCSV, computeSLAStatus, normalizeMonthYearKey } from './utils/formatters';

const STORAGE_KEY = 'grudado_em_voce_ressarcimentos_v1';
const SHEETS_CONFIG_KEY = 'grudado_em_voce_sheets_config_v1';
const USER_OVERRIDES_KEY = 'grudado_em_voce_status_overrides_v1';

interface StatusOverride {
  refundStatus: RefundStatus;
  resolution: ResolutionStatus;
  ticketStatus?: string;
  isRefundEligible?: boolean;
  notes?: string;
  updatedAt: string;
}

const getStatusOverrides = (): Record<string, StatusOverride> => {
  try {
    const raw = localStorage.getItem(USER_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setStatusOverride = (key: string, override: Partial<StatusOverride>) => {
  if (!key) return;
  try {
    const current = getStatusOverrides();
    current[key] = {
      ...current[key],
      ...override,
      updatedAt: new Date().toISOString(),
    } as StatusOverride;
    localStorage.setItem(USER_OVERRIDES_KEY, JSON.stringify(current));
  } catch (err) {
    console.error('Error saving status override:', err);
  }
};

const clearStatusOverrides = () => {
  try {
    localStorage.removeItem(USER_OVERRIDES_KEY);
  } catch {}
};

export default function App() {
  // Claims state with localStorage persistence
  const [claims, setClaims] = useState<Claim[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Claim[] = JSON.parse(saved);
        // Filter out ancient legacy mock dummy items while preserving all user claims & changes
        const validClaims = parsed.filter(
          (c) => c.id !== 'claim-1' && !(c.orderNumber === '1' && c.amount === 20) && !(c.orderNumber === '4' && c.amount === 876)
        );
        if (validClaims.length > 0) {
          const overrides = getStatusOverrides();
          return validClaims.map((c) => {
            const key = c.orderNumber?.trim() || c.id;
            const ov = overrides[key] || overrides[c.id];
            return {
              ...c,
              carrier: c.carrier ? normalizeCarrierName(c.carrier) : c.carrier,
              refundStatus: ov?.refundStatus || c.refundStatus,
              resolution: ov?.resolution || c.resolution,
              ticketStatus: ov?.ticketStatus || c.ticketStatus,
              isRefundEligible: ov?.isRefundEligible !== undefined ? ov.isRefundEligible : c.isRefundEligible,
            };
          });
        }
      }
    } catch (e) {
      console.error('Error loading claims from storage:', e);
    }
    return INITIAL_CLAIMS;
  });

  // Google Sheets automation config state
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetConfig>(() => {
    try {
      const saved = localStorage.getItem(SHEETS_CONFIG_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading sheets config:', e);
    }
    return {
      url: '',
      spreadsheetId: '',
      autoSync: true,
      syncIntervalMinutes: 2,
      lastSyncStatus: 'idle',
    };
  });

  // Save sheets config to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SHEETS_CONFIG_KEY, JSON.stringify(sheetConfig));
    } catch (e) {
      console.error('Error saving sheets config:', e);
    }
  }, [sheetConfig]);

  // Google Sheets sync state
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    } catch (e) {
      console.error('Error saving claims to storage:', e);
    }
  }, [claims]);

  // View state: 'dashboard' (KPIs + Table), 'table' (Focus on Claims Table), 'reports' (Charts & Analytics)
  const [activeView, setActiveView] = useState<'dashboard' | 'table' | 'reports'>('dashboard');
  const [showChartsInDashboard, setShowChartsInDashboard] = useState(false);

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Authentication & Role Permissions
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getStoredSession());
  const [isManagePinsOpen, setIsManagePinsOpen] = useState(false);
  const [adminPromptAction, setAdminPromptAction] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onAuthorize: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onAuthorize: () => {},
  });

  const handleLogout = () => {
    clearStoredSession();
    setCurrentUser(null);
  };

  // Modals state
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [editClaim, setEditClaim] = useState<Claim | null>(null);
  const [cobranceClaim, setCobranceClaim] = useState<Claim | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    carrier: '',
    problemType: '',
    refundStatus: '',
    resolution: '',
    monthYear: '',
    slaFilter: 'all',
    tab: 'all',
  });

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Trigger celebration on recovery
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2563EB', '#10B981', '#F59E0B', '#6366F1'],
      });
    } catch (e) {
      // benign fallback
    }
  };

  // Add / Edit Claim
  const handleSaveClaim = (
    claimData: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    const now = new Date().toISOString();
    const finalResolution: ResolutionStatus =
      claimData.refundStatus === 'Pago' ? 'Sim' :
      claimData.refundStatus === 'Negado' ? 'Não' :
      claimData.resolution;

    const dataWithResolution = {
      ...claimData,
      resolution: finalResolution,
    };

    if (claimData.refundStatus === 'Pago') {
      triggerConfetti();
      setSyncToast(`✓ Pedido #${claimData.orderNumber} salvo como PAGO com sucesso!`);
      setTimeout(() => setSyncToast(null), 4500);
    }

    if (editId) {
      setClaims((prev) => {
        const next = prev.map((c) =>
          c.id === editId
            ? { ...c, ...dataWithResolution, updatedAt: now }
            : c
        );
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      // Save status overrides
      setStatusOverride(editId, {
        refundStatus: claimData.refundStatus,
        resolution: finalResolution,
        ticketStatus: claimData.ticketStatus,
        isRefundEligible: claimData.isRefundEligible,
        notes: claimData.notes,
      });
      if (claimData.orderNumber) {
        setStatusOverride(claimData.orderNumber.trim(), {
          refundStatus: claimData.refundStatus,
          resolution: finalResolution,
          ticketStatus: claimData.ticketStatus,
          isRefundEligible: claimData.isRefundEligible,
          notes: claimData.notes,
        });
      }
    } else {
      const newClaim: Claim = {
        ...dataWithResolution,
        id: `claim-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setClaims((prev) => {
        const next = [newClaim, ...prev];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      if (claimData.orderNumber) {
        setStatusOverride(claimData.orderNumber.trim(), {
          refundStatus: claimData.refundStatus,
          resolution: finalResolution,
          ticketStatus: claimData.ticketStatus,
          isRefundEligible: claimData.isRefundEligible,
          notes: claimData.notes,
        });
      }
    }
  };

  // Inline status update
  const handleUpdateStatus = (
    id: string,
    resolution: ResolutionStatus,
    refundStatus: RefundStatus
  ) => {
    const existing = claims.find((c) => c.id === id);
    if (existing && existing.refundStatus !== 'Pago' && refundStatus === 'Pago') {
      triggerConfetti();
    }

    const autoResolution: ResolutionStatus =
      refundStatus === 'Pago' ? 'Sim' :
      refundStatus === 'Negado' ? 'Não' :
      resolution;

    const orderDisplay = existing?.orderNumber ? `#${existing.orderNumber}` : '';
    setSyncToast(
      refundStatus === 'Pago'
        ? `✓ Pedido ${orderDisplay} salvo como PAGO!`
        : `Status do pedido ${orderDisplay} atualizado para "${refundStatus}"`
    );
    setTimeout(() => setSyncToast(null), 4500);

    // Save override persistently
    setStatusOverride(id, {
      refundStatus,
      resolution: autoResolution,
    });
    if (existing?.orderNumber) {
      setStatusOverride(existing.orderNumber.trim(), {
        refundStatus,
        resolution: autoResolution,
      });
    }

    setClaims((prev) => {
      const next = prev.map((c) =>
        c.id === id
          ? {
              ...c,
              resolution: autoResolution,
              refundStatus,
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Delete single claim with permission guard
  const executeDeleteClaim = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta solicitação de ressarcimento?')) {
      setClaims((prev) => {
        const next = prev.filter((c) => c.id !== id);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }
  };

  const handleDeleteClaim = (id: string) => {
    const permissions = currentUser ? getRolePermissions(currentUser.role) : null;
    if (!permissions?.canDeleteClaim) {
      setAdminPromptAction({
        isOpen: true,
        title: 'Excluir Solicitação',
        description: 'Apenas Administradores podem excluir solicitações. Digite o PIN de Administrador para autorizar.',
        onAuthorize: () => executeDeleteClaim(id),
      });
      return;
    }
    executeDeleteClaim(id);
  };

  // Batch updates
  const handleBatchUpdateStatus = (
    ids: string[],
    refundStatus: RefundStatus,
    resolution: ResolutionStatus
  ) => {
    const autoResolution: ResolutionStatus =
      refundStatus === 'Pago' ? 'Sim' :
      refundStatus === 'Negado' ? 'Não' :
      resolution;

    if (refundStatus === 'Pago') {
      triggerConfetti();
    }

    setSyncToast(`✓ ${ids.length} solicitações atualizadas para "${refundStatus}" com sucesso!`);
    setTimeout(() => setSyncToast(null), 4500);

    ids.forEach((id) => {
      const existing = claims.find((c) => c.id === id);
      setStatusOverride(id, {
        refundStatus,
        resolution: autoResolution,
      });
      if (existing?.orderNumber) {
        setStatusOverride(existing.orderNumber.trim(), {
          refundStatus,
          resolution: autoResolution,
        });
      }
    });

    setClaims((prev) => {
      const next = prev.map((c) =>
        ids.includes(c.id)
          ? { ...c, refundStatus, resolution: autoResolution, updatedAt: new Date().toISOString() }
          : c
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const executeBatchDelete = (ids: string[]) => {
    setClaims((prev) => {
      const next = prev.filter((c) => !ids.includes(c.id));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleBatchDelete = (ids: string[]) => {
    const permissions = currentUser ? getRolePermissions(currentUser.role) : null;
    if (!permissions?.canDeleteClaim) {
      setAdminPromptAction({
        isOpen: true,
        title: 'Exclusão em Lote',
        description: 'Excluir múltiplos chamados exige autorização de Administrador.',
        onAuthorize: () => executeBatchDelete(ids),
      });
      return;
    }
    executeBatchDelete(ids);
  };

  // Reset to initial records with permission guard
  const executeResetData = () => {
    if (confirm('Deseja recarregar os registros originais da planilha? (Isso redefinirá os status alterados)')) {
      clearStatusOverrides();
      setClaims(INITIAL_CLAIMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CLAIMS));
      } catch (e) {}
      setFilters({
        search: '',
        carrier: '',
        problemType: '',
        refundStatus: '',
        resolution: '',
        monthYear: '',
        slaFilter: 'all',
        tab: 'all',
      });
      setSyncToast('Registros restaurados com sucesso!');
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  const handleResetData = () => {
    const permissions = currentUser ? getRolePermissions(currentUser.role) : null;
    if (!permissions?.canResetData) {
      setAdminPromptAction({
        isOpen: true,
        title: 'Restaurar Registros',
        description: 'Apenas Administradores podem restaurar a base de dados original.',
        onAuthorize: () => executeResetData(),
      });
      return;
    }
    executeResetData();
  };

  // Open Manage PINs strictly for Admin
  const handleOpenManagePins = () => {
    if (currentUser?.role !== 'admin') {
      setAdminPromptAction({
        isOpen: true,
        title: 'Acesso Restrito ao Gestor',
        description: 'Apenas Administradores podem visualizar e gerenciar os PINs da equipe. Digite o PIN de Administrador para autorizar.',
        onAuthorize: () => setIsManagePinsOpen(true),
      });
      return;
    }
    setIsManagePinsOpen(true);
  };

  // Open Google Sheets Modal with permission guard
  const handleOpenGoogleSheetsModal = () => {
    const permissions = currentUser ? getRolePermissions(currentUser.role) : null;
    if (!permissions?.canConfigureSheets) {
      setAdminPromptAction({
        isOpen: true,
        title: 'Configurações de Planilha',
        description: 'Apenas Administradores podem configurar a integração com o Google Sheets. Digite o PIN de Administrador para prosseguir.',
        onAuthorize: () => setIsSheetsModalOpen(true),
      });
      return;
    }
    setIsSheetsModalOpen(true);
  };

  // Import claims manually
  const handleImportClaims = (newClaims: Claim[]) => {
    const overrides = getStatusOverrides();
    const applied = newClaims.map((item) => {
      const key = item.orderNumber?.trim() || item.id;
      const ov = overrides[key] || overrides[item.id];
      if (ov) {
        return {
          ...item,
          refundStatus: ov.refundStatus || item.refundStatus,
          resolution: ov.resolution || item.resolution,
        };
      }
      return item;
    });
    setClaims((prev) => {
      const next = [...applied, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // Sync claims from Google Sheets (called from modal or background auto-sync)
  const handleSyncClaims = (newClaims: Claim[], mode: 'merge' | 'replace') => {
    const overrides = getStatusOverrides();

    if (mode === 'replace') {
      const applied = newClaims.map((item) => {
        const key = item.orderNumber?.trim() || item.id;
        const ov = overrides[key] || overrides[item.id];
        if (ov) {
          return {
            ...item,
            refundStatus: ov.refundStatus || item.refundStatus,
            resolution: ov.resolution || item.resolution,
            ticketStatus: ov.ticketStatus || item.ticketStatus,
            isRefundEligible: ov.isRefundEligible !== undefined ? ov.isRefundEligible : item.isRefundEligible,
          };
        }
        return item;
      });
      setClaims(applied);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applied));
      } catch (e) {}
    } else {
      // Merge strategy: update if orderNumber or trackingCode matches, otherwise prepend
      setClaims((prev) => {
        const updated = [...prev];
        newClaims.forEach((newItem) => {
          const index = updated.findIndex(
            (c) =>
              (c.orderNumber && newItem.orderNumber && c.orderNumber.trim().toLowerCase() === newItem.orderNumber.trim().toLowerCase()) ||
              (c.trackingCode && newItem.trackingCode && c.trackingCode.trim().toLowerCase() === newItem.trackingCode.trim().toLowerCase())
          );
          if (index !== -1) {
            const local = updated[index];
            const key = local.orderNumber?.trim() || local.id;
            const ov = overrides[key] || overrides[local.id];

            // Determine final preserved refundStatus:
            // If user marked as Pago, Negado, or Não se aplica, PRESERVE it!
            let finalRefundStatus = newItem.refundStatus;
            let finalResolution = newItem.resolution;

            if (ov?.refundStatus) {
              finalRefundStatus = ov.refundStatus;
              finalResolution = ov.resolution;
            } else if (local.refundStatus === 'Pago' || local.refundStatus === 'Negado' || local.refundStatus === 'Não se aplica') {
              if (newItem.refundStatus === 'Pendente') {
                finalRefundStatus = local.refundStatus;
                finalResolution = local.resolution;
              }
            }

            updated[index] = {
              ...local,
              ...newItem,
              id: local.id, // preserve local id
              refundStatus: finalRefundStatus,
              resolution: finalResolution,
              ticketStatus: ov?.ticketStatus || local.ticketStatus || newItem.ticketStatus,
              isRefundEligible: ov?.isRefundEligible !== undefined ? ov.isRefundEligible : (local.isRefundEligible !== undefined ? local.isRefundEligible : newItem.isRefundEligible),
              notes: ov?.notes || local.notes || newItem.notes,
              updatedAt: new Date().toISOString(),
            };
          } else {
            const key = newItem.orderNumber?.trim() || newItem.id;
            const ov = overrides[key] || overrides[newItem.id];
            if (ov) {
              updated.unshift({
                ...newItem,
                refundStatus: ov.refundStatus || newItem.refundStatus,
                resolution: ov.resolution || newItem.resolution,
                ticketStatus: ov.ticketStatus || newItem.ticketStatus,
                isRefundEligible: ov.isRefundEligible !== undefined ? ov.isRefundEligible : newItem.isRefundEligible,
              });
            } else {
              updated.unshift(newItem);
            }
          }
        });
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }

    setSyncToast(`Google Sheets: ${newClaims.length} ${newClaims.length === 1 ? 'chamado sincronizado' : 'chamados sincronizados'} com sucesso!`);
    setTimeout(() => setSyncToast(null), 4500);
  };

  // Quick background sync
  const handleQuickSyncSheets = async () => {
    if (!sheetConfig.url) {
      setIsSheetsModalOpen(true);
      return;
    }

    setIsSyncingSheets(true);
    try {
      const csvText = await fetchGoogleSheetCSV(sheetConfig.url);
      const parsed = parseClaimsFromCSV(csvText);

      if (parsed.claims.length > 0) {
        handleSyncClaims(parsed.claims, 'merge');
        setSheetConfig((prev) => ({
          ...prev,
          lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          lastSyncStatus: 'success',
          lastSyncCount: parsed.claims.length,
          lastErrorMessage: undefined,
        }));
      }
    } catch (err: any) {
      console.warn('Google Sheets auto-sync notice:', err?.message);
      setSheetConfig((prev) => ({
        ...prev,
        lastSyncStatus: 'error',
        lastErrorMessage: err?.message || 'Erro ao sincronizar',
      }));
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Check URL query parameters for cross-browser sheet sharing (?sheet=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sheetUrlParam = params.get('sheet');
      if (sheetUrlParam && sheetUrlParam.trim()) {
        const cleanUrl = sheetUrlParam.trim();
        setSheetConfig((prev) => ({
          ...prev,
          url: cleanUrl,
          autoSync: true,
        }));
        setIsSyncingSheets(true);
        fetchGoogleSheetCSV(cleanUrl)
          .then((csvText) => {
            const parsed = parseClaimsFromCSV(csvText);
            if (parsed.claims.length > 0) {
              handleSyncClaims(parsed.claims, 'merge');
              setSheetConfig((prev) => ({
                ...prev,
                lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                lastSyncStatus: 'success',
                lastSyncCount: parsed.claims.length,
              }));
            }
          })
          .catch((err) => {
            console.warn('Auto-sync from sheet query param failed:', err?.message);
          })
          .finally(() => {
            setIsSyncingSheets(false);
          });
      }
    } catch (e) {
      // benign URL parse fallback
    }
  }, []);

  // Auto-sync timer (e.g. every 2 min when active)
  useEffect(() => {
    if (!sheetConfig.url || !sheetConfig.autoSync) return;

    const intervalMinutes = sheetConfig.syncIntervalMinutes || 2;
    const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    const timer = setInterval(() => {
      handleQuickSyncSheets();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [sheetConfig.url, sheetConfig.autoSync, sheetConfig.syncIntervalMinutes]);

  // Calculate stats
  const stats: ClaimStats = useMemo(() => {
    let totalCount = claims.length;
    let totalAmount = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let paidAmount = 0;
    let paidCount = 0;
    let deniedAmount = 0;
    let deniedCount = 0;
    let notApplicableCount = 0;
    let notApplicableAmount = 0;
    let overdueCount = 0;
    let dueTodayCount = 0;
    let awaitingPaymentCount = 0;
    let awaitingPaymentAmount = 0;

    const carrierMap: Record<
      string,
      { count: number; totalAmount: number; paidAmount: number; pendingAmount: number }
    > = {};

    const problemMap: Record<
      string,
      { count: number; totalAmount: number }
    > = {};

    const monthMap: Record<
      string,
      { key: string; monthYear: string; count: number; totalAmount: number; paidAmount: number; pendingAmount: number }
    > = {};

    claims.forEach((claim) => {
      const amt = Number(claim.amount) || 0;
      totalAmount += amt;

      const isNonRefundable = claim.refundStatus === 'Não se aplica' || claim.isRefundEligible === false;

      if (claim.refundStatus === 'Pago') {
        paidAmount += amt;
        paidCount += 1;
      } else if (claim.refundStatus === 'Negado') {
        deniedAmount += amt;
        deniedCount += 1;
      } else if (isNonRefundable) {
        notApplicableAmount += amt;
        notApplicableCount += 1;
      } else {
        pendingAmount += amt;
        pendingCount += 1;
      }

      // SLA
      const sla = computeSLAStatus(claim);
      if (sla.status === 'overdue') overdueCount += 1;
      if (sla.status === 'due_today') dueTodayCount += 1;

      // Track approved claims awaiting payment (resolution = 'Sim' & refundStatus = 'Pendente')
      if (claim.resolution === 'Sim' && claim.refundStatus === 'Pendente' && !isNonRefundable) {
        awaitingPaymentCount += 1;
        awaitingPaymentAmount += amt;
      }

      // Carrier breakdown
      const carrierName = claim.carrier || 'Outros';
      if (!carrierMap[carrierName]) {
        carrierMap[carrierName] = { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 };
      }
      carrierMap[carrierName].count += 1;
      carrierMap[carrierName].totalAmount += amt;
      if (claim.refundStatus === 'Pago') carrierMap[carrierName].paidAmount += amt;
      if (claim.refundStatus === 'Pendente' && !isNonRefundable) carrierMap[carrierName].pendingAmount += amt;

      // Problem breakdown
      const probName = claim.problemType || 'Outros';
      if (!problemMap[probName]) {
        problemMap[probName] = { count: 0, totalAmount: 0 };
      }
      problemMap[probName].count += 1;
      problemMap[probName].totalAmount += amt;

      // Monthly breakdown normalized chronologically
      const norm = normalizeMonthYearKey(claim.monthYear, claim.ticketDate || claim.shippingDate);
      if (!monthMap[norm.key]) {
        monthMap[norm.key] = {
          key: norm.key,
          monthYear: norm.label,
          count: 0,
          totalAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
        };
      }
      monthMap[norm.key].count += 1;
      monthMap[norm.key].totalAmount += amt;
      if (claim.refundStatus === 'Pago') monthMap[norm.key].paidAmount += amt;
      if (claim.refundStatus === 'Pendente' && !isNonRefundable) monthMap[norm.key].pendingAmount += amt;
    });

    const carrierDistribution = Object.entries(carrierMap).map(([name, data]) => ({
      name,
      count: data.count,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      pendingAmount: data.pendingAmount,
    }));

    const problemDistribution = Object.entries(problemMap).map(([name, data]) => ({
      name,
      count: data.count,
      totalAmount: data.totalAmount,
      percentage: totalCount > 0 ? (data.count / totalCount) * 100 : 0,
    }));

    // Chronologically sorted monthly evolution
    const monthlyEvolution = Object.values(monthMap)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, ...data }) => data);

    const eligibleAmount = paidAmount + pendingAmount + deniedAmount;
    const recoveryRate = eligibleAmount > 0 ? (paidAmount / eligibleAmount) * 100 : 0;

    return {
      totalCount,
      totalAmount,
      pendingAmount,
      pendingCount,
      paidAmount,
      paidCount,
      deniedAmount,
      deniedCount,
      notApplicableCount,
      notApplicableAmount,
      overdueCount,
      dueTodayCount,
      awaitingPaymentCount,
      awaitingPaymentAmount,
      recoveryRate,
      carrierDistribution,
      problemDistribution,
      monthlyEvolution,
    };
  }, [claims]);

  // Filtered claims for table display
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Tab filter
      if (filters.tab === 'pending' && (claim.refundStatus !== 'Pendente' || claim.isRefundEligible === false)) return false;
      if (filters.tab === 'awaiting_payment' && (claim.resolution !== 'Sim' || claim.refundStatus !== 'Pendente' || claim.isRefundEligible === false)) return false;
      if (filters.tab === 'paid' && claim.refundStatus !== 'Pago') return false;
      if (filters.tab === 'denied' && claim.refundStatus !== 'Negado') return false;
      if (filters.tab === 'not_applicable' && claim.refundStatus !== 'Não se aplica' && claim.isRefundEligible !== false) return false;
      if (filters.tab === 'overdue') {
        const sla = computeSLAStatus(claim);
        if (sla.status !== 'overdue') return false;
      }

      // Carrier filter
      if (filters.carrier && claim.carrier !== filters.carrier) return false;

      // Problem type filter
      if (filters.problemType && claim.problemType !== filters.problemType) return false;

      // Month filter
      if (filters.monthYear && claim.monthYear !== filters.monthYear) return false;

      // Text search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesOrder = claim.orderNumber.toLowerCase().includes(query);
        const matchesTracking = (claim.trackingCode || '').toLowerCase().includes(query);
        const matchesInvoice = (claim.invoiceNumber || '').toLowerCase().includes(query);
        const matchesProtocol = (claim.protocolNumber || '').toLowerCase().includes(query);
        const matchesTicketStatus = (claim.ticketStatus || '').toLowerCase().includes(query);
        const matchesNotes = (claim.notes || '').toLowerCase().includes(query);
        const matchesCarrier = (claim.carrier || '').toLowerCase().includes(query);
        if (
          !matchesOrder &&
          !matchesTracking &&
          !matchesInvoice &&
          !matchesProtocol &&
          !matchesTicketStatus &&
          !matchesNotes &&
          !matchesCarrier
        ) {
          return false;
        }
      }

      return true;
    });
  }, [claims, filters]);

  // Check if user is authenticated via PIN
  if (!currentUser) {
    return (
      <PinAuthScreen
        onLoginSuccess={(user) => {
          setStoredSession(user);
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar from Professional Polish theme */}
      <Sidebar
        currentTab={filters.tab}
        activeView={activeView}
        onViewChange={setActiveView}
        onTabChange={(tab) => handleFilterChange({ tab })}
        pendingCount={stats.pendingCount}
        overdueCount={stats.overdueCount}
        paidCount={stats.paidCount}
        totalCount={claims.length}
        onResetData={handleResetData}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        sheetConfig={sheetConfig}
        onOpenGoogleSheetsModal={handleOpenGoogleSheetsModal}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenManagePins={currentUser?.role === 'admin' ? handleOpenManagePins : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header */}
        <Header
          claims={claims}
          overdueCount={stats.overdueCount}
          pendingAmount={stats.pendingAmount}
          activeView={activeView}
          onViewChange={setActiveView}
          onNewClaim={() => {
            setEditClaim(null);
            setIsClaimModalOpen(true);
          }}
          onExport={() => exportClaimsToCSV(claims)}
          onImportClick={() => setIsImportModalOpen(true)}
          onResetData={handleResetData}
          onOverdueFilterClick={() => {
            setActiveView('table');
            handleFilterChange({ tab: 'overdue' });
          }}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          sheetConfig={sheetConfig}
          onOpenGoogleSheetsModal={handleOpenGoogleSheetsModal}
          onQuickSyncSheets={handleQuickSyncSheets}
          isSyncingSheets={isSyncingSheets}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenManagePins={currentUser?.role === 'admin' ? handleOpenManagePins : undefined}
        />

        {/* Executive Dashboard & Claims Sections */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
          {/* Active View Content */}
          {activeView === 'dashboard' && (
            <>
              {/* KPI metrics row */}
              <DashboardMetrics
                stats={stats}
                showCharts={showChartsInDashboard}
                selectedCarrierFilter={filters.carrier}
                onSelectCarrierFilter={(c) => handleFilterChange({ carrier: c })}
                selectedProblemFilter={filters.problemType}
                onSelectProblemFilter={(p) => handleFilterChange({ problemType: p })}
                onTabChange={(tab) => {
                  setActiveView('table');
                  handleFilterChange({ tab });
                }}
              />

              {/* Toggle to view charts or focus on table */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Visão Operacional
                  </span>
                </div>
                <button
                  onClick={() => setShowChartsInDashboard((prev) => !prev)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 rounded-md transition cursor-pointer"
                >
                  <span>{showChartsInDashboard ? '▲ Ocultar Gráficos Analíticos' : '▼ Exibir Gráficos Analíticos'}</span>
                </button>
              </div>

              {/* Table Container - Immediately visible under KPI cards */}
              <ClaimsTable
                claims={filteredClaims}
                filters={filters}
                onFilterChange={handleFilterChange}
                onUpdateStatus={handleUpdateStatus}
                onEditClaim={(c) => {
                  setEditClaim(c);
                  setIsClaimModalOpen(true);
                }}
                onDeleteClaim={handleDeleteClaim}
                onCobranceClick={(c) => setCobranceClaim(c)}
                onBatchUpdateStatus={handleBatchUpdateStatus}
                onBatchDelete={handleBatchDelete}
                currentUser={currentUser}
              />
            </>
          )}

          {activeView === 'table' && (
            <>
              {/* Full focus on the claims table */}
              <ClaimsTable
                claims={filteredClaims}
                filters={filters}
                onFilterChange={handleFilterChange}
                onUpdateStatus={handleUpdateStatus}
                onEditClaim={(c) => {
                  setEditClaim(c);
                  setIsClaimModalOpen(true);
                }}
                onDeleteClaim={handleDeleteClaim}
                onCobranceClick={(c) => setCobranceClaim(c)}
                onBatchUpdateStatus={handleBatchUpdateStatus}
                onBatchDelete={handleBatchDelete}
                currentUser={currentUser}
              />
            </>
          )}

          {activeView === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Relatórios & Gráficos Analíticos
                  </h2>
                  <p className="text-xs text-slate-500">
                    Estatísticas consolidadas por transportadora, tipo de sinistro e competência
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('table')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition cursor-pointer"
                >
                  Ver Tabela de Demandas &rarr;
                </button>
              </div>

              {/* KPI cards and full analytical charts */}
              <DashboardMetrics
                stats={stats}
                showCharts={true}
                selectedCarrierFilter={filters.carrier}
                onSelectCarrierFilter={(c) => handleFilterChange({ carrier: c })}
                selectedProblemFilter={filters.problemType}
                onSelectProblemFilter={(p) => handleFilterChange({ problemType: p })}
                onTabChange={(tab) => {
                  setActiveView('table');
                  handleFilterChange({ tab });
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <ClaimModal
        isOpen={isClaimModalOpen}
        onClose={() => {
          setIsClaimModalOpen(false);
          setEditClaim(null);
        }}
        onSave={handleSaveClaim}
        editClaim={editClaim}
      />

      <QuickCobranceModal
        isOpen={!!cobranceClaim}
        claim={cobranceClaim}
        onClose={() => setCobranceClaim(null)}
        onMarkAsPaid={(claimId) => handleUpdateStatus(claimId, 'Sim', 'Pago')}
      />

      <ImportExportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        claims={claims}
        onImportClaims={handleImportClaims}
        onResetOriginals={handleResetData}
      />

      {/* Google Sheets Automation Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        config={sheetConfig}
        onSaveConfig={setSheetConfig}
        onSyncClaims={handleSyncClaims}
        currentClaimsCount={claims.length}
      />

      {/* Manage PINs Modal - Strictly Admin Only */}
      {currentUser && currentUser.role === 'admin' && (
        <ManagePinsModal
          isOpen={isManagePinsOpen}
          onClose={() => setIsManagePinsOpen(false)}
          currentUser={currentUser}
          onUsersUpdated={(updatedUsers) => {
            const me = updatedUsers.find((u) => u.id === currentUser.id);
            if (me) {
              setStoredSession(me);
              setCurrentUser(me);
            }
          }}
        />
      )}

      {/* Admin Authorization Prompt Modal */}
      <AdminAuthPromptModal
        isOpen={adminPromptAction.isOpen}
        onClose={() => setAdminPromptAction((prev) => ({ ...prev, isOpen: false }))}
        onAuthorized={() => {
          adminPromptAction.onAuthorize();
        }}
        actionTitle={adminPromptAction.title}
        actionDescription={adminPromptAction.description}
      />

      {/* Floating Sync Notification Toast */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#253746] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#8EDD65]/40 flex items-center gap-3 text-xs shadow-slate-900/30">
          <CheckCircle2 className="w-4 h-4 text-[#8EDD65] shrink-0" />
          <span className="font-semibold">{syncToast}</span>
          {filters.tab === 'pending' && (
            <button
              onClick={() => handleFilterChange({ tab: 'paid' })}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition cursor-pointer whitespace-nowrap ml-1"
            >
              Ver em Pagos &rarr;
            </button>
          )}
          <button
            onClick={() => setSyncToast(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm cursor-pointer leading-none"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
