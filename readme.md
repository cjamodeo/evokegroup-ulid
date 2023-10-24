# evokegroup/ulid

Universally unique Lexicographically sortable IDentifier

A ULID is a 26 charater string consisting of a encoded timestamp followed by 16 random characters. This library can also encode a ULID in a UUID format and convert between the 2 formats.

## ulid()

Generates a ULID.

**returns** `string`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| timestamp? | `number` | `Date.now()` | The timestamp |

```javascript
import { ulid } from '@evokegroup/ulid';

const id = ulid(); // 01HDEKBMW3904VB2HYTVWWMSY5

// Use a existing timestamp
const now = Date.now(); // 1698075890563
const id = ulid(now); // 01HDEKBMW3904VB2HYTVWWMSY5
```

## ulid.timestamp()

Gets the timestamp from a ULID

**returns** `number`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| id | `string` | | The string to parconsose |

```javascript
import { ulid } from '@evokegroup/ulid';

ulid.timestamp('01HDEKBMW3904VB2HYTVWWMSY5'); // 1698075890563
ulid.timestamp('018B5D35-D383-4809-B58A-3ED6F9CA67C5'); // 1698075890563
```

## ulid.data()

Gets the random data portion of a ULID as a `BigInt`

**returns** `bigint`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| id | `string` | | The string to parse |

```javascript
import { ulid } from '@evokegroup/ulid';

ulid.data('01HDEKBMW3904VB2HYTVWWMSY5'); // 340189488800438527092677n
ulid.data('018B5D35-D383-4809-B58A-3ED6F9CA67C5'); // 340189488800438527092677n
```

## ulid.is()

Determines if the given string is a ULID

**returns** `boolean`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| id | `string` | | The string to test |

```javascript
import { ulid } from '@evokegroup/ulid';

ulid.is('01HDEKBMW3904VB2HYTVWWMSY5'); // true
ulid.is('018B5D35-D383-4809-B58A-3ED6F9CA67C5'); // false
```

## ulid.uuid()

Generates a ULID in a UUID v4 format. 

**returns** `string`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| timestamp? | `number` | `Date.now()` | The timestamp |

```javascript
import { ulid } from '@evokegroup/ulid';

const id = ulid.uuid(); // 018B5D35-D383-4809-B58A-3ED6F9CA67C5
```

## ulid.fromUUID()

Convert a UUID to a ULID.

**returns** `string`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| id | `string` | | The ID to be converted |

```javascript
import { ulid } from '@evokegroup/ulid';

const id = ulid.fromUUID('018B5D38-9C52-47FB-97AB-09550991A91C'); // 01HDEKH72J8ZXSFAR9AM4S3A8W
```

## ulid.toUUID()

Convert a ULID to a UUID. Conversions of externally generated ULIDs may not result in a valid UUID v4. 

**returns** `string`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| id | `string` | | The ID to be converted |

```javascript
import { ulid } from '@evokegroup/ulid';

const uuid = ulid.toUUID('01HDEKH72J8ZXSFAR9AM4S3A8W'); // 018B5D38-9C52-47FB-97AB-09550991A91C
```

## ulid.factory()

Create a ULID factory which will increment the ID with every generation. The ID will increment regardless of which ID format is generated.

**returns** `Factory`

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| args | `object` | | |
| args.timestamp? | `number` | `Date.now()` | The timestamp |
| args.data? | `bigint` | Randomly generated | The seed data value. If this value is less than `FACTORY_DATA_MIN` or greater than `FACTORY_DATA_MAX` it will be set to `FACTORY_DATA_MIN`. |

```javascript
import { ulid } from '@evokegroup/ulid';

let factory = ulid.factory();
// with a timestamp
factory = ulid.factory({ timestamp: 1698160540736 });
// with a timestamp and data seed
factory = ulid.factory({ timestamp: 1698160540736, data: 369740473983206468055316n });

const ulid1 = factory.ulid(); // 01HDH42Z209S5TQNW6QK6BEW8M
const uuid2 = factory.uuid(); // 018B6241-7C40-4E4B-ABD7-86BCCCB77115
const ulid3 = factory.ulid(); // 01HDH42Z209S5TQNW6QK6BEW8P
const uuid4 = factory.uuid(); // 018B6241-7C40-4E4B-ABD7-86BCCCB77117
```

## Factory.ulid()

Returns a ULID from the factory.

**returns** `string`

```javascript
import { ulid } from '@evokegroup/ulid';

const factory = ulid.factory();
const ulid1 = factory.ulid(); // 01HDH8AJWQ9X7ABB2P330S362Y
const ulid2 = factory.ulid(); // 01HDH8AJWQ9X7ABB2P330S362Z
const ulid3 = factory.ulid(); // 01HDH8AJWQ9X7ABB2P330S3630
```

## Factory.uuid()

Returns a UUID v4 from the factory.

**returns** `string`

```javascript
import { ulid } from '@evokegroup/ulid';

const factory = ulid.factory();
const uuid1 = factory.uuid(); // 018B6286-CC0B-4F0B-DDEC-B6040D445C4E
const uuid2 = factory.uuid(); // 018B6286-CC0B-4F0B-DDEC-B6040D445C4F
const uuid3 = factory.uuid(); // 018B6286-CC0B-4F0B-DDEC-B6040D445C50
```

## Constants

| Name | Type | Description |
| --- | --- | --- |
| ULID_CHARS | `string` | The characters used to encode a ULID |
| ULID_TIMESTAMP_LENGTH | `number` | The length of the timestamp portion of a ULID |
| UUID_TIMESTAMP_LENGTH | `number` | The length of the timestamp portion of a UUID |
| FACTORY_DATA_MIN | `bigint` | The minimum data seed value for the `Factory` |
| FACTORY_DATA_MAX | `bigint` | The maximum data seed value for the `Factory` |