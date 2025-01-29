const C = 0xbea225f9;
export default (key: Uint32Array, seed = 0) => {
  let Z = ~~key.length, z = 0, a = seed ^ Z, b;
  while (z < Z) {
    a = Math.imul(
      C,
      a + Math.imul(C, (b = Math.imul(C, key[z++])) ^ (b >> 29 ^ b >> 17)),
    );
  }
  a = Math.imul(C, a);
  a = Math.imul(C, a ^ a >> 17);
  a = Math.imul(C, a ^ a >> 14);
  return (a ^ a >> 19) >>> 0;
};
