
export const ULID_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ULID_TIMESTAMP_LENGTH = 10;
export const UUID_TIMESTAMP_LENGTH = 12;
export const TIMESTAMP_MIN = 0;
export const TIMESTAMP_MAX = 281474976710655;
export const FACTORY_DATA_MIN = BigInt('302240678275694148452352');
export const FACTORY_DATA_MAX = BigInt('377789318629571617095679');
const regexULID = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i;
const regexUUID = /^\{?[0-9A-F]{8}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{12}\}?$/i;
const ERROR_INVALID = 'Invalid format';
const ERROR_TIMESTAMP = `Timestamp (##VALUE##) must be between ${TIMESTAMP_MIN} and ${TIMESTAMP_MAX}`;
const ERROR_DATA = `Data value (##VALUE##) must be between ${FACTORY_DATA_MIN} and ${FACTORY_DATA_MAX}`;
function isULID(id) {
    return typeof (id) == 'string' && regexULID.test(id);
}
function isUUID(id) {
    return typeof (id) == 'string' && regexUUID.test(id);
}
function getIdFormat(id) {
    const format = isULID(id) ? 'ulid' : isUUID(id) ? 'uuid' : null;
    if (format === null) {
        throw new Error(ERROR_INVALID);
    }
    return format;
}
function parseBigInt(str, radix) {
    const negate = str.charAt(0) === '-';
    const big = str.slice(negate ? 1 : 0).split('').reduce((r, v) => {
        return r * BigInt(radix) + BigInt(parseInt(v, radix));
    }, BigInt(0));
    return negate ? -big : big;
}
function encode(val) {
    const str = [];
    const type = typeof (val);
    const base = type == 'number' ? ULID_CHARS.length : BigInt(ULID_CHARS.length);
    while (val > 0) {
        str.unshift(ULID_CHARS[val % base]);
        val = type == 'number' ? Math.floor(val / base) : (val / base);
    }
    return str.join('');
}
function decode(str) {
    const val = str.toUpperCase();
    let num = BigInt(0);
    const length = val.length;
    const base = BigInt(ULID_CHARS.length);
    for (let i = 0; i < length; i++) {
        num = (num * base) + BigInt(ULID_CHARS.indexOf(val[i]));
    }
    return num;
}
function cleanUUID(id) {
    return id.replace(/[-\{\}]/g, '');
}
function randomData(format) {
    const data = [...crypto.getRandomValues(new Uint16Array(5))]
        .map((val, i) => {
        switch (i) {
            case 0:
                return Math.floor(val / 65535 * 4096) + 16384;
            case 1:
                return Math.floor(val / 65535 * 32767) + 32768;
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
    }
    else {
        return convertData(data, 'uuid', 'ulid');
    }
}
function convertData(data, from, to) {
    if (from === 'uuid') {
        data = cleanUUID(data);
        data = data.substring(data.length - 20).toLowerCase();
        if (to === 'uuid') {
            return data;
        }
        else {
            return encode(parseBigInt(data, 16));
        }
    }
    else {
        data = data.substring(data.length - 16).toUpperCase();
        if (to === 'ulid') {
            return data;
        }
        else {
            return decode(data).toString(16);
        }
    }
}
function encodeTimestamp(timestamp, format = 'ulid') {
    if (format === 'uuid') {
        return timestamp.toString(16).toUpperCase();
    }
    else {
        return encode(timestamp);
    }
}
function decodeTimestamp(timestamp, format = 'ulid') {
    if (format === 'uuid') {
        return parseInt(cleanUUID(timestamp).substring(0, UUID_TIMESTAMP_LENGTH).toLowerCase(), 16);
    }
    else {
        return Number(decode(timestamp.substring(0, ULID_TIMESTAMP_LENGTH)));
    }
}
function convertID(id, to) {
    if (typeof (id) != 'string' || typeof (to) != 'string') {
        throw new Error(ERROR_INVALID);
    }
    const from = getIdFormat(id);
    if (from === to) {
        return id;
    }
    else {
        const timestamp = encodeTimestamp(decodeTimestamp(id, from), to);
        const data = convertData(id, from, to);
        if (to === 'uuid') {
            return formatUUID(timestamp, data);
        }
        else {
            return formatULID(timestamp, data);
        }
    }
}
function validateTimestamp(timestamp) {
    if (timestamp < TIMESTAMP_MIN || timestamp > TIMESTAMP_MAX) {
        throw new Error(ERROR_TIMESTAMP.replace('##VALUE##', timestamp.toString()));
    }
}
function formatULID(timestamp, data) {
    return `${timestamp.padStart(ULID_TIMESTAMP_LENGTH, '0')}${data.padStart(16, '0')}`;
}
function formatUUID(timestamp, data) {
    const s = `${timestamp.padStart(UUID_TIMESTAMP_LENGTH, '0')}${data.padStart(20, '0')}`.toUpperCase().padStart(32, '0');
    return `${s.substring(0, 8)}-${s.substring(8, 12)}-${s.substring(12, 16)}-${s.substring(16, 20)}-${s.substring(20)}`;
}
export function ulid(timestamp) {
    timestamp = timestamp ?? Date.now();
    validateTimestamp(timestamp);
    return formatULID(encodeTimestamp(timestamp), randomData('ulid'));
}
ulid.uuid = (timestamp) => {
    timestamp = timestamp ?? Date.now();
    validateTimestamp(timestamp);
    return formatUUID(encodeTimestamp(timestamp, 'uuid'), randomData('uuid'));
};
ulid.is = (id) => {
    return isULID(id);
};
ulid.timestamp = (id) => {
    const format = getIdFormat(id);
    return decodeTimestamp(id, format);
};
ulid.data = (id) => {
    const format = getIdFormat(id);
    if (format === 'uuid') {
        return parseBigInt(cleanUUID(id).substring(UUID_TIMESTAMP_LENGTH).toLowerCase(), 16);
    }
    else {
        return decode(id.substring(ULID_TIMESTAMP_LENGTH).toUpperCase());
    }
};
ulid.toUUID = (id) => {
    return convertID(id, 'uuid');
};
ulid.fromUUID = (id) => {
    return convertID(id, 'ulid');
};
ulid.factory = (() => {
    let ts = Date.now();
    let dt = FACTORY_DATA_MIN;
    let f = 'ulid';
    function generate() {
        let data = dt.toString(16);
        if (!/^[89a-f]$/.test(data.charAt(4))) {
            dt += BigInt('9223372036854775808');
            data = dt.toString(16);
        }
        return data;
    }
    function increment() {
        if (dt < FACTORY_DATA_MAX) {
            dt++;
        }
        else {
            dt = FACTORY_DATA_MIN;
            ts++;
            validateTimestamp(ts);
        }
    }
    return ({ timestamp, data } = {}) => {
        ts = timestamp ?? Date.now();
        validateTimestamp(ts);
        dt = data ?? parseBigInt(randomData('uuid'), 16);
        if (dt < FACTORY_DATA_MIN || dt > FACTORY_DATA_MAX) {
            throw new Error(ERROR_DATA.replace('##VALUE##', dt.toString()));
        }
        else {
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
