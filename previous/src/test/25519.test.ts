import { assert, assertEquals } from "@std/assert";
import { generate, sign, verify } from "../spec/25519.ts";
import { read, s16_b, slice, test } from "./test.ts";
import wycheproof from "../../public/static/25519/wycheproof_ed25519.json" with {
  type: "json",
};

test("wycheproof", () => {
  for (let z = 0; z < wycheproof.testGroups.length; ++z) {
    const a = wycheproof.testGroups[z], b = s16_b(a.publicKey.pk);
    for (let y = 0; y < a.tests.length; ++y) {
      const c = a.tests[y], d = verify(b, s16_b(c.msg), s16_b(c.sig));
      assertEquals(d, c.result === "valid", `${c.tcId}`);
    }
  }
});
test("rfc8032 7.1", async () => {
  const a = slice(await read("25519/rfc8032.txt"), {
    secret_key_1: [47250, 68],
    public_key_1: [47338, 68],
    message_1: [47436, 0],
    signature_1: [47455, 140],
    secret_key_2: [47657, 68],
    public_key_2: [47745, 68],
    message_2: [47846, 2],
    signature_2: [47867, 140],
    secret_key_3: [48221, 68],
    public_key_3: [48309, 68],
    message_3: [48411, 4],
    signature_3: [48434, 140],
    secret_key_4: [48639, 68],
    public_key_4: [48727, 68],
    message_4_1: [48832, 428],
    message_4_2: [49417, 1724],
    message_4_3: [51298, 138],
    signature_4: [51455, 140],
    secret_key_5: [51664, 68],
    public_key_5: [51752, 68],
    message_5: [51855, 140],
    signature_5: [52014, 140],
  });
  for (const b of [1, 2, 3, 4, 5] as const) {
    const c = s16_b(a[`secret_key_${b}`]);
    const d = s16_b(a[`public_key_${b}`]);
    assertEquals(generate(c), d, "generate");
    const e = s16_b(
      b === 4
        ? a.message_4_1 + a.message_4_2 + a.message_4_3
        : a[`message_${b}`],
    );
    const f = sign(c, e);
    assertEquals(f, s16_b(a[`signature_${b}`]), "sign");
    assert(verify(d, e, f), "verify");
  }
});
test(generate.name, async () => {
  for (let z = 0; z < 0x100; ++z) {
    const a = await crypto.subtle.generateKey("Ed25519", true, ["sign"]);
    const b = await Promise.all([
      crypto.subtle.exportKey("pkcs8", a.privateKey),
      crypto.subtle.exportKey("raw", a.publicKey),
    ]);
    assertEquals(
      generate(new Uint8Array(b[0]).subarray(16)),
      new Uint8Array(b[1]),
      "same generated public key",
    );
  }
});
test(sign.name, async (rng) => {
  for (let z = 0; z < 0x100; ++z) {
    const a = rng(new Uint8Array(48)), b = rng(new Uint8Array(256));
    a.set([48, 46, 2, 1, 0, 48, 5, 6, 3, 43, 101, 112, 4, 34, 4, 32]);
    const c = await crypto.subtle.sign(
      "Ed25519",
      await crypto.subtle.importKey("pkcs8", a, "Ed25519", false, ["sign"]),
      b,
    );
    assertEquals(sign(a.subarray(16), b), new Uint8Array(c), "same signature");
  }
});
const BAD_KEY = s16_b((1n | 1n << 255n).toString(16)).reverse();
test(verify.name, (rng) => {
  const a = new Uint8Array(32), b = new Uint8Array(0x10);
  for (let z = 0; z < b.length; ++z) {
    const c = generate(rng(a)), d = rng(b.subarray(z)), e = sign(a, d);
    assert(verify(c, d, e), "correct");
    ++c[0], assert(!verify(c, d, e), "public key"), --c[0];
    ++d[0], assert(!verify(c, d, e), "message"), --d[0];
    ++e[0], assert(!verify(c, d, e), "signature"), --e[0];
    assert(!verify(c, d, new Uint8Array(e).fill(-1, 0, 32)), "bad point");
    assert(!verify(c, d, new Uint8Array(e).fill(-1, 32)), "too big");
    assert(!verify(BAD_KEY, d, e), "bad key");
  }
});
