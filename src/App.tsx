/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RefreshCw, 
  FileDown, 
  Search, 
  Shield, 
  Calendar, 
  Clock, 
  ChevronRight, 
  X,
  Activity,
  BarChart3,
  Info,
  Target,
  Check,
  ChevronDown,
  Sun,
  Umbrella
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { dataService } from './services/dataService';
import { pdfService } from './services/pdfService';
import { DeploymentRecord, DashboardData } from './types';
import { cn, formatSyncDate, parseBrazilianDate } from './lib/utils';

// @ts-ignore - Handle Vite env context safely
const SHEET_URL = (import.meta as any).env?.VITE_SHEET_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJ-I4MGG0vDh6uPTHrbaW2fB0cDCl5UafigK9PlYUHllYW4Vq-zkUSMPX0jUkHgkhvcmyFARAgSITe/pub?output=csv';

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<DeploymentRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [selectedUOps, setSelectedUOps] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [showStatusDrop, setShowStatusDrop] = useState(false);
  const [weekendFilter, setWeekendFilter] = useState<'ALL' | 'SIM' | 'NAO'>('ALL');

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status) 
        : [...prev, status]
    );
  };

  const clearStatus = () => setSelectedStatus([]);

  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  // Initial load from cache
  useEffect(() => {
    const cached = dataService.getCachedData();
    if (cached) {
      setData(cached);
    }
    // Auto-sync if online and no cache
    if (!cached && SHEET_URL) {
      handleSync();
    }
  }, []);

  const uniqueUOps = useMemo(() => {
    if (!data) return [];
    const units = data.records.map(r => r.uopApoiada);
    return Array.from(new Set(units)).sort();
  }, [data]);

  const [showUnitDrop, setShowUnitDrop] = useState(false);

  const normalizeString = (str: any) => 
    (str || '').toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const toggleUOp = (uop: string) => {
    setSelectedUOps(prev => 
      prev.includes(uop) 
        ? prev.filter(u => u !== uop) 
        : [...prev, uop]
    );
  };

  const clearUOps = () => setSelectedUOps([]);

  const handleSync = async () => {
    if (!SHEET_URL) {
      console.warn('URL da planilha não configurada no ambiente.');
      return;
    }
    setLoading(true);
    setIsSyncing(true);
    try {
      const freshData = await dataService.fetchDeploymentData(SHEET_URL);
      setData(freshData);
    } catch (error: any) {
      console.error('Erro na sincronização:', error);
      alert(`FALHA NA SINCRONIZAÇÃO:\n\n1. Verifique se o link na aba 'Configurações' do app está correto.\n2. No Google Sheets, use Arquivo > Compartilhar > Publicar na Web.\n3. Escolha 'Valores separados por vírgula (.csv)'.\n\nErro técnico: ${error.message}`);
    } finally {
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 1000);
    }
  };

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    
    const normalizedSearch = normalizeString(searchTerm);

    return data.records.filter(r => {
      const matchesSearch = !normalizedSearch || (
        normalizeString(r.uopApoiada).includes(normalizedSearch) ||
        normalizeString(r.referencia).includes(normalizedSearch) ||
        normalizeString(r.descricaoApoio).includes(normalizedSearch) ||
        normalizeString(r.prescricoesDiversas || '').includes(normalizedSearch)
      );
      
      const matchesUOp = selectedUOps.length === 0 || selectedUOps.includes(r.uopApoiada);

      // Filtro por Data
      let matchesDate = true;
      if (startDateFilter || endDateFilter) {
        const recordDateIso = parseBrazilianDate(r.dataInício);
        if (startDateFilter) {
          matchesDate = matchesDate && recordDateIso >= startDateFilter;
        }
        if (endDateFilter) {
          matchesDate = matchesDate && recordDateIso <= endDateFilter;
        }
      }

      // Filtro por Status Granular
      let matchesStatus = true;
      if (selectedStatus.length > 0) {
        const recordStatus = normalizeString(r.status || '');
        matchesStatus = selectedStatus.some(s => recordStatus.includes(normalizeString(s)));
      }

      // Filtro por Fim de Semana
      let matchesWeekend = true;
      if (weekendFilter !== 'ALL') {
        const isWeekend = normalizeString(r.fimDeSemana) === 'sim';
        matchesWeekend = weekendFilter === 'SIM' ? isWeekend : !isWeekend;
      }
      
      return matchesSearch && matchesUOp && matchesDate && matchesStatus && matchesWeekend;
    });
  }, [data, searchTerm, selectedUOps, startDateFilter, endDateFilter, selectedStatus, weekendFilter]);

  const filteredTotalGre = useMemo(() => {
    return filteredRecords.reduce((acc, r) => acc + r.quantidade, 0);
  }, [filteredRecords]);

  const filteredSummaryByUOp = useMemo(() => {
    const summaryMap = new Map<string, number>();
    filteredRecords.forEach(r => {
      summaryMap.set(r.uopApoiada, (summaryMap.get(r.uopApoiada) || 0) + r.quantidade);
    });
    return Array.from(summaryMap.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  const topUOps = useMemo(() => {
    return [...filteredSummaryByUOp].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [filteredSummaryByUOp]);

  const uniqueFilteredUnitsCount = useMemo(() => {
    return new Set(filteredRecords.map(r => r.uopApoiada)).size;
  }, [filteredRecords]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-sky-100 overflow-x-hidden w-full relative">
      {/* Header - Navy Background (#0f172a) */}
      <header className="sticky top-0 z-40 bg-[#0f172a] text-white border-b border-white/10 shadow-xl w-full">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-sky-500/20 p-2 rounded-lg border border-sky-400/30">
              <Shield className="w-7 h-7 text-sky-400" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight uppercase leading-tight">
                EMG-PM/3
              </h1>
              <p className="text-[11px] text-sky-400 font-bold uppercase tracking-[0.1em] leading-none mt-0.5">
                CONTROLE GRE/RECOM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-tighter">
              <Activity className="w-3 h-3" />
              {filteredRecords.length} REGISTROS ATIVOS
            </div>
          </div>
        </div>
      </header>


      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8 sm:space-y-12 overflow-x-hidden">
        
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative group flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input 
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all uppercase"
                  />
                </div>
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input 
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-none transition-all uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleSync}
                className="bg-white text-emerald-600 border border-emerald-200 px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest shadow-sm shadow-emerald-100/50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 text-emerald-500", loading && "animate-spin")} />
                Sincronizar
              </button>
              <button 
                onClick={() => data && pdfService.generateDeploymentReport(filteredRecords, data.lastSync)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-sky-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-sky-500 transition-all active:scale-95 shadow-lg shadow-sky-600/20"
              >
                <FileDown className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-sky-500" />
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Unidades:</p>
                  </div>
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => { setShowUnitDrop(!showUnitDrop); setShowStatusDrop(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 bg-slate-50 border rounded-xl transition-all",
                      selectedUOps.length > 0 ? "border-sky-500 ring-2 ring-sky-500/10" : "border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="bg-[#0f172a] text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                        {selectedUOps.length === 0 ? "TODAS" : selectedUOps.length}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase truncate">
                        {selectedUOps.length === 0 
                          ? "Todas unidades" 
                          : selectedUOps.length === 1 
                            ? selectedUOps[0] 
                            : `${selectedUOps.length} Selecionadas`}
                      </span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showUnitDrop && "rotate-180")} />
                  </button>

                  {showUnitDrop && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowUnitDrop(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-40 overflow-hidden">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Escolher Unidades</span>
                          <button onClick={clearUOps} className="bg-rose-50 text-rose-600 text-[8px] font-black uppercase px-2 py-1 rounded-md">Limpar</button>
                        </div>
                        <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
                          <button
                            onClick={() => { clearUOps(); setShowUnitDrop(false); }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left mb-1",
                              selectedUOps.length === 0 ? "bg-sky-50 text-sky-700" : "hover:bg-slate-50 text-slate-600"
                            )}
                          >
                            <span className="text-[10px] font-black">TODAS</span>
                            {selectedUOps.length === 0 && <Check className="w-3.5 h-3.5" />}
                          </button>
                          {uniqueUOps.map(uop => (
                            <button
                              key={uop}
                              onClick={() => toggleUOp(uop)}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-left mb-1",
                                selectedUOps.includes(uop) ? "bg-sky-600 text-white" : "hover:bg-slate-50 text-slate-600"
                              )}
                            >
                              <span className="text-[10px] font-black uppercase truncate pr-4">{uop}</span>
                              {selectedUOps.includes(uop) && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
        </div>

        {/* Top Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Main Stats Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full -mr-16 -mt-16 opacity-50" />
            <p className="text-[9px] sm:text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-2">EQUIPE GRE FILTRADA</p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter">{filteredTotalGre}</span>
              <span className="text-[9px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">GRE</span>
            </div>
            <div className="mt-4 sm:mt-6 flex items-center gap-2">
              <div className="h-1.5 sm:h-2 flex-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="h-full bg-emerald-500" 
                />
              </div>
              <span className="text-[8px] sm:text-[9px] font-bold text-emerald-600 uppercase whitespace-nowrap">Tempo Real</span>
            </div>
          </div>

          {/* Monitoring Card - Navy style */}
          <div className="bg-[#0f172a] rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute -bottom-8 -right-8 w-48 h-48 bg-sky-500/5 rounded-full border border-sky-400/10 scale-150" />
            <div className="relative z-10 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-sky-400" />
                <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase">Status do Sistema</h2>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-[9px] sm:text-[10px] text-emerald-400 font-bold tracking-widest uppercase">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full animate-ping" />
                  Sincronização Ativa
                </div>
                <p className="text-slate-500 text-[8px] sm:text-[10px] font-mono uppercase">
                  Atualizado em: {data ? formatSyncDate(data.lastSync) : 'Pendente'}
                </p>
              </div>
              <p className="text-slate-400 text-[8px] sm:text-[10px] font-medium uppercase tracking-[0.2em]">
                Controle Técnico GRE/RECOM
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Section - Simplified Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por UOp */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col h-[400px] items-center">
            <div className="w-full mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5 text-sky-500" />
                DISTR. POR UNIDADE (EQUIPES)
              </h3>
            </div>
            <div className="flex-1 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={filteredSummaryByUOp.sort((a,b) => b.value - a.value).slice(0, 8)} 
                  layout="vertical"
                  margin={{ left: 20, right: 40, top: 0, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={100} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                    contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={18}>
                    {filteredSummaryByUOp.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distribuição Percentual */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col h-[400px] items-center">
            <div className="w-full mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                PARTICIPAÇÃO NO EMPREGO
              </h3>
            </div>
            <div className="flex-1 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredSummaryByUOp.sort((a,b) => b.value - a.value).slice(0, 8)}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {filteredSummaryByUOp.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle"
                    iconSize={8}
                    formatter={(value, entry: any) => {
                      const total = filteredSummaryByUOp.reduce((acc, curr) => acc + curr.value, 0);
                      const percent = total > 0 ? ((entry.payload.value / total) * 100).toFixed(0) : 0;
                      return <span className="text-slate-700 ml-1 font-bold text-[10px] uppercase tracking-tighter">{value} <span className="text-sky-600 font-black">({percent}%)</span></span>;
                    }}
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      width: '100%',
                      textAlign: 'center'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Table Section - Full Width for better professional look */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden flex flex-col w-full">
            <div className="p-5 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#0f172a] rounded-xl shadow-lg shadow-slate-900/10">
                  <Activity className="w-5 h-5 text-sky-400" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none">Relação de Emprego</h3>
                  <p className="text-[9px] font-bold text-sky-600 uppercase tracking-widest italic mt-1">Efetivo Filtrado</p>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 w-full">
                {/* Status Filters - Now wrapping instead of scrolling */}
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar por Situação:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: 'EM ANDAMENTO', label: 'Em Andamento', color: 'emerald' },
                      { id: 'NÃO INICIADO', label: 'Não Iniciado', color: 'amber' },
                      { id: 'FINALIZADO', label: 'Finalizado', color: 'rose' }
                    ].map((s) => {
                      const isActive = selectedStatus.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleStatus(s.id)}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all flex items-center gap-2 border",
                            isActive 
                              ? s.color === 'emerald' ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200/50" :
                                s.color === 'amber' ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200/50" :
                                "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200/50"
                              : "bg-white text-slate-500 border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                          )}
                        >
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0", 
                            isActive ? "bg-white" : 
                            s.color === 'emerald' ? "bg-emerald-500" : 
                            s.color === 'amber' ? "bg-amber-500" : "bg-rose-500"
                          )} />
                          {s.label}
                        </button>
                      );
                    })}
                    {selectedStatus.length > 0 && (
                      <button 
                        onClick={clearStatus}
                        className="px-2 py-1 text-[9px] font-black text-slate-400 hover:text-rose-600 uppercase transition-colors"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>

                {/* Weekend Filter */}
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Fim de Semana:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setWeekendFilter('ALL')}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border",
                        weekendFilter === 'ALL' ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white text-slate-500 border-slate-200"
                      )}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setWeekendFilter('SIM')}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border flex items-center gap-2",
                        weekendFilter === 'SIM' ? "bg-sky-600 text-white border-sky-600 shadow-lg shadow-sky-200" : "bg-white text-slate-500 border-slate-200"
                      )}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      Sim
                    </button>
                    <button
                      onClick={() => setWeekendFilter('NAO')}
                      className={cn(
                        "px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border flex items-center gap-2",
                        weekendFilter === 'NAO' ? "bg-slate-100 text-slate-700 border-slate-300" : "bg-white text-slate-500 border-slate-200"
                      )}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* Stats Summary Cards */}
                <div className="flex flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="flex-1 lg:flex-none bg-white border border-slate-200 px-5 py-3 rounded-2xl flex items-center gap-4 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 pr-4 leading-none hidden sm:block">Lançamentos</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{filteredRecords.length}</span>
                      <span className="text-[9px] font-black text-sky-500 uppercase italic tracking-tight">Registros</span>
                    </div>
                  </div>

                  <div className="flex-1 lg:flex-none bg-[#0f172a] px-5 py-3 rounded-2xl flex items-center gap-4 shadow-xl shadow-slate-900/10">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-r border-white/10 pr-4 leading-none hidden sm:block">Efetivo</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white tracking-tighter leading-none">{filteredTotalGre}</span>
                      <span className="text-[9px] font-black text-sky-400 uppercase italic tracking-tight">Equipes</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-h-[500px] overflow-x-auto overflow-y-auto pb-4 custom-scrollbar relative">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-[#0f172a] text-white sticky top-0 z-20 shadow-md">
                  <tr>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Data / Turno</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Unidade Apoiada</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest min-w-[350px]">Descrição do Apoio</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">Equipe</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right">Referência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRecords.map((record, index) => (
                    <tr 
                      key={index} 
                      onClick={() => setSelectedRecord(record)}
                      className="hover:bg-sky-50/40 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-sky-50 flex items-center justify-center">
                            <Calendar className="w-3.5 h-3.5 text-sky-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[11px] font-mono font-bold text-slate-700 leading-tight">{record.dataInício}</span>
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-tight">{record.horarioInicio} - {record.horarioFim}</span>
                          </div>
                        </div>
                      </td>
      <td className="px-6 py-3">
                        <span className="text-[11px] font-black text-[#0f172a] uppercase tracking-tighter block max-w-[200px] truncate" title={record.uopApoiada}>
                          {record.uopApoiada}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-6 py-3">
                        <div 
                          className="text-[11px] font-medium text-slate-600 whitespace-pre-wrap leading-relaxed min-w-[350px] max-w-[500px] cursor-help"
                          title={record.descricaoApoio}
                        >
                          {record.descricaoApoio || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="inline-flex items-center justify-center bg-slate-900 text-white px-3 py-1.5 rounded-xl font-mono font-black text-[11px] min-w-[40px] shadow-sm">
                          {record.quantidade}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span 
                          className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest group-hover:text-sky-600 transition-colors block cursor-help"
                          title={record.referencia}
                        >
                          {record.referencia || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-12 bg-[#0a0f1d] text-white border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="text-center md:text-left space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Chefe da PM/3</p>
            <p className="text-sm font-bold tracking-tight uppercase">Ten. Coronel Moreira</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Oficial Encarregado</p>
            <p className="text-sm font-bold tracking-tight uppercase">Major Gonçalves</p>
          </div>
          <div className="text-center md:text-right">
            <div className="inline-flex items-center gap-4 px-6 py-3 bg-white/5 rounded-full border border-white/10">
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">DEV.FIEL.26</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modern Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-y-auto max-h-[92vh] border border-white/20 custom-scrollbar"
            >
              <div className="bg-[#0f172a] p-6 sm:p-8 flex items-start justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-sky-500 rounded-2xl shadow-xl shadow-sky-500/20">
                    <Info className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">Detalhamento</h2>
                    <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Dados Técnicos Operacionais</p>
                  </div>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <DetailItem label="Unidade Apoiada / UOp" value={selectedRecord.uopApoiada} isBig />
                </div>
                <div className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm h-full flex flex-col justify-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Status do Emprego</p>
                  <StatusBadge status={selectedRecord.status} isLarge />
                </div>
                
                {/* Weekend Highlight Card */}
                {normalizeString(selectedRecord.fimDeSemana) === 'sim' ? (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl shadow-sm flex items-center gap-4 group">
                    <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 group-hover:rotate-12 transition-transform">
                      <Sun className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Tipo de Evento</p>
                      <p className="text-sm font-black text-amber-800 uppercase tracking-tight italic">Fim de Semana</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 bg-slate-50 border border-slate-200 rounded-3xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-300 rounded-2xl flex items-center justify-center">
                      <Umbrella className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Tipo de Evento</p>
                      <p className="text-sm font-bold text-slate-600 uppercase tracking-tight">Dia Útil</p>
                    </div>
                  </div>
                )}

                <DetailItem label="Referência / Documento" value={selectedRecord.referencia} isMono />
                <DetailItem label="Período de Emprego" value={`${selectedRecord.dataInício} até ${selectedRecord.dataTérmino}`} isMono />
                <DetailItem label="Horário de Turno" value={`${selectedRecord.horarioInicio} às ${selectedRecord.horarioFim}`} isMono />
                <DetailItem label="Equipe GRE Alocada" value={selectedRecord.quantidade.toString()} isStat isMono />
                
                <div className="col-span-1 md:col-span-2 mt-4 space-y-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-3 h-3 text-sky-500" />
                      Descrição de Apoio
                    </p>
                    <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 text-slate-600 text-[13px] leading-relaxed border-l-4 border-l-sky-500 whitespace-pre-wrap">
                      {selectedRecord.descricaoApoio || 'Nenhuma descrição detalhada disponível.'}
                    </div>
                  </div>

                  {selectedRecord.prescricoesDiversas && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Info className="w-3 h-3 text-emerald-500" />
                         Prescrições Diversas
                      </p>
                      <div className="p-4 sm:p-5 bg-emerald-50/30 rounded-2xl sm:rounded-3xl border border-emerald-100 text-slate-600 text-[13px] leading-relaxed border-l-4 border-l-emerald-400 whitespace-pre-wrap">
                        {selectedRecord.prescricoesDiversas}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="px-10 py-3 bg-[#0f172a] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status, isLarge = false }: { status?: string; isLarge?: boolean }) {
  const rawStatus = (status || 'NÃO INFORMADO').trim().toUpperCase();
  const s = rawStatus.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  let styles = 'bg-slate-100 text-slate-600 border-slate-200';
  
  if (s.includes('ANDAMENTO')) {
    styles = 'bg-emerald-500 text-white border-emerald-400 font-black shadow-lg shadow-emerald-500/20'; 
  } else if (s.includes('NAO INICIADO') || s.includes('PENDENTE')) {
    styles = 'bg-[#FFC000] text-black border-[#EEB000] font-black shadow-sm';
  } else if (s.includes('FINALIZADO')) {
    styles = 'bg-[#FF0000] text-white border-[#DD0000] font-black shadow-sm';
  }

  return (
    <div className={cn(
      "inline-flex items-center justify-center px-4 py-1.5 rounded-lg border text-[9px] uppercase tracking-tighter transition-all",
      isLarge && "px-8 py-2.5 text-xs tracking-widest rounded-xl",
      styles
    )}>
      {rawStatus}
      {s.includes('ANDAMENTO') && (
        <span className="ml-2 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-white animate-status-pulse shadow-[0_0_8px_rgba(255,255,255,1)]" />
        </span>
      )}
    </div>
  );
}

function DetailItem({ label, value, isBig = false, isStat = false, isMono = false }: { label: string; value: string; isBig?: boolean; isStat?: boolean; isMono?: boolean }) {
  return (
    <div className={cn(
      "p-5 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-center",
      isBig && "bg-sky-50 border-sky-100"
    )}>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={cn(
        "text-sm font-bold text-slate-900 tracking-tight",
        isBig && "text-xl text-sky-700",
        isStat && "text-2xl text-emerald-600",
        isMono && "font-mono"
      )}>{value || '—'}</p>
    </div>
  );
}
