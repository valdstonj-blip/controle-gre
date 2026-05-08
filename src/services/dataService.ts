import Papa from 'papaparse';
import { DeploymentRecord, DashboardData } from '../types';

const STORAGE_KEY = 'emg_pm3_dashboard_cache';

/**
 * Sanitizes keys by removing spaces, special characters and converting to lowercase.
 */
const sanitizeKey = (key: string) => {
  if (!key) return '';
  return key
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]/g, '_')     // Replace special chars with underscore
    .replace(/_+/g, '_')           // Remove duplicate underscores
    .replace(/^_+|_+$/g, '');       // Trim underscores
};

/**
 * Service to handle Google Sheets CSV synchronization and local storage cache.
 */
export const dataService = {
  /**
   * Converts a standard Google Sheets sharing link to a direct CSV export link if needed.
   */
  prepareUrl(url: string): string {
    if (!url) return '';
    let processed = url.trim();
    
    // If it's already a direct output=csv link, don't touch it
    if (processed.includes('output=csv')) {
      return processed;
    }

    // Improve regex to handle all Google Sheets link formats
    const spreadsheetIdMatch = processed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (spreadsheetIdMatch) {
      const id = spreadsheetIdMatch[1];
      const gidMatch = processed.match(/gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '317400917'; // User's specific GID
      
      return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    }

    return processed;
  },

  async fetchDeploymentData(url: string): Promise<DashboardData> {
    const finalUrl = this.prepareUrl(url);
    try {
      console.log('Iniciando fetch de:', finalUrl);
      const response = await fetch(finalUrl);
      
      if (!response.ok) {
        throw new Error(`Erro na conexão com o Google Sheets (${response.status}). Verifique se a planilha foi Publicada na Web como CSV.`);
      }
      
      const csvText = await response.text();
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: false,
          skipEmptyLines: 'greedy',
          complete: (results) => {
            const allRawRows = results.data as string[][];
            const allRows = allRawRows.filter(row => row.some(cell => cell && cell.trim() !== ''));
            
            if (allRows.length === 0) {
              reject(new Error('Planilha vazia ou inacessível.'));
              return;
            }

            // High-Resilience Header Search
            let headerIdx = -1;
            for (let i = 0; i < Math.min(allRows.length, 20); i++) {
              const rowStr = allRows[i].join('|').toLowerCase();
              if (rowStr.includes('quantidade') || rowStr.includes('gre') || rowStr.includes('uop')) {
                headerIdx = i;
                break;
              }
            }

            // Fallback
            if (headerIdx === -1) headerIdx = 0;

            const rawHeaders = allRows[headerIdx];
            const cleanHeaders = rawHeaders.map(sanitizeKey);
            const dataRows = allRows.slice(headerIdx + 1);

            // Dynamic Mapping using sanitized keywords
            const findIdx = (keywords: string[]) => {
              const idx = cleanHeaders.findIndex(h => keywords.some(k => h.includes(k)));
              return idx;
            };

            const colMap = {
              qty: findIdx(['quantidade_de_gre', 'quantidade', 'gre']),
              start: findIdx(['data_de_inicio', 'inicio']),
              end: findIdx(['data_de_termino', 'termino']),
              h1: findIdx(['horario_inicial', 'horario_inicio']),
              h2: findIdx(['horario_final', 'horario_fim']),
              ref: findIdx(['referencia', 'msg', 'ordem']),
              unit: findIdx(['uop_e_apoiada', 'uop_apoio', 'uop']),
              desc: findIdx(['descricao_do_apoio', 'descricao', 'apoio']),
              presc_div: findIdx(['prescricoes_diversas', 'prescricoes', 'diversas', 'obs', 'observacao', 'prescricao']),
              status: findIdx(['status', 'situacao']),
              weekend: findIdx(['fim_de_semana', 'fim_semana', 'weekend', 'fds'])
            };

            console.log('MAPPED COLUMN INDEXES:', colMap);
            console.log('CLEAN HEADERS:', cleanHeaders);

            const records: DeploymentRecord[] = [];
            let totalGreCount = 0;
            const uops: Record<string, number> = {};

            for (const row of dataRows) {
              const getVal = (idx: number, fallbackIdx: number) => {
                const i = idx !== -1 ? idx : fallbackIdx;
                return (row[i] || '').trim();
              };

              const qtyStr = getVal(colMap.qty, 0);
              const qty = parseInt(qtyStr.replace(/\D/g, '')) || 0;
              
              // Skip summary/meta rows
              const firstCellSanitized = sanitizeKey(row[0]);
              if (!firstCellSanitized || firstCellSanitized === 'total' || firstCellSanitized.includes('quantidade_de')) continue;

              const record: DeploymentRecord = {
                quantidade: qty,
                dataInício: getVal(colMap.start, 2),
                dataTérmino: getVal(colMap.end, 3),
                horarioInicio: getVal(colMap.h1, 4),
                horarioFim: colMap.h2 !== -1 ? (row[colMap.h2] || '').trim() : (row[5] || ''), 
                referencia: getVal(colMap.ref, 7),
                uopApoiada: getVal(colMap.unit, 8) || 'Geral',
                descricaoApoio: getVal(colMap.desc, 9),
                prescricoesDiversas: getVal(colMap.presc_div, 10),
                status: getVal(colMap.status, 6) || 'NÃO INFORMADO',
                fimDeSemana: getVal(colMap.weekend, -1).toUpperCase() || 'NÃO',
                rawData: row
              };

              if (record.quantidade > 0 || record.uopApoiada !== 'Geral') {
                records.push(record);
                totalGreCount += record.quantidade;
                uops[record.uopApoiada] = (uops[record.uopApoiada] || 0) + record.quantidade;
              }
            }

            const dashboardData: DashboardData = {
              records,
              totalGre: totalGreCount,
              lastSync: new Date().toISOString(),
              summaryByUOp: Object.entries(uops).map(([name, value]) => ({ name, value }))
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboardData));
            resolve(dashboardData);
          },
          error: (err: any) => reject(new Error(`Falha no processamento: ${err.message}`))
        });
      });
    } catch (error: any) {
      console.error('Data Sync Error:', error);
      throw error;
    }
  },

  getCachedData(): DashboardData | null {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }
};
