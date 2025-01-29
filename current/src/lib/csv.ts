/**
 * @module
 *
 * Comma-separated values (CSV).
 *
 * @see {@link https://w.wiki/3qNX | Comma-separated values}
 * @see {@link https://rfc-editor.org/rfc/rfc4180 | RFC4180}
 */

/**
 * Encode JSON to CSV.
 *
 * @param json Array of rows, each an array of strings.
 * @returns Encoded CSV (without a header row).
 *
 * CSV files may include a header row that labels the fields of the subsequent
 * rows, each of which should be parsed as an object instead of a plain array.
 * This project doesn't need that functionality.
 */
export const json_csv = (json: string[][]): string => {
  let out = "";
  for (let z = 0, y, row; z < json.length; ++z) {
    for (row = json[z], y = 0; y < row.length; ++y) {
      out += /[\r\n",]/.test(row[y])
        ? `"${row[y].replaceAll('"', '""')}",`
        : row[y] + ",";
    }
    out = out.replace(/,$/, "\r\n");
  }
  return out.slice(0, -2);
};

/**
 * Decode JSON from CSV.
 *
 * @param csv CSV string. (No restrictions - any string is parse-able.)
 * @returns Decoded JSON (disregarding the possibility of a header row).
 *
 * For each character:
 * - If it's a quotation mark:
 *   - If you're in a quoted field, it either escapes a following quotation mark
 *     (so append it) or it ends the field.
 *   - If you're not in a quoted field, it starts one.
 * - If you're in a quoted field, only quotation marks have special meaning, so
 *   add the character to the field's value.
 * - Otherwise, you're not in a quoted field, so you have to handle the
 *   remaining non-quote special characters:
 *   - If it's a comma, end the current field. Then, every subsequent comma
 *     indicates the absence of a field, so add the corresponding `null` values.
 *   - If it's a line break, end the current row. RFC4180 "uses CRLF to denote
 *     line breaks" but this implementation is "aware that some implementations
 *     may use other values" (i.e. LF).
 * - If the character isn't special, add it to the current field's value.
 */
export const csv_json = (csv: string): string[][] => {
  const out: string[][] = [];
  let z = 0, y = 0, x = 0, quoting = 0, character;
  while (z < csv.length) {
    character = csv[z++], (out[y] ??= [])[x] ??= "";
    if (character === '"') {
      if (quoting && csv[z] === '"') out[y][x] += character, ++z;
      else quoting ^= 1;
    } else if (quoting) out[y][x] += character;
    else if (character === ",") ++x;
    else if (character === "\r" && csv[z] === "\n") ++z, ++y, x = 0;
    else if (character === "\n") ++y, x = 0;
    else out[y][x] += character;
  }
  return out;
};
