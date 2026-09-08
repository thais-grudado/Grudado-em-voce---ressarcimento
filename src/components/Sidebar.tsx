import React from 'react';
import { 
  LayoutDashboard, 
  Table, 
  BarChart3, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  RotateCcw,
  Sheet,
  X,
  LogOut,
  KeyRound,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { FilterState, GoogleSheetConfig, AppUser } from '../types';
import { getRolePermissions } from '../utils/auth';
import { GrudadoLogo } from './GrudadoLogo';

interface SidebarProps {
  currentTab: string;
  activeView: 'dashboard' | 'table' | 'reports';
  onViewChange: (view: 'dashboard' | 'table' | 'reports') => void;
  onTabChange: (tab: FilterState['tab']) => void;
  pendingCount: number;
  overdueCount: number;
  paidCount: number;
  totalCount: number;
  onResetData: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  sheetConfig?: GoogleSheetConfig;
  onOpenGoogleSheetsModal: () => void;
  currentUser?: AppUser | null;
  onLogout?: () => void;
  onOpenManagePins?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeView,
  onViewChange,
  onTabChange,
  pendingCount,
  overdueCount,
  paidCount,
  totalCount,
  onResetData,
  isOpenMobile,
  onCloseMobile,
  sheetConfig,
  onOpenGoogleSheetsModal,
  currentUser,
  onLogout,
  onOpenManagePins,
}) => {
  const isSheetsConnected = Boolean(sheetConfig?.url);
  const permissions = currentUser ? getRolePermissions(currentUser.role) : null;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#253746]/70 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container with Official Brand Navy #253746 */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 w-64 bg-[#253746] text-white flex flex-col z-50 transition-transform duration-200 ease-in-out border-r border-white/10 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Block */}
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between mb-6">
            {/* Official Grudado em Você Logo */}
            <div className="flex flex-col">
              <GrudadoLogo variant="horizontal" size="md" textColor="white" />
              <span className="text-[10px] text-[#05C3DE] font-bold tracking-wider uppercase mt-1 ml-0.5">
                Ressarcimentos &amp; Logística
              </span>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Google Sheets Live Automation Widget */}
          <div className="mb-4">
            <button
              onClick={onOpenGoogleSheetsModal}
              className={`w-full text-left p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                isSheetsConnected
                  ? 'bg-white/10 border-[#8EDD65]/40 hover:bg-white/15'
                  : 'bg-white/5 border-dashed border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSheetsConnected ? 'bg-[#8EDD65] text-[#253746]' : 'bg-[#05C3DE] text-[#253746]'}`}>
                  <Sheet className="w-4 h-4" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    Google Sheets
                    {isSheetsConnected && (
                      <span className="w-2 h-2 rounded-full bg-[#8EDD65] animate-pulse" />
                    )}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    {isSheetsConnected
                      ? sheetConfig?.autoSync
                        ? `Auto-Sync (${sheetConfig.syncIntervalMinutes}m)`
                        : 'Conectado (Manual)'
                      : 'Automatizar Planilha'}
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isSheetsConnected ? 'bg-[#8EDD65]/20 text-[#8EDD65]' : 'bg-[#05C3DE]/20 text-[#05C3DE]'}`}>
                {isSheetsConnected ? 'Ativo' : 'Conectar'}
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pb-1">
              Visualizações
            </div>

            {/* View 1: Painel Geral */}
            <button
              onClick={() => {
                onViewChange('dashboard');
                onTabChange('all');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-white/15 text-white font-bold border border-white/20'
                  : 'hover:bg-white/10 text-slate-300 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4 h-4 text-[#05C3DE]" />
                <span>Painel Geral</span>
              </div>
            </button>

            {/* View 2: Tabela de Demandas */}
            <button
              onClick={() => {
                onViewChange('table');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeView === 'table'
                  ? 'bg-[#05C3DE] text-[#253746] font-bold shadow-md'
                  : 'hover:bg-white/10 text-slate-300 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Table className={`w-4 h-4 ${activeView === 'table' ? 'text-[#253746]' : 'text-[#05C3DE]'}`} />
                <span>Tabela de Demandas</span>
              </div>
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${activeView === 'table' ? 'bg-[#253746] text-white' : 'bg-white/10 text-white'}`}>
                {totalCount}
              </span>
            </button>

            {/* View 3: Relatórios & Gráficos */}
            <button
              onClick={() => {
                onViewChange('reports');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                activeView === 'reports'
                  ? 'bg-white/15 text-white font-bold border border-white/20'
                  : 'hover:bg-white/10 text-slate-300 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-[#FF6A39]" />
                <span>Relatórios &amp; Gráficos</span>
              </div>
            </button>

            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 pt-4 pb-1">
              Filtros Operacionais
            </div>

            {/* Filter: SLA Vencido */}
            <button
              onClick={() => {
                onViewChange('table');
                onTabChange('overdue');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                currentTab === 'overdue' && activeView === 'table'
                  ? 'bg-[#EF426F] text-white font-bold'
                  : 'hover:bg-white/10 text-slate-300 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-[#EF426F]" />
                <span>SLA Vencido</span>
              </div>
              {overdueCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#EF426F] text-white animate-pulse">
                  {overdueCount}
                </span>
              )}
            </button>

            {/* Filter: Pendentes */}
            <button
              onClick={() => {
                onViewChange('table');
                onTabChange('pending');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                currentTab === 'pending' && activeView === 'table'
                  ? 'bg-[#F9E547] text-[#253746] font-bold'
                  : 'hover:bg-white/10 text-slate-300 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#F9E547]" />
                <span>Pendentes</span>
              </div>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#F9E547] text-[#253746]">
                  {pendingCount}
                </span>
              )}
            </button>

            {/* Filter: Pagos / Indenizados */}
            <button
              onClick={() => {
                onViewChange('table');
                onTabChange('paid');
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition cursor-pointer ${
                currentTab === 'paid' && activeView === 'table'
                  ? 'bg-[#8EDD65] text-[#253746] font-bold'
                  : 'hover:bg-white/10 text-slate-300 opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#8EDD65]" />
                <span>Indenizados</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#8EDD65]/20 text-[#8EDD65]">
                {paidCount}
              </span>
            </button>

            {/* Reset data button - only for Admin */}
            {permissions?.canResetData && (
              <div className="pt-3 mt-3 border-t border-white/10">
                <button
                  onClick={onResetData}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Chamados Originais</span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* User / Access Profile Footer */}
        <div className="mt-auto p-4 border-t border-white/10 text-xs text-slate-300 space-y-2.5 bg-black/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-xs shrink-0"
                style={{ backgroundColor: currentUser?.color || '#05C3DE' }}
              >
                {currentUser?.avatarText || 'GV'}
              </div>
              <div className="leading-tight">
                <p className="font-bold text-white text-xs line-clamp-1">
                  {currentUser?.name || 'Usuário'}
                </p>
                <span className="text-[10px] text-[#05C3DE] font-semibold uppercase">
                  {currentUser?.roleLabel || 'Painel Operacional'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions in Sidebar Footer */}
          <div className="pt-1 flex items-center gap-1.5 border-t border-white/10">
            {permissions?.canManagePins && onOpenManagePins && (
              <button
                onClick={onOpenManagePins}
                title="Configurar PINs de Acesso"
                className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <KeyRound className="w-3 h-3 text-[#F9E547]" />
                <span>PINs</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                title="Sair / Trocar Usuário"
                className="py-1.5 px-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center justify-center gap-1"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

