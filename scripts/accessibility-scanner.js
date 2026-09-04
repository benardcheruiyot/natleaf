const fs = require('fs');
const path = require('path');

function walk(dir, exts) {
  const files = [];
  for (const name of fs.readdirSync(dir)) {
    const fp = path.join(dir, name);
    const stat = fs.statSync(fp);
    if (stat.isDirectory()) files.push(...walk(fp, exts));
    else if (exts.includes(path.extname(name))) files.push(fp);
  }
  return files;
}

function checkFiles(files) {
  const imgMissingAlt = [];
  const buttonsMissingType = [];
  const blankTargets = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('<img') && !/alt\s*=/.test(line)) {
        imgMissingAlt.push({ file, line: i + 1, text: line.trim() });
      }
      if (/\<button(?![^>]*type=)/.test(line)) {
        buttonsMissingType.push({ file, line: i + 1, text: line.trim() });
      }
      if (line.includes('target="_blank"') && !/rel\s*=/.test(line)) {
        blankTargets.push({ file, line: i + 1, text: line.trim() });
      }
    }
  }
  return { imgMissingAlt, buttonsMissingType, blankTargets };
}

const SRC = path.join(__dirname, '..', 'frontend', 'src');
const exts = ['.js', '.jsx', '.html'];
const files = walk(SRC, exts);
const report = checkFiles(files);
console.log('Accessibility scanner report (basic static checks)');
console.log('Files scanned:', files.length);
console.log('Images missing alt:', report.imgMissingAlt.length);
if (report.imgMissingAlt.length) console.log(report.imgMissingAlt.slice(0, 10));
console.log('Buttons missing type:', report.buttonsMissingType.length);
if (report.buttonsMissingType.length) console.log(report.buttonsMissingType.slice(0, 10));
console.log('Links target="_blank" missing rel:', report.blankTargets.length);
if (report.blankTargets.length) console.log(report.blankTargets.slice(0, 10));

if (!report.imgMissingAlt.length && !report.buttonsMissingType.length && !report.blankTargets.length) {
  console.log('No basic issues found by static scanner.');
} else {
  console.log('Please review the above findings and consider fixing them.');
}
