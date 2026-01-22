# Barbearia Álvaro Santos 💈✂️  
Aplicação Web (Front-end)

![Badge](https://img.shields.io/badge/React-Frontend-blue)
![Badge](https://img.shields.io/badge/Vite-Build-purple)
![Badge](https://img.shields.io/badge/TailwindCSS-Styles-06B6D4)
![Badge](https://img.shields.io/badge/Recharts-Charts-4F46E5)
![Badge](https://img.shields.io/badge/Deploy-Vercel-2ea44f)
![Badge](https://img.shields.io/badge/Status-Em%20Produ%C3%A7%C3%A3o-success)

---

## 🌐 Aplicação em produção

A interface web está publicada em:

- https://barbearia-alvaro-santos-front-end.vercel.app

> Este repositório contém o **front-end**. O back-end (API REST) roda separadamente e deve estar configurado em `VITE_API_URL`.

---

## 📌 Sobre o Projeto

Aplicação front-end responsável por consumir a **API** do sistema de **agendamentos, serviços e pagamentos** da Barbearia Álvaro Santos.

Além da aplicação (área logada), este projeto inclui uma **landing page institucional**.

Principais objetivos:

- Permitir que clientes **visualizem serviços**, consultem horários disponíveis e **criem agendamentos**
- Disponibilizar um painel para o **ADMIN** gerenciar serviços, agenda e acompanhar pagamentos
- Operar de forma segura, com autenticação via **JWT** e controle de acesso por perfil

---

## ✨ Funcionalidades

- **Landing page (rota `/`)**: apresentação do negócio e acesso para login/agendamento.

### Cliente
- Login/registro
- Listagem de serviços ativos
- Consulta de horários disponíveis
- Criação, listagem e cancelamento de agendamentos
- Pagamento via Mercado Pago (quando habilitado pela API)

### Admin
- CRUD de serviços (criar/editar/ativar/desativar/excluir)
- Gestão de horários/disponibilidade
- Gestão e acompanhamento de agendamentos
- Ações de pagamento (conforme endpoints do back)

---

## 🧱 Stack / Tecnologias

- React
- Vite
- TypeScript
- Tailwind CSS
- Recharts (gráficos/dashboards)
- Fetch/Axios (dependendo do seu client HTTP)
- JWT (armazenamento/uso do token no fluxo de auth)

---

## ⚙️ Configuração

### Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:8080
```

#### Produção (Vercel)
No painel da Vercel, configure **Environment Variables**:

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

## ☁️ Deploy (Vercel)

1) Conecte o repositório no Vercel  
2) Configure `VITE_API_URL` nas Environment Variables (Production/Preview)  
3) Faça o deploy

---

## 🔒 Observações de segurança

- O front utiliza o token JWT emitido pela API para autenticação.
- Nunca versionar `.env` com URLs privadas ou chaves.
- Em produção, utilize sempre HTTPS no `VITE_API_URL`.

---

## 🧭 Melhorias futuras (opcional)

- Melhorias de UX (skeletons/loading states)
- Performance: cache de requisições, paginação no admin, evitar chamadas em cascata
- Observabilidade: tratamento padronizado de erros e mensagens de API

---

## 👨‍💻 Autor

**Bryan Mendes Pinheiro**  
- GitHub: https://github.com/BryanPinheiro77  
- LinkedIn: https://www.linkedin.com/in/bryan-mendes-0406b92b5  
