const fs = require('fs');
const path = 'app/dashboard/centre-analytics/page.tsx';
const fullPath = __dirname + '/' + path;
let content = fs.readFileSync(fullPath, 'utf8');
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('bg-blue-600 text-white') && lines[i].includes('bg-transparent text-gray-500')) {
    lines[i] = lines[i].replace(/\s+".*$/, '');
    break;
  }
}
content = lines.join('\n');
fs.writeFileSync(fullPath, content);
console.log('Done');
