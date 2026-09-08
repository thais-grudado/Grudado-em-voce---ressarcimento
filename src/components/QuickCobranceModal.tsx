import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Send, Truck, CheckCircle2 } from 'lucide-react';
import { Claim } from '../types';
import { generateCobranceMessage, computeSLAStatus } from '../utils/formatters';

interface QuickCobranceModalProps {
  claim: Claim | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsPaid?: (claimId: string) => void;
}

export const QuickCobranceModal: React.FC<QuickCobranceModalProps> = ({
  claim,
  isOpen,
  onClose,
  onMarkAsPaid,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !claim) return null;

  const messageText = generateCobranceMessage(claim);
  const sla = computeSLAStatus(claim);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handlePaidClick = () => {
    if (onMarkAsPaid) {
      onMarkAsPaid(claim.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">
                Cobrança de SLA &bull; Pedido #{claim.orderNumber}
              </h2>
              <p className="text-xs text-slate-400">
                Transportadora: <strong className="text-blue-400">{claim.carrier}</strong> | {sla.label}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Copie o texto estruturado para acionar o SAC ou WhatsApp da transportadora informando o vencimento do SLA.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
              Mensagem Pronta para Cobrança
            </label>
            <textarea
              readOnly
              rows={8}
              value={messageText}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-2xs transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Abrir no WhatsApp</span>
            </button>

            <div className="w-full sm:w-auto flex flex-wrap items-center justify-end gap-2">
              {claim.refundStatus !== 'Pago' && onMarkAsPaid && (
                <button
                  type="button"
                  onClick={handlePaidClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-md shadow-xs transition cursor-pointer"
                  title="Marcar como indenizado / pago com sucesso"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar como Pago</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
              >
                Fechar
              </button>

              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-xs transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Mensagem</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
