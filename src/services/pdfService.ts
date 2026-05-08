import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DeploymentRecord, DashboardData } from '../types';
import { formatSyncDate } from '../lib/utils';

/**
 * Service to generate professional PDF reports.
 */
export const pdfService = {
  generateDeploymentReport(records: DeploymentRecord[], lastSync: string) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const totalGre = records.reduce((acc, r) => acc + r.quantidade, 0);
    const now = new Date();
    
    // Header area - Navy Blue (#0f172a)
    doc.setFillColor(15, 23, 42); // Navy Blue
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('CONTROLE GRE/RECOM', 14, 25);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTADO MAIOR GERAL - PM/3', 14, 32);
    
    doc.setFontSize(9);
    doc.setTextColor(186, 230, 253); // Sky-200
    doc.text(`Relatório Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 14, 39);
    
    // Summary Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO DO EMPREGO - VISTA FILTRADA', 14, 58);
    
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 60, pageWidth - 14, 60);

    const weekendGre = records.filter(r => (r.fimDeSemana || '').toUpperCase() === 'SIM').reduce((acc, r) => acc + r.quantidade, 0);
    const workdayGre = totalGre - weekendGre;

    const summaryTable = [
      ['TOTAL DE EQUIPE (GRE):', totalGre.toString()],
      ['EQUIPES FIM DE SEMANA:', weekendGre.toString()],
      ['EQUIPES DIAS ÚTEIS:', workdayGre.toString()],
    ];

    autoTable(doc, {
      startY: 65,
      body: summaryTable,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2, fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 60 } }
    });
    
    // Detailed Table
    const tableData = records.map((r, i) => [
      i + 1,
      (r.uopApoiada || '').toUpperCase(),
      (r.status || 'NÃO INFORMADO').toUpperCase(),
      r.quantidade,
      r.dataInício,
      `${r.horarioInicio} - ${r.horarioFim}`
    ]);
    
    autoTable(doc, {
      startY: 95,
      head: [['ID', 'UNIDADE APOIADA', 'SITUAÇÃO', 'GRE', 'DATA', 'TURNO']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85] },
      columnStyles: {
        1: { fontStyle: 'bold', textColor: [15, 23, 42] },
        2: { cellWidth: 35 },
        5: { cellWidth: 35 }
      }
    });

    // Page 2: Descriptions
    if (records.length > 0) {
      doc.addPage();
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.text('DETALHAMENTO: DESCRIÇÃO DE APOIO E PRESCRIÇÕES', 14, 13);

      const descriptionsData = records.map(r => [
        (r.uopApoiada || '').toUpperCase(),
        r.descricaoApoio || '—',
        r.prescricoesDiversas || '—'
      ]);
      
      autoTable(doc, {
        startY: 25,
        head: [['UNIDADE', 'DESCRIÇÃO DE APOIO', 'PRESCRIÇÕES']],
        body: descriptionsData,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42], fontSize: 9 },
        styles: { fontSize: 7.5, overflow: 'linebreak', cellPadding: 4, valign: 'top' },
        columnStyles: {
          0: { cellWidth: 30, fontStyle: 'bold' },
          1: { cellWidth: 75 },
          2: { cellWidth: 77, fontStyle: 'italic', textColor: [5, 150, 105] } // emerald-600
        }
      });
    }
    
    // Footer on all pages
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        
        const footerY = doc.internal.pageSize.getHeight() - 15;
        doc.setFont('helvetica', 'bold');
        doc.text('CHEFE DA PM/3: TEN. CORONEL MOREIRA', 14, footerY);
        doc.text('OFICIAL ENCARREGADO: MAJOR GONÇALVES', 14, footerY + 5);
        doc.text('DEV.FIEL.26', pageWidth - 14, footerY + 2.5, { align: 'right' });
    }
    
    doc.save(`RELATORIO_PM3_EMG_${new Date().getTime()}.pdf`);
  }
};
