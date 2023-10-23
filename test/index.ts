import { ulid } from '../src/index';
import { webcrypto } from 'crypto';

interface Tests {
  passed: number;
  data?: string[];
  failed: string[];
}
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

