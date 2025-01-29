import { assertEquals, assertLessOrEqual } from "@std/assert";
import { b_s } from "../spec/encoding.ts";
import { Blossom, hungarian } from "../spec/matching.ts";
import { read, test } from "./test.ts";
import problem_cases from "../../public/static/matching/problem_cases.json" with {
  type: "json",
};

test(hungarian.name, () => {
  assertEquals(
    new Float64Array(
      hungarian(new Float64Array([8, 5, 9, 4, 2, 4, 7, 3, 8]), 3).buffer,
    ),
    new Float64Array([0, 2, 1, 15]),
    "wikipedia example",
  );
  const a = new Float64Array();
  for (
    const b of [
      [a, 0],
      [new Float64Array(1), 2],
      [new Float64Array(3), 2],
    ] as const
  ) assertEquals(hungarian(b[0], b[1]), a, "empty");
});
const A = await read("matching/mwmatching.py"), B = 0x100000000, C = 0x39e2d;
const edges = (size: number, seed_1: number, seed_2: number) => {
  const a: [number, number, number][] = [], b = Array<Float64Array>(size);
  for (let y = 0; y < size; ++y) b[y] = new Float64Array(size);
  for (let y = 0; y < size; ++y) {
    for (let x = y + 1; x < size; ++x) {
      seed_1 = seed_1 * C >>> 0, seed_2 = seed_2 * C >>> 0;
      const f = +(seed_1 + seed_2 / B).toFixed(1);
      const [g, h] = seed_1 > seed_2 ? [x, y] : [y, x], i = y ^ x;
      a.push([g, h, b[y][x] = b[x][y] = i % 11 ? 0 : i & 1 ? -f : f]);
    }
  }
  return [a, b] satisfies [unknown, unknown];
};
test(Blossom.name, async (rng) => {
  const a = new Int32Array(2), b = new Uint8Array(a.buffer);
  for (let z = 2; z < 96; z += (Math.random() * 16 | 0) + 16) {
    rng(b);
    const c = a[0], d = a[1], [e, f] = edges(z, c, d);
    const g = JSON.parse(
      await new Deno.Command("python3", {
        args: [
          "-c",
          `import json
DEBUG = None
CHECK_DELTA = False
CHECK_OPTIMUM = False
${A.slice(1189, A.indexOf("# Unit tests"))}
one, two = ${c}, ${d}
edges = []
for vertex_1 in range(${z}):
    for vertex_2 in range(vertex_1 + 1, ${z}):
        one = one * ${C} % ${B}
        two = two * ${C} % ${B}
        weight = round(one + two / ${B}, 1)
        xor = vertex_1 ^ vertex_2
        if xor % 11: weight = 0
        elif xor & 1: weight *= -1
        edges.append([vertex_1, vertex_2, weight])
print(json.dumps([
    maxWeightMatching(edges, True),
    maxWeightMatching(edges, False),
], separators=(",",":")))`,
        ],
      }).output().then((Z) => b_s(Z.stdout)),
    );
    for (let z = 0; z < 2; ++z) {
      const h = [...new Blossom(e, !z).mate];
      try {
        assertEquals(h, g[z], `blossom ${z} same`);
      } catch {
        let i = 0, j = 0;
        for (let x = 0; x < z; ++x) i += f[x][h[x]], j += f[x][g[z][x]];
        try {
          assertLessOrEqual(i, j, `blossom ${z} weight`);
        } catch (Y) {
          console.log([z, c, d]);
          throw Y;
        }
      }
    }
  }
});
test("problem cases", () => {
  for (const a of problem_cases) {
    assertEquals(
      [...new Blossom(edges(a.size, a.seed_1, a.seed_2)[0], true).mate],
      a.matching,
      a.message,
    );
  }
});
