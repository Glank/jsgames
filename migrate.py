import re
import sys

input_fn = sys.argv[1]
output_fn = sys.argv[2]

with open(input_fn) as f:
  lines = f.read().split('\n')

exports = []
for l in range(len(lines)):
  line = lines[l]
  m = re.match(r'\s*export\s+(var|function|class)\s+(\w+)', line)
  if m:
    name = m.groups()[1]
    exports.append(name)
    m = re.match(r'(\s*)export\s+(.*)$', line)
    line = ''.join(m.groups())
    lines[l] = line

if lines[0].find('strict') == -1:
  lines.insert(0, "'use strict';")
  lines.insert(1, '')
if exports:
  if lines[-1] != '':
    lines.append('');
  lines.append('module.exports = {');
  for i, export in enumerate(exports):
    line = '  {}: {}'.format(export, export)
    if i+1 < len(exports):
      line += ','
    lines.append(line);
  lines.append('};');

with open(output_fn, 'w') as f:
  f.write('\n'.join(lines))
