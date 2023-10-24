import { ulid } from '../src/index';
import { randomUUID } from 'crypto';

interface Tests {
  passed: number;
  data?: string[];
  failed: string[];
}
console.log(ulid());
console.log(ulid.uuid());
const timestamp = Date.now();
console.log(timestamp);
const id = ulid(timestamp);
console.log(id);
console.log(ulid.timestamp(id))
console.log(ulid.data(id));
console.log(ulid.is(id));
console.log(ulid.toUUID(id));
console.log(ulid.fromUUID(ulid.toUUID(id)));
console.log(ulid.toUUID(ulid.fromUUID(ulid.toUUID(id))));

// console.log(` - Recreate 01HDGXKCW99TXTBEEHYPTH5QHF: ${ulid(1698153739145, 371806068612356197506607n) === '01HDGXKCW99TXTBEEHYPTH5QHF'}`);


console.log(ulid.toUUID('01HDGX93NBW6AY9C60GH2TWDP4') === '018B61D4-8EAB-E195-E4B0-C08445AE36C4');
console.log(ulid.fromUUID('018B61D4-8EAB-E195-E4B0-C08445AE36C4') === '01HDGX93NBW6AY9C60GH2TWDP4');

// for (let i = 0; i < 100000; i++) {
//   const uuid = randomUUID();
//   const uuid2 = ulid.toUUID(ulid.fromUUID(uuid)).toLowerCase();
//   if (uuid !== uuid2) {
//     console.log(`failed conversion: ${uuid}`);
//   }
// }
console.log();
console.log('Factory - ULIDs');
let factory = ulid.factory();
for (let i = 0; i < 10; i++) {
  console.log(factory.ulid());
}
console.log();
console.log('Factory - UUIDs');
for (let i = 0; i < 10; i++) {
  console.log(factory.uuid());
}
console.log();
console.log('Factory - both');
factory = ulid.factory({ timestamp: 1698160540736 });
for (let i = 0; i < 10; i++) {
  if (i % 2 == 0) {
    console.log(factory.ulid());
  } else {
    console.log(factory.uuid());
  }
}
console.log();
console.log('Factory with timestamp and data seed');
factory = ulid.factory({ timestamp: 1698160540736, data: 369740473983206468055316n });
for (let i = 0; i < 10; i++) {
  if (i % 2 == 0) {
    console.log(factory.ulid());
  } else {
    console.log(factory.uuid());
  }
}
console.log();
factory = ulid.factory({ timestamp: 1698160540736, data: 377789318629571617095675n });
for (let i = 0; i < 10; i++) {
  if (i % 2 == 0) {
    console.log(factory.ulid());
  } else {
    console.log(factory.uuid());
  }
}


console.log();
factory = ulid.factory({ data: 302249901647731003228158n });
for (let i = 0; i < 4; i++) {
  console.log(factory.uuid());
}