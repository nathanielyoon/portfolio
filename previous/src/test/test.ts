export const url = (path: string) =>
  import.meta.url.replace(
    /^file:\/\/((?:\/\w+)+)\/src\/test\/test\.ts$/,
    `$1/${path}`,
  );
export const read = async (file_name: string, from?: number, to?: number) =>
  (await Deno.readTextFile(url(`public/static/${file_name}`))).slice(from, to);
export const log = (...data: unknown[]) =>
  console.log(
    JSON.stringify(data, (_, Z) =>
      Z instanceof Uint8Array || Z instanceof Uint16Array ||
        Z instanceof Uint32Array
        ? b_s16(Z)
        : Z instanceof Set
        ? [...Z]
        : Z),
  );
export const s16_b = (hex: string) =>
  Uint8Array.from(hex.match(/[\da-f]{2}/g) ?? [], (Z) => parseInt(Z, 16));
export const b_s16 = (binary: Uint8Array | Uint16Array | Uint32Array) =>
  new Uint8Array(binary.buffer)
    .subarray(binary.byteOffset, binary.byteOffset + binary.byteLength)
    .reduce((Z, Y) => Z + Y.toString(16).padStart(2, "0"), "");
export type RNG = (into: Uint8Array) => Uint8Array;
export const test = (
  name: string,
  callback: (rng: RNG, context: Deno.TestContext) => unknown,
  seed = crypto.getRandomValues(new BigUint64Array(1))[0],
) =>
  Deno.test(name, async (Z) => {
    try {
      let state = seed;
      await callback((into: Uint8Array) => {
        for (let z = 0, y, a, b; z < into.length;) {
          state = state * 0xf1357aea2e62a9c5n & 0xffffffffffffffffn;
          a = Number(state & 0xffffffffn), y = 0;
          while (z < into.length && y < 4) into[z++] = a >> (y++ << 3);
          b = Number(state >> 32n), y = 0;
          while (z < into.length && y < 4) into[z++] = b >> (y++ << 3);
        }
        return into;
      }, Z);
    } catch (Y) {
      console.log(name, seed);
      throw Y;
    }
  });
export const slice = <A extends string>(
  source: string,
  parts: { [_ in A]: [from: number, length: number, preserve?: true] },
) => {
  const a = <{ [_ in A]: string }> {};
  for (let z = 0, b = <A[]> Object.keys(parts); z < b.length; ++z) {
    const c = parts[b[z]], d = source.slice(c[0], c[0] + c[1]);
    a[b[z]] = c[2] ? d : d.replace(/\s/g, "");
  }
  return a;
};
