import React from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  AlertTriangle, 
  Menu,
  Sheet,
  RefreshCw
} from 'lucide-react';
import { Claim, GoogleSheetConfig } from '../types';
import { GrudadoLogo } from './GrudadoLogo';

interface HeaderProps {
  claims: Claim[];
  overdueCount: number;
  pendingAmount: number;
  activeView: 'dashboard' | 'table' | 'reports';
  onViewChange: (view: 'dashboard' | 'table' | 'reports') => void;
  onNewClaim: () => void;
  onExport: () => void;
  onImportClick: () => void;
  onResetData: () => void;
  onOverdueFilterClick: () => void;
  onToggleMobileSidebar?: () => void;
  sheetConfig?: GoogleSheetConfig;
  onOpenGoogleSheetsModal?: () => void;
  onQuickSyncSheets?: () => void;
  isSyncingSheets?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  claims,
  overdueCount,
  activeView,
  onViewChange,
  onNewClaim,
  onExport,
  onImportClick,
  onOverdueFilterClick,
  onToggleMobileSidebar,
  sheetConfig,
  onOpenGoogleSheetsModal,
  onQuickSyncSheets,
  isSyncingSheets = false,
}) => {
  const isSheetsConnected = Boolean(sheetConfig?.url);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      {/* Grudado em Você Colorful Brand Accent Bar */}
      <div className="h-1 w-full flex">
        <div className="flex-1 bg-[#F9E547]" title="Pantone 106 C" />
        <div className="flex-1 bg-[#8EDD65]" title="Pantone 7487 C" />
        <div className="flex-1 bg-[#EF426F]" title="Pantone 191 C" />
        <div className="flex-1 bg-[#05C3DE]" title="Pantone 311 C" />
        <div className="flex-1 bg-[#FF6A39]" title="Pantone 1645 C" />
      </div>

      {/* Alert banner if overdue */}
      {overdueCount > 0 && (
        <div className="bg-[#EF426F]/10 border-b border-[#EF426F]/20 px-6 py-2 text-xs text-[#253746] flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-[#EF426F] animate-ping" />
            <AlertTriangle className="w-4 h-4 text-[#EF426F] shrink-0" />
            <span>
              <strong className="text-[#EF426F]">Atenção operacional:</strong> Existem{' '}
              <span className="underline font-bold text-[#EF426F]">{overdueCount} {overdueCount === 1 ? 'chamado vencido' : 'chamados vencidos'}</span>{' '}
              com transportadoras aguardando cobrança de SLA.
            </span>
          </div>
          <button
            onClick={onOverdueFilterClick}
            className="text-[#EF426F] hover:text-[#253746] font-bold underline cursor-pointer text-xs shrink-0 ml-2"
          >
            Filtrar pendências &rarr;
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger toggle */}
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-slate-500 hover:text-[#253746] hover:bg-slate-100 rounded-xl cursor-pointer"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo on mobile / compact */}
          <div className="lg:hidden">
            <GrudadoLogo variant="icon" size="sm" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#253746]">
                Ressarcimentos &amp; Sinistros
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#05C3DE]/15 text-[#05C3DE]">
                Grudado em Você
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {/* View Switcher with Brand Styling */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => onViewChange('dashboard')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeView === 'dashboard'
                      ? 'bg-white text-[#253746] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Painel Geral
                </button>
                <button
                  onClick={() => onViewChange('table')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'table'
                      ? 'bg-[#05C3DE] text-[#253746] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>Tabela de Demandas</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeView === 'table' ? 'bg-[#253746] text-white' : 'bg-slate-200 text-slate-700'}`}>
                    {claims.length}
                  </span>
                </button>
                <button
                  onClick={() => onViewChange('reports')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    activeView === 'reports'
                      ? 'bg-white text-[#253746] shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Gráficos
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Google Sheets Automation Button */}
          {onOpenGoogleSheetsModal && (
            <div className="flex items-center gap-1">
              <button
                id="btn-google-sheets"
                onClick={onOpenGoogleSheetsModal}
                title={isSheetsConnected ? 'Google Sheets Conectado - Clique para gerenciar' : 'Automatizar com Google Sheets'}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  isSheetsConnected
                    ? 'bg-emerald-50 border-[#8EDD65] text-[#253746] hover:bg-emerald-100 shadow-2xs'
                    : 'bg-white border-[#05C3DE]/50 text-[#253746] hover:bg-[#05C3DE]/10 shadow-2xs'
                }`}
              >
                <Sheet className={`w-4 h-4 ${isSheetsConnected ? 'text-[#8EDD65]' : 'text-[#05C3DE]'}`} />
                <span className="hidden md:inline">
                  {isSheetsConnected ? 'Google Sheets Ativo' : 'Google Sheets'}
                </span>
                {isSheetsConnected && (
                  <span className="w-2 h-2 rounded-full bg-[#8EDD65] animate-pulse" />
                )}
              </button>

              {/* Quick sync button if connected */}
              {isSheetsConnected && onQuickSyncSheets && (
                <button
                  onClick={onQuickSyncSheets}
                  disabled={isSyncingSheets}
                  title="Sincronizar agora com o Google Sheets"
                  className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin text-[#05C3DE]' : ''}`} />
                </button>
              )}
            </div>
          )}

          <button
            id="btn-export-csv"
            onClick={onExport}
            title="Exportar dados para Excel / CSV"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar</span>
          </button>

          <button
            id="btn-import-modal"
            onClick={onImportClick}
            title="Importar arquivo CSV"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Importar CSV</span>
          </button>

          {/* New Claim button with Brand Blue */}
          <button
            id="btn-new-claim"
            onClick={onNewClaim}
            className="inline-flex items-center gap-1.5 bg-[#05C3DE] hover:bg-[#04b0c7] active:bg-[#039eb3] text-[#253746] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">+ Nova Solicitação</span>
            <span className="sm:hidden">Novo</span>
          </button>

          {/* User Avatar with Grudado Brand Colors */}
          <div 
            title="Thais - Grudado em Você"
            className="w-9 h-9 rounded-xl bg-[#253746] border border-white/20 flex items-center justify-center font-extrabold text-[#F9E547] text-xs shrink-0 select-none shadow-xs"
          >
            GV
          </div>
        </div>
      </div>
    </header>
  );
};

