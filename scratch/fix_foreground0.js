const fs = require('fs');
const path = require('path');

const DIR = ['app', 'components'];

const replacements = [
  [/text-foreground0/g, 'text-muted-foreground'],
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      for (const [regex, replacement] of replacements) {
        content = content.replace(regex, replacement);
      }
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

for (const dir of DIR) {
  processDir(path.join(__dirname, '..', dir));
}
