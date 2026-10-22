import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import ts from 'typescript';
import { filesUnder,sourceInfo,resolveLocal } from './architecture-lib.mjs';

export function createInventory(root) {
  const files=filesUnder(root),components=[],consumers=new Map();
  for(const absolute of files.filter(f=>/\.tsx?$/.test(f))){
    const file=path.relative(root,absolute).split(path.sep).join('/');
    for(const spec of sourceInfo(file,fs.readFileSync(absolute,'utf8')).imports){const target=resolveLocal(file,spec,root);if(target)consumers.set(target,[...(consumers.get(target)??[]),file]);}
  }
  const contracts=JSON.parse(fs.readFileSync(path.join(root,'design-system/contracts.json'),'utf8'));
  for(const absolute of files.filter(f=>f.endsWith('.tsx')&&!f.includes('/app/'))){
    const file=path.relative(root,absolute).split(path.sep).join('/'),text=fs.readFileSync(absolute,'utf8'),{ast}=sourceInfo(file,text);
    const names=[];
    for(const node of ast.statements){
      if(node.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)){
        if(ts.isFunctionDeclaration(node)&&node.name)names.push(node.name.text);
        if(ts.isVariableStatement(node))for(const decl of node.declarationList.declarations)if(ts.isIdentifier(decl.name))names.push(decl.name.text);
      }
      if(ts.isExportDeclaration(node)&&node.exportClause&&ts.isNamedExports(node.exportClause))for(const item of node.exportClause.elements)if(!item.isTypeOnly)names.push(item.name.text);
    }
    const parts=file.split('/'),owner=parts[0]==='features'?`feature:${parts[1]}`:parts[0];
    for(const name of names.filter(name=>/^[A-Z]/.test(name))){
      const adapter=file.startsWith('design-system/patterns/')&&ast.statements.every(node=>ts.isExportDeclaration(node));
      const id=`${owner}.${adapter?'adapter.':''}${name}`;
      const contract=contracts[id]??{};
      components.push({id,name,owner,file,revision:contract.revision??1,kind:parts.includes('screens')?'screen':adapter?'adapter':'component',variants:contract.variants??['default'],states:contract.states??['existing behavior'],description:contract.description??'Feature-owned composition; contract review required before redesign.',review:contract.review??'source inventory; visual review pending',usedBy:[...new Set(consumers.get(file)??[])].sort(),sourceHash:crypto.createHash('sha256').update(text).digest('hex')});
    }
  }
  const routes=files.filter(f=>f.endsWith('/page.tsx')).map(absolute=>{const file=path.relative(root,absolute).split(path.sep).join('/');const spec=sourceInfo(file,fs.readFileSync(absolute,'utf8')).imports[0];return {route:'/'+file.slice(4,-9).replace(/\/$/,''),entry:file,screen:resolveLocal(file,spec,root)};});
  const foundations = ['tokens.css','components.css','contracts.json'].map(name=>({file:`design-system/${name}`,sourceHash:crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'design-system',name))).digest('hex')}));
  return {schemaVersion:2,foundations,components:components.sort((a,b)=>a.id.localeCompare(b.id)),routes};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(new URL(import.meta.url).pathname)){
  const root=process.cwd(),file=path.join(root,'design-system/inventory.json');const generated=JSON.stringify(createInventory(root),null,2)+'\n';
  if(process.argv.includes('--write')){fs.writeFileSync(file,generated);console.log('Design inventory regenerated.');}
  else if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==generated){console.error('Design inventory is stale. Run npm run inventory:update and review the diff.');process.exitCode=1;}
  else console.log('Design inventory is current.');
}
