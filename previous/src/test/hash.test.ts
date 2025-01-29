import { assert, assertEquals } from "@std/assert";
import { b_s } from "../spec/encoding.ts";
import { mph, oaat, query } from "../spec/hash.ts";
import { test, url } from "./test.ts";

test(oaat.name, async (rng) => {
  const a = url("public/static/oaat/micro_oaat.o");
  try {
    await Deno.stat(a);
  } catch (Z) {
    if (!(Z instanceof Deno.errors.NotFound)) throw Z;
    await new Deno.Command(
      "g++",
      { args: [a.slice(0, -1) + "cpp", "-o", a] },
    ).output();
  }
  const c = new Deno.Command(a, { stdin: "piped", stdout: "piped" });
  const d = new Uint8Array(32), e = Array<Promise<void>>(8);
  for (let z = 0; z < e.length; ++z) {
    const f = rng(d).map((Z) => Z % 94 + 33);
    const g = c.spawn(), h = g.stdin.getWriter();
    e[z] = h.write(f)
      .then(() => h.ready)
      .then(() => h.close())
      .then(() => g.output())
      .then((Z) => assertEquals(oaat(f, 0), +b_s(Z.stdout), "ascii oaat"));
  }
  await Promise.all(e);
});
test(mph.name, (rng) => {
  for (let z = 0; z < 0x1000; z += 111) {
    const a = Array<Uint8Array>(z);
    for (let y = 0; y < a.length; ++y) a[y] = rng(new Uint8Array(32));
    const b = mph(a), c = new Set<number>();
    for (let y = 0; y < a.length; ++y) c.add(query(b, a[y]));
    assertEquals(c.size, a.length, "minimal");
    for (let y = 0; y < a.length; ++y) assert(c.has(y), "perfect");
  }
});
