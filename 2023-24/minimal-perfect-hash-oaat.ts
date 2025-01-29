const micro_oaat = (key: Uint8Array, seed: number) => { // github.com/rurban/smhasher/commit/3931fd6f723f4fb2afab6ef9a628912220e90ce7
  let a = seed ^ 0x3b00, b = seed << 15 | seed >>> 17, z = 0, Z = ~~key.length;
  while (z < Z) b -= (a += key[z++], a += a << 3), a = a << 7 | a >>> 25;
  return (a ^ b) >>> 0;
};
export const mph = (keys: Uint8Array[]) => { // cmph.sourceforge.net/papers/esa09.pdf
  const Z = keys.length, Y = Z >>> 2 || 1, a = new Uint32Array(Y);
  for (let z = 0; z < Y; ++z) a[z] = z;
  const b = new Uint8Array(Z), c = Array<Uint8Array[]>(Y);
  const d = new Uint32Array(Y + 1);
  z: for (let z = 0, y, x, w, X, e, f, g: number[], h; z < 0x100; ++z) {
    for (y = 0; y < Y; ++y) c[y] = [];
    for (y = 0; y < Z; ++y) b[y] = 0, c[micro_oaat(e = keys[y], z) % Y].push(e);
    y: for (y = 0, a.sort((A, B) => c[B].length - c[A].length); y < Y; ++y) {
      x: for (x = 0, X = (f = c[a[y]]).length; x < 0x100000000; ++x) {
        for (w = 0, g = []; w < X; g.push(h), ++w) {
          if (b[h = micro_oaat(f[w], x) % Z] || g.includes(h)) continue x;
        }
        for (w = 0, d[a[y]] = x; w < X; ++w) b[g[w]] = 1;
        continue y;
      } /* v8 ignore next 2 */
      continue z;
    }
    return d[Y] = z | Z << 8, d;
  } /* v8 ignore next 2 */
  throw Error();
};
export const query = (seed: Uint32Array, key: Uint8Array) => { // w.wiki/8NMD
  const Z = seed.length - 1, b = seed[Z];
  return micro_oaat(key, seed[micro_oaat(key, b & 0xff) % Z]) % (b >>> 8) || 0;
};

import.meta.vitest?.describe.concurrent("hash", (t) => {
  t("low hash collisions", ({ expect }) => {
    let Z = 1e4, z = 0, a = new Uint8Array(32), b = new Set<number>();
    do b.add(micro_oaat(crypto.getRandomValues(a), 0)); while (++z < Z);
    expect(Z - b.size).toBeLessThan(5);
  });
  t("no collisions or gaps", ({ expect }) => {
    for (let z = 0; z < 0x1000; z += 0x800) {
      const a = Array<Uint8Array>(z);
      for (let y = 0; y < z; ++y) {
        a[y] = crypto.getRandomValues(new Uint8Array(32));
      }
      const c = mph(a), d = new Set<number>();
      for (let y = 0; y < z; ++y) d.add(query(c, a[y]));
      expect(d.size).toBe(z);
      expect([...d].sort()).toEqual([...Array(z).keys()].sort());
    }
  });
});
