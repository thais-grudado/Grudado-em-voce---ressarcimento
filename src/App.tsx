import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Claim, FilterState, ClaimStats, ResolutionStatus, RefundStatus, GoogleSheetConfig } from './types';
import { INITIAL_CLAIMS } from './data/initialData';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardMetrics } from './components/DashboardMetrics';
import { ClaimsTable } from './components/ClaimsTable';
import { ClaimModal } from './components/ClaimModal';
import { QuickCobranceModal } from './components/QuickCobranceModal';
import { ImportExportModal } from './components/ImportExportModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { fetchGoogleSheetCSV, parseClaimsFromCSV, normalizeCarrierName } from './services/googleSheetsService';
import { exportClaimsToCSV, computeSLAStatus } from './utils/formatters';

const STORAGE_KEY = 'grudado_em_voce_ressarcimentos_v1';
const SHEETS_CONFIG_KEY = 'grudado_em_voce_sheets_config_v1';

export default function App() {
  // Claims state with localStorage persistence
  const [claims, setClaims] = useState<Claim[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Claim[] = JSON.parse(saved);
        // Correct order 61076, 57890 or similar records with real spreadsheet values
        return parsed.map((c) => {
          if (c.orderNumber && c.orderNumber.includes('61076')) {
            return {
              ...c,
              orderNumber: '61076',
              trackingCode: '888030881344028',
              carrier: 'J&T',
              invoiceNumber: '23655',
              shippingDate: '2026-08-19',
              ticketDate: '2026-08-19',
              amount: 45.49,
              estimatedReturnDate: '2026-08-26',
              problemType: 'Avaria',
              slaDays: 5,
              resolution: 'Sim',
              refundStatus: 'Pendente',
              monthYear: 'agosto/2026',
            };
          }
          if (c.orderNumber && c.orderNumber.includes('57890')) {
            return {
              ...c,
              orderNumber: '57890',
              trackingCode: 'AD604025375BR',
              carrier: 'Correios',
              invoiceNumber: '25123',
              monthYear: 'julho/2026',
              ticketDate: '2026-07-10',
              estimatedReturnDate: '2026-07-15',
              shippingDate: '2026-07-02',
              problemType: 'Não localizado',
              amount: 54.48,
              resolution: 'Sim',
              refundStatus: 'Pendente',
            };
          }
          if (c.carrier) {
            return {
              ...c,
              carrier: normalizeCarrierName(c.carrier),
            };
          }
          return c;
        });
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
    if (editId) {
      setClaims((prev) =>
        prev.map((c) =>
          c.id === editId
            ? { ...c, ...claimData, updatedAt: now }
            : c
        )
      );
    } else {
      const newClaim: Claim = {
        ...claimData,
        id: `claim-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setClaims((prev) => [newClaim, ...prev]);
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

    setClaims((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              resolution,
              refundStatus,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  // Delete single claim
  const handleDeleteClaim = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta solicitação de ressarcimento?')) {
      setClaims((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Batch updates
  const handleBatchUpdateStatus = (
    ids: string[],
    refundStatus: RefundStatus,
    resolution: ResolutionStatus
  ) => {
    if (refundStatus === 'Pago') {
      triggerConfetti();
    }
    setClaims((prev) =>
      prev.map((c) =>
        ids.includes(c.id)
          ? { ...c, refundStatus, resolution, updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  const handleBatchDelete = (ids: string[]) => {
    setClaims((prev) => prev.filter((c) => !ids.includes(c.id)));
  };

  // Reset to initial 10 records
  const handleResetData = () => {
    if (confirm('Deseja recarregar os 10 registros originais da sua planilha?')) {
      setClaims(INITIAL_CLAIMS);
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
    }
  };

  // Import claims manually
  const handleImportClaims = (newClaims: Claim[]) => {
    setClaims((prev) => [...newClaims, ...prev]);
  };

  // Sync claims from Google Sheets (called from modal or background auto-sync)
  const handleSyncClaims = (newClaims: Claim[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setClaims(newClaims);
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
            updated[index] = {
              ...updated[index],
              ...newItem,
              id: updated[index].id, // preserve local id
              updatedAt: new Date().toISOString(),
            };
          } else {
            updated.unshift(newItem);
          }
        });
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
    let overdueCount = 0;
    let dueTodayCount = 0;

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
      { count: number; totalAmount: number; paidAmount: number; pendingAmount: number }
    > = {};

    claims.forEach((claim) => {
      const amt = Number(claim.amount) || 0;
      totalAmount += amt;

      if (claim.refundStatus === 'Pago') {
        paidAmount += amt;
        paidCount += 1;
      } else if (claim.refundStatus === 'Negado') {
        deniedAmount += amt;
        deniedCount += 1;
      } else {
        pendingAmount += amt;
        pendingCount += 1;
      }

      // SLA
      const sla = computeSLAStatus(claim);
      if (sla.status === 'overdue') overdueCount += 1;
      if (sla.status === 'due_today') dueTodayCount += 1;

      // Carrier breakdown
      const carrierName = claim.carrier || 'Outros';
      if (!carrierMap[carrierName]) {
        carrierMap[carrierName] = { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 };
      }
      carrierMap[carrierName].count += 1;
      carrierMap[carrierName].totalAmount += amt;
      if (claim.refundStatus === 'Pago') carrierMap[carrierName].paidAmount += amt;
      if (claim.refundStatus === 'Pendente') carrierMap[carrierName].pendingAmount += amt;

      // Problem breakdown
      const probName = claim.problemType || 'Outros';
      if (!problemMap[probName]) {
        problemMap[probName] = { count: 0, totalAmount: 0 };
      }
      problemMap[probName].count += 1;
      problemMap[probName].totalAmount += amt;

      // Monthly breakdown
      const mName = claim.monthYear || 'setembro/2026';
      if (!monthMap[mName]) {
        monthMap[mName] = { count: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0 };
      }
      monthMap[mName].count += 1;
      monthMap[mName].totalAmount += amt;
      if (claim.refundStatus === 'Pago') monthMap[mName].paidAmount += amt;
      if (claim.refundStatus === 'Pendente') monthMap[mName].pendingAmount += amt;
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

    const monthlyEvolution = Object.entries(monthMap).map(([monthYear, data]) => ({
      monthYear,
      count: data.count,
      totalAmount: data.totalAmount,
      paidAmount: data.paidAmount,
      pendingAmount: data.pendingAmount,
    }));

    const recoveryRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    return {
      totalCount,
      totalAmount,
      pendingAmount,
      pendingCount,
      paidAmount,
      paidCount,
      deniedAmount,
      deniedCount,
      overdueCount,
      dueTodayCount,
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
      if (filters.tab === 'pending' && claim.refundStatus !== 'Pendente') return false;
      if (filters.tab === 'paid' && claim.refundStatus !== 'Pago') return false;
      if (filters.tab === 'denied' && claim.refundStatus !== 'Negado') return false;
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
        const matchesNotes = (claim.notes || '').toLowerCase().includes(query);
        const matchesCarrier = (claim.carrier || '').toLowerCase().includes(query);
        if (
          !matchesOrder &&
          !matchesTracking &&
          !matchesInvoice &&
          !matchesProtocol &&
          !matchesNotes &&
          !matchesCarrier
        ) {
          return false;
        }
      }

      return true;
    });
  }, [claims, filters]);

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
        onOpenGoogleSheetsModal={() => setIsSheetsModalOpen(true)}
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
          onOpenGoogleSheetsModal={() => setIsSheetsModalOpen(true)}
          onQuickSyncSheets={handleQuickSyncSheets}
          isSyncingSheets={isSyncingSheets}
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

      {/* Floating Sync Notification Toast */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#253746] text-white px-4 py-3 rounded-2xl shadow-xl border border-[#8EDD65]/40 flex items-center gap-3 text-xs animate-bounce">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8EDD65]" />
          <span className="font-semibold">{syncToast}</span>
        </div>
      )}
    </div>
  );
}
