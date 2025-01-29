/*
 * @module
 *
 * Convenient `querySelector` and `querySelectorAll`.
 *
 * @see {@linkcode https://dev.mozilla.org/Web/API/Element/querySelector | querySelector}
 * @see {@linkcode https://dev.mozilla.org/Web/API/Element/querySelectorAll | querySelectorAll}
 */

import { Err } from "./error.ts";

const never = () => {
  throw new Err(500, "$");
};
/** Accepts Deno's and {@link https://jsr.io/@b-fuze/deno-dom | Deno DOM}'s. */
export type Queryable = {
  querySelector: (tag_or_selector: string) => Element | null;
  querySelectorAll: (tag_or_selector: string) => Iterable<unknown>;
};

/**
 * Wraps `querySelector`.
 *
 * @param selector HTML tag or CSS selector.
 * @param on Element to query.
 * @returns HTML element.
 * @throws When there are no matches.
 *
 * If type parameter `A` is passed explicitly, it will faithfully type the
 * returned element(s) regardless of selectors - including bare element names.
 * For example, `$<"a">("p.c")`'s type is `HTMLAnchorElement`, not
 * `HTMLParagraphElement`, but so is `$<"a">("p")`'s even though `$("p")` is
 * correctly inferred.
 */
export const $: {
  <A extends keyof HTMLElementTagNameMap>(
    selector: A,
    on?: Queryable,
  ): HTMLElementTagNameMap[A];
  <A extends keyof HTMLElementTagNameMap>(
    selector: string,
    on?: Queryable,
  ): HTMLElementTagNameMap[A];
} = (selector, on = document.body) => on.querySelector(selector) ?? never();

/**
 * Wraps `querySelectorAll`.
 *
 * @param selector HTML tag or CSS selector.
 * @param on Element to query.
 * @returns Array of matched elements.
 *
 * @see {@linkcode $} warns about the explicit type parameter.
 */
export const $$: {
  <A extends keyof HTMLElementTagNameMap>(
    selector: A,
    on?: Queryable,
  ): HTMLElementTagNameMap[A][];
  <A extends keyof HTMLElementTagNameMap>(
    selector: string,
    on?: Queryable,
  ): HTMLElementTagNameMap[A][];
} = (selector, on = document.body) => [...on.querySelectorAll(selector)];
