import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const source = path.join(root, "..", "silene-clone");
const dest = path.join(root, "public");

function rmrf(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

rmrf(dest);
fs.mkdirSync(dest, { recursive: true });

function copyRecursive(src, dst) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dst, name));
    }
  } else {
    fs.copyFileSync(src, dst);
  }
}

copyRecursive(source, dest);

const staleLogin = path.join(dest, "login");
if (fs.existsSync(staleLogin)) {
  fs.rmSync(staleLogin, { recursive: true, force: true });
}

const nextDir = path.join(dest, "_next");
const mirrorDir = path.join(dest, "mirror-next");
if (fs.existsSync(nextDir)) {
  fs.renameSync(nextDir, mirrorDir);
}

function walkFiles(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walkFiles(p, out);
    else out.push(p);
  }
  return out;
}

const textExt = new Set([
  ".html",
  ".css",
  ".js",
  ".svg",
  ".txt",
  ".json",
  ".xml",
]);
for (const file of walkFiles(dest)) {
  const ext = path.extname(file).toLowerCase();
  if (!textExt.has(ext)) continue;
  let s = fs.readFileSync(file, "utf8");
  if (s.includes("/_next/")) {
    s = s.split("/_next/").join("/mirror-next/");
    fs.writeFileSync(file, s);
  }
}

const indexPath = path.join(dest, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
const heroCta =
  '<a href="https://app.silene.systems" class="group relative inline-block w-52 cursor-pointer overflow-hidden rounded-full border border-primary bg-primary px-8 py-4 text-center text-base font-semibold text-white sm:text-lg"><span class="inline-block translate-x-1 transition-all duration-500 group-hover:translate-x-12 group-hover:opacity-0">Get Started</span>';
const heroCtaNew =
  '<a href="/get-started" target="_top" class="group relative inline-block w-52 cursor-pointer overflow-hidden rounded-full border border-primary bg-primary px-8 py-4 text-center text-base font-semibold text-white sm:text-lg"><span class="inline-block translate-x-1 transition-all duration-500 group-hover:translate-x-12 group-hover:opacity-0">Get Started</span>';
if (html.includes(heroCta)) {
  html = html.replace(heroCta, heroCtaNew);
  fs.writeFileSync(indexPath, html);
} else if (
  !html.includes('href="/get-started"') &&
  !html.includes('href="/app"')
) {
  console.warn(
    "sync-public: hero Get Started CTA not found; ensure hero links to /get-started (or /app)"
  );
}

console.log("sync-public: copied silene-clone -> web/public (_next -> mirror-next)");
