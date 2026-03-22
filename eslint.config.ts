import * as js from "@eslint/js";
import { defineConfig } from "eslint/config";
import { node } from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
		plugins: { js },
		extends: ["js/recommended"],
		languageOptions: { globals: node },
	},
	tseslint.configs.recommended,
]);
