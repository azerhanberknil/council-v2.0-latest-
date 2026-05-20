import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const indexPath = join(distDir, "index.html");
const jsDir = join(distDir, "_expo", "static", "js", "web");

if (!existsSync(indexPath)) {
  console.warn("No dist/index.html found; skipping web export patch.");
  process.exit(0);
}

let index = readFileSync(indexPath, "utf8");
index = index.replaceAll('href="/', 'href="./');
index = index.replaceAll('src="/', 'src="./');
writeFileSync(indexPath, index);

if (existsSync(jsDir)) {
  for (const fileName of readdirSync(jsDir)) {
    const filePath = join(jsDir, fileName);
    if (!statSync(filePath).isFile() || !fileName.endsWith(".js")) continue;

    let source = readFileSync(filePath, "utf8");
    source = source.replaceAll('uri:"/assets/', 'uri:"./assets/');
    source = source.replaceAll("uri:'/assets/", "uri:'./assets/");
    writeFileSync(filePath, source);
  }
}

console.log("Patched web export paths for localhost and direct file preview.");
