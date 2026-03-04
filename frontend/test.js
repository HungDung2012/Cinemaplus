const ts = require('typescript');
const fs = require('fs');
const fileContent = fs.readFileSync('components/admin/QuickScheduleModal.tsx', 'utf8');
const sourceFile = ts.createSourceFile('test.tsx', fileContent, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const errs = sourceFile.parseDiagnostics.map(d => {
  const pos = ts.getLineAndCharacterOfPosition(sourceFile, d.start);
  return { line: pos.line + 1, col: pos.character + 1, msg: d.messageText };
});
fs.writeFileSync('errors.json', JSON.stringify(errs, null, 2));

