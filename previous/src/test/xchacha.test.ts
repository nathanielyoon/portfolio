import { assertEquals } from "@std/assert";
import { chacha } from "../spec/xchacha.ts";
import { read, s16_b, slice, test } from "./test.ts";

test("rfc8439", async () => {
  const a = slice(await read("aead/rfc8439.txt"), {
    key_1: [17759, 102],
    iv_1: [17994, 35],
    state_1: [19249, 266, true],
  });
  const b = s16_b(a.iv_1), c = new Uint32Array(16);
  chacha(
    new DataView(s16_b(a.key_1.replace(/\s+/, "")).buffer),
    1,
    b[0] | b[1] << 8 | b[2] << 16 | b[3] << 24,
    b[4] | b[5] << 8 | b[6] << 16 | b[7] << 24,
    b[8] | b[9] << 8 | b[10] << 16 | b[11] << 24,
    c,
  );
  assertEquals(
    new Uint8Array(c.buffer),
    s16_b(a.state_1.replace(/\S{3,}/g, "")),
    "2.3.2",
  );
});
