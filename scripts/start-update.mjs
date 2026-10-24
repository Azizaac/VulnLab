import { spawnSync } from 'node:child_process';

function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args[0]} failed.`);
  }
  return result.stdout.trim();
}

try {
  const topic = process.argv.slice(2).join(' ').trim();
  const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '');
  if (!slug) throw new Error('Usage: npm run update:new -- nama-update');

  const base = git(['rev-parse', '--verify', 'HEAD']);
  if (git(['status', '--porcelain', '--untracked-files=all'])) {
    throw new Error('Working tree belum bersih. Simpan dan commit perubahan yang ada sebelum memulai update baru.');
  }

  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
  const stamp = `${parts.year}-${parts.month}-${parts.day}-${parts.hour}${parts.minute}${parts.second}`;
  const prefix = `codex/${stamp}-${slug}`;
  const branches = new Set(git(['for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes/origin'])
    .split('\n').map((ref) => ref.replace(/^origin\//, '')));
  let branch = prefix;
  for (let suffix = 2; branches.has(branch); suffix++) branch = `${prefix}-${suffix}`;

  git(['check-ref-format', '--branch', branch]);
  git(['switch', '-c', branch]);
  console.log(`Branch baru: ${branch}\nDasar: ${base.slice(0, 12)}\nSetelah update diperiksa dan di-commit: git push -u origin HEAD`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
