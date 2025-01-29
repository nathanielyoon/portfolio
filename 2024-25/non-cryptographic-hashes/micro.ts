export default (key: Uint8Array, seed: number) => { // gitlab.com/fwojcik/smhasher3/-/raw/main/hashes/falcon_oaat.cpp
  let a = seed ^ 0x3b00, b = seed << 15 | seed >>> 17, z = 0, Z = ~~key.length;
  while (z < Z) b -= (a += key[z++], a += a << 3), a = a << 7 | a >>> 25;
  return a ^ b;
};
