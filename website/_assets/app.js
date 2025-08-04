import * as pmtiles from "https://esm.run/pmtiles@4.3.0";
import maplibre from "https://esm.run/maplibre-gl@5.6.1";
import { layers, namedFlavor } from "https://esm.run/@protomaps/basemaps@5.5.1";

class BuildsInfo extends HTMLElement {
	static get observedAttributes() {
		return ["endpoint", "fake"];
	}

	static fakeInfo = {
		date: "2025-06-25T14:54:00.389Z",
		meta: { name: "fake-app", version: "1.2.3" },
		targets: [
			{
				name: "first.pmtiles",
				bbox: [-2.072468, 54.730692, -1.112537, 55.248329],
			},
		],
	};

	get endpoint() {
		return this.getAttribute("endpoint") ?? "/tiles/_metadata.json";
	}
	get fake() {
		return this.hasAttribute("fake");
	}
	get url() {
		return this.getAttribute("url") ?? location.origin;
	}

	async getMetadata() {
		if (this.fake) return BuildsInfo.fakeInfo;

		const res = await fetch(this.getUrl(this.endpoint));
		return res.ok ? res.json() : null;
	}

	getUrl(input) {
		return new URL(input, this.url).toString();
	}

	async render() {
		const data = await this.getMetadata();
		if (!data) {
			this.innerHTML = "<p>Failed to fetch metadata</p>";
			return;
		}

		const tileAnchor = (name) => {
			return `<a href="${this.getUrl(name)}" download="${name}">${name}</a>`;
		};

		const metaAnchor = (pmtiles) => {
			const name = pmtiles.replace(/\.pmtiles$/, "");
			return `<a href="${this.getUrl(name)}.json" download="${name}.json">metadata</a>`;
		};

		const builds = data.targets.map(
			(target) =>
				`<li>
					${tileAnchor(target.name)}
					&ndash;
					${metaAnchor(target.name)}
					<br>
					boundary=${target.bbox.join(",")}
				</li>`,
		);

		const debug = {
			element: {
				endpoint: this.endpoint,
				url: this.url,
				fake: this.fake,
			},
			data,
		};

		const format = new Intl.DateTimeFormat(undefined, {
			dateStyle: "medium",
			timeStyle: "medium",
		});
		const updated = format.format(new Date(data.date));

		this.classList.add("flow");

		this.innerHTML = `
			<ul>
				${builds.join("\n")}
			</ul>
			<p>
				Last updated: ${updated}
			</p>
			<details>
				<summary>debug</summary>
				<pre>${JSON.stringify(debug, null, 2)}</pre>
			</details>
		`;
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback() {
		this.render();
	}
}

class ExampleMap extends HTMLElement {
	get source() {
		return (
			this.getAttribute("source") ??
			"pmtiles://https://maps.openlab.dev/tiles/uk.pmtiles"
		);
	}

	get mapStyle() {
		return {
			version: 8,
			glyphs:
				"https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf",
			sources: {
				protomaps: {
					type: "vector",
					url: this.source,
				},
			},
			layers: layers("protomaps", namedFlavor("light"), { lang: "en" }),
		};
	}

	render() {
		const source = this.source;
		if (!source) throw new TypeError("<example-map> source not set");

		if (!this.innerHTML) {
			this.innerHTML = `
				<frame-layout ratio="16:9">
					<div id="example_map"></div>
				</frame-layout>
				<p class="mapAttribution">
					Attribution:
						<a href="https://maplibre.org/">MapLibre</a>,
						<a href="https://docs.protomaps.com/pmtiles/">PMTiles</a>
						&amp;
						<a href="https://www.openstreetmap.org/about">OpenStreetMap</a>
				</p>
			`;
		}
		if (!this.map) {
			this.map = new maplibre.Map({
				container: "example_map",
				style: this.mapStyle,
				center: [-1.615008, 54.971191],
				zoom: 13,
				attributionControl: false,
			});
			this.map.once("styledata", () => this.render());
		}
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback() {
		this.render();
	}
}

const protocol = new pmtiles.Protocol();
maplibre.addProtocol("pmtiles", protocol.tile);

window.customElements.define("builds-info", BuildsInfo);
window.customElements.define("example-map", ExampleMap);
