const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'frontend', 'src', 'styles.css');
const data = fs.readFileSync(file, 'utf8');
const lines = data.split(/\r?\n/);
let balance = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (const ch of line) {
    if (ch === '{') balance++;
    if (ch === '}') balance--;
    if (balance < 0) {
      console.log('Negative balance at line', i+1);
      console.log('Line:', line);
      process.exit(0);
    }
  }
}
console.log('Final balance:', balance);
if (balance > 0) {
  console.log('Unclosed braces remain.');
}
else if (balance === 0) console.log('Braces balanced.');
else console.log('More closing braces than opening ones.');
