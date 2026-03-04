const ts = require('typescript');
const fs = require('fs');

function checkContent(content) {
  const sourceFile = ts.createSourceFile('test.tsx', content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  return sourceFile.parseDiagnostics.length === 0;
}

let code = fs.readFileSync('components/admin/QuickScheduleModal.tsx', 'utf-8');
const lines = code.split('\n');

const before = lines.slice(0, 197).join('\n') + '\n{!showPreview && !result && (\n';
const after = ')} \n' + lines.slice(385).join('\n');

const blocks = [
  lines.slice(197, 230).join('\n'), // Movie+Theater
  lines.slice(230, 290).join('\n'), // Room selection
  lines.slice(290, 311).join('\n'), // Schedule params + Templates
  lines.slice(311, 325).join('\n'), // Date range
  lines.slice(325, 350).join('\n'), // Time slots
  lines.slice(350, 366).join('\n'), // Buffer
  lines.slice(366, 384).join('\n'), // Save template + end wrapper
];

let currentBody = '';
for(let i=0; i<blocks.length; i++) {
   const testCode = before + '\n<div className="space-y-6">\n' + currentBody + blocks[i] + '\n</div>\n' + after;
   if(checkContent(testCode)) {
      console.log('Block ' + i + ' is OK');
      currentBody += blocks[i];
   } else {
      console.log('Block ' + i + ' FAILS!');
      const sourceFile = ts.createSourceFile('test.tsx', testCode, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      console.log(sourceFile.parseDiagnostics[0].messageText);
   }
}
