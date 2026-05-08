# Guia de Prompting: Modelo Dashboard Operacional PM3

Use as instruções abaixo como base (ou copie e cole) quando quiser iniciar um novo projeto com esta mesma estrutura, lógica de dados e estética.

---

## 📝 1. O Prompt "Mestre" (Para iniciar o projeto)

**Prompt sugerido:**
> "Crie um Dashboard Operacional em React (Vite) + Tailwind CSS com foco em visualização de dados de segurança/logística. O app deve consumir dados de uma planilha Google Sheets publicada como CSV. 
> 
> **Requisitos de UI:**
> - Estilo 'Midnight Navy' (Slate-950/900) com sotaques em Sky-500 e Emerald-500.
> - Layout responsivo com Cards de métricas no topo (Total de Equipes e Total de Registros).
> - Tabela principal com badges de status coloridos. Itens 'EM ANDAMENTO' devem ter um efeito de pulso e um indicador visual de atividade.
> - Painel lateral (Drawer) para detalhes completos do registro clicado.
> 
> **Requisitos de Funcionalidade:**
> - Sincronização automática via fetch de CSV.
> - Filtros dinâmicos por Unidade, Status e Busca Textual.
> - Exportação de PDF usando jsPDF e autoTable, refletindo EXATAMENTE os filtros aplicados na tela. 
> - O PDF deve conter um resumo quantitativo e um detalhamento qualitativo (descrições longas) em páginas separadas se necessário."

---

## 📊 2. Prompt para a Lógica de Dados (CSV/Sheets)

Se precisar explicar como os dados funcionam:
> "Implemente um `dataService` que busca um CSV público. Crie uma função de mapeamento resiliente que procure por cabeçalhos mesmo que os nomes variem ligeiramente (Ex: procurar por 'unidade', 'uop' ou 'apoio' para a mesma coluna). Certifique-se de tratar erros de fetch e fornecer um estado de 'loading' visual no app."

---

## 🎨 3. Prompt para Estética e Animações

Para garantir o mesmo visual polido:
> "Utilize a biblioteca `motion/react` para animações de entrada de listas e abertura de modais. No `index.css`, defina uma animação `@keyframes` de pulso para status ativos. Use fontes sem-serifa modernas (Inter) e monoespaçadas para referências/códigos. Todo o design deve ser 'clean', com bordas arredondadas generosas (rounded-2xl) e sombras suaves."

---

## 📄 4. Prompt para o Gerador de PDF

Para manter o relatório profissional:
> "O serviço de PDF deve gerar um documento com cabeçalho institucional (azul marinho), rodapé com data/hora da geração e duas seções principais: 
> 1. Uma tabela técnica com os dados básicos (Unidade, Situação, Quantidade, Turno).
> 2. Uma seção de 'Detalhamento' com colunas largas para textos longos (Descrição de Apoio e Prescrições), usando fontes menores e quebra de linha automática para não cortar o texto."

---

## 🔧 5. Dicas para Manutenção via Prompt

Quando quiser pedir alterações específicas:
- **Para novos campos:** "Adicione o campo 'X' ao mapeamento do CSV e exiba-o no Drawer de detalhes com o ícone Lucide 'Y'."
- **Para filtros:** "Adicione um novo botão de filtro rápido que mostre apenas os registros de hoje."
- **Para estilo:** "Mude a cor de destaque de Sky-500 para Amber-500 em todo o projeto."
