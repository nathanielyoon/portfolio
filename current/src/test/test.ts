import { assertEquals } from "@std/assert";
import { and, next } from "lib/mcg.ts";

export const url = (path: string) =>
  import.meta.url.replace(
    /^file:\/\/((?:\/\w+)+)\/src\/test\/test\.ts$/,
    `$1/${path}`,
  );
export const read = async (file_name: string, from?: number, to?: number) => {
  const text = await Deno.readTextFile(url(`public/static/${file_name}`));
  if (from === undefined && to === undefined) return text;
  return text.split(/\r?\n/).slice(~-from!, to).join("\n");
};
export const slice = <A extends string>(
  source: string,
  parts: { [_ in A]: [from: number, length: number, preserve?: true] },
) => {
  const slices = <{ [_ in A]: string }> {};
  for (let z = 0, keys = <A[]> Object.keys(parts); z < keys.length; ++z) {
    const part = parts[keys[z]];
    const slice = source.slice(part[0], part[0] + part[1]);
    slices[keys[z]] = part[2] ? slice : slice.replace(/\s/g, "");
  }
  return slices;
};
export const sample = (length = 256, offset = 0) =>
  Uint8Array.from({ length }, (_, index) => index + offset);
type TypedArray = {
  readonly BYTES_PER_ELEMENT: number;
  readonly buffer: ArrayBuffer;
  readonly byteOffset: number;
  readonly length: number;
};
const fill = (seed: bigint) => {
  const rng = (into: TypedArray | number) => {
    const [length, view] = typeof into === "number"
      ? [into, new DataView(new ArrayBuffer(into))]
      : [
        Math.ceil(into.length / into.BYTES_PER_ELEMENT),
        new DataView(into.buffer, into.byteOffset),
      ];
    const truncated = length & ~7;
    seed ^= BigInt(length);
    let z = 0;
    while (z < truncated) view.setBigUint64(z, seed = next(seed), true), z += 8;
    seed = next(seed);
    while (z < length) view.setUint8(z++, Number(seed & 255n)), seed >>= 8n;
    return new Uint8Array(view.buffer, view.byteOffset);
  };
  rng.number = (to = 0x100000000) => and(seed = next(seed), to);
  rng.string = (length = 32) =>
    rng(length).reduce((Z, Y) => Z + String.fromCharCode(Y % 95 + 32), "");
  return rng;
};
export type RNG = ReturnType<typeof fill>;
const SEED = new BigUint64Array(1);
export const test = (
  name: string,
  callback: (rng: RNG, context: Deno.TestContext) => unknown,
  seed = crypto.getRandomValues(SEED)[0],
) =>
  Deno.test(name, async (context) => {
    try {
      await callback(fill(seed), context);
    } catch (thrown) {
      console.log(name, seed);
      throw thrown;
    }
  });
export const encode_decode = (
  encode: (binary: Uint8Array) => string,
  decode: (string: string) => Uint8Array,
) =>
(rng: ReturnType<typeof fill>) => {
  const binary = new Uint8Array(0x100);
  for (let z = 0; z < binary.length; z += 9) {
    const subarray = rng(binary.subarray(0, z));
    assertEquals(decode(encode(subarray)), subarray, `length ${z}`);
  }
};
