import crypto from 'crypto';
export const ULID_CHARS = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const ULID_TIMESTAMP_LENGTH = 10;
export const UUID_TIMESTAMP_LENGTH = 12;
export const FACTORY_DATA_MIN = BigInt(302240678275694148452352);
export const FACTORY_DATA_MAX = BigInt(377789318629571617095679);
const regexULID = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i;
const regexUUID = /^\{?[0-9A-F]{8}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{4}-?[0-9A-F]{12}\}?$/i;
const ERROR_INVALID = 'Invalid format';
function isULID(id) {
    return typeof (id) == 'string' && regexULID.test(id);
}
function isUUID(id) {
    return typeof (id) == 'string' && regexUUID.test(id);
}
function getIdFormat(id) {
    return isULID(id) ? 'ulid' : isUUID(id) ? 'uuid' : null;
}
function parseBigInt(str, radix) {
    return str.split('').reduce((r, v) => {
        return r * BigInt(radix) + BigInt(parseInt(v, radix));
    }, BigInt(0));
}
function base32ToCrockford(str) {
    return str.toUpperCase().split('').map((s) => {
        let index = s.charCodeAt(0);
        let shift = 0;
        if (index >= 73) {
            shift++;
            if (index >= 75)
                shift++;
            if (index >= 77)
                shift++;
            if (index >= 82)
                shift++;
            return String.fromCharCode(index + shift);
        }
        else {
            return s;
        }
    }).join('');
}
function crockfordToBase32(str) {
    return str.toUpperCase().split('').map((s) => {
        let index = s.charCodeAt(0);
        let shift = 0;
        if (index >= 74) {
            shift++;
            if (index >= 77)
                shift++;
            if (index >= 80)
                shift++;
            if (index >= 86)
                shift++;
            return String.fromCharCode(index - shift);
        }
        else {
            return s;
        }
    }).join('').toLowerCase();
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
            return base32ToCrockford(parseBigInt(data, 16).toString(32));
        }
    }
    else {
        data = data.substring(data.length - 16).toUpperCase();
        if (to === 'ulid') {
            return data;
        }
        else {
            return parseBigInt(crockfordToBase32(data), 32).toString(16);
        }
    }
}
function encodeTimestamp(timestamp, format = 'ulid') {
    if (format === 'uuid') {
        return timestamp.toString(16).toUpperCase();
    }
    else {
        return base32ToCrockford(timestamp.toString(32));
    }
}
function decodeTimestamp(timestamp, format = 'ulid') {
    if (format === 'uuid') {
        return parseInt(cleanUUID(timestamp).substring(0, UUID_TIMESTAMP_LENGTH).toLowerCase(), 16);
    }
    else {
        return parseInt(crockfordToBase32(timestamp.substring(0, ULID_TIMESTAMP_LENGTH).toUpperCase()), 32);
    }
}
function convertID(id, to) {
    if (typeof (id) != 'string' || typeof (to) != 'string') {
        throw new Error(ERROR_INVALID);
    }
    const from = getIdFormat(id);
    if (from === null) {
        throw new Error(ERROR_INVALID);
    }
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
function formatULID(timestamp, data) {
    return `${timestamp.padStart(ULID_TIMESTAMP_LENGTH, '0')}${data.padStart(16, '0')}`;
}
function formatUUID(timestamp, data) {
    const s = `${timestamp.padStart(UUID_TIMESTAMP_LENGTH, '0')}${data.padStart(20, '0')}`.toUpperCase().padStart(32, '0');
    return `${s.substring(0, 8)}-${s.substring(8, 12)}-${s.substring(12, 16)}-${s.substring(16, 20)}-${s.substring(20)}`;
}
export function ulid(timestamp) {
    return formatULID(encodeTimestamp(timestamp ?? Date.now()), randomData('ulid'));
}
ulid.uuid = (timestamp) => {
    return formatUUID(encodeTimestamp(timestamp ?? Date.now(), 'uuid'), randomData('uuid'));
};
ulid.is = (id) => {
    return isULID(id);
};
ulid.timestamp = (id) => {
    const format = getIdFormat(id);
    if (format === null) {
        throw new Error(ERROR_INVALID);
    }
    return decodeTimestamp(id, format);
};
ulid.data = (id) => {
    const format = getIdFormat(id);
    if (format === null) {
        throw new Error(ERROR_INVALID);
    }
    if (format === 'uuid') {
        return parseBigInt(cleanUUID(id).substring(UUID_TIMESTAMP_LENGTH).toLowerCase(), 16);
    }
    else {
        return parseBigInt(crockfordToBase32(id.substring(ULID_TIMESTAMP_LENGTH).toUpperCase()), 32);
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
        let data = '';
        if (dt <= FACTORY_DATA_MAX) {
            data = dt.toString(16);
            if (!/^[89a-f]$/.test(data.charAt(4))) {
                dt += BigInt(9223372036854775808);
                data = dt.toString(16);
            }
            dt++;
        }
        else {
            data = (FACTORY_DATA_MIN).toString(16);
            ts++;
            dt = FACTORY_DATA_MIN + BigInt(1);
        }
        return data;
    }
    return ({ timestamp, data } = {}) => {
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
