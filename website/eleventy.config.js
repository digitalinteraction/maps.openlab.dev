import { eleventyAlembic } from "@openlab/alembic/11ty.cjs";
import { HtmlBasePlugin } from "@11ty/eleventy";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default function (eleventyConfig) {
	eleventyConfig.addPlugin(eleventyAlembic, { useLabcoat: true });
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPassthroughCopy({ _assets: "assets" });
}

export const config = {
	markdownTemplateEngine: "njk",
};
