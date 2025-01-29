import { assertEquals } from "@std/assert/";
import { b_b32, max, min } from "../spec/number.ts";
import { test } from "./test.ts";

test(`${min.name}, ${max.name}`, (rng) => {
  const a = new Uint32Array(0x10000);
  const b = new Uint32Array(a.length);
  rng(new Uint8Array(a.buffer)), rng(new Uint8Array(b.buffer));
  for (let z = 0; z < a.length; ++z) {
    const c = a[z] & 0x7fffffff, d = b[z] & 0x7fffffff;
    assertEquals(min(c, d), Math.min(c, d), "min");
    assertEquals(max(c, d), Math.max(c, d), "max");
  }
});
test(b_b32.name, (rng) => {
  for (let z = 0, a = new Uint8Array(32); z < 0x100; ++z) {
    assertEquals(new Uint8Array(b_b32(rng(a)).buffer), a, "little-endian");
  }
});
