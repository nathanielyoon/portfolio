import {
  blake3_derive,
  blake3_hash,
  blake3_keyed,
  compress,
} from "../spec/blake3.ts";
import { s_b } from "../spec/encoding.ts";
import reference from "../../public/static/blake3/reference_vectors.json" with {
  type: "json",
};
import { b_s16, read, s16_b, test } from "./test.ts";
import { assertEquals } from "@std/assert";

test(compress.name, async () => {
  const a = await read("blake3/c2sp_spec.md", 21600, 23177);
  const b = (prefix: string) =>
    Uint32Array.from(
      a.match(RegExp(`(?<=${prefix}:[\\s\\da-f]*\\s+)[\\da-f]{2,}\\s`, "g"))!,
      (Z) => parseInt(Z, 16),
    );
  const c = new Uint32Array(8);
  compress(b("h"), new DataView(b("m").buffer), 0, 4, b("flags")[0], c);
  assertEquals(c, b("compress output"), "spec 1");
});
test("reference", () => {
  const a = s_b(reference.key), b = reference.context_string;
  const c = (length: number) => Uint8Array.from({ length }, (_, Z) => Z % 251);
  for (let z = 0; z < reference.cases.length; ++z) {
    const d = reference.cases[z], e = c(d.input_len), f = s16_b(d.hash);
    assertEquals(blake3_hash(e), f.subarray(0, 32), `hash default ${z}`);
    assertEquals(blake3_hash(e, f.length), f, `hash full ${z}`);
    const g = s16_b(d.keyed_hash);
    assertEquals(blake3_keyed(a, e), g.subarray(0, 32), `keyed default ${z}`);
    assertEquals(blake3_keyed(a, e, g.length), g, `keyed full ${z}`);
    const h = s16_b(d.derive_key);
    assertEquals(blake3_derive(b, e), h.subarray(0, 32), `derive default ${z}`);
    assertEquals(blake3_derive(b, e, h.length), h, `derive full ${z}`);
  }
});
test("seek", (rng) => {
  for (let z = 0; z < 16; ++z) {
    const a = b_s16(rng(new Uint8Array(32)));
    const b = rng(new Uint8Array(32)), c = blake3_derive(a, b, 1024);
    for (let y = 0; y < 16; ++y) {
      assertEquals(blake3_derive(a, b, 64, y), c.subarray(y << 6, y + 1 << 6));
    }
  }
});
