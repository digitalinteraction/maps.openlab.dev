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

	async getMetadata() {
		if (this.fake) return BuildsInfo.fakeInfo;

		const res = await fetch(this.endpoint);
		return res.ok ? res.json() : null;
	}

	async render() {
		const data = await this.getMetadata();
		if (!data) {
			this.innerHTML = "<p>Failed to fetch metadata</p>";
			return;
		}

		const tileAnchor = (name) => {
			return `<a href="/tiles/${name}" download="${name}.json">${name}</a>`;
		};

		const metaAnchor = (pmtiles) => {
			const name = pmtiles.replace(/\.pmtiles$/, "");
			return `<a href="/tiles/${name}.json" download="${name}.json">metadata</a>`;
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

		const debug = [
			`endpoint: ${this.endpoint}`,
			`version: ${data.meta.name}/${data.meta.version}`,
		];

		this.classList.add("flow");

		this.innerHTML = `
			<ul>
				${builds.join("\n")}
			</ul>
			<details>
				<summary>debug</summary>
				<pre>${debug.join("\n")}</pre>
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

window.customElements.define("builds-info", BuildsInfo);
