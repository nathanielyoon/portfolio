import type { Json } from "./types.ts";

const MAX = 0x100000000;
export class Encoder {
  private buffer = new Uint8Array(8);
  private view = new DataView(this.buffer.buffer);
  private bytes!: number[];
  private set(json: Json) {
    switch (typeof json) {
      case "boolean":
        this.bytes.push(json ? 0xc3 : 0xc2); // github.com/msgpack/msgpack/blob/master/spec.md#bool-format-family
        break;
      case "number":
        if (Number.isInteger(json)) { // github.com/msgpack/msgpack/blob/master/spec.md#int-format-family
          if (json > 0) {
            if (json < 0x80) this.bytes.push(json);
            else if (json < 0x100) this.bytes.push(0xcc, json);
            else if (json < 0x10000) this.bytes.push(0xcd, json >> 8, json);
            else if (json < MAX) {
              this.bytes.push(0xce, json >> 24, json >> 16, json >> 8, json);
            } else {
              const a = json / MAX, b = json % MAX;
              this.bytes.push(
                0xcf,
                a >> 24,
                a >> 16,
                a >> 8,
                a,
                b >> 24,
                b >> 16,
                b >> 8,
                b,
              );
            }
          } else {
            if (json >= -0x20) this.bytes.push(json);
            else if (json >= -0x80) this.bytes.push(0xd0, json);
            else if (json >= -0x8000) this.bytes.push(0xd1, json >> 8, json);
            else if (json >= -0x80000000) {
              this.bytes.push(0xd2, json >> 24, json >> 16, json >> 8, json);
            } else {
              const a = Math.abs(json + 1), b = ~(a / MAX), c = ~(a % MAX);
              this.bytes.push(
                0xd3,
                b >> 24,
                b >> 16,
                b >> 8,
                b,
                c >> 24,
                c >> 16,
                c >> 8,
                c,
              );
            }
          }
        } else { // github.com/msgpack/msgpack/blob/master/spec.md#float-format-family
          if (json === Math.fround(json)) {
            this.view.setFloat32(0, json);
            this.bytes.push(
              0xca,
              this.buffer[0],
              this.buffer[1],
              this.buffer[2],
              this.buffer[3],
            );
          } else {
            this.view.setFloat64(0, json);
            this.bytes.push(
              0xcb,
              this.buffer[0],
              this.buffer[1],
              this.buffer[2],
              this.buffer[3],
              this.buffer[4],
              this.buffer[5],
              this.buffer[6],
              this.buffer[7],
            );
          }
        }
        break;
      case "string": // github.com/msgpack/msgpack/blob/master/spec.md#str-format-family
        const a = this.bytes.length;
        for (let z = 0, b; z < json.length; ++z) {
          if ((b = json.charCodeAt(z)) < 0x80) this.bytes.push(b);
          else if (b < 0x800) this.bytes.push(0xc0 | b >> 6, 0x80 | b & 0x3f);
          else if (b < 0xd800 || b >= 0xe000) {
            this.bytes.push(
              0xe0 | b >> 12,
              0x80 | b >> 6 & 0x3f,
              0x80 | b & 0x3f,
            );
          } else {
            b = 0x10000 + ((b & 0x3ff) << 10 | json.charCodeAt(++z) & 0x3ff);
            this.bytes.push(
              0xf0 | b >> 18,
              0x80 | b >> 12 & 0x3f,
              0x80 | b >> 6 & 0x3f,
              0x80 | b & 0x3f,
            );
          }
        }
        const b = this.bytes.length - a;
        if (b < 0x20) this.bytes.splice(a, 0, 0xa0 | b);
        else if (b < 0x100) this.bytes.splice(a, 0, 0xd9, b);
        else if (b < 0x10000) this.bytes.splice(a, 0, 0xda, b >> 8, b);
        else this.bytes.splice(a, 0, 0xdb, b >> 24, b >> 16, b >> 8, b);
        break;
      case "object":
        if (json === null) this.bytes.push(0xc0); // github.com/msgpack/msgpack/blob/master/spec.md#nil-format
        else if (Array.isArray(json)) { // github.com/msgpack/msgpack/blob/master/spec.md#array-format-family
          const Z = Math.min(json.length, MAX);
          if (Z < 0x10) this.bytes.push(0x90 | Z);
          else if (Z < 0x10000) this.bytes.push(0xdc, Z >> 8, Z);
          else this.bytes.push(0xdd, Z >> 24, Z >> 16, Z >> 8, Z);
          for (let z = 0; z < Z; ++z) this.set(json[z]);
        } else { // github.com/msgpack/msgpack/blob/master/spec.md#map-format-family
          const a = Object.keys(json), Z = Math.min(a.length, MAX);
          if (Z < 0x10) this.bytes.push(0x80 | Z);
          else if (Z < 0x10000) this.bytes.push(0xde, Z >> 8, Z);
          else this.bytes.push(0xdf, Z >> 24, Z >> 16, Z >> 8, Z);
          for (let z = 0, b; z < Z; ++z) this.set(b = a[z]), this.set(json[b]);
        }
    }
  }
  encode(json: Json) {
    this.bytes = [];
    this.set(json);
    return new Uint8Array(this.bytes);
  }
}
export class Decoder {
  private buffer!: Uint8Array;
  private view!: DataView;
  private index!: number;
  private string(size: number) {
    let a = "";
    for (let Z = this.index + size, b, c; this.index < Z; ++this.index) {
      if ((b = this.buffer[this.index]) & 0x80) {
        if ((b & 0xe0) === 0xc0) {
          a += String.fromCharCode(
            (b & 0x1f) << 6 | this.buffer[++this.index] & 0x3f,
          );
        } else if ((b & 0xf0) === 0xe0) {
          a += String.fromCharCode(
            (b & 0xf) << 12 |
              (this.buffer[++this.index] & 0x3f) << 6 |
              this.buffer[++this.index] & 0x3f,
          );
        } else if ((b & 0xf8) === 0xf0) {
          c = (b & 0x7) << 18 | (this.buffer[++this.index] & 0x3f) << 12 |
            (this.buffer[++this.index] & 0x3f) << 6 |
            this.buffer[++this.index] & 0x3f;
          if (c >= 0x10000) {
            a += String.fromCharCode(
              ((c -= 0x10000) >>> 10) + 0xd800,
              (c & 0x3ff) + 0xdc00,
            );
          } else a += String.fromCharCode(c);
        }
      } else a += String.fromCharCode(b);
    }
    return a;
  }
  private map(size: number) {
    const a: { [A: string]: Json } = {};
    for (let z = 0; z < size; ++z) a[<string> this.get()] = this.get();
    return a;
  }
  private array(size: number) {
    const a = Array<Json>(size);
    for (let z = 0; z < size; ++z) a[z] = this.get();
    return a;
  }
  private get() {
    let a = this.buffer[this.index++];
    if (a >= 0 && a < 0x80) return a;
    if (a >= 0xe0) return a - 256;
    if (a >= 0x80 && a < 0x90) return this.map(a & 0xf);
    if (a >= 0x90 && a < 0xa0) return this.array(a & 0xf);
    if (a >= 0x80 && a < 0xc0) return this.string(a & 0x1f);
    switch (a) {
      case 0xc0:
        return null;
      case 0xc2:
        return false;
      case 0xc3:
        return true;
      case 0xca:
        a = this.view.getFloat32(this.index), this.index += 4;
        return a;
      case 0xcb:
        a = this.view.getFloat64(this.index), this.index += 8;
        return a;
      case 0xcc:
        a = this.view.getUint8(this.index), ++this.index;
        return a;
      case 0xcd:
        a = this.view.getUint16(this.index), this.index += 2;
        return a;
      case 0xce:
        a = this.view.getUint32(this.index), this.index += 4;
        return a;
      case 0xcf:
        a = this.view.getUint32(this.index) * MAX;
        a += this.view.getUint32(this.index += 4), this.index += 4;
        return a;
      case 0xd0:
        a = this.view.getInt8(this.index), ++this.index;
        return a;
      case 0xd1:
        a = this.view.getInt16(this.index), this.index += 2;
        return a;
      case 0xd2:
        a = this.view.getInt32(this.index), this.index += 4;
        return a;
      case 0xd3:
        a = this.view.getInt32(this.index) * MAX;
        a += this.view.getInt32(this.index += 4), this.index += 4;
        return a;
      case 0xd9:
        return this.string(this.buffer[this.index++]);
      case 0xda:
        a = this.view.getUint16(this.index), this.index += 2;
        return this.string(a);
      case 0xdb:
        a = this.view.getUint32(this.index), this.index += 4;
        return this.string(a);
      case 0xdc:
        a = this.view.getUint16(this.index), this.index += 2;
        return this.array(a);
      case 0xdd:
        a = this.view.getUint32(this.index), this.index += 4;
        return this.array(a);
      case 0xde:
        a = this.view.getUint16(this.index), this.index += 2;
        return this.map(a);
      case 0xdf:
        a = this.view.getUint32(this.index), this.index += 4;
        return this.map(a);
      default:
        throw Error();
    }
  }
  decode(buffer: Uint8Array) {
    this.view = new DataView((this.buffer = buffer).buffer);
    this.index = 0;
    return this.get();
  }
}
