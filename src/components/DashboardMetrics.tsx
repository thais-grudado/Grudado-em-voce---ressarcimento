import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  AlertCircle,
  Truck,
  TrendingUp,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { ClaimStats } from '../types';
import { formatBRL } from '../utils/formatters';

interface DashboardMetricsProps {
  stats: ClaimStats;
  selectedCarrierFilter?: string;
  onSelectCarrierFilter?: (carrier: string) => void;
  selectedProblemFilter?: string;
  onSelectProblemFilter?: (problem: string) => void;
  onTabChange?: (tab: 'all' | 'pending' | 'overdue' | 'paid' | 'denied' | 'not_applicable') => void;
  showCharts?: boolean;
  onToggleCharts?: () => void;
}

const PROBLEM_COLORS: Record<string, string> = {
  'Extravio': '#FF6A39',       // Laranja Grudado
  'Roubo de carga': '#EF426F',  // Rosa Grudado
  'Avaria': '#F9E547',          // Amarelo Grudado
  'Atraso na entrega': '#05C3DE', // Azul Claro Grudado
  'Outros': '#253746',         // Azul Escuro Grudado
};

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  stats,
  selectedCarrierFilter,
  onSelectCarrierFilter,
  selectedProblemFilter,
  onSelectProblemFilter,
  onTabChange,
  showCharts = true,
  onToggleCharts,
}) => {
  return (
    <div className="space-y-6">
      {/* KPI Cards Row - Professional Polish style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Card 1: Pendente */}
        <div 
          onClick={() => onTabChange && onTabChange('pending')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-sm transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pendente
              </p>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <p className="text-3xl font-bold text-amber-500 tracking-tight">
              {formatBRL(stats.pendingAmount)}
            </p>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between gap-1 flex-wrap">
            <span>{stats.pendingCount} solicitações abertas</span>
            {stats.awaitingPaymentCount > 0 ? (
              <span className="text-[11px] text-sky-800 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200" title="Retorno já aprovado, aguardando repasse bancário">
                {stats.awaitingPaymentCount} aguardando depósito
              </span>
            ) : (
              <span className="text-[11px] text-amber-600 font-medium">Em análise</span>
            )}
          </div>
        </div>

        {/* Card 2: Aprovado / Em Trâmite */}
        <div 
          onClick={() => onTabChange && onTabChange('all')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-sm transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Solicitado
              </p>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600 tracking-tight">
              {formatBRL(stats.totalAmount)}
            </p>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>{stats.totalCount} demandas totais</span>
            <span className="text-[11px] text-blue-600 font-medium">100% catalogado</span>
          </div>
        </div>

        {/* Card 3: Pago (Mês) */}
        <div 
          onClick={() => onTabChange && onTabChange('paid')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-sm transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pago / Indenizado
              </p>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-600 tracking-tight">
              {formatBRL(stats.paidAmount)}
            </p>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>{stats.paidCount} concluídos com êxito</span>
            <span className="text-[11px] text-emerald-600 font-bold">
              {stats.recoveryRate.toFixed(0)}% taxa recup.
            </span>
          </div>
        </div>

        {/* Card 4: Recusado */}
        <div 
          onClick={() => onTabChange && onTabChange('denied')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm transition cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recusado / Negado
              </p>
              <span className="w-2 h-2 rounded-full bg-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-700 tracking-tight">
              {formatBRL(stats.deniedAmount)}
            </p>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>{stats.deniedCount} improcedentes</span>
            <span className="text-[11px] text-slate-500 font-medium">Arquivado</span>
          </div>
        </div>

        {/* Card 5: SLA Vencido */}
        <div 
          onClick={() => onTabChange && onTabChange('overdue')}
          className={`bg-white p-5 rounded-xl border shadow-xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between ${
            stats.overdueCount > 0 ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">
                SLA Retorno Vencido
              </p>
              {stats.overdueCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </div>
            <p className="text-3xl font-bold text-rose-600 tracking-tight">
              {stats.overdueCount} <span className="text-sm font-semibold text-rose-400">chamados</span>
            </p>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>Sem retorno da transportadora</span>
            <span className="text-[11px] text-rose-600 font-bold">Cobrar</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Por Transportadora (5 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                Por Transportadora
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparativo de valores pendentes e ressarcidos
              </p>
            </div>
            {selectedCarrierFilter && (
              <button
                onClick={() => onSelectCarrierFilter && onSelectCarrierFilter('')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.carrierDistribution}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-lg border border-slate-800">
                          <p className="font-bold text-sm text-blue-400 mb-1">{data.name}</p>
                          <p className="flex justify-between gap-4 py-0.5">
                            <span className="text-slate-300">Volume:</span>
                            <span className="font-bold">{data.count} pedidos</span>
                          </p>
                          <p className="flex justify-between gap-4 py-0.5">
                            <span className="text-slate-300">Pendente:</span>
                            <span className="font-bold text-amber-300">{formatBRL(data.pendingAmount)}</span>
                          </p>
                          <p className="flex justify-between gap-4 py-0.5">
                            <span className="text-slate-300">Recuperado:</span>
                            <span className="font-bold text-emerald-400">{formatBRL(data.paidAmount)}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="pendingAmount" 
                  name="Pendente" 
                  fill="#F9E547" 
                  radius={[3, 3, 0, 0]}
                  cursor="pointer"
                  onClick={(entry) => onSelectCarrierFilter && onSelectCarrierFilter(entry.name)}
                />
                <Bar 
                  dataKey="paidAmount" 
                  name="Pago" 
                  fill="#8EDD65" 
                  radius={[3, 3, 0, 0]}
                  cursor="pointer"
                  onClick={(entry) => onSelectCarrierFilter && onSelectCarrierFilter(entry.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-500 mt-2 border-t border-slate-100 pt-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#F9E547] inline-block" />
              <span className="font-semibold text-[#253746]">Pendente</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#8EDD65] inline-block" />
              <span className="font-semibold text-[#253746]">Pago / Indenizado</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Tipo de Ocorrência (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-blue-600" />
                Categorias de Problema
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Distribuição das ocorrências registradas
              </p>
            </div>
            {selectedProblemFilter && (
              <button
                onClick={() => onSelectProblemFilter && onSelectProblemFilter('')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.problemDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={3}
                  cursor="pointer"
                  onClick={(entry) => onSelectProblemFilter && onSelectProblemFilter(entry.name)}
                >
                  {stats.problemDistribution.map((entry) => (
                    <Cell 
                      key={entry.name} 
                      fill={PROBLEM_COLORS[entry.name] || '#64748B'} 
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-lg p-2.5 shadow-lg border border-slate-800">
                          <p className="font-bold text-blue-300">{data.name}</p>
                          <p className="text-slate-300 mt-0.5">{data.count} pedidos ({data.percentage.toFixed(0)}%)</p>
                          <p className="font-bold text-emerald-400 mt-1">{formatBRL(data.totalAmount)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-slate-800">{stats.totalCount}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 border-t border-slate-100 pt-3 text-xs">
            {stats.problemDistribution.map((item) => {
              const isSelected = selectedProblemFilter === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => onSelectProblemFilter && onSelectProblemFilter(isSelected ? '' : item.name)}
                  className={`flex items-center justify-between p-1.5 rounded-md text-left transition cursor-pointer ${
                    isSelected ? 'bg-blue-50 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: PROBLEM_COLORS[item.name] || '#64748B' }} 
                    />
                    <span className="truncate text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 shrink-0 ml-1">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chart 3: Evolução Mensal (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Evolução por Competência
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Valores totais solicitados por mês
              </p>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.monthlyEvolution}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="monthYear" 
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `R$${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white text-xs rounded-lg p-3 shadow-lg border border-slate-800">
                          <p className="font-bold text-sm text-blue-300 capitalize mb-1">{data.monthYear}</p>
                          <p className="flex justify-between gap-4 py-0.5">
                            <span className="text-slate-300">Volume:</span>
                            <span className="font-bold">{data.count} pedidos</span>
                          </p>
                          <p className="flex justify-between gap-4 py-0.5">
                            <span className="text-slate-300">Valor Total:</span>
                            <span className="font-bold text-white">{formatBRL(data.totalAmount)}</span>
                          </p>
                          <p className="flex justify-between gap-4 py-0.5">
                            <span className="text-slate-300">Indenizado:</span>
                            <span className="font-bold text-emerald-400">{formatBRL(data.paidAmount)}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="totalAmount" 
                  name="Valor Total" 
                  fill="#05C3DE" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-2.5">
            {stats.monthlyEvolution.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">Nenhum dado por competência registrado</p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {stats.monthlyEvolution.map((m) => (
                    <div key={m.monthYear} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/70">
                      <span className="capitalize font-medium text-slate-700">{m.monthYear}:</span>
                      <span className="font-bold text-slate-900">{formatBRL(m.totalAmount)}</span>
                      <span className="text-[10px] text-slate-500 font-medium">({m.count} {m.count === 1 ? 'ped.' : 'peds.'})</span>
                    </div>
                  ))}
                </div>
                <div className="text-right ml-auto font-medium">
                  <span className="text-slate-500 mr-1">Total:</span>
                  <span className="font-bold text-cyan-700 text-sm">
                    {formatBRL(stats.monthlyEvolution.reduce((acc, curr) => acc + curr.totalAmount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
