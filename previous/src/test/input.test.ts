import { assert, assertEquals } from "@std/assert";
import {
  type Data,
  type Form,
  FORMATS,
  type Input,
  keys,
  parse,
  stringify,
  Type,
  Value,
} from "../lib/input.ts";
import { b_s16, type RNG, test } from "./test.ts";
import { mix } from "../spec/number.ts";
import { Err } from "../lib/error.ts";

// // const create_test = <A extends Type>(
// //   type: A,
// //   base: (index: number) => Input & { type: A },
// //   generate: (
// //     input: Input & { type: A },
// //     index: number,
// //   ) => [Value<Input & { type: A }>, Value<Input & { type: A }>],
// // ) => {
// //   for (let z = 1; z < 16; ++z) {
// //     const a = base(z), b = { [z]: a } satisfies Form;
// //     const c = Array<Data<typeof b>>(z), d = Array<Data<typeof b>>(z);
// //     for (let y = 0; y < z; ++y) {
// //       const [g, h] = generate(a, y);
// //       c[y] = { [z]: g }, d[y] = { [z]: h };
// //     }
// //     assertEquals(parse(b, stringify(b, c)), c);
// //     const e = stringify(b, d), f = Array<{ [_: string]: Err<string> }>(z);
// //     for (let y = 0; y < z; ++y) f[y] = {[z]: }
// //     assertEquals(parse(b, stringify(b, d)), f);
// //   }
// // };
// test(Type.ENUM, (rng) => {
//   for (let z = 0; z < 16; ++z) {
//     const a = {
//       [z]: INPUT[Type.ENUM]({
//         type: Type.ENUM,
//         required: !(z & 1),
//         options: Array(z + 1),
//       }, rng),
//     } satisfies Form;
//     const b = Array<string[]>(z + 1), c = Array<Data<typeof a>>(z + 1);
//     for (let y = 0; y < b.length; ++y) {
//       const d = a[z].options[y];
//       b[y] = [d], c[y] = { [z]: d };
//     }
//     assertEquals(parse(a, b), c, "option ok");
//   }
// });
// test(Type.SET, (rng) => {
//   for (let z = 0; z < 16; ++z) {
//     const a = {
//       [z]: INPUT[Type.ENUM]({
//         type: Type.ENUM,
//         required: !(z & 1),
//         options: Array(z + 1),
//       }, rng),
//     } satisfies Form;
//     const b = Array<string[]>(z + 1), c = Array<Data<typeof a>>(z + 1);
//     for (let y = 0; y < b.length; ++y) {
//       const d = a[z].options[y];
//       b[y] = [d], c[y] = { [z]: d };
//     }
//     assertEquals(parse(a, b), c);
//   }
// });
test(keys.name, (rng) => {
  const a = new Uint8Array(16);
  for (let z = 0; z < 0x100; ++z) {
    const b: { [_: string]: number } = {};
    for (let y = 0; y < a.length; ++y) b[b_s16(rng(a))] = y;
    const c = keys(b);
    assertEquals(c, Object.keys(b), "same keys");
    for (let y = 0; y < c.length; ++y) assert(c[y] in b, "in");
  }
});
const options = <A extends Type.ENUM | Type.SET>(
  input: Input & { type: A },
  rng: RNG,
) => {
  let z = input.options.length;
  const a = rng(new Uint8Array(z << 2)), b = new DataView(a.buffer);
  do {
    let c = b.getUint32(--z << 2, true), d = c.toString(16);
    while (input.options.includes(d)) d = (c = mix(c)).toString(16);
    (<string[]> input.options)[z >> 2] = d;
  } while (z);
  return input;
};
const number = (rng: RNG) =>
  new DataView(rng(new Uint8Array(4)).buffer).getUint32(0, true);
const INPUT = {
  [Type.ENUM]: options<Type.ENUM>,
  [Type.SET]: options<Type.SET>,
  [Type.DATE]: (input: Input & { type: Type.DATE }, rng: RNG) => {
    input.min &&= new Date(number(rng) * 1000);
    input.max &&= new Date(number(rng) * 1000);
    +input.min! > +input.max! &&
      ([input.min, input.max] = [input.max, input.min]);
    return input;
  },
  [Type.NUMBER]: (input: Input & { type: Type.NUMBER }, rng: RNG) => {
    input.min &&= number(rng), input.max &&= number(rng);
    input.min! > input.max! &&
      (input.min! ^= input.max! ^ (input.max = input.min!));
    return input;
  },
  [Type.STRING]: (input: Input & { type: Type.STRING }, rng: RNG) => {
    (<{ length: number }> input).length &&= number(rng) & 0xff;
    (<{ minlength: number }> input).minlength &&= number(rng) & 0xff;
    (<{ maxlength: number }> input).maxlength &&= number(rng) & 0xff;
    (<{ minlength: number }> input).minlength >
        (<{ maxlength: number }> input).maxlength &&
      ((<{ minlength: number }> input).minlength ^=
        (<{ maxlength: number }> input).maxlength! ^
        ((<{ maxlength: number }> input).maxlength =
          (<{ minlength: number }> input).minlength));
    input.pattern &&= FORMATS[number(rng) % FORMATS.length];
    return input;
  },
};
const create_test = <A extends Input>(
  type: A["type"],
  base: (index: number) => A,
  values: (
    input: A,
    rng: RNG,
    index: number,
  ) => [Value<A>, { [_ in keyof A]: string }],
  repeat: number,
  start = 0,
) =>
(rng: RNG) => {
  for (let z = start; z < repeat; ++z) {
    const a = base(z), [b, c] = values(a, rng, z);
  }
};
