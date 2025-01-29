/**
 * @module
 *
 * Base type definitions and stringifying/parsing.
 *
 * @see {@link https://dev.mozilla.org/Web/HTML/Element/input | HTML Input}
 */

import { Err } from "./error.ts";

/** Values for the HTML `input` element's `type` attribute. */
export const enum Type {
  ENUM = "radio",
  SET = "checkbox",
  DATE = "datetime-local",
  NUMBER = "number",
  STRING = "text",
}
/** Validation schema for a two-dimensional record. */
export type Form = {
  [_: string]:
    & ({ required: true; value?: never } | { required?: never; value: string })
    & (
      | { type: Type.ENUM | Type.SET; options: readonly string[] }
      | { type: Type.DATE; min?: Date; max?: Date }
      | { type: Type.NUMBER; min?: number; max?: number; step?: number | "any" }
      | {
        type: Type.STRING;
        minlength?: number;
        maxlength?: number;
        pattern?: RegExp;
      }
    );
};
/** Inferred type from a schema-parsed record. */
export type Data<A extends Form> = {
  [B in keyof A]: A[B] extends { options: readonly (infer B extends string)[] }
    ? A[B]["type"] extends Type.ENUM ? B : Set<B>
    : A[B]["type"] extends Type.DATE ? Date
    : A[B]["type"] extends Type.NUMBER ? number
    : A[B]["type"] extends Type.STRING ? string
    : unknown;
};

/**
 * Converts array of records to 2-D array of strings.
 *
 * @param form Schema the data comply to.
 * @param data Array of records.
 * @returns Stringified values.
 */
export const stringify = <A extends Form>(
  form: A,
  data: Data<A>[],
): string[][] => {
  const keys = Object.keys(form);
  let z = data.length, y, key, input;
  const out = Array<string[]>(z);
  do out[--z] = Array(keys.length); while (z);
  do {
    key = keys[z], input = form[key], y = out.length;
    switch (input.type) {
      case Type.ENUM:
      case Type.STRING:
        do out[--y][z] = <string> data[y][key]; while (y);
        break;
      case Type.SET:
        do out[--y][z] = JSON.stringify([
          ...(<Set<string>> data[y][key]),
        ]); while (y);
        break;
      case Type.DATE:
        do out[--y][z] = (<Date> data[y][key]).toISOString(); while (y);
        break;
      case Type.NUMBER:
        do out[--y][z] = `${data[y][key]}`; while (y);
        break;
    }
  } while (++z < keys.length);
  return out;
};

const stepper = (step: number, value: number) => value % step === 0;
/**
 * Uses a schema to parse an array of records.
 *
 * @param form Schema that each record should match.
 * @param data String values for each record.
 * @returns Array of parsed records or array of errors.
 */
export const parse = <A extends Form>(
  form: A,
  data: string[][],
): { ok: Data<A>[]; no: { [_ in keyof A]?: Err<string> }[] } => {
  const keys = Object.keys(form);
  let z = data.length, y, key, input;
  const ok = Array<Data<Form>>(z), no = Array<{ [_: string]: Err<string> }>(z);
  do ok[--z] = {}, no[z] = {}; while (z);
  do {
    key = keys[z], input = form[key], y = data.length;
    switch (input.type) {
      case Type.ENUM: {
        const has = Set.prototype.has.bind(new Set(input.options));
        do {
          const from = data[--y][z];
          if (from) {
            if (has(from)) ok[y][key] = from;
            else no[y][key] = new Err(422, from, "options");
          } else if (input.value) ok[y][key] = input.value;
          else no[y][key] = new Err(422, from, "required");
        } while (y);
        break;
      }
      case Type.SET: {
        const value = input.value && new Set<string>(JSON.parse(input.value));
        const has = Set.prototype.has.bind(new Set(input.options));
        do {
          const from = data[--y][z];
          if (from) {
            try {
              const json = JSON.parse(from);
              if (!Array.isArray(json)) no[y][key] = new Err(422, from, "type");
              else {
                const out = new Set<string>();
                let bad = 0;
                for (let x = 0; x < json.length; ++x) {
                  const option = json[x];
                  if (typeof option !== "string" || !has(option)) bad ||= 1;
                  else out.add(option);
                }
                if (bad) no[y][key] = new Err(422, from, "options");
                else ok[y][key] = out;
              }
            } catch {
              no[y][key] = new Err(422, from, "type");
            }
          } else if (value) ok[y][key] = new Set(value);
          else no[y][key] = new Err(422, from, "required");
        } while (y);
        break;
      }
      case Type.DATE: {
        const value = input.value && new Date(input.value);
        const min = +input.min!, max = +input.max!;
        do {
          const from = data[--y][z];
          if (from) {
            const out = new Date(from), time = +out;
            if (isNaN(time)) no[y][key] = new Err(422, from, "type");
            else if (time < min) no[y][key] = new Err(422, from, "min");
            else if (time > max) no[y][key] = new Err(422, from, "max");
            else ok[y][key] = out;
          } else if (value) ok[y][key] = new Date(value);
          else no[y][key] = new Err(422, from, "required");
        } while (y);
        break;
      }
      case Type.NUMBER: {
        const value = input.value && +input.value, min = +input.min!;
        const max = +input.max!;
        const step = input.step === undefined
          ? Number.isSafeInteger
          : input.step === "any"
          ? Number.isFinite
          : stepper.bind(null, input.step);
        do {
          const from = data[--y][z];
          if (from) {
            const out = +from;
            if (Number.isNaN(out)) no[y][key] = new Err(422, from, "type");
            else if (out < min) no[y][key] = new Err(422, from, "min");
            else if (out > max) no[y][key] = new Err(422, from, "max");
            else if (!step(out)) no[y][key] = new Err(422, from, "step");
            else ok[y][key] = out;
          } else if (value !== undefined) ok[y][key] = value;
          else no[y][key] = new Err(422, from, "required");
        } while (y);
        break;
      }
      case Type.STRING: {
        const value = input.value, minlength = +input.minlength!;
        const maxlength = +input.maxlength!, pattern = input.pattern;
        do {
          const from = data[--y][z];
          if (from) {
            if (from.length < minlength) {
              no[y][key] = new Err(422, from, "minlength");
            } else if (from.length > maxlength) {
              no[y][key] = new Err(422, from, "maxlength");
            } else if (pattern?.test(from) === false) {
              no[y][key] = new Err(422, from, "pattern");
            } else ok[y][key] = from;
          } else if (value) ok[y][key] = value;
          else no[y][key] = new Err(422, from, "required");
        } while (y);
        break;
      }
    }
  } while (++z < keys.length);
  return <{ ok: Data<A>[]; no: { [_ in keyof A]?: Err<string> }[] }> { ok, no };
};

/**
 * Abbreviated (but equivalent) email regex.
 *
 * @see {@link https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email) | HTML standard}
 */
export const EMAIL =
  /^(?![ -~]{255,})[\w!#-'*+./=?^-~-]+@[\dA-Z](?:[-\dA-Z]{0,61}[\dA-Z])?(?:\.[\dA-Z](?:[-\dA-Z]{0,61}[\dA-Z])?)*$/i;
