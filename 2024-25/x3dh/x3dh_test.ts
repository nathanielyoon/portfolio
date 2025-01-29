import { publish, receive, send } from "../lib/x3dh.ts";
import { LOOP, RNG, test } from "./test.ts";
import { generate, verify } from "../lib/25519.ts";
import { assert, assertEquals, assertThrows } from "jsr:@std/assert@^1.0.0";

test(publish, (rng) => {
  const a = new Uint8Array(128);
  for (let z = 0; z < LOOP >>> 4; ++z) {
    const b = publish(rng.u8(a)), c = generate(a);
    assertEquals(b.subarray(128, 160), generate(a.subarray(64)), "1");
    assertEquals(b.subarray(160, 192), generate(a.subarray(96)), "2");
    assertEquals(b.subarray(0, 32), c, "identity");
    assert(verify(c, b.subarray(32, 64), b.subarray(64, 128)), "prekey");
  }
});
test(`${send.name} ${receive.name}`, (rng) => {
  const a = rng.u8(new Uint8Array(64 + ((LOOP >>> 3) + 31 & ~31)));
  const b = publish(a), c = new Uint8Array(32), d = rng.string(RNG.ascii);
  for (let z = 0; z < LOOP >>> 6; ++z) {
    const e = d(z + 1 << 4), f = send(rng.u8(c), b, e), g = receive(a, f[1]);
    assertEquals(f[0], g[0], "shared secret"), assertEquals(g[1], e, "text");
  }
  const e = send(rng.u8(c), b, "");
  ++b[32], assertThrows(() => send(new Uint8Array(), b, ""), "invalid prekey");
  ++e[1][64], assertThrows(() => receive(a, e[1]), "wrong prekey");
});
