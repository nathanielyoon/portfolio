const l = (a: number, b: number) => a << b | a >>> 32 - b,
  r = (a: number, b: number) => a >>> b | a << 32 - b;
export default (key: Uint8Array, seed: number) => { // gitlab.com/fwojcik/smhasher3/-/raw/main/hashes/falcon_oaat.cpp
  let h1 = seed ^ 0x3b00, h2 = l(seed, 15);
  for (let z = 0; z < key.length; ++z) {
    h1 += key[z], h1 += h1 << 3, h2 += h1, h2 = l(h2, 7), h2 += h2 << 2;
  }
  h1 ^= h2, h1 += l(h2, 14), h2 ^= h1, h2 += r(h1, 6);
  return h1 ^= h2, h1 += l(h2, 5), h2 ^= h1, h2 += r(h1, 8);
};
