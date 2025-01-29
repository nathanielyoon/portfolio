import { u8 } from "./bits.ts";

export default (a: string, b: string) => {
  if (a.length < b.length) [a, b] = [b, a];
  if (a.includes(b)) return 0;
  let r = 0xff, j = 0, J = b.length, A = u8(J + 1);
  do A[j] = j; while (j++ < J);
  for (let i = 0, I = a.length - J, c, B, C, j, k, l; i < I; ++i) {
    for (j = 0, c = a.slice(i, i + J), B = u8(A), C = u8(J + 1); j < J; ++j) {
      for (C[k = 0] = j + (l = 1); k < J; ++k, ++l) {
        C[l] = Math.min(C[k] + 1, B[k] + (c[j] === b[k] ? 0 : 1), B[l] + 1);
      }
      B.set(C);
    }
    if (B[J] < r) r = B[J];
  }
  return r;
};
