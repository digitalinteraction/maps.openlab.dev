#!/usr/bin/env node --experimental-strip-types --env-file=.env

// import "gruber/polyfill.js"; TODO: waiting on gruber fix
import "urlpattern-polyfill";

import process from "node:process";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { appConfig, outputConfiguration } from "./config.ts";
import { runTool } from "./run.ts";

const cli = yargs()
	.demandCommand(1, "A command is required")
	.recommendCommands()
	.version(appConfig.meta.version)
	.help();

cli.command(
	"config",
	"Output config and usage",
	(yargs) => yargs,
	() => outputConfiguration(),
);

cli.command(
	"run",
	"Run the tool",
	(yargs) => yargs.option("dryRun", { type: "boolean", default: false }),
	(args) => runTool(args),
);

cli.parse(hideBin(process.argv));
