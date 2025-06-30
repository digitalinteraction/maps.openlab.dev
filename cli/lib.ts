import cp from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import { promisify } from "node:util";

export const exec = promisify(cp.exec);

export function loadEnvFile() {
	if (fs.existsSync(".env")) process.loadEnvFile(".env");
}
