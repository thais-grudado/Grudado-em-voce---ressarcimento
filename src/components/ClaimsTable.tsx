import React, { useState } from 'react';
import { 
  Search, 
  Copy, 
  Check, 
  MessageSquare, 
  Edit3, 
  Trash2, 
  Truck, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  Ban,
  Layers,
  Tag,
  HelpCircle,
  Lock
} from 'lucide-react';
import { Claim, FilterState, ResolutionStatus, RefundStatus, AppUser } from '../types';
import { formatBRL, formatDateBR, computeSLAStatus } from '../utils/formatters';
import { getRolePermissions } from '../utils/auth';

interface ClaimsTableProps {
  claims: Claim[];
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onUpdateStatus: (id: string, resolution: ResolutionStatus, refundStatus: RefundStatus) => void;
  onEditClaim: (claim: Claim) => void;
  onDeleteClaim: (id: string) => void;
  onCobranceClick: (claim: Claim) => void;
  onBatchUpdateStatus?: (ids: string[], refundStatus: RefundStatus, resolution: ResolutionStatus) => void;
  onBatchDelete?: (ids: string[]) => void;
  currentUser?: AppUser | null;
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({
  claims,
  filters,
  onFilterChange,
  onUpdateStatus,
  onEditClaim,
  onDeleteClaim,
  onCobranceClick,
  onBatchUpdateStatus,
  onBatchDelete,
  currentUser,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const permissions = currentUser ? getRolePermissions(currentUser.role) : null;
  const canEdit = permissions ? permissions.canEditClaim : true;
  const canDelete = permissions ? permissions.canDeleteClaim : true;
  const canChangeStatus = permissions ? permissions.canChangeStatus : true;

  // Copy tracking to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Selection helpers
  const isAllSelected = claims.length > 0 && selectedIds.length === claims.length;
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(claims.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div id="tabela-demandas" className="bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col overflow-hidden scroll-mt-20">
      {/* Table Top Toolbar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl space-y-3">
        {/* Table Title Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              Tabela de Demandas Recentes
            </h2>
            <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              {claims.length} {claims.length === 1 ? 'chamado' : 'chamados'}
            </span>
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Status de Ressarcimento &bull; Prazos SLA
          </span>
        </div>

        {/* Navigation Tabs (Professional Polish style) */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => onFilterChange({ tab: 'all' })}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                filters.tab === 'all'
                  ? 'bg-[#05C3DE] text-[#253746] shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Todos ({claims.length})
            </button>
            <button
              onClick={() => onFilterChange({ tab: 'pending' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                filters.tab === 'pending'
                  ? 'bg-[#F9E547] text-[#253746] shadow-2xs'
                  : 'text-slate-700 bg-[#F9E547]/15 hover:bg-[#F9E547]/30 border border-[#F9E547]/40'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pendentes</span>
            </button>
            <button
              onClick={() => onFilterChange({ tab: 'awaiting_payment' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                filters.tab === 'awaiting_payment'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-sky-800 bg-sky-100 hover:bg-sky-200 border border-sky-300'
              }`}
              title="Chamados com retorno aprovado pela transportadora aguardando depósito financeiro"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Aguardando Depósito</span>
            </button>
            <button
              onClick={() => onFilterChange({ tab: 'overdue' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                filters.tab === 'overdue'
                  ? 'bg-[#EF426F] text-white shadow-2xs'
                  : 'text-[#EF426F] bg-[#EF426F]/10 hover:bg-[#EF426F]/20 border border-[#EF426F]/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF426F]" />
              <span>SLA Vencido</span>
            </button>
            <button
              onClick={() => onFilterChange({ tab: 'paid' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                filters.tab === 'paid'
                  ? 'bg-[#8EDD65] text-[#253746] shadow-2xs'
                  : 'text-emerald-800 bg-[#8EDD65]/20 hover:bg-[#8EDD65]/35 border border-[#8EDD65]/50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Pagos</span>
            </button>
            <button
              onClick={() => onFilterChange({ tab: 'denied' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                filters.tab === 'denied'
                  ? 'bg-[#253746] text-white shadow-2xs'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Recusados</span>
            </button>
            <button
              onClick={() => onFilterChange({ tab: 'not_applicable' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer whitespace-nowrap ${
                filters.tab === 'not_applicable'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Apenas Atrasos / Sem Cobrança</span>
            </button>
          </div>
        </div>

        {/* Filter Inputs Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 pt-1">
          {/* Search Box */}
          <div className="lg:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filtrar por pedido, rastreio, NF ou transportadora..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="w-full pl-9 pr-7 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Carrier Filter */}
          <div className="lg:col-span-3">
            <select
              value={filters.carrier}
              onChange={(e) => onFilterChange({ carrier: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs sm:text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">Todas Transportadoras</option>
              <option value="Jadlog">Jadlog</option>
              <option value="J&T">J&T</option>
              <option value="Correios">Correios</option>
            </select>
          </div>

          {/* Problem Type Filter */}
          <div className="lg:col-span-3">
            <select
              value={filters.problemType}
              onChange={(e) => onFilterChange({ problemType: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs sm:text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="">Todos Tipos / Categorias</option>
              <option value="Extravio">Extravio</option>
              <option value="Não localizado">Não localizado</option>
              <option value="Roubo de carga">Roubo de carga</option>
              <option value="Avaria">Avaria</option>
              <option value="Atraso na entrega">Atraso na entrega</option>
            </select>
          </div>
        </div>

        {/* Batch Actions Bar (when rows are selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-md text-blue-900 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                {selectedIds.length}
              </span>
              <span>{selectedIds.length === 1 ? 'demanda selecionada' : 'demandas selecionadas'}</span>
            </div>
            <div className="flex items-center gap-2">
              {canChangeStatus && (
                <>
                  <button
                    onClick={() => {
                      if (onBatchUpdateStatus) {
                        onBatchUpdateStatus(selectedIds, 'Pago', 'Sim');
                        setSelectedIds([]);
                      }
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium transition cursor-pointer"
                  >
                    Marcar como Pago
                  </button>
                  <button
                    onClick={() => {
                      if (onBatchUpdateStatus) {
                        onBatchUpdateStatus(selectedIds, 'Pendente', 'Em análise');
                        setSelectedIds([]);
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs font-medium transition cursor-pointer"
                  >
                    Marcar Pendente
                  </button>
                  <button
                    onClick={() => {
                      if (onBatchUpdateStatus) {
                        onBatchUpdateStatus(selectedIds, 'Não se aplica', 'Em análise');
                        setSelectedIds([]);
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-medium transition cursor-pointer"
                  >
                    Não se aplica
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={() => {
                    if (onBatchDelete && confirm(`Excluir ${selectedIds.length} solicitações selecionadas?`)) {
                      onBatchDelete(selectedIds);
                      setSelectedIds([]);
                    }
                  }}
                  className="px-2.5 py-1 bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 rounded text-xs font-medium transition cursor-pointer"
                >
                  Excluir
                </button>
              )}
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-blue-700 hover:underline px-1 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="px-5 py-3 whitespace-nowrap">ID / Pedido</th>
              <th className="px-5 py-3 whitespace-nowrap">Transportadora</th>
              <th className="px-5 py-3 whitespace-nowrap">Rastreio & NF</th>
              <th className="px-5 py-3 whitespace-nowrap">Categoria</th>
              <th className="px-5 py-3 whitespace-nowrap">Valor</th>
              <th className="px-5 py-3 whitespace-nowrap">Abertura</th>
              <th className="px-5 py-3 whitespace-nowrap">SLA / Previsão</th>
              <th className="px-5 py-3 whitespace-nowrap">Resolução</th>
              <th className="px-5 py-3 whitespace-nowrap">Status</th>
              <th className="px-5 py-3 text-right whitespace-nowrap">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs sm:text-sm">
            {claims.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-medium text-slate-600">Nenhuma solicitação encontrada</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Ajuste os filtros de busca ou adicione um novo chamado.
                  </p>
                </td>
              </tr>
            ) : (
              claims.map((claim) => {
                const sla = computeSLAStatus(claim);
                const isSelected = selectedIds.includes(claim.id);

                return (
                  <tr
                    key={claim.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(claim.id)}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* ID / Order */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-700 font-medium">
                      <span>#{claim.orderNumber}</span>
                      <span className="block text-[10px] text-slate-400 font-sans">
                        {claim.monthYear}
                      </span>
                    </td>

                    {/* Carrier */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Truck className="w-3 h-3 text-slate-500" />
                        {claim.carrier}
                      </span>
                    </td>

                    {/* Tracking & Invoice */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-mono text-xs text-slate-700">
                        <span>{claim.trackingCode || '-'}</span>
                        {claim.trackingCode && (
                          <button
                            onClick={() => handleCopy(claim.trackingCode, claim.id)}
                            title="Copiar código de rastreio"
                            className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          >
                            {copiedId === claim.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {claim.invoiceNumber ? `NF: ${claim.invoiceNumber}` : 'Sem NF'}
                      </span>
                    </td>

                    {/* Problem & Ticket Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-slate-800">{claim.problemType}</span>
                        {claim.ticketStatus && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 w-fit">
                            <Tag className="w-2.5 h-2.5 text-blue-500" />
                            {claim.ticketStatus}
                          </span>
                        )}
                        {(claim.refundStatus === 'Não se aplica' || claim.isRefundEligible === false) && (
                          <span className="text-[10px] text-slate-500 font-normal">
                            Sem ressarcimento
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {claim.refundStatus === 'Não se aplica' || claim.isRefundEligible === false ? (
                        <div>
                          <span className="font-medium text-slate-400 line-through text-xs block">
                            {formatBRL(claim.amount)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Apenas atraso</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-900">
                          {formatBRL(claim.amount)}
                        </span>
                      )}
                    </td>

                    {/* Ticket Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-600">
                      {formatDateBR(claim.ticketDate)}
                    </td>

                    {/* SLA Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="text-slate-700 font-medium">
                        {formatDateBR(claim.estimatedReturnDate)}
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            sla.status === 'overdue'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : sla.status === 'answered_pending_payment'
                              ? 'bg-sky-50 text-sky-800 border border-sky-200 font-bold'
                              : sla.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {sla.status === 'overdue' && <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />}
                          {sla.status === 'answered_pending_payment' && <CheckCircle2 className="w-2.5 h-2.5 text-sky-600" />}
                          {sla.status === 'completed' && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                          {sla.label}
                        </span>
                        {sla.sublabel && (
                          <span className="block text-[10px] text-slate-500 font-medium mt-0.5">
                            {sla.sublabel}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Inline Resolution */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {canChangeStatus ? (
                        <select
                          value={claim.resolution}
                          onChange={(e) => {
                            const newRes = e.target.value as ResolutionStatus;
                            const newRefund = newRes === 'Não' && claim.refundStatus === 'Pendente' 
                              ? 'Negado' 
                              : claim.refundStatus;
                            onUpdateStatus(
                              claim.id,
                              newRes,
                              newRefund
                            );
                          }}
                          className={`text-xs font-semibold px-2 py-1 bg-white border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer ${
                            claim.resolution === 'Sim'
                              ? 'border-sky-300 text-sky-800 bg-sky-50/40'
                              : 'border-slate-200 text-slate-800'
                          }`}
                        >
                          <option value="Em análise">Em análise</option>
                          <option value="Sim">Sim (Retorno OK)</option>
                          <option value="Não">Não (Recusado)</option>
                        </select>
                      ) : (
                        <span className="inline-block text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {claim.resolution}
                        </span>
                      )}
                    </td>

                    {/* Inline Status Pill */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {canChangeStatus ? (
                        <div>
                          <select
                            value={claim.refundStatus}
                            onChange={(e) => {
                              const newStatus = e.target.value as RefundStatus;
                              const newResolution: ResolutionStatus =
                                newStatus === 'Pago' ? 'Sim' :
                                newStatus === 'Negado' ? 'Não' :
                                claim.resolution;
                              onUpdateStatus(
                                claim.id,
                                newResolution,
                                newStatus
                              );
                            }}
                            className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider cursor-pointer border outline-none ${
                              claim.refundStatus === 'Pago'
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : claim.refundStatus === 'Negado'
                                ? 'bg-rose-100 text-rose-700 border-rose-200'
                                : claim.refundStatus === 'Não se aplica'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                          >
                            <option value="Pendente" className="bg-white text-slate-800 font-normal">Pendente</option>
                            <option value="Pago" className="bg-white text-slate-800 font-normal">Pago</option>
                            <option value="Negado" className="bg-white text-slate-800 font-normal">Negado</option>
                            <option value="Não se aplica" className="bg-white text-slate-800 font-normal">Não se aplica</option>
                          </select>
                          {claim.resolution === 'Sim' && claim.refundStatus === 'Pendente' && (
                            <span className="block text-[10px] text-sky-700 font-semibold mt-0.5">
                              Aguardando depósito
                            </span>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span
                            className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              claim.refundStatus === 'Pago'
                                ? 'bg-emerald-100 text-emerald-700'
                                : claim.refundStatus === 'Negado'
                                ? 'bg-rose-100 text-rose-700'
                                : claim.refundStatus === 'Não se aplica'
                                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {claim.refundStatus}
                          </span>
                          {claim.resolution === 'Sim' && claim.refundStatus === 'Pendente' && (
                            <span className="block text-[10px] text-sky-700 font-semibold mt-0.5">
                              Aguardando depósito
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Actions Links / Buttons */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {/* Cobrança WhatsApp button */}
                        <button
                          onClick={() => onCobranceClick(claim)}
                          title="Gerar cobrança para WhatsApp / SAC"
                          className="text-blue-600 font-medium text-xs hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Cobrar</span>
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => onEditClaim(claim)}
                            title="Editar solicitação"
                            className="p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => onDeleteClaim(claim.id)}
                            title="Excluir solicitação"
                            className="p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with exact pagination style from design */}
      <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500 bg-white">
        <span>
          Mostrando <strong>1-{claims.length}</strong> de <strong>{claims.length}</strong> solicitações registradas
        </span>
        <div className="flex items-center gap-1">
          <button className="px-2.5 py-1 border border-slate-200 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer">
            ‹
          </button>
          <button className="px-3 py-1 border border-blue-500 bg-blue-50 text-blue-600 font-bold rounded">
            1
          </button>
          <button className="px-2.5 py-1 border border-slate-200 rounded bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer">
            ›
          </button>
        </div>
      </div>
    </div>
  );
};
