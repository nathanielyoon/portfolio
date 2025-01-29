import { hkdf_salt, pbkdf2_salt } from "./salt";

export const ECDH = { name: "ECDH", namedCurve: "P-256" };
export const AES = { name: "AES-GCM", length: 256 };
export const PBKDF2 = {
  name: "PBKDF2",
  hash: "SHA-512",
  salt: pbkdf2_salt,
  iterations: 5000000,
};
export const HKDF = {
  name: "HKDF",
  hash: "SHA-512",
  salt: hkdf_salt,
} as const;
export const encode = (it: string) => new TextEncoder().encode(it);
export const decode = (it: Uint8Array | ArrayBuffer) =>
  new TextDecoder().decode(it);
export const randos = (size: number) =>
  crypto.getRandomValues(new Uint8Array(size));
export const debuff = (it: ArrayBuffer) => new Uint8Array(it);
export const smush = (one: Uint8Array) => (two: Uint8Array) =>
  new Uint8Array([...one, ...two]);
type Hash = "SHA-256" | "SHA-384" | "SHA-512";
export const hashify = (it: Uint8Array | ArrayBuffer | string, hash: Hash) =>
  crypto.subtle.digest(hash, typeof it === "string" ? encode(it) : it)
    .then(debuff);
export const encrypt = (it: Uint8Array) => (key: CryptoKey) => {
  const iv = randos(12);
  return crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, it).then(debuff)
    .then(smush(iv));
};
export const decrypt = (it: Uint8Array) => (key: CryptoKey) =>
  crypto.subtle.decrypt(
    { name: "AES-GCM", iv: it.subarray(0, 12) },
    key,
    it.subarray(12),
  ).then(debuff);
