// Builds data/activity.json from recent commits on the showcase repos.
// Runs in GitHub Actions (see .github/workflows/deploy.yml). Node 20+, no dependencies.
import { readFile, writeFile } from "node:fs/promises";

const OWNER = "ACReturns";
// Repos that may appear in the Activity strip. Add new projects here.
const REPOS = ["Command-Center", "Bambu-Bridge", "XLSX-Translator-Skill", "Portfolio"];
const MAX_ITEMS = 6;
const NOISE = /^(merge\b|update(d)?\s*$|update(d)? readme|initial commit|wip\s*$|minor\b|test\s*$)/i;
const OUT = "data/activity.json";

const headers = { Accept: "application/vnd.github+json", "User-Agent": "portfolio-activity" };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function commits(repo) {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${repo}/commits?per_page=10`, { headers });
  if (!res.ok) throw new Error(`${repo}: HTTP ${res.status}`);
  const list = await res.json();
  return list
    .map((c) => ({
      date: (c.commit.author?.date || c.commit.committer?.date || "").slice(0, 10),
      repo,
      url: c.html_url,
      text: c.commit.message.split("\n")[0].trim(),
    }))
    .filter((c) => c.date && c.text.length >= 12 && !NOISE.test(c.text));
}

const results = await Promise.allSettled(REPOS.map(commits));
const items = [];
for (const r of results) {
  if (r.status === "fulfilled") {
    // At most two entries per repo so one busy repo can't fill the strip.
    items.push(...r.value.slice(0, 2));
  } else {
    console.warn("skipped:", r.reason.message);
  }
}
items.sort((a, b) => b.date.localeCompare(a.date));

if (!items.length) {
  console.warn("No activity fetched; keeping the existing file.");
  process.exit(0);
}

const data = { updated: new Date().toISOString(), source: "github", items: items.slice(0, MAX_ITEMS) };
const prev = await readFile(OUT, "utf8").catch(() => "");
await writeFile(OUT, JSON.stringify(data, null, 2) + "\n");
console.log(prev ? "Updated" : "Created", OUT, `(${data.items.length} items)`);
