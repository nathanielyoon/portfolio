import { assertEquals } from "@std/assert";
import { decrypt, encrypt, poly_xchacha, xchacha_poly } from "../spec/aead.ts";
import { s16_b, test } from "./test.ts";
import wycheproof from "../../public/static/aead/wycheproof_xchacha20poly1305.json" with {
  type: "json",
};

test("wycheproof", () => {
  for (let z = 0; z < wycheproof.testGroups.length; ++z) {
    const a = wycheproof.testGroups[z].tests;
    for (let y = 0; y < a.length; ++y) {
      const b = a[y], c = s16_b(b.key), d = s16_b(b.iv);
      const e = s16_b(b.ct + b.tag), f = s16_b(b.aad);
      if (b.result === "valid") {
        const g = s16_b(b.msg), h = xchacha_poly(c, d, g, f);
        assertEquals(h.subarray(0, -16), s16_b(b.ct));
        assertEquals(h.subarray(-16), s16_b(b.tag));
        assertEquals(poly_xchacha(c, d, e, f), g);
      } else assertEquals(poly_xchacha(c, d, e, f), false);
    }
  }
});
test(`${encrypt.name} ${decrypt.name}`, (rng) => {
  const a = new Uint8Array(), b = new Uint8Array(32);
  assertEquals(xchacha_poly(a, a, a, a), a, "bad key");
  assertEquals(xchacha_poly(b, a, a, a), a, "bad nonce");
  const c = new Uint8Array(0x100), d = new Uint8Array(c.length);
  for (let z = 0; z < c.length; ++z) {
    const e = rng(c.subarray(0, z)), f = rng(d.subarray(0, z - 1));
    assertEquals(decrypt(b, encrypt(rng(b), e, f), f), e, "same");
  }
});
