# Plano de Treino — Webapp

Webapp de treino personalizada (Mai–Dez 2026). React + Vite, compila para um único `index.html` via `vite-plugin-singlefile`. Deploy no GitHub Pages.

## Contexto do utilizador

- Cirurgia ao menisco (joelho esquerdo, 4 pontos)
- Objetivo: perda gordura + preparação época futebol (meados Ago 2026)
- Mini ginásio garagem: bicicleta, elíptica, remo, steps, corda, elevações
- Rotina: Seg–Sáb musculação/cardio, Dom jogo futebol

## Stack

- **React 19** + **Vite 6**
- **vite-plugin-singlefile** → output: um único `index.html`
- **Outfit** (Google Fonts) — tipografia
- **localStorage** para persistência (checks, check-ins, dark mode)
- PWA via `manifest.json`

## Setup local

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/index.html (ficheiro único)
```

## Deploy (GitHub Pages)

O repo usa um GitHub Actions workflow (`.github/workflows/static.yml`) que faz deploy do `dist/index.html` automaticamente em cada push à branch `main`.

Para atualizar manualmente:
1. `npm run build`
2. Copia `dist/index.html` para a raiz do repo GitHub
3. Commit + push

## Estrutura

```
training-app/
├── index.html              # Entry HTML (Vite)
├── package.json
├── vite.config.js
├── public/
│   └── manifest.json       # PWA manifest
├── src/
│   ├── main.jsx            # React entry
│   └── App.jsx             # Toda a app (single component)
└── .github/
    └── workflows/
        └── static.yml      # GitHub Pages deploy
```

## localStorage keys

| Key | Conteúdo |
|-----|----------|
| `tp3` | Checks por atividade (objeto `{dateKey: {actId: true}}`) |
| `tp3-wn` | Check-ins semanais |
| `training-plan-checked` | Legacy (v1) — migrado automaticamente |
| `training-plan-dark` | Dark mode (legacy, já não usado na v2) |

## Arquitetura da App

### 4 tabs (bottom nav)
- **Hoje** — dia atual, atividades com checkbox individual, detail sheets
- **Progresso** — fases, timeline de benefícios, identidade
- **Guias** — nutrição, reab. joelho (ATG), recovery/plateau, zonas FC, abs, NEAT, mindset
- **Check-in** — energia, joelho, cardio, motivação, notas livres

### 6 fases (Mai–Dez 2026)
1. Readaptação (S1–3)
2. Base Aeróbica (S4–8)
3. Capacidade Específica (S9–14)
4. Afinação Pré-Época (S15–17)
5. Em Época (S18–29)
6. Pausa Festiva (S30–34)

### Cardio por fase
Cada fase tem protocolo diferente por dia da semana (Ter/Qui/Dom).
Máquinas rodam: elíptica, remo, bicicleta.

### Reabilitação joelho (ATG System)
- Sessão A (Ter/Dom): força + mobilidade
- Sessão B (Qui): recuperação + isométricos

### Desafio Abdominal
300 dias, padrão 3 treino + 1 descanso.
5 blocos: Iniciante×2 → Intermédio → Avançado×2.

## Momentum V5
- ciclo de execução de 12 semanas
- resultado principal semanal
- registo de restrições e compromissos da semana
- score separado para negócio, corpo e aprendizagem
- foco diário sugerido com base no que está em risco
