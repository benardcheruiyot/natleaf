const fs = require('fs');
const paths = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
for (const p of paths) {
  if (fs.existsSync(p)) {
    console.log(p);
    process.exit(0);
  }
}
console.log('NOTFOUND');
process.exit(1);
