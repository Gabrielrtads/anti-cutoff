---
name: anti-cutoff
description: O escudo definitivo contra o limite de corte de treino (Knowledge Cutoff) das IAs. Detecta defasagem temporal de bibliotecas, ingere llms.txt oficiais e sintetiza especialistas atualizados com vacina anti-padrão.
---

# Anti-Cutoff: A Vacina Contra o Limite de Corte das IAs

O **`anti-cutoff`** elimina alucinações e erros causados pelo limite de corte de conhecimento (*Knowledge Cutoff*) dos modelos (Claude, GPT, Gemini). Ele calcula a defasagem temporal entre a data da versão oficial e o corte do modelo, ingere documentações oficiais (`llms.txt` / Jina) e sintetiza uma **Vacina Anti-Padrão** (tabela de sintaxes obsoletas vs vigentes).

## 🚀 Quando Ativar Esta Skill
- Sempre que o usuário mencionar `/anti-cutoff`, `anti-cutoff`, `verificar corte`, `atualizar especialista` ou perguntar se uma biblioteca é muito nova para a IA.
- Antes de iniciar refatorações ou escrever código usando bibliotecas modernas (Next 15/16, Tailwind v4, React 19, n8n v2, Hono, Supabase).
- Ao analisar um novo projeto ou `package.json` para auditar riscos de corte.

## 🛠️ Comandos do Motor

\`\`\`bash
# 1. Checar o Radar de Corte de uma tecnologia específica
node scripts/anti-cutoff.mjs radar <package>

# 2. Auditar todas as dependências de um projeto (package.json)
node scripts/anti-cutoff.mjs audit [caminho_do_projeto]

# 3. Gerar ou atualizar a vacina/especialista para uma biblioteca
node scripts/anti-cutoff.mjs vaccine <package>
\`\`\`

## 🧠 Fluxo de Execução do Agente

### 1. Diagnóstico Temporal (Cutoff Radar)
Quando o usuário pedir para verificar ou usar uma tecnologia:
1. Rode `node scripts/anti-cutoff.mjs radar <tech>`.
2. Avalie o **Cutoff Gap**:
   - Se o gap for **> 0 meses**: A versão foi lançada APÓS o treino do modelo.
   - **Risco CRÍTICO (+6 meses)**: É estritamente proibido confiar na memória de treino. O agente deve puxar a documentação oficial viva (`llms.txt`) antes de codar.

### 2. Ingestão Autorizada (Zero Alucinação de SEO)
1. **Prioridade 1:** `https://<dominio>/llms.txt` (padrão oficial de IAs).
2. **Prioridade 2:** `https://r.jina.ai/<docs_url>` (extrai Markdown puro sem cookies/popups).
3. **Prioridade 3:** GitHub Releases / CHANGELOG oficial para caçar *Breaking Changes*.

### 3. A Vacina Anti-Padrão (Obrigatória em Todo Especialista)
Toda documentação de especialista deve ter uma seção clara de códigos proibidos:
\`\`\`markdown
## ⚠️ Códigos Banidos & Quebras de Versão
- ❌ PROIBIDO: Sintaxe antiga que quebra na versão atual.
- ✅ USE EXCLUSIVAMENTE: Nova API oficial pós-corte.
\`\`\`

## 📦 Sincronização no Swarm
Após gerar ou atualizar qualquer vacina/especialista, sincronize para Claude, Codex e Antigravity:
\`\`\`bash
node scripts/skills.mjs aplicar
\`\`\`
