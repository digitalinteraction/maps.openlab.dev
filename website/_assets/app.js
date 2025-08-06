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

		this.dispatchEvent(
			new CustomEvent("data", {
				detail: { data },
			}),
		);

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
				<frame-layout ratio="4:3">
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
				center: [-4, 56],
				zoom: 4,
				attributionControl: false,
			});
			this.map.once("styledata", () => {
				this.render();
				this.dispatchEvent(
					new CustomEvent("map", {
						detail: { map: this.map },
					}),
				);
			});
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

let map = null;
let data = null;

document.querySelector("example-map")?.addEventListener("map", (event) => {
	map = event.detail.map;
	updateMap();
});

document.querySelector("builds-info")?.addEventListener("data", (event) => {
	data = event.detail.data;
	updateMap();
});

const colours = ["#0371A6", "#D7461A"];

function updateMap() {
	if (!data || !map) return;

	let source = map.getSource("targets");
	if (!source) {
		map.addSource("targets", {
			type: "geojson",
			data: { type: "FeatureCollection", features: [] },
		});
		source = map.getSource("targets");
	}

	const features = data.targets.map((t, i) => ({
		type: "Feature",
		properties: {
			target_color: colours[i % colours.length],
			target_name: t.name,
		},
		geometry: {
			type: "Polygon",
			coordinates: [
				[
					[t.bbox[0], t.bbox[1]],
					[t.bbox[0], t.bbox[3]],
					[t.bbox[2], t.bbox[3]],
					[t.bbox[2], t.bbox[1]],
					[t.bbox[0], t.bbox[1]],
				],
			],
		},
	}));

	source.setData({
		type: "FeatureCollection",
		features,
	});

	if (!map.getLayer("targets_outline")) {
		map.addLayer({
			id: "targets_outline",
			type: "line",
			source: "targets",
			paint: {
				"line-width": 2,
				"line-color": ["get", "target_color"],
			},
		});
	}

	// NOTE: this doesn't work, but I'd like it to show the name in the bottom-right of the rectangle
	// if (!map.getLayer("targets_label")) {
	// 	map.addLayer({
	// 		id: "targets_label",
	// 		type: "symbol",
	// 		source: "targets",
	// 		paint: {
	// 			"text-color": ["get", "target_color"],
	// 		},
	// 		layout: {
	// 			"text-field": ["get", "target_name"],
	// 			"text-anchor": "bottom-right",
	// 			"text-font": ["Noto Sans Regular"],
	// 			"text-offset": [0, -1],
	// 			"text-size": 14,
	// 			// 'text-color': 'red'
	// 		},
	// 	});
	// }
}
