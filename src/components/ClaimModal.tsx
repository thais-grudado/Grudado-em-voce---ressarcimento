import React, { useState, useEffect } from 'react';
import { X, Save, FileText, HelpCircle, CheckCircle2, Clock, Ban, Tag } from 'lucide-react';
import { Claim, CarrierName, ProblemType, ResolutionStatus, RefundStatus } from '../types';
import { CARRIERS, PROBLEM_TYPES } from '../data/initialData';
import { addDaysToDate, getMonthYearFromDate } from '../utils/formatters';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (claimData: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  editClaim?: Claim | null;
}

const COMMON_TICKET_STATUSES = [
  'Aberto',
  'Em análise na transportadora',
  'Aguardando transportadora',
  'Cobrado / Reclamado',
  'Entregue com atraso',
  'Extravio confirmado',
  'Finalizado',
];

export const ClaimModal: React.FC<ClaimModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editClaim,
}) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState<CarrierName>('Jadlog');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [shippingDate, setShippingDate] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [ticketDate, setTicketDate] = useState('');
  const [monthYear, setMonthYear] = useState('');
  const [problemType, setProblemType] = useState<ProblemType>('Extravio');
  const [slaDays, setSlaDays] = useState<number>(5);
  const [estimatedReturnDate, setEstimatedReturnDate] = useState('');
  const [resolution, setResolution] = useState<ResolutionStatus>('Em análise');
  const [refundStatus, setRefundStatus] = useState<RefundStatus>('Pendente');
  const [isRefundEligible, setIsRefundEligible] = useState<boolean>(true);
  const [ticketStatus, setTicketStatus] = useState<string>('Em análise');
  const [customStatusInput, setCustomStatusInput] = useState<string>('');
  const [protocolNumber, setProtocolNumber] = useState('');
  const [notes, setNotes] = useState('');

  // When opening or changing editClaim
  useEffect(() => {
    if (editClaim) {
      setOrderNumber(editClaim.orderNumber);
      setTrackingCode(editClaim.trackingCode || '');
      setCarrier(editClaim.carrier);
      setInvoiceNumber(editClaim.invoiceNumber || '');
      setShippingDate(editClaim.shippingDate || '');
      setAmount(editClaim.amount ? editClaim.amount.toString() : '');
      setTicketDate(editClaim.ticketDate);
      setMonthYear(editClaim.monthYear || getMonthYearFromDate(editClaim.ticketDate) || '');
      setProblemType(editClaim.problemType);
      setSlaDays(editClaim.slaDays);
      setEstimatedReturnDate(editClaim.estimatedReturnDate);
      setResolution(editClaim.resolution);
      setRefundStatus(editClaim.refundStatus);

      const eligible = editClaim.isRefundEligible !== undefined
        ? editClaim.isRefundEligible
        : editClaim.refundStatus !== 'Não se aplica';
      setIsRefundEligible(eligible);

      setTicketStatus(editClaim.ticketStatus || (eligible ? 'Em análise' : 'Atraso na entrega'));
      setCustomStatusInput('');
      setProtocolNumber(editClaim.protocolNumber || '');
      setNotes(editClaim.notes || '');
    } else {
      // Defaults for new claim
      const today = new Date().toISOString().split('T')[0];
      setOrderNumber('');
      setTrackingCode('');
      setCarrier('Correios');
      setInvoiceNumber('');
      setShippingDate('');
      setAmount('');
      setTicketDate(today);
      setMonthYear(getMonthYearFromDate(today) || '');
      setProblemType('Extravio');
      setSlaDays(5);
      setEstimatedReturnDate(addDaysToDate(today, 5));
      setResolution('Em análise');
      setRefundStatus('Pendente');
      setIsRefundEligible(true);
      setTicketStatus('Em análise');
      setCustomStatusInput('');
      setProtocolNumber('');
      setNotes('');
    }
  }, [editClaim, isOpen]);

  // Recalculate estimated return date when ticketDate or slaDays changes
  const handleTicketDateChange = (val: string) => {
    setTicketDate(val);
    if (val) {
      const computedMonth = getMonthYearFromDate(val);
      if (computedMonth) setMonthYear(computedMonth);
      if (slaDays) {
        setEstimatedReturnDate(addDaysToDate(val, slaDays));
      }
    }
  };

  const handleSlaDaysChange = (days: number) => {
    setSlaDays(days);
    if (ticketDate && days) {
      setEstimatedReturnDate(addDaysToDate(ticketDate, days));
    }
  };

  const handleCarrierChange = (newCarrier: string) => {
    setCarrier(newCarrier);
    const found = CARRIERS.find((c) => c.name === newCarrier);
    if (found) {
      handleSlaDaysChange(found.defaultSla);
    }
  };

  const handleProblemTypeChange = (newType: ProblemType) => {
    setProblemType(newType);
    if (newType === 'Atraso na entrega' && !editClaim) {
      setTicketStatus('Atraso na entrega');
    }
  };

  // Toggle plausibility of refund
  const handlePlausibilityChange = (eligible: boolean) => {
    setIsRefundEligible(eligible);
    if (!eligible) {
      setRefundStatus('Não se aplica');
      if (ticketStatus === 'Em análise') {
        setTicketStatus('Atraso na entrega');
      }
    } else {
      if (refundStatus === 'Não se aplica') {
        setRefundStatus('Pendente');
      }
    }
  };

  const handleRefundStatusSelect = (st: RefundStatus) => {
    setRefundStatus(st);
    if (st === 'Não se aplica') {
      setIsRefundEligible(false);
    } else {
      setIsRefundEligible(true);
    }
    if (st === 'Pago') {
      setResolution('Sim');
      if (!ticketStatus || ticketStatus === 'Em análise' || ticketStatus === 'Atraso em Tratativa') {
        setTicketStatus('Indenizado / Pago');
      }
    } else if (st === 'Negado') {
      setResolution('Não');
      if (!ticketStatus || ticketStatus === 'Em análise' || ticketStatus === 'Atraso em Tratativa') {
        setTicketStatus('Recusado / Negado');
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      alert('Por favor, informe o número do pedido.');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
    const finalMonthYear = monthYear.trim() || getMonthYearFromDate(ticketDate) || 'julho/2026';
    const finalTicketStatus = customStatusInput.trim() || ticketStatus || 'Em análise';
    const finalResolution: ResolutionStatus =
      refundStatus === 'Pago' ? 'Sim' :
      refundStatus === 'Negado' ? 'Não' :
      resolution;

    onSave(
      {
        orderNumber: orderNumber.trim(),
        trackingCode: trackingCode.trim(),
        carrier,
        invoiceNumber: invoiceNumber.trim(),
        shippingDate,
        amount: parsedAmount,
        ticketDate,
        problemType,
        slaDays: Number(slaDays) || 0,
        estimatedReturnDate: estimatedReturnDate || addDaysToDate(ticketDate, slaDays),
        resolution: finalResolution,
        refundStatus,
        ticketStatus: finalTicketStatus,
        isRefundEligible,
        monthYear: finalMonthYear,
        protocolNumber: protocolNumber.trim(),
        notes: notes.trim(),
      },
      editClaim?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden my-8 animate-scaleIn">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                {editClaim ? `Editar Solicitação #${editClaim.orderNumber}` : 'Nova Solicitação de Ressarcimento'}
              </h2>
              <p className="text-xs text-slate-400">
                Preencha os dados da ocorrência e acompanhe o SLA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {/* Row 1: Order #, Tracking, Carrier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Nº do Pedido *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: 1042"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Transportadora *
              </label>
              <select
                value={carrier}
                onChange={(e) => handleCarrierChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {CARRIERS.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} (SLA padrão {c.defaultSla}d)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Cód de Rastreio
              </label>
              <input
                type="text"
                placeholder="Ex: JAD30089202"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 2: NF, Envio, Valor Total */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Nota Fiscal (NF-e)
              </label>
              <input
                type="text"
                placeholder="Ex: NF-10491"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Data de Envio
              </label>
              <input
                type="date"
                value={shippingDate}
                onChange={(e) => setShippingDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Valor {isRefundEligible ? 'Total (R$) *' : 'do Pedido (R$)'}
              </label>
              <input
                type="text"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {!isRefundEligible && (
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Não gerará pendência de indenização.
                </span>
              )}
            </div>
          </div>

          {/* Row 3: Tipo de Problema & Protocolo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Categoria de Problema *
              </label>
              <select
                value={problemType}
                onChange={(e) => handleProblemTypeChange(e.target.value as ProblemType)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {PROBLEM_TYPES.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Protocolo na Transportadora
              </label>
              <input
                type="text"
                placeholder="Ex: JAD-77192 / COR-891024"
                value={protocolNumber}
                onChange={(e) => setProtocolNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 4: Abertura Chamado, SLA dias, Previsão Retorno, Mês Referência */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Data Abertura *
              </label>
              <input
                type="date"
                required
                value={ticketDate}
                onChange={(e) => handleTicketDateChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Mês Referência
              </label>
              <input
                type="text"
                placeholder="Ex: julho/2026"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Prazo SLA (Dias)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={slaDays}
                onChange={(e) => handleSlaDaysChange(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>Previsão Retorno</span>
                <span className="text-[10px] text-blue-600 font-normal">Auto</span>
              </label>
              <input
                type="date"
                value={estimatedReturnDate}
                onChange={(e) => setEstimatedReturnDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-md text-sm font-semibold text-blue-700 outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Destaque: Plausibilidade de Ressarcimento */}
          <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  Plausível de Ressarcimento?
                </span>
                <p className="text-[11px] text-slate-500">
                  Defina se haverá cobrança de indenização ou se é apenas ticket de atraso / acompanhamento.
                </p>
              </div>

              {/* Segmented Buttons */}
              <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => handlePlausibilityChange(true)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    isRefundEligible
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sim (Cobrar)
                </button>
                <button
                  type="button"
                  onClick={() => handlePlausibilityChange(false)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                    !isRefundEligible
                      ? 'bg-slate-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  Não (Apenas atraso)
                </button>
              </div>
            </div>

            {!isRefundEligible && (
              <div className="p-2 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>
                  <strong>Apenas acompanhamento:</strong> O valor não será somado aos valores pendentes ou cobrados no dashboard financeiro.
                </span>
              </div>
            )}
          </div>

          {/* Campo para Adicionar / Escolher Status do Chamado */}
          <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                Status do Chamado / Ocorrência
              </label>
              <span className="text-[11px] text-blue-600 font-medium">
                Escolha uma opção ou digite um status livre
              </span>
            </div>

            {/* Quick Status Chips */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TICKET_STATUSES.map((st) => {
                const isSelected = (customStatusInput ? customStatusInput === st : ticketStatus === st);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setTicketStatus(st);
                      setCustomStatusInput('');
                    }}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>

            {/* Custom status input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Ou digite outro status personalizado (Ex: Aguardando laudo, Sinistro em apuração...)"
                value={customStatusInput}
                onChange={(e) => {
                  setCustomStatusInput(e.target.value);
                  setTicketStatus(e.target.value);
                }}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Row 5: Resolvido & Ressarcimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Demanda Resolvida?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Em análise', 'Sim', 'Não'] as ResolutionStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setResolution(st);
                      if (st === 'Não' && refundStatus === 'Pendente') {
                        setRefundStatus('Negado');
                      }
                    }}
                    className={`py-1.5 text-xs font-medium rounded-md border transition cursor-pointer ${
                      resolution === st
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Status do Ressarcimento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['Pendente', 'Pago', 'Negado', 'Não se aplica'] as RefundStatus[]).map((rf) => (
                  <button
                    key={rf}
                    type="button"
                    onClick={() => handleRefundStatusSelect(rf)}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded-md border transition cursor-pointer text-center whitespace-nowrap ${
                      refundStatus === rf
                        ? rf === 'Pago'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : rf === 'Negado'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : rf === 'Não se aplica'
                          ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
                          : 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {rf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Destaque Informativo: Retorno OK aguardando depósito */}
          {resolution === 'Sim' && refundStatus === 'Pendente' && (
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sky-900">Retorno da Transportadora Recebido (Deferido / Aprovado)</p>
                <p className="text-sky-700 text-[11px] mt-0.5 leading-relaxed">
                  O SLA da transportadora foi concluído com sucesso e <strong>não ficará mais marcando como vencido</strong>. O status financeiro permanece como <strong>Pendente</strong> até a transportadora efetuar o depósito bancário ou abater na fatura (prazo habitual de até 30 dias).
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Observações & Histórico de Cobrança
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Laudo anexado, fotos enviadas, aguardando parecer final do SAC..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-xs transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Solicitação</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
