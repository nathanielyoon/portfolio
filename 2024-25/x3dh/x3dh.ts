import { INFO, SEED } from "../base.ts";
import { generate, sign, verify, x25519 } from "./25519.ts";
import { a_s, s_a } from "./64.ts";
import { decrypt, encrypt } from "./aead.ts";
import { Errer } from "./error.ts";
import { oaat } from "./oaat.ts";
import { hkdf } from "./sha2.ts";
import { Type } from "./type.ts";

export const KEY = { type: "text", pattern: /^[-\w]{43}$/ } satisfies Type;
const one_time = (bundle: Uint8Array, key: Uint8Array, at: number) =>
  bundle.subarray((oaat(key, SEED) % (bundle.length - at >> 5) << 5) + at);
export const publish = (from: Uint8Array) => {
  const a = from.length, b = new Uint8Array(a + 64);
  for (let z = 64; z < a; z += 32) b.set(generate(from.subarray(z)), z + 64);
  const c = generate(from.subarray(32));
  return b.set(generate(from)), b.set(c, 32), b.set(sign(from, c), 64), b;
};
class InvalidPreKey extends Errer<Uint8Array> {}
export const send = (from: Uint8Array, to: Uint8Array, text: string) => {
  const a = to.subarray(0, 32), b = to.subarray(32, 64);
  if (!verify(a, b, to.subarray(64, 128))) throw new InvalidPreKey(to);
  const c = new Uint8Array(128).fill(0xff);
  c.set(x25519(from.subarray(0, 32), b));
  const e = crypto.getRandomValues(new Uint8Array(32));
  c.set(x25519(e, a), 32), c.set(x25519(e, b), 64);
  const g = s_a(text), h = generate(from);
  c.set(x25519(e, one_time(to, h, 128)), 96);
  const i = hkdf(c, INFO), j = new Uint8Array(136 + g.length);
  j.set(h), j.set(generate(e), 32), j.set(b, 64), c.set(h), c.set(a, 32);
  return j.set(encrypt(i, g, c.subarray(0, 64)), 96), [i, j] as const;
};
class WrongPreKey extends Errer<[prekey: Uint8Array, message: Uint8Array]> {}
export const receive = (secret_bundle: Uint8Array, message: Uint8Array) => {
  const a = generate(secret_bundle.subarray(32));
  let b = 1, z = 32;
  do b &= +(a[--z] === message[z + 64]); while (z);
  if (!b) throw new WrongPreKey([secret_bundle.subarray(32, 64), message]);
  const c = new Uint8Array(128).fill(0xff), d = message.subarray(0, 32);
  const e = secret_bundle.subarray(32), f = message.subarray(32);
  c.set(x25519(e, d)), c.set(x25519(secret_bundle, f), 32);
  c.set(x25519(e, f), 64), c.set(x25519(one_time(secret_bundle, d, 64), f), 96);
  const g = hkdf(c, INFO);
  c.set(d), c.set(generate(secret_bundle), 32);
  return [g, a_s(decrypt(g, message.subarray(96), c.subarray(0, 64)))] as const;
};
