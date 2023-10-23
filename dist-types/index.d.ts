export declare const ULID_CHARS: string;
export declare const ULID_TIMESTAMP_LENGTH: number;
export declare const UUID_TIMESTAMP_LENGTH: number;
export declare function ulid(timestamp?: number): string;
export declare namespace ulid {
    var uuid: (timestamp?: number) => string;
    var is: (id: string) => boolean;
    var timestamp: (id: string) => number;
    var data: (id: string) => bigint;
    var toUUID: (id: string) => string;
    var fromUUID: (id: string) => string;
}
