/**
 * Common RobTop ciphering routines for savefile analysis.
 */
export namespace XOR {
	/**
	 * Encode a string using XOR.
	 * @param str The string to perform XOR operations on.
	 * @param key The key used in the XOR operations.
	 * @returns A XOR-encoded string.
	 */
	export function xor(str: string, key: number) {
		return String.fromCodePoint(...str.split('').map(
			(char, i) => char.charCodeAt(0) ^ key.toString().charCodeAt(i % key.toString().length)));
	}

	/**
	 * RobTop-cipher a string.
	 * @param str The string to perform the RobTop cipher on.
	 * @param key The key used in the "cipher". Defaults to 37526.
	 * @returns A RobTop-ciphered string.
	 */
	export function encrypt(str: string, key = 37526) {
		return Buffer.from(this.xor(str, key)).toString('base64').replace(/./gs, c => ({'/': '_', '+': '-'}[c] || c));
	}

	/**
	 * RobTop-decipher a string.
	 * @param str The string to reverse the RobTop cipher on.
	 * @param key The key used in the "cipher". Defaults to 37526.
	 * @returns A RobTop-deciphered string.
	 */
	export function decrypt(str: string, key = 37526) {
		return xor(Buffer.from(str.replace(/./gs, c => ({'/': '_', '+': '-'}[c] || c)), 'base64').toString(), key);
	}
}