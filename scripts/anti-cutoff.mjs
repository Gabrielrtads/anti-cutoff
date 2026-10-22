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
        "gemini-3-8-flash": { cutoff: "2025-01-01", name: "Gemini 3.8 Flash" },
        "claude-3-7-sonnet": { cutoff: "2025-02-01", name: "Claude 3.7 Sonnet" },
        "claude-3-5-sonnet": { cutoff: "2024-10-22", name: "Claude 3.5 Sonnet (Latest)" },
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

// Universal Package Resolver (NPM -> PyPI)
async function fetchPackageMetadata(pkgName) {
  // 1. Try NPM Registry first
  try {
    const res = await fetchWithTimeout(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}`, {}, 5000);
    if (res.ok) {
      const data = await res.json();
      const latestVersion = data["dist-tags"]?.latest || Object.keys(data.versions || {}).pop();
      const releaseDate = data.time ? data.time[latestVersion] : null;
      const homepage = data.homepage || (data.repository?.url ? data.repository.url.replace(/^git\+/, "").replace(/\.git$/, "") : null);

      if (releaseDate) {
        return {
          registry: "npm",
          pkgName,
          latestVersion,
          releaseDate,
          homepage
        };
      }
    }
  } catch {}

  // 2. Fallback to Python PyPI Registry
  try {
    const pyRes = await fetchWithTimeout(`https://pypi.org/pypi/${encodeURIComponent(pkgName)}/json`, {}, 5000);
    if (pyRes.ok) {
      const pyData = await pyRes.json();
      const latestVersion = pyData.info?.version;
      const releases = pyData.releases?.[latestVersion];
      const releaseDate = releases?.[0]?.upload_time_iso_8601 || releases?.[0]?.upload_time;
      const homepage = pyData.info?.home_page || pyData.info?.project_urls?.Documentation || pyData.info?.project_urls?.Source;

      if (releaseDate) {
        return {
          registry: "pypi",
          pkgName,
          latestVersion,
          releaseDate,
          homepage
        };
      }
    }
  } catch {}

  return null;
}

// 1. Radar Command
export async function inspectPackageRadar(pkgName, modelKey = "claude-3-5-sonnet") {
  const model = radar.models[modelKey] || radar.models["default"];
  console.log(`\n======================================================`);
  console.log(`🎯 ANTI-CUTOFF RADAR: [${pkgName}]`);
  console.log(`🤖 Target Model: ${model.name} (Cutoff: ${model.cutoff})`);
  console.log(`======================================================`);

  try {
    const meta = await fetchPackageMetadata(pkgName);
    if (!meta) {
      throw new Error(`Package "${pkgName}" not found on NPM or PyPI.`);
    }

    const gap = calculateCutoffGap(meta.releaseDate, model.cutoff);
    const risk = getRiskCategory(gap.diffMonths);

    console.log(`📦 Registry       : ${meta.registry.toUpperCase()}`);
    console.log(`🏷️ Latest Version : ${meta.latestVersion}`);
    console.log(`📅 Release Date   : ${new Date(meta.releaseDate).toLocaleDateString()} (${meta.releaseDate.split("T")[0]})`);
    console.log(`⏳ Cutoff Gap     : ${gap.diffMonths > 0 ? `+${gap.diffMonths} months` : `${gap.diffMonths} months`} (${gap.diffDays} days)`);
    console.log(`🛡️ Risk Status    : ${risk.label}`);

    // Check for llms.txt or authoritative doc
    let llmsUrl = radar.canonical_llms[pkgName.toLowerCase()];
    if (!llmsUrl && meta.homepage) {
      try {
        const urlObj = new URL(meta.homepage);
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
          console.log(`📄 Official llms  : 🟡 Not at root (${llmsUrl}). Fallback ready.`);
        }
      } catch {
        console.log(`📄 Official llms  : 🟡 Fallback via Jina Reader ready.`);
      }
    }

    if (gap.isPostCutoff) {
      console.log(`\n💡 VACCINE PRESCRIPTION:`);
      console.log(`   This package was released AFTER your AI model was trained.`);
      console.log(`   Relying on built-in AI memory WILL cause breaking change errors.`);
      console.log(`   Run: node scripts/anti-cutoff.mjs vaccine ${pkgName} [--local | --global]`);
    } else {
      console.log(`\n✅ Knowledge baseline is safe. Model memory has strong grounding for this version.`);
    }

    return {
      registry: meta.registry,
      pkgName: meta.pkgName,
      latestVersion: meta.latestVersion,
      releaseDate: meta.releaseDate,
      gap,
      risk,
      homepage: meta.homepage,
      llmsUrl: llmsAvailable ? llmsUrl : null
    };
  } catch (err) {
    console.error(`❌ Radar Error for "${pkgName}":`, err.message);
    return null;
  }
}

