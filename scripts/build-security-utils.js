import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, '../src/lib/server/utils/security');
const outDir = join(__dirname, '../dist/security');

await build({
  entryPoints: [
    join(srcDir, 'audit.ts'),
    join(srcDir, 'rateLimit.ts'),
    join(srcDir, 'sanitize.ts')
  ],
  outdir: outDir,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  bundle: true,
});