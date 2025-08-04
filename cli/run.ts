import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { appConfig } from "./config.ts";
import * as Minio from "minio";
import { exec } from "./lib.ts";

interface BuildMetadata {
	key: string;
	size: number;
	md5sum: string;
	b3sum: string;
	uploaded: string;
	version: string;
}

/** Fetch protomaps metadata JSON, somewhat unofficial */
async function getMetadata(): Promise<BuildMetadata[] | null> {
	const res = await fetch(appConfig.protomaps.metadata);
	return res.ok ? res.json() : null;
}

export interface RunOptions {
	dryRun: boolean;
}

export async function runTool(options: RunOptions) {
	console.log("Running dryRun=%o", options.dryRun);
	console.log();

	const s3 = new Minio.Client({
		accessKey: appConfig.s3.accessKey,
		secretKey: appConfig.s3.secretKey,
		endPoint: appConfig.s3.endpoint.hostname,
		useSSL: appConfig.s3.endpoint.protocol === "https:",
	});

	console.log(
		"Using s3 endpoint=%o bucketName=%o",
		appConfig.s3.endpoint.toString(),
		appConfig.s3.bucketName,
	);
	console.log();

	const metadata = await getMetadata();
	if (!metadata) throw new Error("failed to fetch metadata");

	// Get the latest build to reference
	const latest = metadata[metadata.length - 1];
	const url = new URL(latest.key, appConfig.protomaps.builds);
	console.log("Using build", latest);
	console.log("url=%o", url.toString());
	console.log();

	for (const [index, target] of appConfig.targets.entries()) {
		console.log(
			"[%d/%d] target=%o boundary=%o",
			index + 1,
			appConfig.targets.length,
			target.name,
			target.bbox.join(","),
		);

		// Work out where to put the build locally & see if it already exists
		const local = new URL(`../tiles/${target.name}`, import.meta.url);
		let stat = await fs.promises.stat(local).catch(() => null);
		console.log("local=%o ", stat?.isFile() ?? false);

		// If it doesn't exist, use the pmtiles CLI to extract and download it
		if (!stat?.isFile()) {
			const command = [
				"pmtiles",
				"extract",
				url.toString(),
				fileURLToPath(local),
				"--bbox=" + target.bbox.join(","),
			].join(" ");

			if (options.dryRun) {
				console.log("dry-run:\n  ", command);
			} else {
				console.log("downloading file=%o", fileURLToPath(local));
				await exec(command);
			}
		}

		// Check the build now exists and create a read-only stream
		stat = await fs.promises.stat(local).catch(() => null);
		const stream = fs.createReadStream(local);

		if (!stat && !options.dryRun) {
			throw new Error("Failed to download file");
		}

		const tilesName = appConfig.s3.prefix + target.name;

		// Upload the build to out bucket
		if (options.dryRun) {
			console.log("dry-run: upload to s3 object=%o", tilesName);
		} else {
			const metadata = {
				...appConfig.s3.objectMetadata,
				"content-type": "application/vnd.pmtiles",
			};

			console.log(
				"upload name=%o chunk=%o metadata=%O",
				tilesName,
				s3.calculatePartSize(stat!.size),
				metadata,
			);

			await s3.putObject(
				appConfig.s3.bucketName,
				tilesName,
				stream,
				stat!.size,
				metadata,
			);
		}

		// perp tiles metadata
		const metadataName = tilesName.replace(/\.pmtiles$/, "") + ".json";
		const metadata = {
			url: url.toString(),
			date: new Date(),
			uploaded: latest.uploaded,
			version: latest.version,
		};

		// upload companion metadata object
		if (options.dryRun) {
			console.log("dry-run: write metadata", metadata);
		} else {
			console.log("upload", metadataName);
			await s3.putObject(
				appConfig.s3.bucketName,
				metadataName,
				JSON.stringify(metadata),
				undefined,
				{
					...appConfig.s3.objectMetadata,
					"content-type": "application/json",
				},
			);
		}

		console.log("[%d/%d] done\n", index + 1, appConfig.targets.length);
	}

	// generate global metadata
	const buildsName = appConfig.s3.prefix + "_metadata.json";
	const builds = {
		date: new Date(),
		meta: structuredClone(appConfig.meta),
		targets: appConfig.targets.map((t) => ({
			name: t.name,
			bbox: t.bbox,
		})),
	};

	// upload global metadata
	if (options.dryRun) {
		console.log("dry-run: write builds", builds);
	} else {
		console.log("upload", buildsName);
		await s3.putObject(
			appConfig.s3.bucketName,
			buildsName,
			JSON.stringify(builds),
			undefined,
			{
				...appConfig.s3.objectMetadata,
				"content-type": "application/json",
			},
		);
	}

	console.log("\ncomplete");
}
