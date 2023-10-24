import crypto from 'crypto';

export const ULID_CHARS: string = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ULID_TIMESTAMP_LENGTH: number = 10;
export const UUID_TIMESTAMP_LENGTH: number = 12;
export const TIMESTAMP_MIN = 0;
export const TIMESTAMP_MAX = 281474976710655; // A timestamp greater than this value would have more than 12 characters in the UUID format

export const FACTORY_DATA_MIN = BigInt('302240678275694148452352');
export const FACTORY_DATA_MAX = BigInt('377789318629571617095679');

const regexULID = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i;
const regexUUID = /^\{?[0-9A-F]{8}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{12}\}?$/i;

const ERROR_INVALID = 'Invalid format';
const ERROR_TIMESTAMP = `Timestamp (##VALUE##) must be between ${TIMESTAMP_MIN} and ${TIMESTAMP_MAX}`;
const ERROR_DATA = `Data value (##VALUE##) must be between ${FACTORY_DATA_MIN} and ${FACTORY_DATA_MAX}`;

type IDFormat = 'ulid' | 'uuid';

function isULID(id: string): boolean {
  return typeof (id) == 'string' && regexULID.test(id);
}

function isUUID(id: string): boolean {
  return typeof (id) == 'string' && regexUUID.test(id);
}

function getIdFormat(id: string): IDFormat {
  const format: IDFormat | null = isULID(id) ? 'ulid' : isUUID(id) ? 'uuid' : null;
  if (format === null) {
    throw new Error(ERROR_INVALID);
  }
  return format;
}

function parseBigInt(str: string, radix: number): bigint {
  const negate = str.charAt(0) === '-';
  const big: bigint = str.slice(negate ? 1 : 0).split('').reduce((r, v) => {
    return r * BigInt(radix) + BigInt(parseInt(v, radix));
  }, BigInt(0));
  return negate ? -big : big;
}

function base32ToCrockford(str: string): string {
  return str.toUpperCase().split('').map((s) => {
    let index = s.charCodeAt(0);
    let shift = 0;
    if (index >= 73) { // I => J
      shift++;
      if (index >= 75) shift++; // K => M
      if (index >= 77) shift++; // M => P
      if (index >= 82) shift++; // R => V
      return String.fromCharCode(index + shift);
    } else {
      return s;
    }
  }).join('');
}

function crockfordToBase32(str: string): string {
  return str.toUpperCase().split('').map((s) => {
    let index = s.charCodeAt(0);
    let shift = 0;
    if (index >= 74) { // J => I
      shift++;
      if (index >= 77) shift++; // M => K
      if (index >= 80) shift++; // P => M
      if (index >= 86) shift++; // V => R
      return String.fromCharCode(index - shift);
    } else {
      return s;
    }
  }).join('').toLowerCase();
}

function cleanUUID(id: string): string {
  return id.replace(/[-\{\}]/g, '');
}

function randomData(format: IDFormat) {
  const data: string = [...crypto.getRandomValues(new Uint16Array(5))]
    .map((val, i) => {
      switch (i) {
        case 0:
          return Math.floor(val / 65535 * 4096) + 16384; // 4\d{3}
        case 1:
          return Math.floor(val / 65535 * 32767) + 32768; // [89a-f]\d{3}
        default:
          return val;
      }
    })
    .map((val) => {
      return val.toString(16).padStart(4, '0');
    })
    .join('');
  if (format === 'uuid') {
    return data;
  } else {
    return convertData(data, 'uuid', 'ulid');
  }
}

function convertData(data: string, from: IDFormat, to: IDFormat) {
  if (from === 'uuid') {
    data = cleanUUID(data);
    data = data.substring(data.length - 20).toLowerCase();
    if (to === 'uuid') {
      return data;
    } else {
      return base32ToCrockford(parseBigInt(data, 16).toString(32));
    }
  } else {
    data = data.substring(data.length - 16).toUpperCase();
    if (to === 'ulid') {
      return data;
    } else {
      return parseBigInt(crockfordToBase32(data), 32).toString(16);
    }
  }
}

function encodeTimestamp(timestamp: number, format: IDFormat = 'ulid'): string {
  if (format === 'uuid') {
    return timestamp.toString(16).toUpperCase();
  } else {
    return base32ToCrockford(timestamp.toString(32));
  }
}

