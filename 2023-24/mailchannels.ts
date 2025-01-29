import { type ExecutionContext, type ExportedHandler, R2Bucket, type Response as R } from "@cloudflare/workers-types/experimental";
import { b62_i, b62_n, i_b62, n_b62 } from "../src/lib/base.ts";
import { decrypt, encrypt, point, scalar } from "../src/lib/crypto.ts";

const r = (a: number) =>
  new Response(a >= 400 ? `ERROR ${a}` : null, { status: a }) as unknown as R;
const now = (offset = 86400) => Date.now() / 1000 + offset;
const is_probably_email = (a: unknown): a is string =>
  typeof a === "string"
  && /^[^@]{1,64}@(?=[\dA-Za-z-.]{1,255})[\dA-Za-z-]{1,64}(?:\.[\dA-Za-z-]{1,64})*$/
    .test(a);
const email = (a: ExecutionContext, b: string, c: string, d: string) => (
  a.waitUntil(fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    body: JSON.stringify({
      personalizations: [{ to: [{ email: b }] }],
      from: { email: "noreply@tab.wiki", name: "tab.wiki" },
      subject: c,
      content: [{ type: "text/plain", value: d }],
    }),
  })), new Response("OK", { status: 202 }) as unknown as R
);
export default {
  async fetch(a, b, c) {
    switch (a.method) {
      case "GET": {
        const d = new URL(a.url).searchParams, e = d.get("a");
        if (!e || !/^[\dA-Za-z]{43}[-\w]{66,}$/.test(e)) return r(400);
        const f = e.slice(0, 43);
        let g = decrypt(BigInt(`0x${b.PRIVATE_KEY}`), b62_i(f), e.slice(43));
        if (!g) return r(403);
        if (!/^[\dA-Za-z]{6}/.test(g) || b62_n(g) < now(0)) return r(410);
        return is_probably_email(g = g.slice(6))
          ? b.R2.put(f, g, {
            httpMetadata: {
              contentType: "text/plain",
              contentDisposition: "inline",
              cacheControl: "public,max-age=31536000,immutable",
            },
            onlyIf: { uploadedBefore: new Date(1632844800000) },
          }).then(h =>
            (h
              ? Response.redirect(`https://key.tab.wiki/${f}`, 303)
              : r(500)) as unknown as R
          )
          : g === "DELETE"
          ? (c.waitUntil(b.R2.delete(f)), r(204))
          : r(400);
      }
      case "POST": {
        const d = await a.formData(), e = d.get("email");
        if (!is_probably_email(e)) return r(400);
        const f = scalar(), g = point(f), h = i_b62(g);
        return email(
          c,
          e,
          "Confirm post request",
          `Private key (never share this): ${i_b62(f)}
Link to complete upload (expires in about 24 hours): https://email.tab.wiki?a=${h}${
            encrypt(BigInt(`0x${b.PRIVATE_KEY}`), g, n_b62(now()) + e)
          }`,
        );
      }
      case "DELETE": {
        const d = new URL(a.url).searchParams.get("a");
        if (!d || !/^[\dA-Za-z]{43}$/.test(d)) return r(400);
        const e = await b.R2.get(d).then(e => e?.text());
        if (!is_probably_email(e)) return r(404);
        return email(
          c,
          e,
          "Confirm delete request",
          `Public key (at key.tab.wiki): ${d}
Link to complete removal (expires in about 24 hours): https://email.tab.wiki?a=${d}${
            encrypt(
              BigInt(`0x${b.PRIVATE_KEY}`),
              b62_i(d),
              n_b62(now()) + "DELETE",
            )
          }`,
        );
      }
      default:
        return r(405);
    }
  },
} satisfies ExportedHandler<{ R2: R2Bucket; PRIVATE_KEY: string }>;
