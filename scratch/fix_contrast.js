const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const targetDirs = ['app', 'components'];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    walkDir(dir, function(filePath) {
      if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Replace bg-slate-800 when not already prefixed by hover/dark
        // We will be slightly careful.
        
        // This is a naive regex replacement, but we can target specific exact combinations we saw:
        content = content.replace(/(?<!hover:|dark:)bg-slate-800/g, "bg-slate-100 dark:bg-slate-800");
        content = content.replace(/hover:bg-slate-800/g, "hover:bg-slate-200 dark:hover:bg-slate-800");
        
        // bg-slate-900 
        content = content.replace(/(?<!hover:|dark:)bg-slate-900/g, "bg-slate-200 dark:bg-slate-900");
        
        // bg-[#0a0a0a] -> bg-background (in demo/clinical/page.tsx, user wants Light Mode audit except not break dark mode, so bg-[#0a0a0a] -> bg-background)
        // Wait, demo/clinical is a literal simulator screen. I will manually review it.
        
        // Text colors
        content = content.replace(/text-slate-350/g, "text-muted-foreground");
        content = content.replace(/(?<!hover:|dark:)text-slate-450/g, "text-slate-500 dark:text-slate-450");
        content = content.replace(/(?<!hover:|dark:)text-slate-400/g, "text-slate-600 dark:text-slate-400");
        content = content.replace(/(?<!hover:|dark:)text-slate-300/g, "text-slate-700 dark:text-slate-300");
        
        // Border colors
        content = content.replace(/(?<!hover:|dark:)border-slate-700/g, "border-border dark:border-slate-700");
        content = content.replace(/(?<!hover:|dark:)border-slate-800/g, "border-border dark:border-slate-800");

        if (content !== originalContent) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`Updated: ${filePath}`);
        }
      }
    });
  }
});
