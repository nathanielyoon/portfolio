import { assertEquals } from "@std/assert";
import { b_s64, s64_b } from "lib/64.ts";
import { s_b } from "lib/text.ts";
import { encode_decode, read, test } from "./test.ts";

test("rfc", async () => {
  const rfc = await read("rfc4648.txt", 652, 664);
  const strings = [...rfc.matchAll(/\("(.*)"\) = "(.*)"/g)!];
  for (let z = 0; z < strings.length; ++z) {
    const [_, from, to] = strings[z];
    assertEquals(
      b_s64(s_b(from)).replaceAll("-", "+").replaceAll("_", "/"),
      to.replace(/=?=$/, ""),
      `"${from}"`,
    );
  }
});
test("encode decode", encode_decode(b_s64, s64_b));
