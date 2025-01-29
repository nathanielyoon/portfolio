import { a_i, b64_u, i_a, i_u, s_u, u_b64, u_i, u_s } from "@tab-wiki/base";
import ladder from "./25519.ts";
import chacha, { state } from "./chacha.ts";
import poly from "./poly.ts";

export const encrypt = (key: ArrayBuffer, data: string, additional: string) => {
  const a = crypto.getRandomValues(new Uint8Array(24));
  const c = state(key, a), d = new Uint8Array(c.buffer.slice(0, 32));
  const e = s_u(data), f = chacha(c, e), g = poly(d, f, s_u(additional));
  const h = new Uint8Array(e.length + 40);
  return h.set(a), h.set(g, 24), h.set(f, 40), u_b64(h);
};
export const decrypt = (key: ArrayBuffer, data: string, additional: string) => {
  const a = b64_u(data), b = state(key, a.slice(0, 24)), c = a.subarray(40);
  const d = poly(new Uint8Array(b.buffer), c, s_u(additional));
  let e = 1, z = 24, y = 0;
  do e &= a[z] === d[y] ? 1 : 0; while (++z, ++y < 16);
  return e ? u_s(chacha(b, c)) : null;
};
export const point = (scalar: string) =>
  u_b64(i_u(ladder(u_i(b64_u(scalar)), 9n), 32));
export const scalar = () =>
  u_b64(i_u(a_i(crypto.getRandomValues(new BigUint64Array(4))), 32));
export const hkdf = (a: string, A: string, B: string, info?: string) => {
  const c = u_i(b64_u(B)), d = i_a(ladder(u_i(b64_u(a)), c));
  return crypto.subtle.importKey("raw", d, "HKDF", false, ["deriveBits"])
    .then(e =>
      crypto.subtle.deriveBits(
        {
          name: "HKDF",
          hash: "SHA-256",
          info: s_u(info),
          salt: i_a(u_i(b64_u(A)) ^ c),
        },
        e,
        256,
      )
    );
};
