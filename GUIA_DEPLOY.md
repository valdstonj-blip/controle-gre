# Guia de Deploy (GitHub Pages, Vercel, Netlify)

Como este é um aplicativo **SPA (Single Page Application)** sem backend (os dados vem direto do Google Sheets via CSV), o deploy é extremamente simples.

## 📦 1. Como Exportar os Arquivos
Para levar o código para outra plataforma:
1. Vá no menu de **Configurações (ícone de engrenagem)** no topo do AI Studio.
2. Clique em **Export to GitHub** (se quiser usar GitHub Pages) ou **Download ZIP**.
3. Se baixar o ZIP, extraia os arquivos no seu computador.

## 🚀 2. Deploy no GitHub Pages (Grátis)
1. Crie um repositório no GitHub.
2. Suba todos os arquivos do projeto.
3. Vá em **Settings > Pages**.
4. Em "Build and deployment", selecione a branch `main` e a pasta `/` (root).
5. **Atenção**: Como usamos o Vite, o ideal é rodar `npm run build` e subir apenas a pasta `dist`. Caso prefira automatizado:
   - Use o **GitHub Actions** para Vite (o GitHub sugere modelos prontos ao detectar o projeto).

## ⚡ 3. Deploy na Vercel ou Netlify (Recomendado)
Estas são as plataformas mais fáceis para projetos React/Vite:
1. Conecte sua conta do GitHub na Vercel (vercel.com) ou Netlify (netlify.com).
2. Selecione o repositório do seu projeto.
3. A plataforma detectará automaticamente que é um projeto **Vite**.
4. Configurações padrão:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Clique em **Deploy**.

## 🔄 4. Como atualizar o site depois de pronto
Sempre que você quiser fazer uma alteração no código aqui no AI Studio:
1. Faça a alteração aqui.
2. Baixe o ZIP novamente ou dê Push no GitHub.
3. Se você baixou o ZIP e está usando uma hospedagem manual (como via FTP), basta substituir os arquivos antigos pelos novos.
4. **Nota**: As alterações na **Planilha Google** não exigem novo deploy. O site reflete as mudanças da planilha automaticamente assim que o usuário atualiza a página ou clica em "Sincronizar".
