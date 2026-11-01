/** Validate actual exported HTML and local link destinations; never contacts production. */
import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
const root=path.resolve("out");
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]))).flat();}
const files=(await walk(root)).filter(file=>file.endsWith(".html"));
const failures=[];let links=0;
for(const file of files){
 const source=await readFile(file,"utf8");if(!/<html[^>]+lang=/.test(source)||!source.includes('<title>'))failures.push(`${path.relative(root,file)}: missing document language or title`);
 for(const match of source.matchAll(/href="(\/(?!\/)[^"#?]*)(?:[^\"]*)"/g)){
  let pathname;try{pathname=decodeURIComponent(match[1]);}catch{failures.push(`Invalid local URL in ${file}`);continue;}
  if(pathname.startsWith('/_next/'))continue;
  const resolved=path.resolve(root,'.'+pathname);if(resolved!==root&&!resolved.startsWith(root+path.sep)){failures.push(`Unsafe local path ${pathname}`);continue;}
  const destination=path.extname(resolved)?resolved:path.join(resolved,'index.html');
  links++;try{await access(destination);}catch{failures.push(`${path.relative(root,file)} → ${pathname}`);}
 }
}
if(!files.length)failures.push('No static HTML export found');
if(failures.length){console.error([...new Set(failures)].join('\n'));process.exitCode=1;}else console.log(`Validated ${files.length} static HTML documents and ${links} local link destinations.`);
