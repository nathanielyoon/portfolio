import { AES, decrypt, encrypt, hashify, HKDF, smush } from "./crypto";

const derive = (private_key: Uint8Array, info: Uint8Array) =>
  crypto.subtle.importKey("raw", private_key, "HKDF", false, [
    "deriveKey",
  ]).then((key) =>
    crypto.subtle.deriveKey({ ...HKDF, info }, key, AES, false, [
      "encrypt",
      "decrypt",
    ])
  );
export const enhkdf = async (key: Uint8Array, it: Uint8Array) => {
  const now = Date.now() / 1000 | 0;
  const info = await hashify(
    new Uint8Array([now >> 24, now >> 16 & 0xff, now >> 8 & 0xff, now & 0xff]),
    "SHA-256",
  );
  return derive(key, info).then(encrypt(it)).then(smush(info));
};
export const dehkdf = (key: Uint8Array, it: Uint8Array) =>
  derive(key, it.subarray(0, 32)).then(decrypt(it.subarray(32)));
