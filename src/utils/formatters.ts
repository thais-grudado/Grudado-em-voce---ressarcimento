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
 * Normalizes month/year into a chronological key (YYYY-MM) and standard label (mes/ano)
 */
export interface NormalizedMonthYear {
  key: string;      // e.g. "2026-07", "2026-08" (for chronological sorting)
  label: string;    // e.g. "julho/2026", "agosto/2026"
  year: number;     // e.g. 2026
  month: number;    // 1-12
}

export function normalizeMonthYearKey(rawMonthYear?: string, fallbackDate?: string): NormalizedMonthYear {
  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  let year = 2026;
  let month = 0; // 1-12

  if (rawMonthYear) {
    const clean = rawMonthYear.trim().toLowerCase();

    // Check if numeric format like "08/2026", "8/2026", "08/26", "08-2026"
    const numMatch = clean.match(/^(\d{1,2})[\/\-](\d{2,4})$/);
    if (numMatch) {
      month = parseInt(numMatch[1], 10);
      let y = parseInt(numMatch[2], 10);
      if (y < 100) y += 2000;
      year = y;
    } else {
      // Check for month name in string, e.g. "agosto/2026", "agosto", "julho/2026"
      for (let i = 0; i < monthNames.length; i++) {
        if (clean.includes(monthNames[i])) {
          month = i + 1;
          break;
        }
      }
      // Check abbreviations like "jul", "ago", "set"
      if (month === 0) {
        const shortMonths: Record<string, number> = {
          jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
          jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12
        };
        for (const [sM, val] of Object.entries(shortMonths)) {
          if (clean.includes(sM)) {
            month = val;
            break;
          }
        }
      }
      // Look for 4-digit year
      const yMatch = clean.match(/\b(20\d\d)\b/);
      if (yMatch) {
        year = parseInt(yMatch[1], 10);
      }
    }
  }

  // If month was not found in rawMonthYear, derive from fallbackDate
  if (month === 0 && fallbackDate) {
    const iso = parseDateBRToISO(fallbackDate);
    const parts = iso.split('-');
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(y) && y > 2000) year = y;
      if (!isNaN(m) && m >= 1 && m <= 12) month = m;
    }
  }

  if (month < 1 || month > 12) month = 8; // fallback to agosto

  const name = monthNames[month - 1];
  const padMonth = String(month).padStart(2, '0');
  return {
    key: `${year}-${padMonth}`,
    label: `${name}/${year}`,
    year,
    month,
  };
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
  refDateStr?: string
): { status: SLAStatus; label: string; daysDiff: number; badgeColor: string } {
  // Only officially paid or denied claims are completed; pending refunds still have SLA tracking
  if (claim.refundStatus === 'Pago' || claim.refundStatus === 'Negado') {
    return {
      status: 'completed',
      label: 'Finalizado',
      daysDiff: 0,
      badgeColor: 'bg-[#8EDD65]/20 text-[#253746] border border-[#8EDD65]/40 font-semibold',
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
  const refISO = refDateStr ? parseDateBRToISO(refDateStr) : new Date().toISOString().split('T')[0];

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
      badgeColor: 'bg-[#EF426F]/15 text-[#EF426F] border border-[#EF426F]/30 font-bold',
    };
  } else if (diffDays === 0) {
    return {
      status: 'due_today',
      label: 'Vence Hoje',
      daysDiff: 0,
      badgeColor: 'bg-[#FF6A39]/20 text-[#FF6A39] border border-[#FF6A39]/40 font-bold',
    };
  } else {
    return {
      status: 'on_track',
      label: `No prazo (${diffDays} ${diffDays === 1 ? 'dia' : 'dias'})`,
      daysDiff: diffDays,
      badgeColor: 'bg-[#05C3DE]/15 text-[#253746] border border-[#05C3DE]/30 font-medium',
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
