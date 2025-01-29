import { assertEquals } from "@std/assert";
import { generate } from "../spec/25519.ts";
import { detoken, entoken } from "../spec/jwt.ts";
import { b_s16, test } from "./test.ts";

test(`${entoken.name}, ${detoken.name}`, (rng) => {
  const a = new Uint8Array(32), b = new Uint8Array(32), c = new Uint8Array(16);
  for (let z = 0; z < 0x10; ++z) {
    const d = {
      iss: generate(rng(a)),
      sub: rng(b),
      ctx: b_s16(rng(c)),
      exp: Date.now() / 1000 >>> 0,
    };
    const e = entoken(a, d);
    assertEquals(detoken(e), d, "same");
    assertEquals(detoken("a" + e), 400, "bad token");
    assertEquals(
      detoken(entoken(a, { ...d, iss: new Uint8Array(33) })),
      400,
      "bad claims",
    );
    assertEquals(detoken(entoken(a, { ...d, exp: 0 })), 401, "bad expiration");
    assertEquals(
      detoken(entoken(a, d).replace(/.{86}$/, "0".repeat(86))),
      403,
      "bad signature",
    );
  }
});
