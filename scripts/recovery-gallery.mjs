import fs from 'node:fs';
const root = 'docs/ui-recovery';
const names = fs.readdirSync(`${root}/screenshots/after`).filter(name => /^[a-z0-9-]+\.png$/.test(name)).sort();
const groups = ['desktop', 'laptop', 'mobile', 'mobile320'].flatMap(view => ['dark', 'light'].map(theme => {
    const suffix = `-${view}-${theme}.png`;
    const rows = names.filter(name => name.endsWith(suffix)).map(name => `<section><h3>${name.slice(0, -suffix.length)}</h3><div class="pair">${['before', 'after'].map(stage => `<figure><figcaption>${stage}</figcaption><a href="screenshots/${stage}/${name}"><img loading="lazy" src="screenshots/${stage}/${name}" alt="${stage} ${name}" /></a></figure>`).join('')}</div></section>`).join('');
    return `<details ${view === 'desktop' && theme === 'dark' ? 'open' : ''}><summary>${view} / ${theme}</summary>${rows}</details>`;
})).join('');
fs.writeFileSync(`${root}/comparison.html`, `<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>VulnLab — UI recovery comparison</title><style>body{font:16px/1.6 system-ui;background:#071525;color:#e8f1ff;max-width:1440px;margin:auto;padding:24px}h1{font-size:28px}summary{cursor:pointer;padding:16px;background:#11243d;margin:12px 0}.pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}figure{margin:0;min-width:0}img{width:100%;height:auto}figcaption{color:#9cb0cc}section{border-bottom:1px solid #263c57;padding-bottom:24px}@media(max-width:600px){.pair{grid-template-columns:1fr}}</style><h1>VulnLab — before / after</h1><p>Synthetic accounts and disposable SQLite data. Full-page captures at 1440×900, 1280×800, 390×844 and 320×740. Click an image for full resolution. Illustration is original vector artwork; screenshots are QA evidence, never production page backgrounds.</p>${groups}</html>`);
console.log(`Gallery: ${names.length} before/after pairs.`);
