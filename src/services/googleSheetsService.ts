import { Claim, CarrierName, ProblemType, ResolutionStatus, RefundStatus } from '../types';

export interface ParseResult {
  claims: Claim[];
  errors: string[];
  totalRows: number;
  importedCount: number;
}

/**
 * Extracts spreadsheet ID and sheet name from various Google Sheets URL formats.
 */
export function extractGoogleSheetInfo(urlOrId: string): {
  spreadsheetId: string;
  isPublicPublish: boolean;
  pubId?: string;
  sheetName?: string;
  csvUrl: string;
} {
  const trimmed = urlOrId.trim();

  // Format 1: Public Web Publish: https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
  const pubMatch = trimmed.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch) {
    const pubId = pubMatch[1];
    return {
      spreadsheetId: pubId,
      isPublicPublish: true,
      pubId,
      csvUrl: `https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`,
    };
  }

  // Format 2: Standard Google Sheet: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/...
  const idMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = idMatch ? idMatch[1] : trimmed;

  // Extract sheet/gid if present
  const sheetMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  const gid = sheetMatch ? sheetMatch[1] : '0';

  // Google visualization query returns CSV with proper CORS on shared sheets
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;

  return {
    spreadsheetId,
    isPublicPublish: false,
    csvUrl,
  };
}

/**
 * Robust CSV parser that handles quotes, line breaks inside cells, and delimiters (, or ;)
 */
