# Lyon Protocol App

App de dieta personalizada baseado no Lyon Protocol, com IA para interpretar refeições e sugerir o que comer para fechar os macros do dia.

## Stack
- React + Vite
- Supabase (auth + banco)
- Claude API ou OpenAI (IA)
- Vercel (deploy)

## Setup

### 1. Supabase
Execute o arquivo `supabase.sql` no SQL Editor do seu projeto Supabase.

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar IA (opcional)
Copie `.env.example` para `.env` e adicione sua chave:
```bash
cp .env.example .env
```

### 4. Rodar localmente
```bash
npm run dev
```

### 5. Deploy no Vercel
1. Conecte o repositório no vercel.com
2. Adicione a variável de ambiente `VITE_AI_KEY` nas configurações do projeto
3. Deploy automático a cada push

## Trocar de Claude para OpenAI
No arquivo `src/lib/ai.js`, altere:
```js
const AI_PROVIDER = 'openai' // era 'claude'
```

## Funcionalidades (Fase 1)
- [x] Login / cadastro
- [x] Onboarding com cálculo de macros (Lyon Protocol)
- [x] Dashboard com saldo do dia
- [x] Registro de refeição por texto livre (IA) ou biblioteca
- [x] Biblioteca de refeições (28 refeições pré-populadas)
- [x] Sugestões inteligentes para fechar macros
- [x] Perfil editável com recálculo de macros

## Próximas fases
- [ ] Marmitas planejadas
- [ ] Histórico semanal
- [ ] Integração com app de treinos
- [ ] Gasto calórico estimado por treino
