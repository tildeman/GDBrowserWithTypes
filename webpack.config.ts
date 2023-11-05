import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Configuration } from "webpack";
const __dirname = dirname(fileURLToPath(import.meta.url));

const config: Configuration = {
	mode: "development",
	entry: "./vendor/index.ts",
	output: {
		path: resolve(__dirname, "out/vendor"),
		filename: "index.js",
		library: {
			type: "module"
		}
	},
	module: {
		rules: [{
			test: /\.tsx?$/,
			include: resolve(__dirname, 'vendor'),
			use: [{
				loader: "ts-loader",
				options: {
					configFile: "bundle.tsconfig.json"
				}
			}]
		}]
	},
	resolve: {
		extensions: ["tsx", ".ts", ".js"]
	},
	experiments: {
		outputModule: true
	}
};

export default config;