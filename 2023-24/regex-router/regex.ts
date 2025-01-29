export const fix = (a?: string) =>
  a?.replace(/\p{Cc}|\p{Co}|\p{Cn}/gu, "")
    .replace(/\n\r|\p{Zl}|\p{Zp}/gu, "\n")
    .replace(/\p{Zs}/gu, " ") ?? "";
export type G<A extends string, B extends string = never> =
  & { [C in A]: string }
  & { [C in B]: string | undefined };
type Types = { [a: string]: ((b?: string) => any) | "" | undefined };
type Typed<A extends Types> = {
  [B in keyof A]: A[B] extends (a?: string) => infer E ? E
    : A[B] extends "" ? string
    : string | undefined;
};
type Entyper = {
  <A extends string, B extends string>(a: RegExp): (b: string) => G<A, B>;
  <A extends Types>(a: RegExp, b: A): (c: string) => Typed<A>;
};
export type It<A> = A extends (b: string) => infer C ? C : never;
export const en: Entyper = (a: RegExp, b?: Types) => (c: string) => {
  const d = (a.lastIndex = 0, a.exec(c)?.groups);
  if (!d) throw Error("400", { cause: `Wanted:\n${a}\n\nGot:\n${c}` });
  if (!b) return d;
  const e = <(keyof typeof b)[]> Object.keys(b), Z = e.length;
  for (let f = 0, g, h; f < Z; ++f) g = e[f], (h = b[g]) && (d[g] = h(d[g]));
  return d;
};
export const de = <A extends ReturnType<Entyper>>(
  a: TemplateStringsArray,
  ...b: (keyof It<A> | { [B in keyof It<A>]?: (c: It<A>[B]) => any })[]
) =>
(c: It<A>) => {
  let d = a[0];
  for (let z = 0, e; z < b.length; d += a[++z]) {
    if (typeof (e = b[z]) === "string") d += c[e];
    else d += (e = Object.entries(e)[0])[1](c[e[0]]);
  }
  return d;
};
