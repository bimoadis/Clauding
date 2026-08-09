const fs = require('fs');
const path = require('path');

const EXCLUDE_DIRS = new Set(['node_modules', '.git', '.next', 'dist']);
const EXCLUDE_FILES = new Set(['rename.js', 'pnpm-lock.yaml']);

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.has(file)) {
        walk(fullPath, callback);
      }
    } else {
      if (!EXCLUDE_FILES.has(file)) {
        callback(fullPath);
      }
    }
  }
}

console.log('Starting case-sensitive string replacement: KIRBLE -> CLAUDING...');

let modifiedCount = 0;

walk(path.join(__dirname, '..'), (filePath) => {
  // Only process text files (code, configs, markdown)
  const ext = path.extname(filePath);
  const textExtensions = ['.ts', '.tsx', '.json', '.md', '.yaml', '.yml', '.css', '.html', '.svg', '.js', '.config'];
  if (!textExtensions.includes(ext) && !filePath.endsWith('.env') && !filePath.endsWith('.env.example')) {
    return;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. KIRBLE -> CLAUDING
    content = content.replace(/KIRBLE/g, 'CLAUDING');
    // 2. Kirble -> Clauding
    content = content.replace(/Kirble/g, 'Clauding');
    // 3. kirble -> clauding
    content = content.replace(/kirble/g, 'clauding');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${path.relative(path.join(__dirname, '..'), filePath)}`);
      modifiedCount++;
    }
  } catch (e) {
    console.error(`Failed to process: ${filePath}`, e.message);
  }
});

console.log(`\nReplacement complete. Total files modified: ${modifiedCount}`);
