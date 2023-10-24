import crypto from 'crypto';

export const ULID_CHARS: string = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ULID_TIMESTAMP_LENGTH: number = 10;
export const UUID_TIMESTAMP_LENGTH: number = 12;
export const FACTORY_DATA_MIN = BigInt(302240678275694148452352);
export const FACTORY_DATA_MAX = BigInt(377789318629571617095679);

const regexULID = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i;
const regexUUID = /^\{?[0-9A-F]{8}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{12}\}?$/i;

const ERROR_INVALID = 'Invalid format';

type IDFormat = 'ulid' | 'uuid';

function isULID(id: string): boolean {
  return typeof (id) == 'string' && regexULID.test(id);
}

function isUUID(id: string): boolean {
  return typeof (id) == 'string' && regexUUID.test(id);
}

function getIdFormat(id: string): IDFormat | null {
  return isULID(id) ? 'ulid' : isUUID(id) ? 'uuid' : null;
}

function parseBigInt(str: string, radix: number): bigint {
  return str.split('').reduce((r, v) => {
    return r * BigInt(radix) + BigInt(parseInt(v, radix));
  }, BigInt(0));
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
  const from: IDFormat | null = getIdFormat(id);
  if (from === null) {
    throw new Error(ERROR_INVALID);
  }

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

function formatULID(timestamp: string, data: string) {
  return `${timestamp.padStart(ULID_TIMESTAMP_LENGTH, '0')}${data.padStart(16, '0')}`;
}
function formatUUID(timestamp: string, data: string) {
  const s = `${timestamp.padStart(UUID_TIMESTAMP_LENGTH, '0')}${data.padStart(20, '0')}`.toUpperCase().padStart(32, '0');
  return `${s.substring(0, 8)}-${s.substring(8, 12)}-${s.substring(12, 16)}-${s.substring(16, 20)}-${s.substring(20)}`;
}

export function ulid(timestamp?: number): string {
  return formatULID(
    encodeTimestamp(timestamp ?? Date.now()), 
    randomData('ulid')
  );
}

ulid.uuid = (timestamp?: number): string => {
  return formatUUID(
    encodeTimestamp(timestamp ?? Date.now(), 'uuid'),
    randomData('uuid')
  );
};

ulid.is = (id: string): boolean => {
  return isULID(id);
};

ulid.timestamp = (id: string): number => {
  const format: IDFormat | null = getIdFormat(id);
  if (format === null) {
    throw new Error(ERROR_INVALID);
  }
  return decodeTimestamp(id, format);
};

ulid.data = (id: string): bigint => {
  const format: IDFormat | null = getIdFormat(id);
  if (format === null) {
    throw new Error(ERROR_INVALID);
  }
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
    let data = '';
    if (dt <= FACTORY_DATA_MAX) {
      data = dt.toString(16);
      // 40008000000000000000
      // 4000ffffffffffffffff
      // 40018000000000000000
      if (!/^[89a-f]$/.test(data.charAt(4))) {
        dt += BigInt(9223372036854775808);
        data = dt.toString(16);
      }
      dt++;
    } else {
      data = (FACTORY_DATA_MIN).toString(16);
      ts++;
      dt = FACTORY_DATA_MIN + BigInt(1);
    }

    return data;
  }

  return ({ timestamp, data } : {timestamp?: number, data?: bigint} = {}): Factory => {
    ts = timestamp ?? Date.now();
    dt = data ?? parseBigInt(randomData('uuid'), 16);
    if (dt < FACTORY_DATA_MIN) {
      dt = FACTORY_DATA_MIN;
    }
    return {
      ulid: () => {
        const data = generate();
        return formatULID(encodeTimestamp(ts, 'ulid'), convertData(data, 'uuid', 'ulid'));
      },
      uuid: () => {
        const data = generate();
        return formatUUID(encodeTimestamp(ts, 'uuid'), convertData(data, 'uuid', 'uuid'));
      }
    };
  };
})();
