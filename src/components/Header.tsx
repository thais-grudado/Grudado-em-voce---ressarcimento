import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  AlertTriangle, 
  Menu, 
  Sheet, 
  RefreshCw,
  LogOut,
  KeyRound,
  ShieldCheck,
  ChevronDown,
  Lock
} from 'lucide-react';
import { Claim, GoogleSheetConfig, AppUser } from '../types';
import { getRolePermissions } from '../utils/auth';
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
  currentUser?: AppUser | null;
  onLogout?: () => void;
  onOpenManagePins?: () => void;
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
  currentUser,
  onLogout,
  onOpenManagePins,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isSheetsConnected = Boolean(sheetConfig?.url);

  const permissions = currentUser ? getRolePermissions(currentUser.role) : null;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          {/* Import CSV - Only for Admin & Operator */}
          {permissions?.canCreateClaim && (
            <button
              id="btn-import-modal"
              onClick={onImportClick}
              title="Importar arquivo CSV"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Importar CSV</span>
            </button>
          )}

          {/* New Claim button with Brand Blue - Restricted for Viewer */}
          {permissions?.canCreateClaim ? (
            <button
              id="btn-new-claim"
              onClick={onNewClaim}
              className="inline-flex items-center gap-1.5 bg-[#05C3DE] hover:bg-[#04b0c7] active:bg-[#039eb3] text-[#253746] px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">+ Nova Solicitação</span>
              <span className="sm:hidden">Novo</span>
            </button>
          ) : (
            <div 
              title="Modo Leitura: Apenas administradores e operadores podem cadastrar ocorrências"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-400 select-none cursor-not-allowed"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Modo Consulta</span>
            </div>
          )}

          {/* User Profile Badge & Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 pl-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition cursor-pointer"
              title="Perfil de acesso e segurança"
            >
              <div className="hidden md:flex flex-col items-end text-right pr-1">
                <span className="text-xs font-bold text-[#253746] line-clamp-1 max-w-[120px]">
                  {currentUser?.name || 'Grudado em Você'}
                </span>
                <span className="text-[10px] font-extrabold uppercase text-[#05C3DE]">
                  {currentUser?.role === 'admin' ? 'Admin' : (currentUser?.role === 'operator' ? 'Operador' : 'Visualizador')}
                </span>
              </div>

              <div 
                className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 select-none shadow-xs"
                style={{ backgroundColor: currentUser?.color || '#253746' }}
              >
                {currentUser?.avatarText || 'GV'}
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-scaleIn">
                {/* User info card */}
                <div className="p-3 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-white text-xs shrink-0"
                      style={{ backgroundColor: currentUser?.color || '#253746' }}
                    >
                      {currentUser?.avatarText || 'GV'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#253746] leading-tight">
                        {currentUser?.name}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {currentUser?.email || currentUser?.roleLabel}
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#05C3DE]" />
                    <span>Perfil: <strong>{currentUser?.roleLabel}</strong></span>
                  </div>
                </div>

                {/* Manage PINs Button (Only for Admin) */}
                {permissions?.canManagePins && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenManagePins) onOpenManagePins();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#253746] hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-2.5"
                  >
                    <KeyRound className="w-4 h-4 text-[#05C3DE]" />
                    <span>Gerenciar PINs da Equipe</span>
                  </button>
                )}

                {/* Logout / Switch User */}
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Trocar Perfil / Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

