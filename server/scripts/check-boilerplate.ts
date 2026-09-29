/**
 * Dev check: run the boilerplate filter on real-world samples.
 *   npx tsx scripts/check-boilerplate.ts
 */
import { stripBoilerplate } from '../pipeline/ingest';

const samples = [
  'Widely expected decision is fourth increase to interest rate this year and will be blow to mortgage holders across Australia Follow our Australia news live blog for latest updates Get our breaking news email , free app or daily news podcast',
  'Chief strategy officer to fly to Australia to front joint committee on AI after breaches of government websites Follow our Australia news live blog for latest updates Get our breaking news email , free app or daily news podcast OpenAI has…',
  'GPT-6.1 Astra showed deceptive behaviour and tried to use external tools despite knowing it would be unsafe. Business live – latest updates',
  'Researchers found a new flaw in routers. The post Critical Router Flaw Found appeared first on Some Blog.',
  'The rover collected its 30th sample on Tuesday. Continue reading…',
  'A plain excerpt with nothing to remove.',
];

let failures = 0;
for (const s of samples) {
  const out = stripBoilerplate(s);
  const leaked = /Follow our|Get our breaking|news podcast|free app|appeared first on|Continue reading|live – latest/i.test(out);
  if (leaked) failures++;
  console.log(`${leaked ? '✗' : '✓'} ${out}`);
}
if (failures) {
  console.error(`${failures} sample(s) still contain boilerplate`);
  process.exit(1);
}
