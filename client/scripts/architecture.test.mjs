import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { dependencyViolation,findCycles,scanArchitecture } from './architecture-lib.mjs';

function fixture(files,run){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'maintainex-architecture-'));
  try { for(const [file,source] of Object.entries(files)){const target=path.join(root,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,source);}run(root); }
  finally { fs.rmSync(root,{recursive:true,force:true}); }
}
test('foundation cannot reach feature behavior',()=>{
  assert.match(dependencyViolation('design-system/primitives/Button.tsx','features/work/index.ts'),/cannot depend/);
  assert.equal(dependencyViolation('features/work/components/Row.tsx','design-system/primitives/Button.tsx'),null);
});
test('cross-feature integration must use a public contract',()=>{
  assert.match(dependencyViolation('features/pins/screens/Pins.tsx','features/work/components/Form.tsx'),/public index/);
  assert.equal(dependencyViolation('features/pins/screens/Pins.tsx','features/work/index.ts'),null);
});
test('relative paths cannot bypass feature boundaries',()=>fixture({
  'features/pins/components/Row.tsx':'import { Form } from "../../work/components/Form"; export const Row = Form;',
  'features/work/components/Form.tsx':'export const Form = () => null;'
},root=>assert.ok(scanArchitecture(root).some(x=>x.includes('public index')))));
test('dynamic imports cannot bypass foundation boundary',()=>fixture({
  'design-system/primitives/Bad.tsx':'export const Bad = () => import("../../features/work/private");',
  'features/work/private.ts':'export const hidden = 1;'
},root=>assert.ok(scanArchitecture(root).some(x=>x.includes('cannot depend')))));
test('routes cannot become page implementations',()=>fixture({
  'app/work/page.tsx':'export default function Work(){ return null; }'
},root=>assert.ok(scanArchitecture(root).some(x=>x.includes('route must')))));
test('raw colors and HTTP outside the transport are rejected',()=>fixture({
  'features/work/components/Bad.tsx':'export const Bad = () => { fetch("/api"); return <div className="text-blue-500" style={{color:"#123456"}} />; };'
},root=>{const errors=scanArchitecture(root);assert.ok(errors.some(x=>x.includes('raw visual')));assert.ok(errors.some(x=>x.includes('color utility')));assert.ok(errors.some(x=>x.includes('HTTP')));}));
test('CSS colors belong only to token definitions',()=>fixture({
  'design-system/components.css':'.bad { color: #abcdef; }',
  'design-system/tokens.css':':root { --accent: #abcdef; }'
},root=>assert.equal(scanArchitecture(root).filter(x=>x.includes('raw color')).length,1)));
test('cycles are reported while shared dependencies are allowed',()=>{
  assert.equal(findCycles(new Map([['a',['b']],['b',['a']]])).length,1);
  assert.deepEqual(findCycles(new Map([['a',['c']],['b',['c']],['c',[]]])),[]);
});
test('API contracts cannot reach UI and state cannot reach pages',()=>{
  assert.ok(dependencyViolation('data/api/work.ts','features/work/index.ts'));
  assert.ok(dependencyViolation('state/auth.tsx','app/login/page.tsx'));
  assert.equal(dependencyViolation('state/auth.tsx','data/http.ts'),null);
});
test('unresolved aliases fail instead of silently escaping inspection',()=>fixture({
  'features/work/components/Bad.tsx':'import { Missing } from "@/not-a-module"; export const Bad = Missing;'
},root=>assert.ok(scanArchitecture(root).some(x=>x.includes('unresolved import')))));
test('computed module loading is rejected rather than bypassing the graph',()=>fixture({
  'features/work/components/Bad.tsx':'export const Bad = (name: string) => import(name);'
},root=>assert.ok(scanArchitecture(root).some(x=>x.includes('computed module')))));
test('server implementations cannot leak into client code',()=>{
  assert.match(dependencyViolation('features/work/screens/Work.tsx','../server/src/app.ts'),/cannot leave/);
});
test('inventory preserves IDs and detects both component and token drift',async()=>{
  const { createInventory } = await import('./design-inventory.mjs');
  fixture({
    'design-system/contracts.json':'{}',
    'design-system/tokens.css':':root { --accent: #abcdef; }',
    'design-system/components.css':'.button { color: var(--accent); }',
    'design-system/primitives/Button.tsx':'export function Button(){ return null; }'
  },root=>{
    const before=createInventory(root);
    fs.writeFileSync(path.join(root,'design-system/primitives/Button.tsx'),'export function Button(){ return <button>Changed</button>; }');
    fs.writeFileSync(path.join(root,'design-system/tokens.css'),':root { --accent: #fedcba; }');
    const after=createInventory(root);
    assert.equal(before.components[0].id,after.components[0].id);
    assert.notEqual(before.components[0].sourceHash,after.components[0].sourceHash);
    assert.notEqual(before.foundations[0].sourceHash,after.foundations[0].sourceHash);
  });
});
