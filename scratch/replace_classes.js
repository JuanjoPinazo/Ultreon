const fs = require('fs');

const replacements = {
  'slate-450': 'slate-400',
  'slate-850': 'slate-800',
  'red-150': 'red-200'
};

const execSync = require('child_process').execSync;
const files = execSync('grep -rlE "(slate-450|slate-850|red-150)" app/ components/').toString().trim().split('\n');

for (const file of files) {
  if (!file) continue;
  let content = fs.readFileSync(file, 'utf8');
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(key, 'g'), value);
  }
  fs.writeFileSync(file, content);
}
console.log('Replaced invalid classes.');
