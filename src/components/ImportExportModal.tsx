import React, { useState } from 'react';
import { X, Download, RotateCcw, FileSpreadsheet, Check } from 'lucide-react';
import { Claim } from '../types';
import { exportClaimsToCSV, parseDateBRToISO, getMonthYearFromDate, addDaysToDate } from '../utils/formatters';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  claims: Claim[];
  onImportClaims: (newClaims: Claim[]) => void;
  onResetOriginals: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  claims,
  onImportClaims,
  onResetOriginals,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportClaimsToCSV(claims);
  };

  const handleParsePaste = () => {
    if (!pasteText.trim()) return;

    try {
      const lines = pasteText.trim().split('\n');
      const newItems: Claim[] = [];

      lines.forEach((line, idx) => {
        // Skip header if present
        if (idx === 0 && (line.toLowerCase().includes('pedido') || line.toLowerCase().includes('transportadora'))) {
          return;
        }

        let parts = line.split('\t');
        if (parts.length < 3) parts = line.split(';');
        if (parts.length < 3) parts = line.split(',');

        if (parts.length >= 2) {
          const orderNum = parts[0]?.replace(/"/g, '').trim() || String(Date.now() + idx);
          const tracking = parts[1]?.replace(/"/g, '').trim() || '';
          const carrier = parts[2]?.replace(/"/g, '').trim() || 'Jadlog';
          const invoice = parts[3]?.replace(/"/g, '').trim() || '';
          const shipDate = parseDateBRToISO(parts[4]?.replace(/"/g, '').trim()) || '2026-09-01';
          const rawAmount = parts[5]?.replace(/"/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
          const amount = parseFloat(rawAmount) || 50;
          const ticketDate = parseDateBRToISO(parts[6]?.replace(/"/g, '').trim()) || '2026-09-06';
          const problem = parts[7]?.replace(/"/g, '').trim() || 'Extravio';
          const slaDays = parseInt(parts[8]?.replace(/"/g, '').trim(), 10) || 5;
          const estReturn = parseDateBRToISO(parts[9]?.replace(/"/g, '').trim()) || addDaysToDate(ticketDate, slaDays);
          const resolution = (parts[10]?.replace(/"/g, '').trim() || 'Em análise') as any;
          const refundStatus = (parts[11]?.replace(/"/g, '').trim() || 'Pendente') as any;
          const monthYear = parts[12]?.replace(/"/g, '').trim() || getMonthYearFromDate(ticketDate);

          newItems.push({
            id: `imported-${Date.now()}-${idx}`,
            orderNumber: orderNum,
            trackingCode: tracking,
            carrier,
            invoiceNumber: invoice,
            shippingDate: shipDate,
            amount,
            ticketDate,
            problemType: problem,
            slaDays,
            estimatedReturnDate: estReturn,
            resolution: resolution === 'Sim' || resolution === 'Não' ? resolution : 'Em análise',
            refundStatus: refundStatus === 'Pago' || refundStatus === 'Negado' ? refundStatus : 'Pendente',
            monthYear,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      });

      if (newItems.length > 0) {
        onImportClaims(newItems);
        setImportStatus(`${newItems.length} chamados importados com sucesso!`);
        setTimeout(() => {
          setImportStatus(null);
          onClose();
        }, 1200);
      } else {
        alert('Nenhum dado válido reconhecido. Verifique o formato colado.');
      }
    } catch (e) {
      alert('Erro ao interpretar os dados. Certifique-se de que estão separados por tabulação ou ponto e vírgula.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Importação & Exportação</h2>
              <p className="text-xs text-slate-400">
                Sincronize com sua planilha do Google Sheets ou Excel
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

        <div className="p-6 space-y-5">
          {/* Export Box */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-600" />
                Baixar Planilha Completa (CSV / Excel)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exporta os {claims.length} chamados com acentuação e colunas compatíveis.
              </p>
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-md shadow-2xs transition cursor-pointer shrink-0"
            >
              Exportar CSV
            </button>
          </div>

          {/* Paste Input */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5 flex items-center justify-between">
              <span>Colar Linhas da Planilha (Ctrl+V)</span>
              <span className="text-slate-400 font-normal">Aceita cópia do Google Sheets</span>
            </label>
            <textarea
              rows={4}
              placeholder="Cole as linhas aqui..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-md text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-400">
                Colunas: Pedido, Rastreio, Transportadora, NF, Data envio, Valor, Abertura...
              </span>
              <button
                onClick={handleParsePaste}
                disabled={!pasteText.trim()}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition cursor-pointer"
              >
                Importar Linhas
              </button>
            </div>
          </div>

          {/* Status feedback */}
          {importStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Reset button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => {
                if (confirm('Restaurar os 10 registros originais da sua planilha?')) {
                  onResetOriginals();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar dados originais (10 chamados)</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
