import { assertEquals } from "@std/assert";
import { b_s16, s16_b } from "lib/16.ts";
import { s_b } from "lib/text.ts";
import { encode_decode, read, test } from "./test.ts";

test("rfc", async () => {
  const rfc = await read("rfc4648.txt", 701, 713);
  const strings = [...rfc.matchAll(/\("(.*)"\) = "(.*)"/g)!];
  for (let z = 0; z < strings.length; ++z) {
    const [_, from, to] = strings[z];
    assertEquals(b_s16(s_b(from)).toUpperCase(), to, `"${from}"`);
  }
});
test("encode decode", encode_decode(b_s16, s16_b));
