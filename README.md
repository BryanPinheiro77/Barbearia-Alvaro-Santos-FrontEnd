# Barbearia Álvaro Santos 💈✂️  
Front-end

![Badge](https://img.shields.io/badge/React-Frontend-blue)
![Badge](https://img.shields.io/badge/Vite-Build-purple)
![Badge](https://img.shields.io/badge/TailwindCSS-Styles-06B6D4)
![Badge](https://img.shields.io/badge/Recharts-Charts-4F46E5)
![Badge](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)

---

## 📌 Sobre o Projeto
Aplicação front-end responsável por consumir a API do sistema de agendamentos e pagamentos.

---

## 🚀 Tecnologias
- React
- Vite
- Tailwind CSS
- Recharts

---

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8080
```

### Produção
Aponte para a URL do back-end (Railway), por exemplo:

```env
VITE_API_URL=https://SEU-BACKEND.up.railway.app
```

> Importante: o back-end deve permitir o domínio do front em `CORS_ALLOWED_ORIGINS`.

---

## ▶️ Como executar

### Pré-requisitos
- Node.js 18+ (recomendado)

### Instalar dependências
```bash
npm install
```

### Rodar em desenvolvimento
```bash
npm run dev
```

### Build de produção
```bash
npm run build
```

### Preview local do build
```bash
npm run preview
```

---

## ☁️ Deploy
- Recomendado: Vercel
- Configure a variável `VITE_API_URL` no painel do Vercel (Environment Variables).

---

## 🧭 Roadmap
- Melhorias de UX (loading states, skeletons)
- Performance: cache de requisições, evitar chamadas em cascata, paginação no admin
