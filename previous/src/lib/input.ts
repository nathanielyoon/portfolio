import { B16, B64, B95 } from "../spec/encoding.ts";
import { and, max, mix, rng, U } from "../spec/number.ts";
import { Err } from "./error.ts";

export const keys = <A extends { [_: string]: unknown }>(object: A) =>
  <(keyof A & string)[]> Object.keys(object);
export const enum Type {
  ENUM = "radio",
  SET = "checkbox",
  DATE = "datetime-local",
  NUMBER = "number",
  STRING = "text",
}
const FORMAT = {
  base64url: /^[-\w]*$/,
  email:
    /^(?![ -~]{255,})[\w!#-'*+./=?^-~-]+@[\dA-Z](?:[-\dA-Z]{0,61}[\dA-Z])?(?:\.[\dA-Z](?:[-\dA-Z]{0,61}[\dA-Z])?)*$/i,
  hex: /^[\da-f]*$/,
};
export const FORMATS = keys(FORMAT);
export type Input =
  & { required?: boolean }
  & (
    | { type: Type.ENUM; options: readonly string[] }
    | { type: Type.SET; options: readonly string[] }
    | { type: Type.DATE; min?: Date; max?: Date }
    | { type: Type.NUMBER; min?: number; max?: number; step?: number | "any" }
    | (
      & { type: Type.STRING; pattern?: RegExp | keyof typeof FORMAT }
      & ({ length?: number } | { minlength?: number; maxlength?: number })
    )
  );
export type Value<A extends Input> =
  | (A["required"] extends true ? never : null)
  | (
    A extends { type: Type.ENUM; options: readonly (infer B)[] } ? B
      : A extends { type: Type.SET; options: readonly (infer B)[] } ? Set<B>
      : A extends { type: Type.DATE } ? Date
      : A extends { type: Type.NUMBER } ? number
      : string
  );
export type Form = { [_: string]: Input };
export type Data<A extends Form> = { [B in keyof A]: Value<A[B]> };
export type Out<A extends Form> = { [B in keyof A]: Value<A[B]> | Err<string> };
export const stringify = <A extends Form>(form: A, data: Data<A>[]) => {
  const a = keys(form), b = a.length, c = data.length, d = Array<string[]>(c);
  if (!c) return d;
  let z = c, y, e, f;
  do d[--z] = Array(b); while (z);
  do {
    e = a[z], f = form[e], y = c;
    switch (f.type) {
      case Type.ENUM:
      case Type.STRING:
        do d[--y][z] = <string> data[y][e]; while (y);
        break;
      case Type.SET:
        do d[--y][z] = JSON.stringify([...(<Set<string>> data[y][e])]); while (
          y
        );
        break;
      case Type.DATE:
        do d[--y][z] = (<Date> data[y][e]).toISOString(); while (y);
        break;
      case Type.NUMBER:
        do d[--y][z] = `${data[y][e]}`; while (y);
    }
  } while (++z < b);
  return d;
};
const enum InputError {
  OPTIONS_EMPTY = "`input.options.length` is `0`",
  MIN_MAX = "`input.min` is greater than `input.max`",
  STEP_ZERO = "`input.step` is `0`",
  MINLENGTH_MAXLENGTH = "`input.minlength` is greater than `input.maxlength`",
  CUSTOM_PATTERN = "`RegExp` for `input.pattern` can't be randomized",
  SHORT_EMAIL = '`"email"` for `input.pattern` must have `(min)?length` > `5`',
}
const stepper = (step: number, value: number) => value % step === 0;
export const parse = <A extends Form>(form: A, data: string[][]) => {
  const a = keys(form), b = a.length, c = data.length, d = Array(c);
  if (!c) return <Out<A>[]> d;
  let z = c, y, e, f;
  do d[--z] = {}; while (z);
  do {
    e = a[z], f = form[e], y = c;
    switch (f.type) {
      case Type.ENUM: {
        const g = f.options;
        if (!g.length) throw new Err(500, f, InputError.OPTIONS_EMPTY);
        let h;
        do d[--y][e] = g.includes(h = data[y][z])
          ? h
          : new Err(400, h, "options"); while (y);
        break;
      }
      case Type.SET: {
        const g = f.options;
        if (!g.length) throw new Err(500, f, InputError.OPTIONS_EMPTY);
        do try {
          const h = data[--y][z], i = JSON.parse(h);
          if (!Array.isArray(i)) d[y][e] = new Err(400, h, "type");
          else {
            const j = new Set<string>(), k = new Set<string>();
            let x = i.length, l;
            do g.includes(l = i[--x]) ? j.add(l) : k.add(l); while (x);
            d[y][e] = k.size ? new Err(400, k, "options") : j;
          }
        } catch {
          d[y][e] = new Err(400, data[y][z], "type");
        } while (y);
        break;
      }
      case Type.DATE: {
        const g = +f.min!, h = +f.max!;
        if (g > h) throw new Err(500, f, InputError.MIN_MAX);
        let i, j, k;
        do j = new Date(i = data[--y][z]),
          d[y][e] = isNaN(k = +j)
            ? new Err(400, i, "type")
            : k < g
            ? new Err(400, i, "min")
            : k > h
            ? new Err(400, i, "max")
            : j; while (y);
        break;
      }
      case Type.NUMBER: {
        const g = +f.min!, h = +f.max!;
        if (g > h) throw new Err(500, f, InputError.MIN_MAX);
        if (f.step === 0) throw new Err(500, f, InputError.STEP_ZERO);
        const i = f.step === "any"
          ? Number.isFinite
          : f.step === undefined
          ? Number.isSafeInteger
          : stepper.bind(null, f.step);
        let j, k;
        do j = data[--y][z],
          d[y][e] = isNaN(k = +j)
            ? new Err(400, j, "type")
            : k < g
            ? new Err(400, j, "min")
            : k > g
            ? new Err(400, j, "max")
            : i(k)
            ? k
            : new Err(400, j, "step"); while (y);
        break;
      }
      case Type.STRING: {
        const g = +(<{ length: number }> f).length;
        const h = +(<{ minlength: number }> f).minlength;
        const i = +(<{ maxlength: number }> f).maxlength;
        if (h > i) throw new Err(500, f, InputError.MINLENGTH_MAXLENGTH);
        const j = typeof f.pattern === "string" ? FORMAT[f.pattern] : f.pattern;
        let k;
        do k = data[--y][z],
          d[y][e] = k.length !== g
            ? new Err(400, k, "length")
            : k.length < h
            ? new Err(400, k, "minlength")
            : k.length > i
            ? new Err(400, k, "maxlength")
            : j?.test(k) === false
            ? new Err(400, k, "pattern")
            : k; while (y);
      }
    }
  } while (++z < b);
  return <Out<A>[]> d;
};
const string =
  (alphabet: string, length: (seed: bigint) => number) => (seed: bigint) => {
    const a = length(seed);
    let b = "", z = 0;
    while (z++ < a) b += alphabet[and(seed = rng(seed), alphabet.length)];
    return b;
  };
export const random = <A extends Input>(input: A) => {
  switch (input.type) {
    case Type.ENUM: {
      const a = input.options, b = a.length;
      return (seed: bigint) => a[and(seed, b)];
    }
    case Type.SET: {
      const a = input.options, b = a.length;
      return (seed: bigint) => {
        const c = new Set<string>();
        let z = and(seed, b), d = and(seed, U);
        while (z--) c.add(a[d % b]), d = mix(d);
        return c;
      };
    }
    case Type.DATE:
    case Type.NUMBER: {
      const a = input.min ? +input.min : 0;
      const b = (input.max ? +input.max : U * 1000) - a;
      if (b < 0) throw new Err(500, input, InputError.MIN_MAX);
      return input.type === "number"
        ? (seed: bigint) => and(seed, b) + a
        : (seed: bigint) => new Date(and(seed, b) + a);
    }
    case Type.STRING: {
      if (input.pattern instanceof RegExp) {
        throw new Err(500, input, InputError.CUSTOM_PATTERN);
      }
      const a = "length" in input ? +input.length! : NaN;
      let b;
      if (isNaN(a)) {
        let c = "minlength" in input ? +input.minlength! : NaN;
        if (isNaN(c)) c = 0;
        let d = ("maxlength" in input ? +input.maxlength! : NaN) - c;
        if (isNaN(d)) d = U - 1 - c;
        b = (seed: bigint) => and(seed, d) + c;
      } else b = (_: bigint) => a;
      switch (input.pattern) {
        case "base64url":
          return string(B64, b);
        case "email":
          if (b(0n) < 5) throw new Err(500, input, InputError.SHORT_EMAIL);
          return (seed: bigint) => {
            const c = max(b(seed), 5) - 4;
            let d = "";
            for (let z = 0; z < c; ++z) d += B95[and(seed = rng(seed), 95)];
            return `${d}@a.a`;
          };
        case "hex":
          return string(B16, b);
        case undefined:
          return string(B95, b);
      }
    }
  }
};
