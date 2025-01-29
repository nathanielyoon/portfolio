/**
 * @module
 *
 * Utilities for generating random numbers.
 *
 * @see {@link https://w.wiki/CmFQ | Multiplicative congruential generator}
 * @see {@link https://doi.org/10.1002/spe.3030 | Multipliers}
 */

/**
 * 64-bit multiplicative congruential generator.
 *
 * @param state Current value (`x[n]`).
 * @returns Next value (`x[n + 1] = a * x[n] mod m`).
 */
export const next = (state: bigint): bigint =>
  state * 0xf1357aea2e62a9c5n & 0xffffffffffffffffn;

const MAX = BigInt(Number.MAX_SAFE_INTEGER);
/**
 * Casts and reduces a bigint.
 *
 * @param int Arbitrary bigint.
 * @param to Modulus for output.
 * @returns Number in the range [0, `max`).
 *
 * Casting the bigint directly to a number before getting its remainder could
 * lose precision without the bottom bits. Casting the modulus to a bigint is
 * slower and risks divide-by-zero.
 */
export const and = (int: bigint, to: number): number => Number(int & MAX) % to;
