---
name: anti-cutoff
version: 1.1.0
category: coding
description: "The official vaccine against AI knowledge cutoffs. Synchronizes live model dates via OpenRouter, detects post-cutoff library drifts (NPM & PyPI), fetches live llms.txt docs, and synthesizes zero-hallucination expert anti-pattern skills. / O escudo definitivo contra o limite de corte de treino (Knowledge Cutoff) das IAs. Trigger with /anti-cutoff, 'check cutoff', 'audit dependencies', 'verificar corte', 'gerar vacina', or 'sync models'."
tags: [anti-cutoff, knowledge-cutoff, ai-vaccine, anti-hallucination, openrouter, llms-txt, npm-drift, pypi-drift, zero-hallucination, breaking-changes, claude-code, codex, antigravity, vibe-coding]
---

# Anti-Cutoff: A Vacina Contra o Limite de Corte das IAs (Geração 2026)

O **`anti-cutoff`** elimina alucinações e erros causados pelo limite de corte de conhecimento (*Knowledge Cutoff*) dos modelos (Gemini 4, Claude 5.5, GPT-6, DeepSeek v4). Ele sincroniza modelos vivos diretamente do OpenRouter, calcula a defasagem temporal exata, baixa a documentação oficial crua (`llms.txt` / Jina) e sintetiza uma **Vacina Anti-Padrão** (tabela de códigos banidos vs vigentes).

## 🚀 Quando Ativar Esta Skill
- Sempre que o usuário mencionar `/anti-cutoff`, `anti-cutoff`, `verificar corte`, `atualizar vacina` ou perguntar se uma biblioteca é muito nova para a IA.
- Antes de iniciar refatorações ou escrever código usando bibliotecas modernas (Next 15/16, Tailwind v4, React 19, n8n v2, FastMCP, Hono, Supabase).
- Ao analisar um novo projeto ou `package.json` para auditar riscos de corte.

## 🛠️ Comandos do Motor

```bash
# 0. Sincronizar catálogo vivo de modelos e datas de corte via OpenRouter API
node scripts/anti-cutoff.mjs sync-models

# 1. Checar o Radar de Corte de uma tecnologia (NPM ou Python PyPI)
node scripts/anti-cutoff.mjs radar <package> [--model gemini-4-argon | claude-sonnet-5.5 | gpt-6.1-sol | default]

# 2. Auditar todas as dependências de um projeto em paralelo
node scripts/anti-cutoff.mjs audit [caminho_do_projeto]

# 3. Baixar documentação oficial crua e gerar vacina local de projeto (Padrão)
node scripts/anti-cutoff.mjs vaccine <package> --local

# 4. Criar skill global no Swarm (Apenas para grandes frameworks de infra)
node scripts/anti-cutoff.mjs vaccine <package> --global
```

## 🧠 Fluxo de Execução do Agente

### 1. Diagnóstico Temporal (Cutoff Radar)
1. Rode `node scripts/anti-cutoff.mjs radar <tech>`.
2. O radar busca automaticamente no **NPM** e faz fallback para o **PyPI (Python)**.
3. Avalie o **Cutoff Gap**:
   - **Risco CRÍTICO (+3 meses pós-corte)**: É estritamente proibido confiar na memória de treino. O agente deve puxar a documentação viva antes de codar.

### 2. Ingestão Real da Documentação
1. Ao rodar `node scripts/anti-cutoff.mjs vaccine <tech> --local`:
   - O motor faz o **download real** do `llms.txt` oficial (ou extrai via `r.jina.ai`) e salva em `references/vacinas/<tech>/llms-raw.txt`.
2. O agente **DEVE LER** o arquivo `llms-raw.txt` baixado para extrair as quebras de versão e novas APIs.

### 3. A Vacina Anti-Padrão (Sem Placeholders Ocos)
O agente deve preencher a tabela da vacina com códigos reais banidos identificados no `llms-raw.txt`:

```markdown
## ⚠️ VACINA ANTI-PADRÃO: Códigos Banidos & Breaking Changes
| ❌ Código Obsoleto / Banido | ✅ Código Oficial Atual (vX.Y) | Motivo / Quebra |
| :--- | :--- | :--- |
| `funcaoAntigaDescontinuada()` | `novaApiOficial()` | Removida na versão pós-corte |
```

## 📦 Governança de Escopo: Local vs Global
- **Bibliotecas Pontuais (`--local`):** Salve sempre em `references/vacinas/<pkg>/` dentro do projeto. Não polua o catálogo global com pacotes efêmeros.
- **Grandes Frameworks (`--global`):** Apenas para Next.js, Supabase, Tailwind, n8n ou FastMCP. Após criar com `--global`, sincronize com:
```bash
node scripts/skills.mjs aplicar
```
