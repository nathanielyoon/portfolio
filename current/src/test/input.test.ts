import { assertEquals } from "@std/assert";
import {
  type Data,
  EMAIL,
  type Form,
  parse,
  stringify,
  Type,
} from "lib/input.ts";
import { read, type RNG, test } from "./test.ts";
import type { Err } from "lib/error.ts";

const comp_error = (
  cause: string,
  message: string,
  error: Err<string> | undefined,
) =>
  assertEquals(
    { code: 422, cause: error?.cause, message: error?.message },
    { code: 422, cause, message },
    "no",
  );
const empty = (length: number) => Array.from({ length }, () => ({}));
type Input<A extends Type> = Form[string] & { type: A };
type Value<A extends Type> = Data<{ [_ in 0]: Form[string] & { type: A } }>[0];
class Tester<A extends Type> {
  constructor(private type: A, private rng: RNG) {}
  test<
    B extends Exclude<keyof Input<A>, "required" | "value"> & string,
    C extends Exclude<Input<A>[B], undefined>,
  >(
    key: B,
    generate: (rng: RNG) =>
      & { [_ in B]: C }
      & { [D in Exclude<keyof Input<A>, B>]?: Input<A>[D] },
    ok: ((rng: RNG, generated: C) => Value<A>)[],
    no: ((rng: RNG, generated: C) => string)[],
    repeat = 16,
  ) {
    const oks = Array<{ [_: string]: Value<A> }>(ok.length);
    const nos = Array<[string]>(no.length);
    for (let z = 0, y; z < repeat; ++z) {
      const generated = generate(this.rng);
      y = oks.length;
      do oks[--y] = { [key]: ok[y](this.rng, generated[key]) }; while (y);
      do nos[y] = [no[y](this.rng, generated[key])]; while (++y < nos.length);
      const required = <Form> {
        [key]: { type: this.type, ...generated, required: true },
      };
      const json = stringify(required, oks);
      const value = <Form> {
        [key]: { type: this.type, ...generated, value: json[0][0] },
      };
      const required_no = parse(required, nos), value_no = parse(value, nos);
      assertEquals(parse(required, json), {
        ok: oks,
        no: empty(oks.length),
      }, "ok required"), assertEquals(required_no.ok, empty(nos.length), "no");
      assertEquals(parse(value, [[""]]), {
        ok: [{ [key]: oks[0][key] }],
        no: empty(1),
      }, "ok value"), assertEquals(value_no.ok, empty(nos.length), "no");
      do {
        const error = nos[--y][0];
        comp_error(error, key, required_no.no[y][key]);
        comp_error(error, key, value_no.no[y][key]);
      } while (y);
      const k = parse(required, [[""]]);
      assertEquals(k.ok, empty(1), "no required");
      comp_error("", "required", k.no[0][key]);
    }
    return this;
  }
}
const options = (rng: RNG, length = 64, size = 32) => ({
  options: Array.from({ length }, () => rng.string(size)),
});
test(Type.ENUM, (rng) =>
  new Tester(Type.ENUM, rng)
    .test(
      "options",
      options,
      [(Z, Y) => Y[Z.number() % Y.length]],
      [(Z, Y) => `${Z.number(10)}`.repeat(~-Y[0].length)],
    ));
test(Type.SET, (rng) =>
  new Tester(Type.SET, rng)
    .test(
      "type",
      (Z) => ({ ...options(Z), type: Type.SET as const }),
      [() => new Set()],
      [() => "invalid", () => "null", () => "false", () => "0", () => '""'],
    )
    .test(
      "options",
      options,
      [
        () => new Set(),
        (_, Z) => new Set(Z),
        (Z, Y) => new Set([Y[Z.number() % Y.length]]),
        (Z, Y) => new Set(Y.slice(0, Z.number() % Y.length)),
      ],
      [(Z, Y) => JSON.stringify([`${Z.number(10)}`.repeat(~-Y[0].length)])],
    ));
test(Type.DATE, (rng) =>
  new Tester(Type.DATE, rng)
    .test(
      "type",
      () => ({ type: Type.DATE as const }),
      [() => new Date(), () => new Date("1970-01-01T00:00:00.000Z")],
      [() => "a", () => "1970-13-01", () => `${undefined}`],
    )
    .test(
      "min",
      (Z) => ({ min: new Date(Z.number() * 1000) }),
      [(_, Z) => new Date(Z), (_, Z) => new Date(+Z + 1)],
      [(_, Z) => new Date(+Z - 1).toISOString()],
    )
    .test(
      "max",
      (Z) => ({ max: new Date(Z.number() * 1000) }),
      [(_, Z) => new Date(Z), (_, Z) => new Date(+Z - 1)],
      [(_, Z) => new Date(+Z + 1).toISOString()],
    ));
test(Type.NUMBER, (rng) =>
  new Tester(Type.NUMBER, rng)
    .test(
      "type",
      () => ({ type: Type.NUMBER as const }),
      [(Z) => Z.number()],
      [() => "a", () => `${undefined}`],
    )
    .test(
      "min",
      (Z) => ({ min: Z.number() }),
      [(_, Z) => Z, (_, Z) => Z + 1],
      [(_, Z) => `${Z - 1}`],
    )
    .test(
      "max",
      (Z) => ({ max: Z.number() }),
      [(_, Z) => Z, (_, Z) => Z - 1],
      [(_, Z) => `${Z + 1}`],
    )
    .test(
      "step",
      () => ({ step: <number> <unknown> undefined }),
      [(Z) => Z.number()],
      [() => "Infinity", () => "1e16", (Z) => `${Z.number() / Z.number()}`],
    )
    .test(
      "step",
      (Z) => ({ step: Z.number(0x100) + 1 }),
      [() => 0, (Z, Y) => Z.number() * Y],
      [() => "Infinity", (_, Z) => `${Z + 1}`, (_, Z) => `${Z - 1}`],
    )
    .test(
      "step",
      () => ({ step: "any" as const }),
      [(Z) => Z.number(), (Z) => Z.number() / Z.number()],
      [() => "Infinity", () => "1e309"],
    ));
test(Type.STRING, async (rng) => {
  const wikipedia: string =
    JSON.parse(await read("input/wikipedia_email_address.json")).source;
  const examples =
    (wikipedia.slice(21461, 23619) + wikipedia.slice(23751, 24747)).match(
      /(?<=\* <code>).+?(?=<\/code>)/g,
    )!;
  const official_regex = RegExp(
    (await read("input/html_input_standard.html")).slice(199731, 199868)
      .replace("&amp;", "&"),
  );
  const ok: (() => string)[] = [], no: (() => string)[] = [];
  for (let z = 0; z < examples.length; ++z) {
    (official_regex.test(examples[z]) ? ok : no).push(() => examples[z]);
  }
  new Tester(Type.STRING, rng)
    .test(
      "minlength",
      (Z) => ({ minlength: Z.number(0x100) + 2 }),
      [(Z, Y) => Z.string(Y), (Z, Y) => Z.string(Y + 1)],
      [(Z, Y) => Z.string(Y - 1)],
    )
    .test(
      "maxlength",
      (Z) => ({ maxlength: Z.number(0x100) + 2 }),
      [(Z, Y) => Z.string(Y), (Z, Y) => Z.string(Y - 1)],
      [(Z, Y) => Z.string(Y + 1)],
    )
    .test("pattern", () => ({ pattern: EMAIL }), ok, no, 1);
});
