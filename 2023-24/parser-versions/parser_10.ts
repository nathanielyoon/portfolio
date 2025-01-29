import { b62_n16, b62_n32, n16_b62, n32_b62 } from "../base/62.ts";
import { b91_u, u_b91 } from "../base/91.ts";
import { ENCODER, s_u, u_s } from "../base/text.ts";
import type { Stream } from "../crypto/chacha.ts";

type Value = number | U8 | U16 | U32 | F64;
type Part<A extends Value = Value> = {
  key: string;
  pattern: RegExp;
  s_d(string: string): A;
  d_s(number: A): string;
  encrypt(plaintext: string, stream: Stream): string;
  decrypt(ciphertext: string, stream: Stream): string;
};
class Booleaner implements Part<number> {
  pattern = /^(?:yes|no)$/;
  constructor(public key: string) {}
  s_d(A: string) {
    return A === "no" ? 0 : 1;
  }
  d_s(A: number) {
    return A & 1 ? "yes" : "no";
  }
  encrypt(A: string, B: Stream) {
    return n16_b62(+A ^ B.next());
  }
  decrypt(A: string, B: Stream) {
    return String(b62_n16(A) ^ B.next());
  }
}
class Inter implements Part<number> {
  pattern = /^\d{1,10}$/;
  constructor(public key: string) {}
  s_d(A: string) {
    return +A >>> 0;
  }
  d_s(A: number) {
    return String(A);
  }
  encrypt(A: string, B: Stream) {
    return n32_b62(+A ^ B.next());
  }
  decrypt(A: string, B: Stream) {
    return String(b62_n32(A) ^ B.next());
  }
}
class Floater implements Part<number> {
  pattern = /^-?\d+(?:\.\d+(?:[+-]e\d+)?)?$/;
  constructor(public key: string) {}
  s_d(A: string) {
    return +A;
  }
  d_s(A: number) {
    return String(A);
  }
  encrypt(A: string, B: Stream) {
  }
}
class Stringer implements Part<U8> {
  pattern;
  buffer;
  view;
  constructor(public key: string, public min: number, public max: number) {
    this.pattern = RegExp(`^[^\\n\\t]{${min},${max}}$`);
    this.view = new DataView((this.buffer = new Uint8Array(max + 2)).buffer);
  }
  s_d(A: string) {
    return s_u(A);
  }
  d_s(A: U8) {
    return u_s(A);
  }
  encrypt(A: string, B: Stream) {
    const a = ENCODER.encodeInto(A, this.buffer.subarray(2));
    this.view.setUint16(0, a.written, true);
    for (let z = 0; z < this.max; ++z) this.buffer[z] ^= B.next();
    return u_b91(this.buffer);
  }
  decrypt(A: string, B: Stream) {
    this.buffer.set(b91_u(A));
    for (let z = 0; z < this.max; ++z) this.buffer[z] ^= B.next();
    return u_s(this.buffer.subarray(2, this.view.getUint16(0, true)));
  }
}
