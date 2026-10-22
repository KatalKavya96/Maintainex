import path from 'node:path';
import fs from 'node:fs';
import ts from 'typescript';

export const roots = ['app','features','design-system','shell','shared','data','state','types','lib'];
export function filesUnder(root, dirs = roots) {
  const visit = dir => fs.existsSync(dir) ? fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry => entry.isDirectory() ? visit(path.join(dir,entry.name)) : /\.(tsx?|css)$/.test(entry.name) ? [path.join(dir,entry.name)] : []) : [];
  return dirs.flatMap(dir=>visit(path.join(root,dir))).sort();
}
export function sourceInfo(file, text) {
  const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const imports=[];
  const visit=node=>{
    if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if(ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && node.moduleReference.expression && ts.isStringLiteral(node.moduleReference.expression)) imports.push(node.moduleReference.expression.text);
    if(ts.isCallExpression(node) && (node.expression.kind===ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression)&&node.expression.text==='require')) && ts.isStringLiteral(node.arguments[0])) imports.push(node.arguments[0].text);
    ts.forEachChild(node,visit);
  };visit(ast);
  return { ast,imports };
}
export function resolveLocal(from, specifier, root) {
  let base=specifier.startsWith('@/')?path.join(root,specifier.slice(2)):specifier.startsWith('.')?path.resolve(path.dirname(path.join(root,from)),specifier):null;
  if(!base)return null;
  const candidate=[base,...['.ts','.tsx','.json','.css','/index.ts','/index.tsx'].map(ext=>base+ext)].find(file=>fs.existsSync(file)&&fs.statSync(file).isFile());
  return candidate ? path.relative(root,candidate).split(path.sep).join('/') : null;
}
export function dependencyViolation(from,to) {
  const a=from.split('/'),b=to.split('/');
  if(a[0]==='design-system' && !['design-system','types'].includes(b[0]))return 'Design system cannot depend on application behavior';
  if(a[0]==='shared' && !['shared','design-system','types'].includes(b[0]))return 'Shared utilities cannot depend on features, state or data';
  if(a[0]==='data' && !['data','types'].includes(b[0]))return 'Data modules cannot depend on UI or application state';
  if(a[0]==='state' && !['state','data','types','shared'].includes(b[0]))return 'State cannot depend on presentation';
  if(a[0]==='types' && b[0]!=='types')return 'Contracts cannot depend on implementations';
  if(a[0]==='features' && b[0]==='features' && a[1]!==b[1] && to!==`features/${b[1]}/index.ts`)return 'Cross-feature imports must use the public index';
  if(to.startsWith("../"))return "Client imports cannot leave the client boundary";
  if(b[0]==='app' && a[0]!=='app')return 'Features cannot import route adapters';
  if(to==='lib/api.ts')return 'Import the owning data/api module, not the compatibility barrel';
  return null;
}
export function findCycles(graph) {
  const active=new Set(),done=new Set(),cycles=[];
  const visit=(id,trail=[])=>{
    if(active.has(id)){cycles.push([...trail.slice(trail.indexOf(id)),id]);return;}
    if(done.has(id))return;
    active.add(id);for(const next of graph.get(id)??[])if(graph.has(next))visit(next,[...trail,id]);active.delete(id);done.add(id);
  };for(const id of graph.keys())visit(id);return cycles;
}
export function scanArchitecture(root) {
  const errors=[],graph=new Map();
  for(const absolute of filesUnder(root)){
    const file=path.relative(root,absolute).split(path.sep).join('/'),text=fs.readFileSync(absolute,'utf8');
    if(file.endsWith('.css')){
      if(file!=='design-system/tokens.css' && /#[\da-fA-F]{3,8}\b|rgba?\(/.test(text))errors.push(`${file}: raw color outside tokens`);
      continue;
    }
    const { ast,imports }=sourceInfo(file,text);const targets=[];
    for(const spec of imports){
      if(spec.startsWith('node:') || ['fs','path','express','@prisma/client'].includes(spec)) errors.push(`${file}: server-only dependency ${spec}`);
      const target=resolveLocal(file,spec,root);
      if(!target){if(spec.startsWith('@/')||spec.startsWith('.'))errors.push(`${file}: unresolved import ${spec}`);continue;}
      targets.push(target);const violation=dependencyViolation(file,target);if(violation)errors.push(`${file} -> ${target}: ${violation}`);
    }
    graph.set(file,targets);
    if(file.endsWith('/page.tsx')){
      if(ast.statements.some(node=>!ts.isExportDeclaration(node)))errors.push(`${file}: route must only re-export its feature screen`);
      if(imports.length!==1 || !/^@\/features\/[^/]+\/screens\//.test(imports[0]??''))errors.push(`${file}: route must select exactly one feature screen`);
    }
    if(file==='lib/api.ts')continue;
    const checkDynamic = node => { if(ts.isCallExpression(node) && (node.expression.kind===ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression)&&node.expression.text==='require')) && (!node.arguments[0] || !ts.isStringLiteral(node.arguments[0]))) errors.push(`${file}: computed module loading is not an allowed extension seam`); ts.forEachChild(node,checkDynamic); };
    checkDynamic(ast);
    if(/#[\da-fA-F]{6}\b|rgba?\(/.test(text))errors.push(`${file}: raw visual color; use semantic tokens`);
    if(/(?:text|bg|border|ring|fill|stroke)-(?:slate|gray|zinc|blue|purple|indigo|orange|green|emerald|red|rose|yellow|cyan|amber)-\d/.test(text))errors.push(`${file}: unapproved color utility`);
    if(/\bfetch\s*\(/.test(text) && file!=='data/http.ts')errors.push(`${file}: HTTP must use data/http.ts`);
    const cap=file==='features/reports/screens/ReportsScreen.tsx'?490:350;
    if(text.split('\n').length>cap)errors.push(`${file}: ${cap}-line module budget exceeded; extract a responsibility`);
  }
  for(const cycle of findCycles(graph))errors.push(`Dependency cycle: ${cycle.join(' -> ')}`);
  return errors;
}