// 2. Audit Command (Scans package.json with Concurrency)
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

  console.log(`Auditing ${depNames.length} dependencies in parallel batches...\n`);

  const results = [];
  const CHUNK_SIZE = 6;

  for (let i = 0; i < depNames.length; i += CHUNK_SIZE) {
    const chunk = depNames.slice(i, i + CHUNK_SIZE);
    const chunkPromises = chunk.map(async (dep) => {
      try {
        const meta = await fetchPackageMetadata(dep);
        if (!meta) return null;

        const gap = calculateCutoffGap(meta.releaseDate, model.cutoff);
        const risk = getRiskCategory(gap.diffMonths);

        return {
          dep,
          installed: deps[dep],
          latest: meta.latestVersion,
          releaseDate: meta.releaseDate.split("T")[0],
          gap,
          risk
        };
      } catch {
        return null;
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const r of chunkResults) {
      if (r) results.push(r);
    }
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
  console.log(`   Post-Cutoff Dependencies   : ${postCutoffCount} (${results.length > 0 ? ((postCutoffCount / results.length) * 100).toFixed(0) : 0}%)`);

  if (postCutoffCount > 0) {
    console.log(`   🚨 Warning: ${postCutoffCount} packages exceed model knowledge cutoff.`);
    console.log(`   Vaccinate critical ones with: node scripts/anti-cutoff.mjs vaccine <pkg> [--local | --global]`);
  } else {
    console.log(`   🟢 All audited dependencies are within pre-cutoff safety margins!`);
  }
}

// Fetch Authoritative Raw Documentation
async function downloadAuthoritativeDoc(radarData) {
  let docUrl = radarData.llmsUrl;
  if (!docUrl && radarData.homepage) {
    docUrl = `https://r.jina.ai/${radarData.homepage}`;
  }

  if (!docUrl) return null;

  try {
    console.log(`   🌐 Downloading authoritative documentation from ${docUrl}...`);
    const res = await fetchWithTimeout(docUrl, { headers: { "User-Agent": "AntiCutoff/2.0" } }, 10000);
    if (res.ok) {
      const text = await res.text();
      // Cap at 80KB to protect memory
      return text.slice(0, 80 * 1024);
    }
  } catch (err) {
    console.log(`   ⚠️ Could not fetch live doc: ${err.message}. Fallback template applied.`);
  }
  return null;
}

// 3. Vaccine Generator (Creates anti-pattern shield with Real Docs)
export async function generateVaccine(pkgName, modeOrPath = "--local") {
  console.log(`\n💉 Synthesizing Anti-Cutoff Vaccine for [${pkgName}]...`);
  const radarData = await inspectPackageRadar(pkgName);
  if (!radarData) return;

  const isGlobal = modeOrPath === "--global";
  let targetFolder;

  if (isGlobal) {
    const skillName = `especialista-${pkgName.replace(/@|\//g, "-").replace(/^-+/, "")}`;
    targetFolder = path.join(process.cwd(), ".agents", "skills", skillName);
    console.log(`   🌐 Scope: GLOBAL SKILL (.agents/skills/${skillName})`);
  } else if (modeOrPath && modeOrPath !== "--local") {
    targetFolder = path.resolve(modeOrPath);
    console.log(`   📂 Scope: CUSTOM PATH (${targetFolder})`);
  } else {
    // Default: Local to the current project/workspace
    targetFolder = path.join(process.cwd(), "references", "vacinas", pkgName.replace(/@|\//g, "-"));
    console.log(`   🏠 Scope: LOCAL PROJECT VACCINE (${targetFolder})`);
  }

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  const rawDocContent = await downloadAuthoritativeDoc(radarData);
  const rawDocPath = path.join(targetFolder, "llms-raw.txt");
  if (rawDocContent) {
    fs.writeFileSync(rawDocPath, rawDocContent, "utf-8");
    console.log(`   📄 Authoritative documentation saved to: ${rawDocPath} (${Math.round(rawDocContent.length / 1024)} KB)`);
  }

  const vaccineContent = `---
name: vacina-${pkgName.replace(/@|\//g, "-")}
description: Vacina anti-alucinação e especialista oficial em ${pkgName} (v${radarData.latestVersion}) pós-cutoff.
upstream:
  registry: ${radarData.registry}
  package: ${pkgName}
  version: ${radarData.latestVersion}
  release_date: ${radarData.releaseDate.split("T")[0]}
  cutoff_gap: "+${radarData.gap.diffMonths} meses"
  updated_at: ${new Date().toISOString().split("T")[0]}
---

# Vacina Anti-Padrão Oficial: ${pkgName} (v${radarData.latestVersion})

> **Anti-Cutoff Shield:** Esta tecnologia foi atualizada ${radarData.gap.diffMonths} meses APÓS o corte de conhecimento da IA. Siga estritamente as regras desta documentação viva e ignore memórias de versões anteriores.

## ⚠️ VACINA ANTI-PADRÃO: Códigos Banidos & Breaking Changes
*O modelo foi treinado em sintaxes obsoletas. O agente DEVE ler o arquivo \`llms-raw.txt\` anexo para aplicar exclusivamente as novas APIs:*

| ❌ Código Obsoleto / Banido (Pré-Corte) | ✅ Código Oficial Atual (v${radarData.latestVersion}) | Motivo / Quebra |
| :--- | :--- | :--- |
| *[Consulte llms-raw.txt para APIs descontinuadas]* | *[Utilize os novos métodos da v${radarData.latestVersion}]* | Descontinuado pós-cutoff |

## 1. Diretrizes Canônicas de Implementação
- **Fonte da Verdade:** ${radarData.homepage || `${radarData.registry}: ${pkgName}`}
- **Documentação Crua Salva:** Consulte \`llms-raw.txt\` nesta pasta para o texto oficial completo.
- **Princípio:** Aplique a menor mutação necessária seguindo as APIs vigentes pós-corte.

## 2. Como Validar
\`\`\`bash
# Valide se o pacote está instalado na versão correta
node -e "console.log(require('${pkgName}/package.json').version)"
\`\`\`
`;

  const vaccineFilePath = path.join(targetFolder, "VACCINE.md");
  fs.writeFileSync(vaccineFilePath, vaccineContent, "utf-8");

  console.log(`\n✅ Vaccine created successfully at:`);
  console.log(`   ${vaccineFilePath}`);

  if (isGlobal) {
    console.log(`\nDistribute to all agents with:`);
    console.log(`   node scripts/skills.mjs aplicar\n`);
  }
}

// CLI Dispatcher
async function main() {
  const [,, cmd, arg, flag, extra] = process.argv;

  if (!cmd || cmd === "help" || cmd === "--help") {
    console.log(`
🛡️  ANTI-CUTOFF CLI - The Vaccine for AI Knowledge Cutoff
Author: Gabriel Toledo (@Gabrielrtads) | License: MIT

Usage:
  node scripts/anti-cutoff.mjs radar <package> [--model <model_key>]
      Check package release date (NPM or PyPI) vs AI model knowledge cutoff.

  node scripts/anti-cutoff.mjs audit [directory] [--model <model_key>]
      Audit package.json dependencies in parallel and calculate cutoff risks.

  node scripts/anti-cutoff.mjs vaccine <package> [--local | --global | <output_path>]
      Fetch live documentation and synthesize an anti-hallucination vaccine.
    `);
    return;
  }

  if (cmd === "radar") {
    if (!arg) {
      console.error("Error: Please specify package name (e.g. node scripts/anti-cutoff.mjs radar n8n)");
      process.exit(1);
    }
    const modelKey = flag === "--model" ? extra : "claude-3-5-sonnet";
    await inspectPackageRadar(arg, modelKey);
  } else if (cmd === "audit") {
    const targetDir = (arg && !arg.startsWith("--")) ? arg : process.cwd();
    const modelKey = (arg === "--model" ? flag : (flag === "--model" ? extra : "claude-3-5-sonnet"));
    await auditDirectory(targetDir, modelKey);
  } else if (cmd === "vaccine" || cmd === "generate") {
    if (!arg) {
      console.error("Error: Please specify package name (e.g. node scripts/anti-cutoff.mjs vaccine n8n)");
      process.exit(1);
    }
    await generateVaccine(arg, flag || "--local");
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
