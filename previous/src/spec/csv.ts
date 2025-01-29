export const json_csv = (json: string[][]) => {
  let a = "";
  for (let z = 0, y, b, c; z < json.length; a = a.replace(/,$/, "\r\n")) {
    for (b = json[z++], y = 0; y < b.length; ++y) {
      a += `${/[\n\r",]/.test(c = b[y]) ? `"${c.replaceAll('"', '""')}"` : c},`;
    }
  }
  return a.slice(0, -2);
};
export const csv_json = (csv: string) => {
  const a = csv.trim().replace(/\n\r?(?:\n\r?)+/g, "\n\r"), b: string[][] = [];
  for (let z = 0, y = 0, x = 0, c = 0, d; z < a.length; ++z) {
    d = a[z], (b[y] ??= [])[x] ??= "";
    if (d === '"') c && a[z + 1] === '"' ? (b[y][x] += d, ++z) : c ^= 1;
    else if (c) b[y][x] += d;
    else if (d === ",") ++x;
    else if (d === "\r" && a[z + 1] === "\n") ++z, ++y, x = 0;
    else if ((d === "\n" || d === "\r")) ++y, x = 0;
    else b[y][x] += d;
  }
  return b;
};
