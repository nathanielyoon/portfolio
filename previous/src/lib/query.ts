import { Err } from "./error.ts";
import { keys } from "./input.ts";

type Tag = keyof HTMLElementTagNameMap;
export const $: {
  <A extends Tag>(tag: A, parent?: Element): HTMLElementTagNameMap[A];
  <A extends Tag>(tag: string, parent?: Element): HTMLElementTagNameMap[A];
} = (tag, parent = document.body) => parent.querySelector(tag) ?? Err.not(tag);
export const $$: {
  <A extends Tag>(tag: A, parent?: Element): HTMLElementTagNameMap[A][];
  <A extends Tag>(tag: string, parent?: Element): HTMLElementTagNameMap[A][];
} = (tag, parent = document.body) => [...parent.querySelectorAll(tag)];
export const add = <A extends Tag>(
  tag: A,
  parent: Element | null,
  attributes: {
    [B in keyof HTMLElementTagNameMap[A]]?: HTMLElementTagNameMap[A][B];
  } = {},
) => {
  const a = document.createElement(tag);
  parent?.appendChild(a);
  for (let z = 0, b = keys(attributes); z < b.length; ++z) {
    const c = attributes[b[z]];
    if (c !== undefined) a[b[z]] = c;
  }
  return a;
};
