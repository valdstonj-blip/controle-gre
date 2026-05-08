# Documentação do Projeto: Dashboard PM3 EMG

Este projeto é um Dashboard interativo desenvolvido para a **PM3 EMG**, com foco na visualização em tempo real de dados provenientes de uma planilha do Google Sheets.

## 🚀 Tecnologias Utilizadas
- **React 18 + Vite**: Estrutura frontend rápida e moderna.
- **Tailwind CSS**: Estilização baseada em utilitários para um design limpo e responsivo.
- **Lucide React**: Biblioteca de ícones.
- **Motion (Framer Motion)**: Animações e transições fluidas.
- **jsPDF + autoTable**: Geração de relatórios PDF customizados.
- **Google Sheets API (via CSV)**: Integração direta para leitura de dados sem necessidade de autenticação complexa (usando link público).

## 🛠️ O que foi implementado:
1. **Sincronização em Tempo Real**: O app lê a planilha e atualiza os dados instantaneamente.
2. **Sistema de Filtros Inteligentes**: Filtros por Unidade (UOp), Status e busca textual.
3. **Métricas (Cards)**: Total de Registros e Total de Equipes (GRE).
4. **Tabela Interativa**: Lista de empenhos com badges de status coloridos e animação "Live" para itens em andamento.
5. **Painel de Detalhes (Drawer)**: Ao clicar em um registro, abre-se uma lateral com todas as informações: Unidade, Status, Horários, Referência, Descrição de Apoio e Prescrições Diversas.
6. **Relatórios PDF**: Exportação baseada nos filtros aplicados, contendo resumo quantitativo e detalhamento das descrições/prescrições.
7. **Design Responsivo**: Adaptado para Desktop e Dispositivos Móveis.

## 📁 Estrutura de Arquivos Principal
- `src/App.tsx`: Componente principal (UI e Lógica de filtros).
- `src/services/dataService.ts`: Lógica de busca e mapeamento dos dados da Google Sheets.
- `src/services/pdfService.ts`: Lógica de formatação e geração do PDF.
- `src/index.css`: Definições de tema e animações customizadas.
