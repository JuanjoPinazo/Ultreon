const fs = require('fs');
const path = require('path');

const DIR = ['app', 'components'];

const replacements = [
  // Patterns from recent manual edits
  [/bg-slate-50 dark:bg-slate-950/g, 'bg-background'],
  [/dark:bg-slate-950 bg-slate-50/g, 'bg-background'],
  [/bg-white dark:bg-slate-900/g, 'bg-card'],
  [/dark:bg-slate-900 bg-white/g, 'bg-card'],
  [/bg-slate-100 dark:bg-slate-900/g, 'bg-card'],
  [/border-slate-200 dark:border-slate-800/g, 'border-border'],
  [/dark:border-slate-800 border-slate-200/g, 'border-border'],
  [/border-slate-200 dark:border-slate-850/g, 'border-border'],
  [/text-slate-900 dark:text-slate-100/g, 'text-foreground'],
  [/dark:text-slate-100 text-slate-900/g, 'text-foreground'],
  [/text-slate-900 dark:text-slate-50/g, 'text-foreground'],
  [/text-slate-700 dark:text-slate-200/g, 'text-foreground'],
  [/text-slate-600 dark:text-slate-300/g, 'text-muted-foreground'],
  [/text-slate-600 dark:text-slate-400/g, 'text-muted-foreground'],
  [/text-slate-500 dark:text-slate-400/g, 'text-muted-foreground'],
  [/bg-white dark:bg-slate-950/g, 'bg-background'],

  // Legacy hardcoded slate colors
  [/bg-slate-950/g, 'bg-background'],
  [/bg-slate-900/g, 'bg-card'],
  [/bg-slate-850/g, 'bg-muted'],
  [/border-slate-800/g, 'border-border'],
  [/border-slate-850/g, 'border-border'],
  [/text-slate-50/g, 'text-foreground'],
  [/text-slate-100/g, 'text-foreground'],
  [/text-slate-200/g, 'text-foreground'],
  [/text-slate-300/g, 'text-muted-foreground'],
  [/text-slate-400/g, 'text-muted-foreground'],
  [/text-slate-500/g, 'text-muted-foreground'],
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
