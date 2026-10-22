import fs from 'node:fs';
import { scanArchitecture } from './architecture-lib.mjs';
import { createInventory } from './design-inventory.mjs';
const errors=scanArchitecture(process.cwd());
const inventory=createInventory(process.cwd());
const seen=new Set();for(const entry of inventory.components){if(seen.has(entry.id))errors.push(`Duplicate inventory id ${entry.id}`);seen.add(entry.id);}
if(fs.readFileSync('design-system/inventory.json','utf8')!==JSON.stringify(inventory,null,2)+'\n')errors.push('Design inventory is stale: run npm run inventory:update.');
const navigation=fs.readFileSync('shell/navigation.ts','utf8');
for(const route of ['/reports','/leaderboard','/explore/quests','/explore/repositories','/explore/recommended','/explore/saved'])if(navigation.includes(`"${route}"`))errors.push(`Withdrawn feature restored to navigation: ${route}`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Architecture passed: ${inventory.components.length} registered components and ${inventory.routes.length} thin route adapters.`);
