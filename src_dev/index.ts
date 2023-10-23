import { webcrypto } from 'node:crypto';

export const ULID_CHARS: string = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ULID_TIMESTAMP_LENGTH: number = 10;
export const ULID_DATA_LENGTH: number = 16;

export const UUID_CHARS: string = '0123456789ABCDEF';
export const UUID_TIMESTAMP_LENGTH: number = 12;
export const UUID_DATA_LENGTH: number = 20;

const regexULID = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i;
const regexUUID = /^\{?[0123456789ABCDEF]{8}-?[0123456789ABCDEF]{4}-?[0123456789ABCDEF]{4}-?[0123456789ABCDEF]{4}-?[0123456789ABCDEF]{12}\}?$/i;

const ERROR_INVALID = 'Invalid format';

export type IDFormat = 'ulid' | 'uuid';

function isULID(id: string): boolean {
  return typeof(id) == 'string' && regexULID.test(id);
}

function isUUID(id: string): boolean {
  return typeof(id) == 'string' && regexUUID.test(id);
}

function getIdFormat(id: string): IDFormat | null {
  return isULID(id) ? 'ulid' : isUUID(id) ? 'uuid' : null;
}

function parseBigInt(str: string, radix: number): bigint {
  return str.split('').reduce((r, v) => {
    return r * BigInt(radix) + BigInt(parseInt(v, radix));
  }, 0n);
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

function convertData(data: string, from: IDFormat, to: IDFormat) {
  if (from === 'uuid') {
    data = cleanUUID(data).substring(UUID_TIMESTAMP_LENGTH).toLowerCase();
    if (to === 'uuid') {
      return data;
    } else {
      return base32ToCrockford(parseBigInt(data, 16).toString(32));
    }
  } else {
    data = data.substring(ULID_TIMESTAMP_LENGTH).toUpperCase();
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
    return base32ToCrockford(timestamp.toString(32)).padStart(ULID_TIMESTAMP_LENGTH, '0');
  }
}

function decodeTimestamp(timestamp: string, format: IDFormat = 'ulid'): number {
  if (format === 'uuid') {
    return parseInt(cleanUUID(timestamp).substring(0, UUID_TIMESTAMP_LENGTH).toLowerCase(), 16);
  } else {
    return parseInt(crockfordToBase32(timestamp.substring(0, ULID_TIMESTAMP_LENGTH).toUpperCase()), 32);
  }
}

function formatULID(timestamp: string, data: string) {
  return `${timestamp}${data}`;
}
function formatUUID(timestamp: string, data: string) {
  const s = `${timestamp}${data}`.toUpperCase().padStart(32, '0');
  return `${s.substring(0, 8)}-${s.substring(8, 12)}-${s.substring(12, 16)}-${s.substring(16, 20)}-${s.substring(20)}`;
}

export function ulid(timestamp: number = Date.now()): string {
  return formatULID(encodeTimestamp(timestamp), convertData(webcrypto.randomUUID(), 'uuid', 'ulid'));
}

ulid.uuid = (timestamp: number = Date.now()): string => {
  return formatUUID(encodeTimestamp(timestamp, 'uuid'), convertData(webcrypto.randomUUID(), 'uuid', 'uuid'));
}

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

ulid.convert = (id: string, to: IDFormat): string => {
  if (typeof(id) != 'string' || typeof(to) != 'string') {
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
};
