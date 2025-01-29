const A = ~~0xcc9e2d51;
const B = ~~0x1b873593;
const C = ~~0xe6546b64;
const D = ~~0x85ebca6b;
const E = ~~0xc2b2ae35;
export default (key: Uint32Array, seed = 0) => {
  let a = ~~seed, Z = ~~key.length;
  for (let z = 0, b; z < Z; ++z) {
    a = (a ^= Math.imul((b = Math.imul(key[z], A)) << 15 | b >>> 17, B)) << 13
      | a >>> 19, a += a << 2 + C;
  }
  a ^= Z, a = Math.imul(a ^ a >>> 16, D), a = Math.imul(a ^ a >>> 13, E);
  return (a ^ a >>> 16) >>> 0;
};