export function parseCSV(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim(); // Remove BOM
  if (!cleanText) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  // Detect delimiter: check first non-empty line
  const firstLine = cleanText.split('\n')[0] || '';
  const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normalizes string for column header comparison (lowercase, unaccented, without symbols)
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Converts currency string (e.g. "R$ 1.250,50" or "1250.50" or "350") to number
 */
function parseCurrency(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : value;

  const str = String(value).trim();
  if (!str) return 0;

  // Handle formats like "1.250,50" vs "1250.50"
  let clean = str.replace(/[R$\s]/g, '');
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Normalizes date string into YYYY-MM-DD
 */
function parseDate(dateStr: string | undefined): string {
  if (!dateStr) {
    return new Date().toISOString().split('T')[0];
  }

  const trimmed = dateStr.trim();

  // Check DD/MM/YYYY
  const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Check YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Default fallback
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Parses raw CSV rows into typed Claims
 */
export function parseClaimsFromCSV(csvText: string): ParseResult {
  const rows = parseCSV(csvText);
  if (rows.length < 2) {
    return {
      claims: [],
      errors: ['A planilha está vazia ou contém apenas a linha de cabeçalho.'],
      totalRows: 0,
      importedCount: 0,
    };
  }

  const headerRow = rows[0];
  const colMap: Record<string, number> = {};

  headerRow.forEach((col, idx) => {
    const norm = normalizeHeader(col);
    colMap[norm] = idx;
  });

  const findCol = (keywords: string[]): number => {
    for (const kw of keywords) {
      const normKw = normalizeHeader(kw);
      for (const [colKey, idx] of Object.entries(colMap)) {
        if (colKey === normKw || colKey.includes(normKw) || normKw.includes(colKey)) {
          return idx;
        }
      }
    }
    return -1;
  };

  // Map columns by common synonyms used in Brazilian e-commerce & Grudado em Você
  const orderCol = findCol(['pedido', 'npedido', 'numeropedido', 'order', 'ordernumber']);
  const trackingCol = findCol(['rastreio', 'codigorastreio', 'objeto', 'tracking', 'etiqueta', 'conhecimento']);
  const carrierCol = findCol(['transportadora', 'carrier', 'empresa', 'envio']);
  const invoiceCol = findCol(['notafiscal', 'nf', 'nnf', 'numeroanf', 'danfe']);
  const dateCol = findCol(['dataregistro', 'data', 'dataabertura', 'ticketdate', 'dataenvio', 'createdat']);
  const amountCol = findCol(['valor', 'valormercadoria', 'valorpedido', 'valorsolicitado', 'amount', 'total']);
  const problemCol = findCol(['motivo', 'tipodesinistro', 'ocorrencia', 'problema', 'sinistro', 'problemtype']);
  const slaCol = findCol(['sladias', 'sla', 'prazosla', 'prazo']);
  const resolutionCol = findCol(['resolucao', 'solucao', 'resolvido', 'resposta']);
  const statusCol = findCol(['status', 'situacao', 'statusreembolso', 'refundstatus', 'statusressarcimento']);
  const notesCol = findCol(['observacoes', 'observacao', 'notas', 'protocolo', 'obs', 'detalhes']);

  const parsedClaims: Claim[] = [];
  const errors: string[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || row.every(c => c === '')) continue;

    try {
      const orderNumber = orderCol !== -1 && row[orderCol] ? row[orderCol].trim() : `PED-${Math.floor(10000 + Math.random() * 90000)}`;
      const trackingCode = trackingCol !== -1 && row[trackingCol] ? row[trackingCol].trim() : `BR${Math.floor(100000000 + Math.random() * 900000000)}GV`;
      const carrierRaw = carrierCol !== -1 && row[carrierCol] ? row[carrierCol].trim() : 'Total Express';
      const invoiceNumber = invoiceCol !== -1 && row[invoiceCol] ? row[invoiceCol].trim() : `${Math.floor(10000 + Math.random() * 90000)}`;
      const rawDate = dateCol !== -1 ? row[dateCol] : undefined;
      const ticketDate = parseDate(rawDate);
      const amount = amountCol !== -1 ? parseCurrency(row[amountCol]) : 150.0;
      const problemRaw = problemCol !== -1 && row[problemCol] ? row[problemCol].trim() : 'Extravio';
      const slaDays = slaCol !== -1 && row[slaCol] ? parseInt(row[slaCol], 10) || 5 : 5;
      
      // Calculate estimated return date (ticketDate + slaDays)
      const baseDate = new Date(ticketDate);
      const returnDateObj = new Date(baseDate);
      returnDateObj.setDate(returnDateObj.getDate() + slaDays);
      const estimatedReturnDate = returnDateObj.toISOString().split('T')[0];

      // Normalize status
      const statusRaw = (statusCol !== -1 && row[statusCol] ? row[statusCol].trim().toLowerCase() : 'pendente');
      let refundStatus: RefundStatus = 'Pendente';
      if (statusRaw.includes('pago') || statusRaw.includes('indenizado') || statusRaw.includes('ressarcido') || statusRaw.includes('aprovado')) {
        refundStatus = 'Pago';
      } else if (statusRaw.includes('negado') || statusRaw.includes('recusado') || statusRaw.includes('indeferido') || statusRaw.includes('improcedente')) {
        refundStatus = 'Negado';
      }

      // Normalize resolution
      const resRaw = (resolutionCol !== -1 && row[resolutionCol] ? row[resolutionCol].trim().toLowerCase() : '');
      let resolution: ResolutionStatus = 'Em análise';
      if (resRaw === 'sim' || refundStatus === 'Pago') {
        resolution = 'Sim';
      } else if (resRaw === 'nao' || resRaw === 'não' || refundStatus === 'Negado') {
        resolution = 'Não';
      }

      // Compute monthYear in Portuguese
      const monthsPt = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
      const mIdx = baseDate.getMonth();
      const monthYear = `${monthsPt[mIdx]}/${baseDate.getFullYear()}`;

      const notes = notesCol !== -1 && row[notesCol] ? row[notesCol].trim() : undefined;

      const claim: Claim = {
        id: `claim-gs-${Date.now()}-${r}`,
        orderNumber,
        trackingCode,
        carrier: carrierRaw as CarrierName,
        invoiceNumber,
        shippingDate: ticketDate,
        amount: amount > 0 ? amount : 100.0,
        ticketDate,
        problemType: problemRaw as ProblemType,
        slaDays,
        estimatedReturnDate,
        resolution,
        refundStatus,
        monthYear,
        notes,
        createdAt: ticketDate,
        updatedAt: new Date().toISOString().split('T')[0],
      };

      parsedClaims.push(claim);
    } catch (err: any) {
      errors.push(`Linha ${r + 1}: Erro ao processar dados (${err?.message || 'formato inválido'})`);
    }
  }

  return {
    claims: parsedClaims,
    errors,
    totalRows: rows.length - 1,
    importedCount: parsedClaims.length,
  };
}

/**
 * Fetches the spreadsheet CSV with automatic retry and CORS proxy support
 */
export async function fetchGoogleSheetCSV(spreadsheetUrlOrId: string): Promise<string> {
  const { csvUrl, isPublicPublish, spreadsheetId } = extractGoogleSheetInfo(spreadsheetUrlOrId);

  // Attempt direct fetch first (Google pub/export CSVs support CORS)
  try {
    const res = await fetch(csvUrl, {
      method: 'GET',
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
    });

    if (res.ok) {
      const text = await res.text();
      // Verify it's not an HTML login page
      if (text.includes('<!DOCTYPE html>') || text.includes('<html') || text.includes('accounts.google.com')) {
        throw new Error(
          'A planilha requer permissão de acesso. No Google Sheets, clique em "Compartilhar" e selecione "Qualquer pessoa com o link pode ler" ou vá em Arquivo > Compartilhar > Publicar na Web.'
        );
      }
      return text;
    }
  } catch (directErr: any) {
    // If direct fetch threw HTML permission error, rethrow directly
    if (directErr?.message && directErr.message.includes('A planilha requer')) {
      throw directErr;
    }
  }

  // Fallback 1: Try alternative Google export endpoint
  try {
    const altUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`;
    const res = await fetch(altUrl);
    if (res.ok) {
      const text = await res.text();
      if (!text.includes('<!DOCTYPE html>')) {
        return text;
      }
    }
  } catch {
    // Continue to fallback
  }

  // Fallback 2: CORS proxy for stubborn environments
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;
  const proxyRes = await fetch(proxyUrl);
  if (!proxyRes.ok) {
    throw new Error(
      'Não foi possível ler a planilha. Verifique se o link está correto e se o acesso está definido como "Qualquer pessoa com o link pode ver" ou "Publicada na Web".'
    );
  }

  const text = await proxyRes.text();
  if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
    throw new Error(
      'A planilha requer permissão pública de leitura. No Google Sheets: Arquivo > Compartilhar > Publicar na Web > Escolha "CSV" e copie o link gerado.'
    );
  }

  return text;
}

/**
 * Generates a ready-to-use CSV template for Grudado em Você
 */
export function generateTemplateCSV(): string {
  const headers = [
    'Data Registro',
    'Nº Pedido',
    'Nota Fiscal',
    'Rastreio',
    'Transportadora',
    'Tipo de Sinistro',
    'Valor Mercadoria',
    'SLA (Dias)',
    'Status Reembolso',
    'Resolvido',
    'Observações / Protocolo',
  ];

  const sampleRows = [
    ['2026-09-01', 'PED-98432', 'NF-10492', 'BR849204921GV', 'Total Express', 'Extravio', '189.90', '5', 'Pendente', 'Em análise', 'Notificação enviada ao SAC'],
    ['2026-09-02', 'PED-98440', 'NF-10495', 'BR849204922GV', 'Jadlog', 'Atraso na entrega', '124.50', '3', 'Pendente', 'Em análise', 'Cliente aguardando resolução'],
    ['2026-09-03', 'PED-98455', 'NF-10501', 'BR849204923GV', 'Correios', 'Avaria', '320.00', '7', 'Pago', 'Sim', 'Ressarcimento concluído no PIX'],
    ['2026-09-04', 'PED-98462', 'NF-10508', 'BR849204924GV', 'J&T', 'Roubo de carga', '210.00', '5', 'Pendente', 'Em análise', 'Boletim de ocorrência anexado'],
  ];

  const csvLines = [
    headers.join(';'),
    ...sampleRows.map(row => row.join(';')),
  ];

  return csvLines.join('\r\n');
}
