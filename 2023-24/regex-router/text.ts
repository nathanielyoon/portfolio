import { u8 } from "./bits.ts";

type From<A, B = A> = A extends (...a: any) => infer C ? C : B;
const en =
  <A extends { [key: string]: "" | ((a: string) => any) }>(a: RegExp, b: A) =>
  (c: string) => {
    let d = a.exec(c)?.groups, e = Object.keys(b), f, g, z = 0;
    if (!d) throw Error("400", { cause: `Wanted:\n${a}\n\nGot:\n${c}` });
    while (z < e.length) (g = b[f = e[z++]]) && (d[f] = g(d[f]));
    return <{ [B in keyof A]: From<A[B], string> }> d;
  };
const de = <A extends From<typeof en>>(
  a: TemplateStringsArray,
  ...b: (string & keyof From<A> | ((c: From<A>) => any))[]
) =>
(c: From<A>) => {
  let d = a[0], e, Z = b.length, z = 0;
  while (z < Z) d += (typeof (e = b[z]) === "string" ? c[e] : e(c)) + a[++z];
  return d;
};
const t_match = en(
  /^(?<gov>[-\w]{12})\t(?<opp>[-\w]{12})\t(?<chair>[-\w]{6})(?<panel>(?: [-\w]{6}){0,14})\t(?<room>[-\w]{6})\t(?<ballot>[-\w]{1,255})$/,
  {
    gov: "",
    opp: "",
    chair: "",
    panel: (a): string[] => a.match(/[-\w]{6}/g) ?? [],
    room: "",
    ballot: "",
  },
);
const t_round = en(
  /^(?<round>[A-Z]\.\d\d)\t(?<date>[-\w]{6})\t(?<name>[ -~]{1,63})\n(?<matches>(?:\n[-\w \t]){0,511})$/,
  {
    round: "",
    date: (a) => new Date(a!),
    name: "",
    matches: (a) => {
      const b = a.split("\n"), c: From<typeof t_match>[] = [], Z = b.length;
      for (let z = 0, d; z < Z; ++z) {
        /^\s*$/.test(d = b[z]) || c.push(t_match(d));
      }
      return c;
    },
  },
);
