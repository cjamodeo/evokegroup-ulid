import { webcrypto } from 'crypto';
import { ulid } from '../src_dev/index';

interface Tests {
  passed: number;
  data?: string[];
  failed: string[];
}

// (() => {
//   const id = ulid();
//   console.log(ulid.data(id));
//   const uuid = ulid.convert(id, 'uuid');
//   const id_back = ulid.convert(uuid, 'ulid');
//   console.log(`${id} => ${uuid} => ${id_back}`);
//   console.log(id_back === id);
// })();

// (() => {
//   const uuid = webcrypto.randomUUID();
//   console.log(ulid.data(uuid));
//   const id = ulid.convert(uuid, 'ulid');
//   const uuid_back = ulid.convert(id, 'uuid').toLowerCase();
//   console.log(`${uuid} => ${id} => ${uuid_back}`);
//   console.log(uuid_back === uuid);
// })();

// console.log(ulid.convert('01HDEH0EYSJPRX17CTBBBXEFSP', 'uuid'));
// console.log(ulid.convert('018B5D10-3BD9-95B1-D09D-9A5AD7D73F36', 'ulid'));
// console.log(ulid.data('01HDEH0EYSJPRX17CTBBBXEFSP'));
// console.log(ulid.data('018B5D10-3BD9-95B1-D09D-9A5AD7D73F36'));

(() => {
  const tests: Tests = {
    passed: 0,
    failed: []
  };
  const MAX = 100000;
  for (let i=0; i<MAX; i++) {
    const id = ulid();
    const flag = ulid.convert(ulid.convert(id, 'uuid'), 'ulid') === id;
    if (!flag) {
      tests.failed.push(id);
    } else {
      tests.passed++;
    }
  }
  console.log(`Run ${MAX} ULID => UUID => ULID conversions`);
  console.log(tests);
  console.log();
})();

(() => {
  const tests: Tests = {
    passed: 0,
    failed: []
  };
  const MAX = 100000;
  for (let i=0; i<MAX; i++) {
    const id = ulid.uuid();
    const flag = ulid.convert(ulid.convert(id, 'ulid'), 'uuid') === id;
    if (!flag) {
      tests.failed.push(id);
    } else {
      tests.passed++;
    }
  }
  console.log(`Run ${MAX} UUID => ULID => UUID conversions`);
  console.log(tests);
  console.log();
})();

(() => {
  const tests: Tests = {
    passed: 0,
    data: [],
    failed: []
  };
  const MAX = 100000;
  for (let i=0; i<MAX; i++) {
    const id = webcrypto.randomUUID();
    const flag = ulid.convert(ulid.convert(id, 'ulid'), 'uuid').toLowerCase() === id;
    if (!flag) {
      tests.failed.push(id);
      tests.data?.push(`=> ${ulid.convert(id, 'ulid')} => ${ulid.convert(ulid.convert(id, 'ulid'), 'uuid').toLowerCase()}`);
    } else {
      tests.passed++;
    }
  }
  console.log('--------------------------------------------------');
  console.log(`Run ${MAX} external UUID => ULID => UUID conversions`);
  console.log(tests);
  console.log();
})();


(() => {
  var data = {
    '01HDEJST6W9AS0AX2854K5K95Q': '018B5D2C-E8DC-4AB2-0574-48292659A4B7',
    '01HDEJTEWHPGWKFHNSA7SDAJQ0': '018B5D2D-3B91-B439-37C6-B951F2D54AE0',
    '01HDEJTTJ2DHHSJ3SR5CGCJXNV': '018B5D2D-6A42-6C63-990F-382B20C976BB',
    '01HDEJVBJTV41R9R4WABC8DBMY': '018B5D2D-AE5A-D903-84E0-9C52D886AE9E',
    '01HDEJVSAQXBC5JZRDHKM2HDCR': '018B5D2D-E557-EAD8-597F-0D8CE828B598'
  }
  const tests: Tests = {
    passed: 0,
    data: [],
    failed: []
  };
  const MAX = Object.keys(data).length;
  Object.keys(data).forEach((key) => {
    const id = key as keyof typeof data;
    const flag = ulid.convert(key as string, 'uuid') === data[id] && ulid.convert(data[id], 'ulid') === key as string;
    if (!flag) {
      tests.failed.push(key as string);
    } else {
      tests.passed++;
    }
  });

  console.log('--------------------------------------------------');
  console.log(`Run ${MAX} external ULID conversions`);
  console.log(tests);
  console.log();
})();