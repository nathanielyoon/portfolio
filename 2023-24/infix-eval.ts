export type Infix = (...a: bigint[]) => bigint[];
const TOKENS = "[\\w!~*/%+\\-<>&^|?]";
export const INFIX = RegExp(`^${TOKENS}+$`);
export default (input: number, postfix: string) => {
  let a = Array(input), b = Array(26 - input), c: string[] = [], d, z;
  for (z = 0; z < input; ++z) a[z] = String.fromCharCode(z + 65);
  for (z = 0, d = input + 97; d < 123; ++z, ++d) b[z] = String.fromCharCode(d);
  d = postfix.match(RegExp(TOKENS, "g")) ?? [], z = 0;
  for (let e = () => c.pop() ?? "0n", f, g; z < d.length; ++z) {
    if (
      (f = d[z]) === "0" || f === "1" || f === "2" || f === "3" || f === "4"
      || f === "5" || f === "6" || f === "7" || f === "8" || f === "9"
    ) c.push(`${f}n`);
    else if (b.includes(f)) c.push(`(${f}=${e()})`);
    else if (a.includes(f) || b.includes(f = f.toLowerCase())) c.push(f);
    else {switch (f) {
        case "!":
          c.push(`(${e()}?0n:1n)`);
          break;
        case "~":
          c.push(`~${e()}`);
          break;
        case "_":
          c.push(`(_=${e()},_?_>0n?1n:-1n:0n)`);
          break;
        case "?":
          f = e(), g = e(), c.push(`(${e()}?${g}:${f})`);
          break;
        case "<":
        case ">":
          f += f;
        case "*":
        case "/":
        case "%":
        case "+":
        case "-":
        case "&":
        case "^":
        case "|":
          g = e(), c.push(`(${e()}${f}${g})`);
      }}
  }
  for (z = 0; z < input; ++z) a[z] += "=0n";
  for (z = 0, d = 26 - input; z < d; ++z) b[z] += "=0n";
  return <Infix> Function(a.join(","), `let ${b};return[${c}]`);
};
