# 🛡️ Anti-Cutoff

[![GitHub stars](https://img.shields.io/github/stars/Gabrielrtads/anti-cutoff?style=social)](https://github.com/Gabrielrtads/anti-cutoff/stargazers)

> ⭐ **If this tool saved you time or empowered your AI agents, please star this repository! It helps more developers discover the project.**

> **The Official Vaccine for AI Knowledge Cutoffs.**  
> Automatically detects post-cutoff library drifts, fetches authoritative `llms.txt` docs, and synthesizes zero-hallucination expert skills with anti-pattern shields.

[![Install via Skills.sh](https://img.shields.io/badge/skills.sh-anti--cutoff-blue.svg)](https://skills.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI & Test Suite](https://github.com/Gabrielrtads/anti-cutoff/actions/workflows/ci.yml/badge.svg)](https://github.com/Gabrielrtads/anti-cutoff/actions)
[![Built for AI Agents](https://img.shields.io/badge/Agents-Claude%20%7C%20Codex%20%7C%20Gemini-purple.svg)]()

---

### 🚨 The Problem: "False Confidence" & The Knowledge Cutoff

Every AI model (Claude 3.5 Sonnet, GPT-4o, Gemini 2.0, Codex) has a fixed **knowledge cutoff date**.
When you ask an AI agent to build with a modern library (e.g., **React 19**, **Next.js 16**, **n8n v2**, **Tailwind v4**):

1. The AI model **does not know that it does not know**.
2. It confidently writes code using **deprecated syntax and removed methods** (e.g., using `$getPairedItem` in n8n, legacy cache directives in Next.js, or old hooks).
3. The build breaks, runtime crashes, and you waste hours debugging outdated hallucinated code.

---

### 💉 The Solution: How `anti-cutoff` Works

`anti-cutoff` turns the model's knowledge cutoff from a point of failure into a **deterministic mathematical trigger**:

```
                       ┌────────────────────────────────────────┐
                       │  Target Library (e.g. n8n or Next.js)  │
                       └───────────────────┬────────────────────┘
                                           │
                        Queries Live Registry API (50ms)
                                           │
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │  Cutoff Drift: Release Date vs Cutoff   │
                      └────────────────────┬────────────────────┘
                                           │
                  ┌────────────────────────┴────────────────────────┐
                  ▼                                                 ▼
       Release <= Model Cutoff                           Release > Model Cutoff
        🟢 Safe Pre-Cutoff                                🚨 Post-Cutoff Drift Detected
        (Normal AI execution)                                       │
                                                   ┌────────────────┴───────────────┐
                                                   ▼                                ▼
                                         Ingests Canonical Docs           Generates Anti-Pattern
                                           (llms.txt / Jina)                Vaccine (Banned APIs)
```

1. **Cutoff Radar:** Compares the package's latest release date against the target model's training cutoff.
2. **Official Ingestion:** Pulls directly from `https://<domain>/llms.txt` or clean Jina markdown readers (bypassing SEO spam and obsolete 2022 blog posts).
3. **The Anti-Pattern Vaccine:** Injects an explicit table of banned obsolete patterns vs required modern syntax, suppressing the model's pre-trained priors.

---

## ⚡ Quick Install

### Via `skills.sh` (Recommended for Agents):
```bash
npx skills add Gabrielrtads/anti-cutoff
```

### Global CLI:
```bash
npm install -g anti-cutoff
```

---

## 🛠️ Usage

### 1. Check a Package on the Cutoff Radar
```bash
anti-cutoff radar n8n
```
**Output:**
```text
======================================================
🎯 ANTI-CUTOFF RADAR: [n8n]
🤖 Target Model: Claude 3.5 Sonnet (Cutoff: 2024-10-22)
======================================================
📦 Latest Version : 2.44.5
📅 Release Date   : 2026-10-21
⏳ Cutoff Gap     : +23.9 months (729 days)
🛡️ Risk Status    : 🚨 CRITICAL CUTOFF DRIFT (+6+ months - High Hallucination Risk)
📄 Official llms  : ✅ FOUND -> https://docs.n8n.io/llms.txt

💡 VACCINE PRESCRIPTION:
   This package was released AFTER your AI model was trained.
   Relying on built-in AI memory WILL cause breaking change errors.
   Run: anti-cutoff vaccine n8n
```

### 2. Audit an Entire Project (`package.json`)
Run this in any repository to check which installed dependencies exceed your AI model's training knowledge:
```bash
anti-cutoff audit ./my-project
```
Produces an instant risk matrix ranking dependencies by cutoff drift and highlighting packages that require grounding docs.

### 3. Synthesize an Anti-Hallucination Vaccine
```bash
anti-cutoff vaccine <package-name>
```
Generates a structured `SKILL.md` (< 500 lines) with upstream metadata, live docs, and explicit anti-pattern rules.

---

## 🤖 Supported AI Models & Cutoffs

| Model | Knowledge Cutoff | Status in Radar |
| :--- | :--- | :--- |
| **Claude 3.7 Sonnet** | Feb 2025 | Supported |
| **Claude 3.5 Sonnet** | Oct 2024 | Supported (Default) |
| **GPT-4o / o1 / o3-mini** | Oct 2024 | Supported |
| **Gemini 2.0 Flash** | Aug 2024 | Supported |
| **Gemini 1.5 Pro** | May 2024 | Supported |

---

## 📄 License

MIT © [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads)
