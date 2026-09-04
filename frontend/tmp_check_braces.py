from pathlib import Path
path = Path('src/styles.css')
text = path.read_text(encoding='utf-8').splitlines()
brace = 0
for i, line in enumerate(text, 1):
    brace += line.count('{') - line.count('}')
    if i % 100 == 0 or i == len(text):
        print(f'{i}: {brace}')
print('FINAL', brace)
for i, line in enumerate(text, 1):
    if '@media (max-width: 980px)' in line:
        print(i, line)
