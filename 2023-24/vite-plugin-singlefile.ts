import { type PluginOption, type Rollup } from "npm:vite";

export const plugin = {
  name: "vite:single-file-improved",
  config: (user_config) => {
    user_config.base = "./";
    user_config.build = {
      assetsDir: "",
      assetsInlineLimit: 1e9,
      chunkSizeWarningLimit: 1e9,
      cssCodeSplit: false,
      rollupOptions: {
        input: { main: "index.html" },
        output: { inlineDynamicImports: true },
      },
    };
  },
  enforce: "post",
  generateBundle(_, out) {
    const html: string[] = [], js: string[] = [], css: string[] = [];
    for (let z = 0, keys = Object.keys(out), key; z < keys.length; ++z) {
      if (/\.html?$/.test(key = keys[z])) html.push(key);
      else if (/\.[mc]?js$/.test(key)) js.push(key);
      else if (/\.css$/.test(key)) css.push(key);
      else console.warn(`"${key}" not inlined`);
    }
    const names = new Set<string>();
    let asset, source, chunk, name, code: string;
    for (let z = 0, y; z < html.length; ++z) {
      asset = <Rollup.OutputAsset> out[html[z]], source = <string> asset.source;
      for (y = 0; y < js.length; ++y) {
        names.add(name = (chunk = <Rollup.OutputChunk> out[js[z]]).fileName);
        (code = chunk.code) && (source = source.replace(
          RegExp(`<script[^>]*? src="[./]*${name}"[^>]*></script>`),
          `<script>
${code.replaceAll('"__VITE_PRELOAD__"', "void 0")}  </script>`,
        ).replace(/\(function(?: polyfill)?\(\)\s*\{.*?\}\)\(\);/, ""));
      }
      for (y = 0; y < css.length; ++y) {
        names.add(name = (chunk = <Rollup.OutputAsset> out[css[z]]).fileName);
        (code = <string> chunk.source) && (source = source.replace(
          RegExp(`<link[^>]*? href="[./]*${name}"[^>]*?>`),
          `<style>
${code.replace('@charset "UTF-8";', "")}
</style>`,
        ));
      }
      asset.source = source;
    }
    for (const e of names) delete out[e];
  },
} satisfies PluginOption;
