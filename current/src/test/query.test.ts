import { DOMParser, type Element as DOMElement } from "@b-fuze/deno-dom/native";
import { assertEquals, assertThrows } from "@std/assert";
import { $, $$ } from "lib/query.ts";
import { test } from "./test.ts";
import { b_s64 } from "lib/64.ts";

test("query", (rng) => {
  const key = new Uint8Array(16);
  for (let z = 0; z < 8; ++z) {
    const document = new DOMParser().parseFromString("", "text/html");
    const body = document.body;
    const children = Array<DOMElement>(z);
    const ids = Array<string>(z);
    const classes = Array<string>(z);
    for (let y = 0; y < z; ++y) {
      const child = children[y] = document.createElement("div");
      child.id = ids[y] = "-" + b_s64(rng(key));
      child.className = classes[y] = "-" + b_s64(rng(key));
      body.appendChild(child);
    }
    assertEquals($$("div", body).length, z, "all");
    for (let y = 0; y < z; ++y) {
      const child = children[y].outerHTML;
      assertEquals($(`#${ids[y]}`, body).outerHTML, child, "id");
      assertEquals($(`.${classes[y]}`, body).outerHTML, child, "class");
      children[y].remove();
    }
    for (let y = 0; y < z; ++y) assertThrows(() => $(`.${classes[y]}`, body));
    assertEquals($$("div", body).length, 0, "none");
  }
});
