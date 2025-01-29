import { assertEquals } from "@std/assert";
import { hmac, sha256, sha512 } from "../spec/sha2.ts";
import { read, s16_b, test } from "./test.ts";

test("NIST", async () => {
  for (let z = 0, a = [sha256, sha512]; z < a.length; ++z) {
    const b = a[z];
    const c = await Promise.all(
      ["short", "long"].map((Y) => read(`sha2/nist_${256 << z}_${Y}.txt`)),
    ).then((Y) =>
      Array.from(
        (Y[0] + Y[1]).matchAll(/Len = (\d+)\s+Msg = (\S+)\s+MD = (\S+)/g),
        (X) => [X[2].slice(0, +X[1] << 1), X[3]].map(s16_b),
      )
    );
    let y = c.length;
    do assertEquals(b(c[--y][0]), c[y][1], "NIST"); while (y);
  }
});
test("SHA-512", async (rng) => {
  const a = new Uint8Array(0x400);
  let z = 0;
  do assertEquals(
    sha512(rng(a.subarray(0, z))),
    new Uint8Array(await crypto.subtle.digest("SHA-512", a.subarray(0, z))),
    "crypto",
  ); while (++z < a.length);
});
test("SHA-256", async (rng) => {
  const a = new Uint8Array(0x400);
  let z = 0;
  do assertEquals(
    sha256(rng(a.subarray(0, z))),
    new Uint8Array(await crypto.subtle.digest("SHA-256", a.subarray(0, z))),
    "crypto",
  ); while (++z < a.length);
});
test(hmac.name, async (rng) => {
  const a = rng(new Uint8Array(0x100)), b = rng(new Uint8Array(a.length));
  for (let z = 0; z < a.length; ++z) {
    const c = rng(a.subarray(z)), d = rng(b.subarray(z));
    const e = await crypto.subtle.importKey(
      "raw",
      c,
      { "name": "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const f = new Uint8Array(await crypto.subtle.sign("HMAC", e, d));
    assertEquals(hmac(c, d), f, "same as webcrypto");
  }
});
