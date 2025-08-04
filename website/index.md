---
layout: html.njk
---

# maps.openlab.dev

This website hosts protomap tiles (pmtiles) for use accress Open Lab projects.
There is a brief description of the format and a guide for using them.

## about

This site contains information about using Open Lab's [PMTiles](https://github.com/protomaps/PMTiles) in your app's maps.
PMTiles is a binary format that contains vector-based tiles for client-side maps, generated from [OpenStreetMap](https://www.openstreetmap.org/about).
That means you can style your maps however you like and do not have to rely on a third party like Google Maps or MapBox.

Internally, the PMTiles format works on [HTTP range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Range_requests)
so the client only requests the specific tiles in needs and the correct resolutions.

This website documents the tilesets that are available and when they were last updated.

## install

> TODO: ...

- [docs.protomaps.com/pmtiles/maplibre](https://docs.protomaps.com/pmtiles/maplibre)

## cli

The other part of this website is a CLI that is used to fetch the generated tiles from [ProtoMaps](https://docs.protomaps.com/basemaps/downloads).
It's `run` command does the following:

1. Connects to the S3 bucket, where the tiles will be uploaded too
2. Reads in the configuration that tells it what tilesets to create with bounding boxes
3. It loads the protomaps build.json file to see what downloads are available.
4. For each target:
5. It uses the `pmtiles` binary to download & extract the boundary box into a new binary
6. It uploads that file to the S3 bucket as `{target}.pmtiles`
7. It also uploads a JSON metadata file containing information about the download as `{target}.json`
8. Finally, it uploads a `_metadata.json` file with information about all the downloads.

## tiles

Copy the URLs below to link them into your app.

<builds-info url="https://maps.openlab.dev/tiles/"></builds-info>
