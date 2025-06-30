import { getConfiguration, Structure } from "gruber";
import pkg from "./package.json" with { type: "json" };
import { loadEnvFile } from "./lib.ts";

loadEnvFile();
const config = getConfiguration();

const UNSET = "gruber://unset";

const struct = config.object({
	env: config.string({ variable: "NODE_ENV", fallback: "development" }),

	meta: config.object({
		name: config.string({ variable: "APP_NAME", fallback: pkg.name }),
		version: config.string({ variable: "APP_VERSION", fallback: pkg.version }),
	}),

	targets: config.array(
		config.object({
			name: Structure.string(),
			bbox: Structure.array(Structure.number()),
		}),
	),

	protomaps: config.object({
		metadata: config.url({
			variable: "PROTOMAPS_METADATA_URL",
			fallback: "https://build-metadata.protomaps.dev/builds.json",
		}),
		builds: config.url({
			variable: "PROTOMAPS_BUILDS_URL",
			fallback: "https://build.protomaps.com",
		}),
	}),

	s3: config.object({
		prefix: config.string({ variable: "S3_PREFIX", fallback: "" }),
		accessKey: config.string({ variable: "S3_ACCESS_KEY", fallback: UNSET }),
		secretKey: config.string({ variable: "S3_SECRET_KEY", fallback: UNSET }),
		bucketName: config.string({ variable: "S3_BUCKET_NAME", fallback: UNSET }),
		endpoint: config.url({ variable: "S3_ENDPOINT", fallback: UNSET }),
		objectMetadata: Structure.any(),
	}),
});

export async function loadConfiguration(path: string | URL) {
	const value = await config.load(path, struct);
	if (value.env === "production") {
		if (value.s3.accessKey === UNSET) throw new Error("s3.accessKey not set");
		if (value.s3.secretKey === UNSET) throw new Error("s3.secretKey not set");
		if (value.s3.bucketName === UNSET) throw new Error("s3.bucketName not set");
		if (value.s3.endpoint.toString() === UNSET) {
			throw new Error("s3.endpoint not set");
		}
	}
	for (const target of value.targets) {
		if (target.bbox.length !== 4) throw new Error("bbox must have 4 elements");
	}
	return value;
}

export function outputConfiguration() {
	console.log(config.getUsage(struct, appConfig));
}

export const appConfig = await loadConfiguration(
	new URL("./config.json", import.meta.url),
);
