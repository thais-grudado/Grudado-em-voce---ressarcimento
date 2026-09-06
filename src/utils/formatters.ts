import { Claim, SLAStatus } from '../types';

/**
 * Format currency in Brazilian Real (R$)
 */
export function formatBRL(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'R$ 0,00';
  return amount.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a YYYY-MM-DD string into DD/MM/YYYY
 */
export function formatDateBR(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  if (dateStr.includes('/')) return dateStr; // already formatted
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  return dateStr;
}

/**
 * Converts DD/MM/YYYY to YYYY-MM-DD
 */
export function parseDateBRToISO(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('-')) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

/**
 * Add calendar/working days to a date string (YYYY-MM-DD)
 */
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const iso = parseDateBRToISO(dateStr);
  const [year, month, day] = iso.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dt = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

/**
 * Get Month/Year name in Portuguese (e.g. "agosto/2026", "setembro/2026")
 */
export function getMonthYearFromDate(dateStr: string): string {
  if (!dateStr) return '';
  const iso = parseDateBRToISO(dateStr);
  const parts = iso.split('-');
  if (parts.length < 2) return '';
  const year = parts[0];
  const month = parseInt(parts[1], 10);
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const name = monthNames[month - 1] || '';
  return `${name}/${year}`;
}

/**
 * Computes SLA Status against a reference date (default: 2026-09-06)
 */
export function computeSLAStatus(
  claim: Claim,
  refDateStr: string = '2026-09-06'
): { status: SLAStatus; label: string; daysDiff: number; badgeColor: string } {
  if (claim.resolution === 'Sim' || claim.refundStatus === 'Pago' || claim.refundStatus === 'Negado') {
    return {
      status: 'completed',
      label: 'Finalizado',
      daysDiff: 0,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  if (!claim.estimatedReturnDate) {
    return {
      status: 'on_track',
      label: 'Sem prazo',
      daysDiff: 0,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  const estISO = parseDateBRToISO(claim.estimatedReturnDate);
  const refISO = parseDateBRToISO(refDateStr);

  const [ey, em, ed] = estISO.split('-').map(Number);
  const [ry, rm, rd] = refISO.split('-').map(Number);

  const estDate = new Date(ey, em - 1, ed);
  const refDate = new Date(ry, rm - 1, rd);

  const diffMs = estDate.getTime() - refDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return {
      status: 'overdue',
      label: `Vencido há ${daysLate} ${daysLate === 1 ? 'dia' : 'dias'}`,
      daysDiff: diffDays,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
    };
  } else if (diffDays === 0) {
    return {
      status: 'due_today',
      label: 'Vence Hoje',
      daysDiff: 0,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold',
    };
  } else {
    return {
      status: 'on_track',
      label: `No prazo (${diffDays} ${diffDays === 1 ? 'dia' : 'dias'})`,
      daysDiff: diffDays,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }
}

/**
 * Export claims to Excel CSV format with BOM for proper Portuguese characters
 */
export function exportClaimsToCSV(claims: Claim[]): void {
  const headers = [
    'Nº do pedido',
    'Cód de rastreio',
    'Transportadora',
    'Nota fiscal',
    'Data envio',
    'Valor total',
    'Data abertura chamado',
    'Tipo de problema',
    'Prazo (SLA) Dias',
    'Previsão de retorno',
    'Resolvido',
    'Ressarcimento',
    'Mês/Ano',
    'Protocolo',
    'Observações',
  ];

  const rows = claims.map((c) => [
    `"${c.orderNumber}"`,
    `"${c.trackingCode || ''}"`,
    `"${c.carrier}"`,
    `"${c.invoiceNumber || ''}"`,
    `"${formatDateBR(c.shippingDate)}"`,
    `"${c.amount.toFixed(2).replace('.', ',')}"`,
    `"${formatDateBR(c.ticketDate)}"`,
    `"${c.problemType}"`,
    c.slaDays,
    `"${formatDateBR(c.estimatedReturnDate)}"`,
    `"${c.resolution}"`,
    `"${c.refundStatus}"`,
    `"${c.monthYear}"`,
    `"${c.protocolNumber || ''}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ressarcimentos_grudado_em_voce_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Standardized carrier cobrança message generator (ready for WhatsApp / Email)
 */
export function generateCobranceMessage(claim: Claim): string {
  return `*SOLICITAÇÃO DE POSIÇÃO DE RESSARCIMENTO - GRUDADO EM VOCÊ*

Prezada equipe ${claim.carrier},

Solicitamos com urgência uma atualização referente ao protocolo de indenização/ressarcimento do envio abaixo:

📦 *Nº Pedido:* #${claim.orderNumber}
🔍 *Código de Rastreio:* ${claim.trackingCode || 'N/A'}
📄 *Nota Fiscal:* ${claim.invoiceNumber || 'N/A'}
💰 *Valor Declarado:* ${formatBRL(claim.amount)}
⚠️ *Motivo da Ocorrência:* ${claim.problemType}
📅 *Data Abertura:* ${formatDateBR(claim.ticketDate)}
⏱️ *Prazo SLA Acordado:* ${claim.slaDays} dias (Previsão: ${formatDateBR(claim.estimatedReturnDate)})
📋 *Protocolo Transportadora:* ${claim.protocolNumber || 'N/A'}

${claim.notes ? `*Observações internas:* ${claim.notes}\n` : ''}
Conforme nosso acordo de nível de serviço (SLA), aguardamos a confirmação da indenização e respectivo comprovante de crédito/estorno.

Atenciosamente,
*Equipe de Logística & SAC - Grudado em Você*`;
}
