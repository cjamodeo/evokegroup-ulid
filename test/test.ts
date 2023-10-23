import { getRandomValues } from 'node:crypto';

const randomBigInt: Function = (() => {
  function max(big: bigint) {
    if (big > 1208925819614629174706175n) {
      return max(big >> 1n);
    } else {
      return big;
    }
  }
  function min(big: bigint) {
    if (big < 75557863725914323419135n) {
      return min(big << 1n);
    } else {
      return big;
    }
  }
  return (): bigint => {
    let big = BigInt(`${[...getRandomValues(new BigUint64Array(1))][0]}${[...getRandomValues(new Uint16Array(1))][0]}`);
    // Trying to do this in a while loop caused serious performance issues
    big = max(big);
    big = min(big);
    return big;
  };
})();

// function randomBigInt(): bigint {
//   let big: bigint = BigInt(`${[...getRandomValues(new BigUint64Array(1))][0]}${[...getRandomValues(new Uint16Array(1))][0]}`);
//   while (big > 1208925819614629174706175n) {
//     big >> 1n;
//   }
//   while (big < 75557863725914323419135n) {
//     big << 1n;
//   }
//   return big;
// }

interface Tests {
  passed: number;
  failed: any[];
}
const tests: Tests = {
  passed: 0,
  failed: []
};
const start = Date.now();
for (let i=0; i<1000000; i++) {
  const big: bigint = randomBigInt();
  const hex = big.toString(16);
  if (hex.length != 20) {
    tests.failed.push(big);
  } else {
    tests.passed++;
  }
}
console.log(tests);
console.log(`Run time: ${(Date.now() - start) / 1000}s`);