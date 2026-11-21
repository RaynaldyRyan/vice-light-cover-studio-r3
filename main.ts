// Vice Light Cover Studio — entry program (Node 22, standard library only).
// Copies app/ and screenshots/ from this repository to the output directory
// and writes dossier.json with the kit's buildDossier library.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function copyTree(name: string): void {
  const src = join(repoRoot, name);
  const dst = join(outDir, name);
  if (!existsSync(src)) throw new Error('missing in repository: ' + name);
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree('app');
copyTree('screenshots');

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Fail loudly if the dossier text ever outgrows the judge's cap, so a bad
// build never ships silently.
const parsed = JSON.parse(new TextDecoder().decode(dossier)) as { text?: string };
const textBytes = Buffer.byteLength(parsed.text ?? '', 'utf8');
if (textBytes > 163840) throw new Error('dossier text ' + textBytes + ' bytes exceeds 163840');
console.log('wrote dossier.json (' + dossier.length + ' bytes, text ' + textBytes + ' bytes) to ' + outDir);
