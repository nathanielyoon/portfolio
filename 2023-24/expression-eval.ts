import { no, test } from "./regex.ts";

export type Eval = (...input: bigint[]) => bigint;
const EXPRESSION =
  /^(?:(?:\s)|(?:\/\/[ -~]*\n)|(?:0|[1-9]\d*|0x[\da-f]+|0b[01]+)|(?:[A-Z][A-Z_]*)|(?:[a-z](?:(?:\s|\/\/[ -~]*\n)*(?:[/%^+-]|([&|*])\1?|<<|>>)?=)?)|(?:(?<!\w\s*)\$\d*(?:\s|\/\/[ -~]*\n)*(?:\(|=(?:\s|\/\/[ -~]*\n)*\((?:\s|\/\/[ -~]*\n)*(?:_\w+(?:\s|\/\/[ -~]*\n)*=(?:\s|\/\/[ -~]*\n)*(?:0|[1-9]\d*|0x[\da-f]+|0b[01]+)(?:\s|\/\/[ -~]*\n)*(?:,(?:\s|\/\/[ -~]*\n)*_\w+(?:\s|\/\/[ -~]*\n)*=(?:\s|\/\/[ -~]*\n)*(?:0|[1-9]\d*|0x[\da-f]+|0b[01]+))*)?\)(?:\s|\/\/[ -~]*\n)*=>))|(?:[(),:~^*/%+-]|([&|?])(?!\2)|<<|>>))*$/;
const initialize = (a: string[], b: string) => {
  const c: string[] = [];
  for (let z = 0, d; z < a.length; ++z) b.includes(d = a[z]) || c.push(d);
  for (let z = 0; z < c.length; ++z) c[z] = c[z] + " = " + b;
  return c.join(", ");
};
export default function expression(source: string) {
  const a = test(EXPRESSION, source.replace(/^\s+|\s+$/g, ""));
  const b = initialize(a.match(/\b[a-z]\b/g) ?? [], "0n");
  const c = initialize(a.match(/\$\d*/g) ?? [], "() => 0n");
  try {
    return <Eval> Function(
      initialize(a.match(/\b[A-Z][A-Z_]\b/g) ?? [], "0n"),
      `  ${b && "let " + b + ";"}\n  ${c && "let " + c + ";"}\n  return ${
        a.replace(/\b(?:0|[1-9]\d*|0x[\da-f]+|0b[01]+)\b/g, "$&n")
      };`,
    );
  } catch (e) {
    throw no(
      "Valid Javascript expression",
      e instanceof Error ? e.message : "Error",
      "dev.mozilla.org/Web/Javascript/Guide/Expressions_and_Operators",
    );
  }
}
