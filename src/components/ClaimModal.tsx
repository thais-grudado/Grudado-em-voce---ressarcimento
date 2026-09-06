import React, { useState, useEffect } from 'react';
import { X, Save, FileText } from 'lucide-react';
import { Claim, CarrierName, ProblemType, ResolutionStatus, RefundStatus } from '../types';
import { CARRIERS, PROBLEM_TYPES } from '../data/initialData';
import { addDaysToDate, getMonthYearFromDate } from '../utils/formatters';

interface ClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (claimData: Omit<Claim, 'id' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  editClaim?: Claim | null;
}

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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      alert('Por favor, informe o número do pedido.');
      return;
    }

    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
    const finalMonthYear = monthYear.trim() || getMonthYearFromDate(ticketDate) || 'julho/2026';

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
        resolution,
        refundStatus,
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
                Valor Total (R$) *
              </label>
              <input
                type="text"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 focus:border-blue-500 rounded-md text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
              />
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
                onChange={(e) => setProblemType(e.target.value)}
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
                    onClick={() => setResolution(st)}
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
              <div className="grid grid-cols-3 gap-2">
                {(['Pendente', 'Pago', 'Negado'] as RefundStatus[]).map((rf) => (
                  <button
                    key={rf}
                    type="button"
                    onClick={() => setRefundStatus(rf)}
                    className={`py-1.5 text-xs font-bold rounded-md border transition cursor-pointer ${
                      refundStatus === rf
                        ? rf === 'Pago'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : rf === 'Negado'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
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
