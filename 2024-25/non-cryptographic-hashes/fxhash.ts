const n = (a: Uint8Array, z: number) =>
    a[z - 4] | a[z - 3] << 8 | a[z - 2] << 16 | a[z - 1] << 24,
  F = ~~0x9e3779b9;
export default (key: Uint8Array, seed: number) => { // hg.mozilla.org/mozilla-central/raw-file/09935ede3c77/netwerk/cache/nsDiskCacheDevice.cpp
  let a = F, b = F, c = ~~seed, z = 0, Z = ~~key.length, Y = Z - 12;
  while (z < Y) {
    a += n(key, z += 4), b += n(key, z += 4), c += n(key, z += 4);
    a -= b + c, a ^= c >> 13, b -= c + a, b ^= a << 8, c -= a + b, c ^= b >> 13;
    a -= b + c, a ^= c >> 12, b -= c + a, b ^= a << 16, c -= a + b, c ^= b >> 5;
    a -= b + c, a ^= c >> 3, b -= c + a, b ^= a << 10, c -= a + b, c ^= b >> 15;
  } // dprint-ignore
  switch(c += Z, Z - z) {
    case 11: c += key[10] << 24;
    case 10: c += key[9] << 16;
    case 9: c += key[8] << 8;
    case 8: b += key[7] << 24;
    case 7: b += key[6] << 16;
    case 6: b += key[5] << 8;
    case 5: b += key[4];
    case 4: a += key[3] << 24;
    case 3: a += key[2] << 16;
    case 2: a += key[1] << 8;
    case 1: a += key[0];
  }
  a -= b + c, a ^= c >> 13, b -= c + a, b ^= a << 8, c -= a + b, c ^= b >> 13;
  a -= b + c, a ^= c >> 12, b -= c + a, b ^= a << 16, c -= a + b, c ^= b >> 5;
  return a -= b + c, a ^= c >> 3, b -= c + a, b ^= a << 10, c - a - b ^ b >> 15;
};
