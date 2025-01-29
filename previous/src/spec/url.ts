import { b_s16, HEX, s_b } from "./encoding.ts";
import { hmac, sha256 } from "./sha2.ts";

const iso = (date: Date) => date.toISOString().replace(/[-:]|\..../g, "");
const S3 = s_b("s3"), AWS4_REQUEST = s_b("aws4_request");
export const presign = (
  env: { S3_HOST: string; S3_ID: string; S3_KEY: string },
  path: string,
  method: "PUT" | "GET" | "HEAD" = "PUT",
  headers: { [_: string]: string } = {},
  time = 604800,
  region = "auto",
  date = new Date(),
) => {
  const a = new URL(env.S3_HOST).hostname, b = iso(date), c = b.slice(0, 8);
  const d = Object.keys(headers), e: { [_: string]: string } = { host: a };
  for (let z = 0; z < d.length; ++z) e[d[z].toLowerCase()] = headers[d[z]];
  const f = `${c}/${region}/s3/aws4_request`, g = Object.keys(e).sort();
  const h = `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${env.S3_ID}%2F${
    f.replace(/[^-.\w~]/g, (a) => "%" + HEX[a.charCodeAt(0)].toUpperCase())
  }&X-Amz-Date=${b}&X-Amz-Expires=${time}&X-Amz-SignedHeaders=${g.join("%3B")}`;
  let i = `${method}\n/${path}\n${h}\n`;
  for (let z = 0; z < g.length; ++z) i += `${g[z]}:${e[g[z]]}\n`;
  return `${a}/${path}?${h}&X-Amz-Signature=` + b_s16(
    hmac(
      hmac(
        hmac(hmac(hmac(s_b(`AWS4${env.S3_KEY}`), s_b(c)), s_b(region)), S3),
        AWS4_REQUEST,
      ),
      s_b(
        `AWS4-HMAC-SHA256\n${b}\n${f}\n${
          b_s16(sha256(s_b(`${i}\n${g.join(";")}\nUNSIGNED-PAYLOAD`)))
        }`,
      ),
    ),
  );
};
