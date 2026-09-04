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

function checkFileContent(text, file) {
  const imgMissingAlt = [];
  const buttonsMissingType = [];
  const blankTargets = [];

  const imgRegex = /<img\b[^>]*>/gsi;
  let m;
  while ((m = imgRegex.exec(text))) {
    const tag = m[0];
    if (!/\balt\s*=/.test(tag)) {
      const before = text.slice(0, m.index);
      const line = before.split(/\r?\n/).length;
      imgMissingAlt.push({ file, line, tag });
    }
  }

  const buttonRegex = /<button\b([^>]*)>/gsi;
  while ((m = buttonRegex.exec(text))) {
    const attrs = m[1] || '';
    if (!/\btype\s*=/.test(attrs)) {
      const before = text.slice(0, m.index);
      const line = before.split(/\r?\n/).length;
      buttonsMissingType.push({ file, line, attrs: attrs.trim() });
    }
  }

  const linkRegex = /<a\b([^>]*)>/gsi;
  while ((m = linkRegex.exec(text))) {
    const attrs = m[1] || '';
    if (/target\s*=\s*"?_blank"?/.test(attrs) && !/rel\s*=/.test(attrs)) {
      const before = text.slice(0, m.index);
      const line = before.split(/\r?\n/).length;
      blankTargets.push({ file, line, attrs: attrs.trim() });
    }
  }

  return { imgMissingAlt, buttonsMissingType, blankTargets };
}

const SRC = path.join(__dirname, '..', 'frontend', 'src');
const exts = ['.js', '.jsx', '.html'];
const files = walk(SRC, exts);

const report = { imgMissingAlt: [], buttonsMissingType: [], blankTargets: [] };
for (const f of files) {
  const text = fs.readFileSync(f, 'utf8');
  const r = checkFileContent(text, f);
  report.imgMissingAlt.push(...r.imgMissingAlt);
  report.buttonsMissingType.push(...r.buttonsMissingType);
  report.blankTargets.push(...r.blankTargets);
}

console.log('Accessibility scanner v2 (multi-line aware)');
console.log('Files scanned:', files.length);
console.log('Images missing alt:', report.imgMissingAlt.length);
if (report.imgMissingAlt.length) console.log(report.imgMissingAlt.slice(0, 20));
console.log('Buttons missing type:', report.buttonsMissingType.length);
if (report.buttonsMissingType.length) console.log(report.buttonsMissingType.slice(0, 20));
console.log('Links target="_blank" missing rel:', report.blankTargets.length);
if (report.blankTargets.length) console.log(report.blankTargets.slice(0, 20));

if (!report.imgMissingAlt.length && !report.buttonsMissingType.length && !report.blankTargets.length) {
  console.log('No basic issues found by static scanner.');
} else {
  console.log('Please review the above findings and consider fixing them.');
}
