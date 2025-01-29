export type Env = { R2: R2Bucket };
export default {
  async fetch(request: Request, env: Env) {
    const { pathname } = new URL(request.url);
    const file = await fetch(
      `https://i.imgur.com/${pathname.replace(/\//g, "")}.jpeg`,
    ).then((response) => response.blob());
    return env.R2.put("latest", file, {
      httpMetadata: { contentType: "image/jpeg", contentDisposition: "inline" },
    }).then(() =>
      Response.redirect("https://leo-report.nathanielyoon.com/latest")
    );
  },
};
