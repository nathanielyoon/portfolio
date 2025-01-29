export const U = 2 ** 32;
export const min = (a: number, b: number) => b + (a - b & a - b >> 31);
export const max = (a: number, b: number) => a - (a - b & a - b >> 31);
export const rng = (state: bigint) => state * 0xe817fb2dn & 0xffffffffffffffffn;
const M = BigInt(Number.MAX_SAFE_INTEGER);
export const and = (int: bigint, mod: number) => Number(int & M) % mod;
export const mix = (a: number) => (
  a -= a << 6,
    a ^= a >> 17,
    a -= a << 9,
    a ^= a << 4,
    a -= a << 3,
    a ^= a << 10,
    a ^ a >> 15
);
export const b_b32 = (binary: Uint8Array) => {
  const a = new Uint32Array(8);
  for (let z = 0; z < 32; ++z) a[z >> 2] |= binary[z] << (z << 3);
  return a;
};
