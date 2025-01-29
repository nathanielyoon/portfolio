import { AES, debuff, decrypt, ECDH, encrypt, randos, smush } from "./crypto";

const derive = ([private_key, public_key]: [CryptoKey, CryptoKey]) =>
  crypto.subtle.deriveKey(
    { name: "ECDH", public: public_key },
    private_key,
    AES,
    false,
    ["encrypt", "decrypt"],
  );
export const enecdh = (to_public: Uint8Array, it: Uint8Array) =>
  Promise.all([
    crypto.subtle.importKey("raw", to_public, ECDH, true, []),
    crypto.subtle.generateKey(ECDH, true, ["deriveKey"]),
  ]).then(([public_key, { privateKey, publicKey }]) =>
    Promise.all([
      crypto.subtle.exportKey("raw", publicKey).then(debuff),
      derive([privateKey, public_key]).then(encrypt(it)),
    ])
  ).then(([from, encrypted]) => smush(from)(encrypted));

export const deecdh = (to_private: Uint8Array, it: Uint8Array) =>
  Promise.all([
    crypto.subtle.importKey("pkcs8", to_private, ECDH, true, ["deriveKey"]),
    crypto.subtle.importKey("raw", it.subarray(0, 65), ECDH, true, []),
  ]).then(derive).then(decrypt(it.subarray(65)));
