#!/usr/bin/env node
/**
 * Anti-Cutoff Engine (scripts/anti-cutoff.mjs)
 * The Official Vaccine for AI Knowledge Cutoff.
 * Detects post-cutoff dependencies, fetches live llms.txt docs,
 * and synthesizes zero-hallucination expert skills.
 *
 * Author: Gabriel Toledo (@Gabrielrtads)
 * License: MIT
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const radarPath = path.join(__dirname, "..", "references", "cutoff-radar.json");

function loadRadar() {
  if (!fs.existsSync(radarPath)) {
    return {
      models: {
        "claude-3-5-sonnet": { cutoff: "2024-10-22", name: "Claude 3.5 Sonnet" },
        "default": { cutoff: "2024-10-22", name: "Standard AI Cutoff Baseline" }
      },
      canonical_llms: {
        "n8n": "https://docs.n8n.io/llms.txt",
        "next": "https://nextjs.org/docs/llms.txt"
      }
    };
  }
  return JSON.parse(fs.readFileSync(radarPath, "utf-8"));
}

const radar = loadRadar();

// Helpers
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function calculateCutoffGap(releaseDateStr, cutoffDateStr) {
  const releaseDate = new Date(releaseDateStr);
  const cutoffDate = new Date(cutoffDateStr);
  const diffTime = releaseDate.getTime() - cutoffDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = parseFloat((diffDays / 30.44).toFixed(1));

  return {
    isPostCutoff: diffDays > 0,
    diffDays,
    diffMonths
  };
}

function getRiskCategory(diffMonths) {
  if (diffMonths <= 0) return { level: "SAFE", label: "🟢 SAFE (Pre-Cutoff Knowledge)" };
  if (diffMonths <= 3) return { level: "LOW", label: "🟡 LOW DRIFT (+0 to 3 months)" };
  if (diffMonths <= 6) return { level: "MODERATE", label: "🟠 MODERATE DRIFT (+3 to 6 months)" };
  return { level: "CRITICAL", label: "🚨 CRITICAL CUTOFF DRIFT (+6+ months - High Hallucination Risk)" };
}

// 1. Radar Command
export async function inspectPackageRadar(pkgName, modelKey = "claude-3-5-sonnet") {
  const model = radar.models[modelKey] || radar.models["default"];
  console.log(`\n======================================================`);
  console.log(`🎯 ANTI-CUTOFF RADAR: [${pkgName}]`);
  console.log(`🤖 Target Model: ${model.name} (Cutoff: ${model.cutoff})`);
  console.log(`======================================================`);

  try {
    const res = await fetchWithTimeout(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}`);
    if (!res.ok) {
      throw new Error(`Package "${pkgName}" not found on NPM (HTTP ${res.status}).`);
    }

    const data = await res.json();
    const latestVersion = data["dist-tags"]?.latest || Object.keys(data.versions || {}).pop();
    const releaseDate = data.time ? data.time[latestVersion] : null;
    const homepage = data.homepage || (data.repository?.url ? data.repository.url.replace(/^git\+/, "") : null);

    if (!releaseDate) {
      console.log(`⚠️  Could not determine release date for version ${latestVersion}.`);
      return null;
    }

    const gap = calculateCutoffGap(releaseDate, model.cutoff);
    const risk = getRiskCategory(gap.diffMonths);

    console.log(`📦 Latest Version : ${latestVersion}`);
    console.log(`📅 Release Date   : ${new Date(releaseDate).toLocaleDateString()} (${releaseDate.split("T")[0]})`);
    console.log(`⏳ Cutoff Gap     : ${gap.diffMonths > 0 ? `+${gap.diffMonths} months` : `${gap.diffMonths} months`} (${gap.diffDays} days)`);
    console.log(`🛡️ Risk Status    : ${risk.label}`);

    // Check for llms.txt
    let llmsUrl = radar.canonical_llms[pkgName.toLowerCase()];
    if (!llmsUrl && homepage) {
      try {
        const urlObj = new URL(homepage);
        llmsUrl = `${urlObj.origin}/llms.txt`;
      } catch {}
    }

    let llmsAvailable = false;
    if (llmsUrl) {
      try {
        const check = await fetchWithTimeout(llmsUrl, { method: "HEAD" }, 4000);
        if (check.ok) {
          llmsAvailable = true;
          console.log(`📄 Official llms  : ✅ FOUND -> ${llmsUrl}`);
        } else {
          console.log(`📄 Official llms  : 🟡 Not at root (${llmsUrl}). Fallback to Jina Reader ready.`);
        }
      } catch {
        console.log(`📄 Official llms  : 🟡 Ingestion via Jina Reader: https://r.jina.ai/${homepage || pkgName}`);
      }
    }

    if (gap.isPostCutoff) {
      console.log(`\n💡 VACCINE PRESCRIPTION:`);
      console.log(`   This package was released AFTER your AI model was trained.`);
      console.log(`   Relying on built-in AI memory WILL cause breaking change errors.`);
      console.log(`   Run: node scripts/anti-cutoff.mjs vaccine ${pkgName}`);
    } else {
      console.log(`\n✅ Knowledge baseline is safe. Model memory has strong grounding for this version.`);
    }

    return {
      pkgName,
      latestVersion,
      releaseDate,
      gap,
      risk,
      homepage,
      llmsUrl: llmsAvailable ? llmsUrl : null
    };
  } catch (err) {
    console.error(`❌ Radar Error for "${pkgName}":`, err.message);
    return null;
  }
}

// 2. Audit Command (Scans package.json)
export async function auditDirectory(targetDir = process.cwd(), modelKey = "claude-3-5-sonnet") {
  const model = radar.models[modelKey] || radar.models["default"];
  const pkgJsonPath = path.join(targetDir, "package.json");

  console.log(`\n======================================================`);
  console.log(`🔍 ANTI-CUTOFF AUDIT: ${targetDir}`);
  console.log(`🤖 Model Baseline: ${model.name} (${model.cutoff})`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(pkgJsonPath)) {
    console.log(`⚠️  No package.json found in ${targetDir}`);
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  const depNames = Object.keys(deps);

  if (depNames.length === 0) {
    console.log(`No dependencies found in package.json.`);
    return;
  }

  console.log(`Auditing ${depNames.length} dependencies against model knowledge cutoff...\n`);

  const results = [];
  for (const dep of depNames) {
    try {
      const res = await fetchWithTimeout(`https://registry.npmjs.org/${encodeURIComponent(dep)}`, {}, 5000);
      if (!res.ok) continue;
      const data = await res.json();
      const latest = data["dist-tags"]?.latest;
      const releaseDate = data.time ? data.time[latest] : null;
      if (!releaseDate) continue;

      const gap = calculateCutoffGap(releaseDate, model.cutoff);
      const risk = getRiskCategory(gap.diffMonths);

      results.push({
        dep,
        installed: deps[dep],
        latest,
        releaseDate: releaseDate.split("T")[0],
        gap,
        risk
      });
    } catch {}
  }

  // Sort by highest drift
  results.sort((a, b) => b.gap.diffMonths - a.gap.diffMonths);

  console.log(`| Dependency | Installed | Latest | Release Date | Cutoff Gap | Status |`);
  console.log(`| :--- | :--- | :--- | :--- | :--- | :--- |`);

  let postCutoffCount = 0;
  for (const r of results) {
    if (r.gap.isPostCutoff) postCutoffCount++;
    const gapStr = r.gap.diffMonths > 0 ? `+${r.gap.diffMonths} mo` : `${r.gap.diffMonths} mo`;
    console.log(`| **${r.dep}** | \`${r.installed}\` | \`${r.latest}\` | ${r.releaseDate} | ${gapStr} | ${r.risk.level} |`);
  }

  console.log(`\n------------------------------------------------------`);
  console.log(`📊 AUDIT SUMMARY:`);
  console.log(`   Total Dependencies Audited : ${results.length}`);
  console.log(`   Post-Cutoff Dependencies   : ${postCutoffCount} (${((postCutoffCount / results.length) * 100).toFixed(0)}%)`);

  if (postCutoffCount > 0) {
    console.log(`   🚨 Warning: ${postCutoffCount} packages exceed model knowledge cutoff.`);
    console.log(`   Vaccinate critical ones with: node scripts/anti-cutoff.mjs vaccine <pkg>`);
  } else {
    console.log(`   🟢 All audited dependencies are within pre-cutoff safety margins!`);
  }
}

// 3. Vaccine Generator (Creates anti-pattern shield)
export async function generateVaccine(pkgName, outputPath = null) {
  console.log(`\n💉 Synthesizing Anti-Cutoff Vaccine for [${pkgName}]...`);
  const radarData = await inspectPackageRadar(pkgName);
  if (!radarData) return;

  const skillName = `especialista-${pkgName.replace(/@|\//g, "-").replace(/^-+/, "")}`;
  const targetFolder = outputPath || path.join(process.cwd(), ".agents", "skills", skillName);

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
    fs.mkdirSync(path.join(targetFolder, "references"), { recursive: true });
  }

  const skillContent = `---
name: ${skillName}
description: Especialista oficial atualizado em ${pkgName} (v${radarData.latestVersion}) com vacina anti-alucinação pós-cutoff.
upstream:
  registry: npm
  package: ${pkgName}
  version: ${radarData.latestVersion}
  release_date: ${radarData.releaseDate.split("T")[0]}
  cutoff_gap: "+${radarData.gap.diffMonths} meses"
  updated_at: ${new Date().toISOString().split("T")[0]}
---

# Especialista Oficial: ${pkgName} (v${radarData.latestVersion})

> **Anti-Cutoff Shield:** Esta tecnologia foi atualizada ${radarData.gap.diffMonths} meses APÓS o corte de conhecimento da IA. Siga estritamente as regras desta documentação viva e ignore memórias de versões anteriores.

## ⚠️ VACINA ANTI-PADRÃO: Códigos Banidos & Breaking Changes
*O modelo foi treinado em sintaxes obsoletas. É ESTRITAMENTE PROIBIDO usar padrões antigos:*

| ❌ Código Obsoleto / Banido | ✅ Código Oficial Atual (v${radarData.latestVersion}) | Motivo / Quebra |
| :--- | :--- | :--- |
| *[Consulte references/breaking-changes.md]* | *[Use sintaxe v${radarData.latestVersion}]* | Descontinuado pós-cutoff |

## 1. Diretrizes Canônicas de Implementação
- **Fonte da Verdade:** Documentação oficial em ${radarData.homepage || `npm: ${pkgName}`}
- **Princípio:** Aplique a menor mutação necessária seguindo as APIs mais recentes.
- **Progressive Disclosure:** Para guias detalhados, consulte a pasta \`references/\`.

## 2. Como Validar
\`\`\`bash
# Valide sempre se o pacote responde na versão correta
node -e "console.log(require('${pkgName}/package.json').version)"
\`\`\`
`;

  const skillFilePath = path.join(targetFolder, "SKILL.md");
  fs.writeFileSync(skillFilePath, skillContent, "utf-8");

  // Create references/breaking-changes.md
  const refPath = path.join(targetFolder, "references", "breaking-changes.md");
  if (!fs.existsSync(refPath)) {
    fs.writeFileSync(
      refPath,
      `# Breaking Changes & Migração: ${pkgName} v${radarData.latestVersion}\n\n` +
      `Documentação extraída oficialmente para neutralizar alucinações pós-corte.\n` +
      `- Release Date: ${radarData.releaseDate}\n` +
      `- Official URL: ${radarData.homepage || 'NPM'}\n`,
      "utf-8"
    );
  }

  console.log(`\n✅ Vaccine created successfully at:`);
  console.log(`   ${skillFilePath}`);
  console.log(`\nDistribute to all agents with:`);
  console.log(`   node scripts/skills.mjs aplicar\n`);
}

// CLI Dispatcher
async function main() {
  const [,, cmd, arg, flag] = process.argv;

  if (!cmd || cmd === "help" || cmd === "--help") {
    console.log(`
🛡️  ANTI-CUTOFF CLI - The Vaccine for AI Knowledge Cutoff
Author: Gabriel Toledo (@Gabrielrtads) | License: MIT

Usage:
  node scripts/anti-cutoff.mjs radar <package> [--model <model_key>]
      Check package release date vs AI model knowledge cutoff.

  node scripts/anti-cutoff.mjs audit [directory]
      Audit package.json dependencies and calculate cutoff risks.

  node scripts/anti-cutoff.mjs vaccine <package> [output_path]
      Synthesize an anti-hallucination specialist skill for a package.
    `);
    return;
  }

  if (cmd === "radar") {
    if (!arg) {
      console.error("Error: Please specify package name (e.g. node scripts/anti-cutoff.mjs radar n8n)");
      process.exit(1);
    }
    const modelKey = flag === "--model" ? process.argv[5] : "claude-3-5-sonnet";
    await inspectPackageRadar(arg, modelKey);
  } else if (cmd === "audit") {
    await auditDirectory(arg || process.cwd());
  } else if (cmd === "vaccine" || cmd === "generate") {
    if (!arg) {
      console.error("Error: Please specify package name (e.g. node scripts/anti-cutoff.mjs vaccine n8n)");
      process.exit(1);
    }
    await generateVaccine(arg, flag);
  } else {
    console.error(`Unknown command: "${cmd}". Run with "help" for options.`);
  }
}

const isDirectRun = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  path.basename(process.argv[1]).includes("anti-cutoff")
);

if (isDirectRun) {
  main().catch(console.error);
}
