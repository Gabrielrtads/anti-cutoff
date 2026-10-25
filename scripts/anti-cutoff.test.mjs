import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "anti-cutoff.mjs");
const RADAR_JSON = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "references", "cutoff-radar.json");

test("anti-cutoff CLI: responde ao help com comandos de sync, radar, audit e vaccine", () => {
  const r = spawnSync("node", [SCRIPT], { encoding: "utf8" });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /ANTI-CUTOFF CLI/);
  assert.match(r.stdout, /sync-models/);
  assert.match(r.stdout, /radar/);
  assert.match(r.stdout, /audit/);
  assert.match(r.stdout, /vaccine/);
});

test("anti-cutoff radar: valida formato integro do cutoff-radar.json", () => {
  assert.equal(fs.existsSync(RADAR_JSON), true, "cutoff-radar.json deve existir");
  const data = JSON.parse(fs.readFileSync(RADAR_JSON, "utf8"));
  assert.ok(data.models, "Deve conter catalogo de models");
  assert.ok(Object.keys(data.models).length >= 5, "Deve conter pelo menos 5 modelos de fronteira");
});
