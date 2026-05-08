# Manual de Manutenção (Dados)

O coração deste aplicativo é a integração com o **Google Sheets**. Para que o app funcione corretamente, a planilha deve seguir certas regras.

## 📊 Estrutura da Planilha
O código está programado para procurar nomes específicos nos cabeçalhos (primeira linha). Ele é flexível, mas idealmente use estes nomes:

- **Unidade/UOp**: `uop_e_apoiada`, `uop_apoio` ou `uop`.
- **Equipe (Quantidade)**: `quantidade_gre`, `qtde` ou `quantidade`.
- **Status/Situação**: `status` ou `situacao`.
- **Data**: `data_inicio` ou `data`.
- **Horário**: `horario_inicio` e `horario_fim`.
- **Referência**: `referencia`, `msg` ou `ordem`.
- **Descrição de Apoio**: `descricao_do_apoio` ou `descricao`.
- **Prescrições Diversas**: `prescricoes_diversas`, `prescricoes`, `obs` ou `observacao`.

## 🔄 Como atualizar o link da Planilha
Se você mudar de planilha, siga estes passos:
1. Na sua nova planilha: **Arquivo > Compartilhar > Publicar na Web**.
2. Escolha **Valores separados por vírgula (.csv)**.
3. Copie o link gerado.
4. No projeto, abra `src/services/dataService.ts`.
5. Substitua a URL na variável `SHEET_URL`.

## 🛠️ Ajustando o Mapeamento de Colunas
Se você adicionar uma coluna nova e o app não reconhecer, edite o arquivo `src/services/dataService.ts` na função `findIdx`. Adicione o nome exato da sua coluna na lista de termos de busca.

Exemplo para Prescrições:
```typescript
presc_div: findIdx(['prescricoes_diversas', 'nome_da_minha_coluna_nova']),
```
