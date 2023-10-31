/**
 * @fileoverview The lonely response parsing function.
 */

/**
 * Parse a response from a Geometry Dash server.
 * @param responseBody The response object in RobTop's custom format.
 * @param splitter The delimiter for data and indices.
 * @returns A response with each given key associated with a string.
 */
export function parseResponse(responseBody: string, splitter = ":") {
	if (!responseBody || responseBody == "-1") return {};
	if (responseBody.startsWith("\nWarning:")) responseBody = responseBody.split("\n").slice(2).join("\n").trim(); // GDPS'es are wild
	if (responseBody.startsWith("<br />")) responseBody = responseBody.split("<br />").slice(2).join("<br />").trim(); // Seriously screw this
	const response = responseBody.split('#')[0].split(splitter);
	const res: Record<number, string> = {};
	for (let i = 0; i < response.length; i += 2) {
		res[response[i]] = response[i + 1];
	};
	return res;
}