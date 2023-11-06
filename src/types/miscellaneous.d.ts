export type Color3B = {
	r: number;
	g: number;
	b: number;
}

/**
 * The type of the resource file the credits button.
 */
export interface BrowserCredits {
	credits: {
		header: string;
		name: string;
		ign?: string;
		youtube: [string, string];
		twitter: [string, string];
		github: [string, string];
	}[];
	specialThanks: string[];
}