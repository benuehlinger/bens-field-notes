import { execFileSync } from 'node:child_process';
import { readdir, readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';

execFileSync('npm', ['run', 'build:web'], { stdio: 'inherit' });
await cp('content', 'dist/content', { recursive: true });

async function notebookFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => !entry.name.startsWith('.') && entry.name !== '_site')
      .map((entry) => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory()
          ? notebookFiles(file)
          : /\.(qmd|ipynb)$/.test(entry.name)
            ? [file]
            : [];
      }),
  );
  return nested.flat();
}
const notebooks = await notebookFiles('notebooks');
if (notebooks.length) {
  const home = await readFile('dist/index.html', 'utf8');
  const header = home.match(/<header\b[^>]*id="site-header"[\s\S]*?<\/header>/)?.[0];
  const footer = home.match(/<footer\b[^>]*id="site-footer"[\s\S]*?<\/footer>/)?.[0];
  const search = home.match(/<dialog\b[^>]*class="search-dialog"[\s\S]*?<\/dialog>/)?.[0] || '';
  const index = home.match(/<script\b[^>]*id="search-index"[\s\S]*?<\/script>/)?.[0] || '';
  const css = [...home.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)]
    .map((match) => match[0])
    .join('\n');
  const scripts = [...home.matchAll(/<script\b[^>]*type="module"[^>]*>[\s\S]*?<\/script>/g)]
    .map((match) => match[0])
    .join('\n');
  if (!header || !footer || !css)
    throw new Error('Cannot build shared notebook navigation and styles.');
  await mkdir('notebooks/.generated', { recursive: true });
  await writeFile(
    'notebooks/.generated/head.html',
    `${css}\n<script>try{document.documentElement.dataset.theme=localStorage.getItem('field-notes-theme')||'dark'}catch{}</script>\n${scripts}`,
  );
  await writeFile('notebooks/.generated/header.html', `${header}${search}${index}`);
  await writeFile('notebooks/.generated/footer.html', footer);
  execFileSync('quarto', ['render', '--no-execute'], { cwd: 'notebooks', stdio: 'inherit' });
} else {
  console.log('No notebook files to render. No code or model APIs executed.');
}
