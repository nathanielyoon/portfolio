const inline = (md: string) =>
  md.replace(/_((?:[^_]|(?<=\\)_)+)_/g, "<i>$1</i>")
    .replace(/\*\*((?:[^*]|\*(?!\*)|(?<=\\)\*\*)+)\*\*/g, "<b>$1</b>")
    .replace(/<(https:\/\/([^<>]+))>/g, '<a href="$1">$2</a>')
    .replace(/\[([^[\]]+)\]\(https:\/\/[^()]+\)/g, '<a href="$2">$1</a>')
    .replace(/`((?:[^`]|(?<=\\)`)+)`/g, "<code>$1</code>");
const id = (text: string) => text.toLowerCase().replaceAll(" ", "-");
const child = <A extends keyof HTMLElementTagNameMap>(parent: Node, tag: A) =>
  parent.appendChild(document.createElement(tag));
export const generate = (md: string) => {
  const [a, ...b] = md.split(/\n\n+/), c = document.createElement("main");
  for (let z = 0, d, e, f, g, h; z < b.length; ++z) {
    if (g = /^- (.+)/.exec(f = b[z])) {
      if (d !== 1) d = 1, e = child(c, "ul");
      child(e!, "li").innerHTML = inline(g[1]);
    } else if (g = /^\d+\. (.+)/.exec(f)) {
      if (d !== 2) d = 2, e = child(c, "ol");
      child(e!, "li").innerHTML = inline(g[1]);
    } else if (d = 0, g = /^(#{1,6}) (.+)/.exec(f)) {
      (h = child(c, `h${<1 | 2 | 3 | 4 | 5 | 6> g[1].length}`)).id = id(g[2]);
      h.innerHTML = inline(g[2]);
    } else if (g = /^> (.+)/.exec(f)) {
      child(c, "blockquote").innerHTML = inline(g[1]);
    } else if (g = /```\n(.+?)\n```/s.exec(f)) {
      child(c, "code").textContent = g[1];
    } else if (f === "---") child(c, "hr");
    else child(c, "p").innerHTML = inline(f);
  }
  const d = a.slice(2);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${d}</title><link rel="icon" href="/i.svg"><link rel="stylesheet" href="/r.css"></head><body><header><h1>${d}</h1></header>${c.outerHTML}</body></html>`;
};
