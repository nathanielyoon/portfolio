import { AES, decrypt, encode, encrypt, PBKDF2, randos } from "./crypto";

const derive = (password: string) =>
  crypto.subtle.importKey("raw", encode(password), "PBKDF2", false, [
    "deriveKey",
  ]).then((key) =>
    crypto.subtle.deriveKey(PBKDF2, key, AES, false, ["encrypt", "decrypt"])
  );
export const enpbkdf2 = (password: string, it: Uint8Array) =>
  derive(password).then(encrypt(it));
export const depbkdf2 = (password: string, it: Uint8Array) =>
  derive(password).then(decrypt(it));
