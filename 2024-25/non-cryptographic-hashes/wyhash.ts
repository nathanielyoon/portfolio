const n = (a: Uint8Array, z: number) =>
  a[z - 4] | a[z - 3] << 8 | a[z - 2] << 16 | a[z - 1] << 24;
export default (key: Uint8Array, seed: number) => { // github.com/wangyi-fudan/wyhash
  const Z = ~~key.length, Y = Z - 8;
  let a = ~~seed, b = Z, z = 0;
  let c = a ^ 0x53c5ca59, c0 = c >>> 16, c1 = c & 0xffff;
  let d = b ^ 0x74743c1b, d0 = d >>> 16, d1 = d & 0xffff;
  let e0 = c1 * d1, e1 = c0 * d0, e2 = (c1 + c0) * (d1 + d0) - e1 - e0;
  a = (e0 + e2 * 0x10000) % 0x100000000, b = e1 + ~~(e2 / 0x10000);
  while (z < Y) {
    c = a ^ (key[z++] | key[z++] << 8 | key[z++] << 16 | key[z++] << 24)
      ^ 0x53c5ca59;
    d = b ^ (key[z++] | key[z++] << 8 | key[z++] << 16 | key[z++] << 24)
      ^ 0x74743c1b;
    c0 = c >>> 16, c1 = c & 0xffff, d0 = d >>> 16, d1 = d & 0xffff;
    e0 = c1 * d1, e1 = c0 * d0, e2 = (c1 + c0) * (d1 + d0) - e1 - e0;
    a = (e0 + e2 * 0x10000) % 0x100000000, b = e1 + ~~(e2 / 0x10000);
  }
  // dprint-ignore
  switch (Z - z) {
    case 7: b ^= key[z++] << 16;
    case 6: b ^= key[z++] << 8;
    case 5: b ^= key[z++];
    case 4: a ^= key[z++] << 24;
    case 3: a ^= key[z++] << 16;
    case 2: a ^= key[a++] << 8
    case 1: a ^= key[a];
  }
  c = a ^ 0x53c5ca59, c0 = c >>> 16, c1 = c & 0xffff;
  d = b ^ 0x74743c1b, d0 = d >>> 16, d1 = d & 0xffff;
  e0 = c1 * d1, e1 = c0 * d0, e2 = (c1 + c0) * (d1 + d0) - e1 - e0;
  a = (e0 + e2 * 0x10000) % 0x100000000, b = e1 + ~~(e2 / 0x10000);
  c = a ^ 0x53c5ca59, c0 = c >>> 16, c1 = c & 0xffff;
  d = b ^ 0x74743c1b, d0 = d >>> 16, d1 = d & 0xffff;
  e0 = c1 * d1, e1 = c0 * d0, e2 = (c1 + c0) * (d1 + d0) - e1 - e0;
  return (e0 + e2 * 0x10000) % 0x100000000 ^ e1 + ~~(e2 / 0x10000);
};
