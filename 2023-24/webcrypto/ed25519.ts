import { getPublicKeyAsync, signAsync, verifyAsync } from "@noble/ed25519";
import { debuff, encode, PBKDF2, randos } from "./crypto";

export const ed25519keyify = async () => {
  const private_key = randos(32);
  const public_key = await getPublicKeyAsync(private_key);
  return { private_key, public_key };
};
export const ed25519passwordify = async (password: string) => {
  const private_key = await crypto.subtle.importKey(
    "raw",
    encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  ).then((key) => crypto.subtle.deriveBits(PBKDF2, key, 256)).then(debuff);
  const public_key = await getPublicKeyAsync(private_key);
  return { private_key, public_key };
};
export const ened25519 = (key: Uint8Array, it: Uint8Array) =>
  Promise.all([getPublicKeyAsync(key), signAsync(it, key)]).then((
    [public_key, signature],
  ) => new Uint8Array([...public_key, ...signature, ...it]));
export const deed25519 = async (it: Uint8Array) => {
  const public_key = it.subarray(0, 32);
  const message = it.subarray(96);
  const verified = await verifyAsync(it.subarray(32, 96), message, public_key);
  return { public_key, verified, message };
};
