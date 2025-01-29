import { assertEquals, assertLess } from "@std/assert";
import { b_s91, s91_b } from "lib/91.ts";
import { encode_decode, test } from "./test.ts";

test("encode decode", encode_decode(b_s91, s91_b));
test("pack 14", () => {
  const max = 91n * 91n - 1n;
  const big = max | max << 14n | max << 28n | max << 42n;
  const binary = new Uint8Array(new BigUint64Array([big]).buffer).slice(0, -1);
  const string = b_s91(binary);
  assertEquals(s91_b(string), binary, "same");
  assertLess(
    string.length,
    Math.ceil(binary.length * 8 / 13 * 2),
    "but shorter",
  );
});
