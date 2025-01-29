import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { a_s64, s64_a } from "../spec/64.ts";
import { read } from "./test.ts";
import { s_a } from "../lib/string.ts";

Deno.test("rfc 4648", async () => {
  const a = await read("rfc4648.txt");
  for (const b of a.matchAll(/BASE64\("(\w+)"\) = "(\w+)=*"/g)) {
    const c = s_a(b[1]);
    assertEquals(a_s64(c), b[2], "encodes");
    assertEquals(s64_a(b[2]), c, "decodes");
  }
});
Deno.test("lengths", () => {
  const a = new Uint8Array(128);
  for (let z = 0; z < a.length; ++z) {
    const b = crypto.getRandomValues(a.subarray(z));
    const c = a_s64(b);
    assertEquals(
      c,
      btoa(b.reduce((Z, Y) => Z + String.fromCharCode(Y), ""))
        .replaceAll("+", "-").replaceAll("/", "_").replace(/=?=$/, ""),
      "atob same",
    );
    const d = s64_a(c);
    assertEquals(
      d,
      Uint8Array.from(
        atob(c.replaceAll("-", "+").replaceAll("_", "/")),
        (Z) => Z.charCodeAt(0),
      ),
    );
    assertEquals(d, b, "encodes decodes");
  }
});
