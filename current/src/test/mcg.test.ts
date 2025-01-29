import { assertEquals } from "@std/assert";
import { and, next } from "lib/mcg.ts";
import { test } from "./test.ts";

test("next and", (rng) => {
  let seed = new BigUint64Array(rng(8).buffer)[0];
  const bigint_set = new Set<bigint>();
  const number_set = new Set<number>();
  const MAX = (-1 >>> 0) + 1;
  const count = 0x1000;
  for (let z = 0; z < count; ++z) {
    bigint_set.add(seed = next(seed));
    number_set.add(and(seed, MAX));
  }
  assertEquals(bigint_set.size, count, "no repeats");
  assertEquals(number_set.size, count, "no repeats");
});
