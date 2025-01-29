// rfc8439 2.8, w.wiki/8NME
import { b62_i, i_u } from "../text/base.ts";
import ChaCha from "./chacha20.ts";
import poly1305 from "./poly1305.ts";

type View = Uint8Array | Uint32Array;
const pad = (a: number) => Math.ceil(a / 16) * 16;
const tag = (a: Uint8Array, b: Uint8Array, c: View) => {
  let Z = c.length, Y = pad(Z), X = b.length, W = pad(X), v = 0, d;
  d = new Uint8Array(Y + W + 16), d.set(new Uint8Array(c.buffer)), d.set(b, Y);
  for (Y = (W += Y) + 8; v < 64; v += 8) d[W++] = Z >> v, d[Y++] = X >> v;
  return poly1305(a, d);
};
export const encrypt = (key: ArrayBuffer, data: string, aad: View) => {
  const a = crypto.getRandomValues(new Uint8Array(24)), b = new Uint8Array(12);
  const c = new Uint8Array(a.subarray(0, 16)), d = i_u(b62_i(data));
  const e = new ChaCha(new ChaCha(key, c).key(), (b.set(a.subarray(16), 4), b));
  let f = new Uint8Array(d.length + 40), g = new Uint8Array(e.stream()), h;
  return f.set(a), f.set(tag(g, h = e.xor(d), aad), 24), f.set(h, 40), f;
};
export const decrypt = (key: ArrayBuffer, data: Uint8Array, aad: View) => {
  let a = data.subarray(24, 40), b = new Uint8Array(12), c;
  b.set(data.subarray(16, 24), 4), c = data.subarray(0, 16);
  const d = new ChaCha(new ChaCha(key, new Uint8Array(c)).key(), b);
  let e = tag(d.stream(), b = data.subarray(40), aad), f = true;
  for (let z = 0; z < 16; ++z) if (a[z] !== e[z]) f = false;
  return f && d.xor(b);
};
