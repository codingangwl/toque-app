import { defineConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

// Emits /sw.js from src/sw.js with the full list of built files to precache, so the app
// works offline from the first visit. The version changes whenever any file changes,
// which makes the browser install the new worker and drop the old cache.
function serviceWorker() {
  let publicDir;
  return {
    name: 'toque-service-worker',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    generateBundle(_, bundle) {
      const hash = createHash('sha256');
      const urls = new Set(['/', '/index.html']);

      for (const file of Object.values(bundle)) {
        if (file.fileName.endsWith('.map')) continue;
        urls.add(`/${file.fileName}`);
        hash.update(file.fileName).update(file.type === 'chunk' ? file.code : file.source);
      }
      for (const path of listFiles(publicDir)) {
        const url = `/${relative(publicDir, path).split(sep).join('/')}`;
        urls.add(url);
        hash.update(url).update(readFileSync(path));
      }

      const source = readFileSync('src/sw.js', 'utf8')
        .replace('__VERSION__', hash.digest('hex').slice(0, 12))
        .replace('self.__PRECACHE__', JSON.stringify([...urls].sort(), null, 2));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  plugins: [serviceWorker()],
});