function decodeTimestamp(timestamp: string, format: IDFormat = 'ulid'): number {
  if (format === 'uuid') {
    return parseInt(cleanUUID(timestamp).substring(0, UUID_TIMESTAMP_LENGTH).toLowerCase(), 16);
  } else {
    return parseInt(crockfordToBase32(timestamp.substring(0, ULID_TIMESTAMP_LENGTH).toUpperCase()), 32);
  }
}

function convertID(id: string, to: IDFormat): string {
  if (typeof (id) != 'string' || typeof (to) != 'string') {
    throw new Error(ERROR_INVALID);
  }
  const from: IDFormat = getIdFormat(id);
  if (from === to) {
    return id;
  } else {
    const timestamp = encodeTimestamp(decodeTimestamp(id, from), to);
    const data = convertData(id, from, to);
    if (to === 'uuid') {
      return formatUUID(timestamp, data);
    } else {
      return formatULID(timestamp, data);
    }
  }
}

function validateTimestamp(timestamp: number) {
  if (timestamp < TIMESTAMP_MIN || timestamp > TIMESTAMP_MAX) {
    throw new Error(ERROR_TIMESTAMP.replace('##VALUE##', timestamp.toString()));
  }
}

function formatULID(timestamp: string, data: string) {
  return `${timestamp.padStart(ULID_TIMESTAMP_LENGTH, '0')}${data.padStart(16, '0')}`;
}
function formatUUID(timestamp: string, data: string) {
  const s = `${timestamp.padStart(UUID_TIMESTAMP_LENGTH, '0')}${data.padStart(20, '0')}`.toUpperCase().padStart(32, '0');
  return `${s.substring(0, 8)}-${s.substring(8, 12)}-${s.substring(12, 16)}-${s.substring(16, 20)}-${s.substring(20)}`;
}

export function ulid(timestamp?: number): string {
  timestamp = timestamp ?? Date.now();
  validateTimestamp(timestamp);
  return formatULID(
    encodeTimestamp(timestamp), 
    randomData('ulid')
  );
}

ulid.uuid = (timestamp?: number): string => {
  timestamp = timestamp ?? Date.now();
  validateTimestamp(timestamp);
  return formatUUID(
    encodeTimestamp(timestamp, 'uuid'),
    randomData('uuid')
  );
};

ulid.is = (id: string): boolean => {
  return isULID(id);
};

ulid.timestamp = (id: string): number => {
  const format: IDFormat = getIdFormat(id);
  return decodeTimestamp(id, format);
};

ulid.data = (id: string): bigint => {
  const format: IDFormat = getIdFormat(id);
  if (format === 'uuid') {
    return parseBigInt(cleanUUID(id).substring(UUID_TIMESTAMP_LENGTH).toLowerCase(), 16);
  } else {
    return parseBigInt(crockfordToBase32(id.substring(ULID_TIMESTAMP_LENGTH).toUpperCase()), 32);
  }
};

ulid.toUUID = (id: string): string => {
  return convertID(id, 'uuid');
};

ulid.fromUUID = (id: string): string => {
  return convertID(id, 'ulid');
};

export interface Factory {
  ulid(): string;
  uuid(): string;
}
ulid.factory = (() => {
  let ts: number = Date.now();
  let dt: bigint = FACTORY_DATA_MIN;
  let f: IDFormat = 'ulid';
  
  function generate(): string {
    let data = dt.toString(16);
    if (!/^[89a-f]$/.test(data.charAt(4))) {
      dt += BigInt('9223372036854775808'); // 40010000000000000000 => 40018000000000000000
      data = dt.toString(16);
    }
    return data;
  }
  
  function increment() {
    if (dt < FACTORY_DATA_MAX) {
      dt++;
    } else {
      dt = FACTORY_DATA_MIN;
      ts++;
      validateTimestamp(ts);
    }
  }

  return ({ timestamp, data } : {timestamp?: number, data?: bigint} = {}): Factory => {
    ts = timestamp ?? Date.now();
    validateTimestamp(ts);
    dt = data ?? parseBigInt(randomData('uuid'), 16);
    if (dt < FACTORY_DATA_MIN || dt > FACTORY_DATA_MAX) {
      throw new Error(ERROR_DATA.replace('##VALUE##', dt.toString()));
    } else {
      dt--;
    }
    return {
      ulid: () => {
        increment();
        const data = generate();
        return formatULID(encodeTimestamp(ts, 'ulid'), convertData(data, 'uuid', 'ulid'));
      },
      uuid: () => {
        increment();
        const data = generate();
        return formatUUID(encodeTimestamp(ts, 'uuid'), convertData(data, 'uuid', 'uuid'));
      }
    };
  };
})();
