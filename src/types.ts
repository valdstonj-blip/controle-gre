/**
 * Interface representing a deployment record from the GRE/RECOM employment spreadsheet.
 */
export interface DeploymentRecord {
  quantidade: number;
  dataInício: string;
  dataTérmino: string;
  horarioInicio: string;
  horarioFim: string;
  referencia: string;
  uopApoiada: string;
  descricaoApoio: string;
  prescricoesDiversas: string;
  status: string;
  fimDeSemana: string;
  rawData: any;
}

export interface DashboardData {
  records: DeploymentRecord[];
  totalGre: number;
  lastSync: string;
  summaryByUOp: { name: string; value: number }[];
}
