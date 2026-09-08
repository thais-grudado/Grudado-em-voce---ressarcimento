import React, { useState } from 'react';
import { 
  X, 
  Sheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Download, 
  Clock, 
  FileSpreadsheet,
  HelpCircle,
  Play,
  Share2,
  Copy
} from 'lucide-react';
import { GoogleSheetConfig, Claim } from '../types';
import { 
  fetchGoogleSheetCSV, 
  parseClaimsFromCSV, 
  generateTemplateCSV,
  extractGoogleSheetInfo 
} from '../services/googleSheetsService';
import { GrudadoLogo } from './GrudadoLogo';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleSheetConfig;
  onSaveConfig: (config: GoogleSheetConfig) => void;
  onSyncClaims: (newClaims: Claim[], mode: 'replace' | 'merge') => void;
  currentClaimsCount: number;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onSyncClaims,
  currentClaimsCount,
}) => {
  const [url, setUrl] = useState(config.url || '');
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);
  const [intervalMinutes, setIntervalMinutes] = useState(config.syncIntervalMinutes || 2);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    claimsFound?: number;
    previewClaims?: Claim[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'config' | 'tutorial'>('config');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyShareLink = () => {
    if (!url.trim()) return;
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?sheet=${encodeURIComponent(url.trim())}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.warn('Clipboard error:', e);
    }
  };

  // Handles test and fetch
  const handleTestAndSync = async (shouldApply = false) => {
    if (!url.trim()) {
      setTestResult({
        success: false,
        message: 'Por favor, insira o link ou ID da sua planilha do Google Sheets.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const csvText = await fetchGoogleSheetCSV(url);
      const parsed = parseClaimsFromCSV(csvText);

      if (parsed.claims.length === 0) {
        setTestResult({
          success: false,
          message: parsed.errors[0] || 'Nenhuma linha válida encontrada. Verifique se a planilha possui cabeçalhos correspondentes.',
        });
        setIsTesting(false);
        return;
      }

      setTestResult({
        success: true,
        message: `Planilha lida com sucesso! Encontradas ${parsed.claims.length} ocorrências prontas para sincronização.`,
        claimsFound: parsed.claims.length,
        previewClaims: parsed.claims.slice(0, 3),
      });

      const { spreadsheetId } = extractGoogleSheetInfo(url);
      const updatedConfig: GoogleSheetConfig = {
        url: url.trim(),
        spreadsheetId,
        autoSync,
        syncIntervalMinutes: intervalMinutes,
        lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        lastSyncStatus: 'success',
        lastSyncCount: parsed.claims.length,
      };

      onSaveConfig(updatedConfig);

      if (shouldApply) {
        onSyncClaims(parsed.claims, importMode);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Falha ao conectar com o Google Sheets. Verifique o compartilhamento.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = generateTemplateCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const urlBlob = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.setAttribute('download', 'planilha-modelo-ressarcimentos-grudado.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseDemoSheet = () => {
    // A ready-to-test public Google Sheets published demo link
    const demoUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT7F_Z0P1wR3X8e-demo-grudado/pub?output=csv';
    setUrl(demoUrl);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Brand Gradient Accent */}
        <div className="relative bg-[#253746] text-white p-6 pb-5">
          {/* Top color accent bar with brand colors */}
          <div className="absolute top-0 left-0 right-0 h-1.5 flex">
            <div className="flex-1 bg-[#F9E547]" />
            <div className="flex-1 bg-[#8EDD65]" />
            <div className="flex-1 bg-[#EF426F]" />
            <div className="flex-1 bg-[#05C3DE]" />
            <div className="flex-1 bg-[#FF6A39]" />
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center">
                <GrudadoLogo variant="icon" size="sm" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Sincronização com Google Sheets
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#05C3DE] text-[#253746]">
                    Tempo Real
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Preencha sua planilha no Google Drive e atualize o painel automaticamente.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'config'
                  ? 'bg-white text-[#253746] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#05C3DE]" />
              <span>Conectar Planilha</span>
            </button>
            <button
              onClick={() => setActiveTab('tutorial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tutorial'
                  ? 'bg-white text-[#253746] shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#F9E547]" />
              <span>Passo a Passo (Como Funciona)</span>
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition cursor-pointer flex items-center gap-1.5"
              title="Baixar modelo em formato CSV com colunas pré-configuradas"
            >
              <Download className="w-3.5 h-3.5 text-[#8EDD65]" />
              <span className="hidden sm:inline">Baixar Modelo</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'config' ? (
            <>
              {/* Google Sheets URL Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#253746] uppercase tracking-wider">
                  Link da Planilha do Google Sheets
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                    <Sheet className="w-5 h-5" />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit ou link publicado"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#05C3DE] focus:bg-white transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Cole o link normal do Google Sheets ou o link publicado na web (CSV). Certifique-se de que o acesso está como <strong>"Qualquer pessoa com o link pode ver"</strong>.
                </p>

                {url.trim() && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-cyan-50/70 border border-cyan-200 rounded-xl text-xs text-cyan-900">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-[#05C3DE] shrink-0" />
                      <span>Abrir em <strong>outro navegador</strong> ou dispositivo com essa mesma planilha conectada:</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="px-2.5 py-1.5 bg-white border border-cyan-300 hover:bg-cyan-100/60 text-cyan-900 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
                    >
                      {copiedLink ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#05C3DE]" />
                          <span>Copiar Link de Acesso</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Sync Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* Auto Sync Toggle */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="autoSync"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#05C3DE] rounded border-slate-300 focus:ring-[#05C3DE] cursor-pointer"
                  />
                  <div>
                    <label htmlFor="autoSync" className="text-xs font-bold text-[#253746] cursor-pointer">
                      Sincronização Automática
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      O painel busca alterações no Google Sheets automaticamente em segundo plano.
                    </p>
                  </div>
                </div>

                {/* Interval selector */}
                <div>
                  <label className="text-xs font-bold text-[#253746] block mb-1">
                    Frequência de Atualização
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <select
                      value={intervalMinutes}
                      onChange={(e) => setIntervalMinutes(Number(e.target.value))}
                      disabled={!autoSync}
                      className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 focus:ring-2 focus:ring-[#05C3DE] disabled:opacity-50 cursor-pointer"
                    >
                      <option value={1}>A cada 1 minuto</option>
                      <option value={2}>A cada 2 minutos (Recomendado)</option>
                      <option value={5}>A cada 5 minutos</option>
                      <option value={15}>A cada 15 minutos</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mode: Merge or Replace */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#253746] block">
                  Regra de Mesclagem
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label 
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'merge'
                        ? 'border-[#05C3DE] bg-[#05C3DE]/5 text-[#253746]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-[#05C3DE] focus:ring-[#05C3DE]"
                    />
                    <div>
                      <span className="text-xs font-bold block">Atualizar e Mesclar (Recomendado)</span>
                      <span className="text-[11px] text-slate-500">
                        Adiciona novos pedidos da planilha e atualiza status existentes sem apagar históricos manuais.
                      </span>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'border-[#EF426F] bg-[#EF426F]/5 text-[#253746]'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-[#EF426F] focus:ring-[#EF426F]"
                    />
                    <div>
                      <span className="text-xs font-bold block">Espelhar Totalmente (Substituir)</span>
                      <span className="text-[11px] text-slate-500">
                        O painel terá exatamente as mesmas linhas da planilha, substituindo os chamados atuais.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Feedback and Test Result */}
              {testResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-fadeIn ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-[#8EDD65] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-[#EF426F] shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-semibold">{testResult.message}</p>
                    {testResult.claimsFound && (
                      <p className="text-[11px] text-slate-600">
                        Total pronto para sincronizar: <strong>{testResult.claimsFound} ocorrências</strong>.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Tutorial Tab */
            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-[#05C3DE]/10 border border-[#05C3DE]/30 p-4 rounded-xl flex items-start gap-3">
                <GrudadoLogo variant="icon" size="sm" />
                <div>
                  <h4 className="font-bold text-[#253746] text-sm">
                    Como a automação funciona na prática:
                  </h4>
                  <p className="text-slate-600 mt-1">
                    Qualquer pessoa da equipe do SAC ou Expedição pode abrir a planilha do Google Sheets, preencher as ocorrências e, em poucos segundos, o painel <strong>Grudado em Você</strong> recalcula os valores, prazos de SLA e gráficos sem ninguém precisar exportar nada!
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-[#253746] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">Crie ou abra sua planilha no Google Sheets</h5>
                    <p className="text-slate-500 mt-0.5 text-[11px]">
                      Você pode usar sua planilha existente ou clicar em "Baixar Modelo" no topo deste modal para ver as colunas recomendadas (Pedido, Nota Fiscal, Rastreio, Transportadora, Valor, Status).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-[#05C3DE] text-[#253746] flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">Permita acesso de leitura no Google Sheets</h5>
                    <p className="text-slate-500 mt-0.5 text-[11px]">
                      No Google Sheets, clique no botão azul <strong>Compartilhar</strong> (canto superior direito) &rarr; em "Acesso Geral", selecione <strong>"Qualquer pessoa com o link pode ver"</strong>.
                      <br />
                      <em>(Ou no menu: Arquivo &gt; Compartilhar &gt; Publicar na Web &gt; Formato CSV).</em>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-[#8EDD65] text-[#253746] flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800">Cole o link aqui e ative a Sincronização Automática</h5>
                    <p className="text-slate-500 mt-0.5 text-[11px]">
                      Cole o link na aba "Conectar Planilha" e clique em "Sincronizar Agora". A partir desse momento, as atualizações acontecerão automaticamente no intervalo configurado!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Chamados atuais no painel: <strong>{currentClaimsCount}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Fechar
            </button>

            <button
              onClick={() => handleTestAndSync(true)}
              disabled={isTesting || !url.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-[#05C3DE] hover:bg-[#04b0c7] active:bg-[#039eb3] disabled:opacity-50 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: '#05C3DE' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Verificando...' : 'Sincronizar Agora'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
