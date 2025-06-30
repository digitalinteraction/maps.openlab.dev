# maps cli

This directory is a Node.js CLI for extracting a set of pmtiles
and uploading them to an S3 bucket.

## usage

You can run the `main.ts` as an executable if you have Node.js 22+ installed.
It will load the `.env` next to it

```
main.ts <command>

Commands:
  main.ts config  Output config and usage
  main.ts run     Run the tool

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## configuration

These are the configurations you can set for how the CLI behaves.
Set them in a `config.json` in this directory or with the corresponding CLI flags or environment variables.
powered by [Gruber](https://gruber.r0b.io).

| name               | type   | flag | variable               | fallback                                         |
| ------------------ | ------ | ---- | ---------------------- | ------------------------------------------------ |
| env                | string | ~    | NODE_ENV               | production                                       |
| meta.name          | string | ~    | APP_NAME               | @openlab/protomaps-cli                           |
| meta.version       | string | ~    | APP_VERSION            | 0.0.0                                            |
| protomaps.builds   | url    | ~    | PROTOMAPS_BUILDS_URL   | https://build.protomaps.com/                     |
| protomaps.metadata | url    | ~    | PROTOMAPS_METADATA_URL | https://build-metadata.protomaps.dev/builds.json |
| s3.accessKey       | string | ~    | S3_ACCESS_KEY          | gruber://unset                                   |
| s3.bucketName      | string | ~    | S3_BUCKET_NAME         | gruber://unset                                   |
| s3.endpoint        | url    | ~    | S3_ENDPOINT            | gruber://unset                                   |
| s3.prefix          | string | ~    | S3_PREFIX              |                                                  |
| s3.secretKey       | string | ~    | S3_SECRET_KEY          | gruber://unset                                   |

Default:

```json
{
  "env": "development",
  "meta": {
    "name": "@openlab/protomaps-cli",
    "version": "0.0.0"
  },
  "targets": [],
  "protomaps": {
    "metadata": "https://build-metadata.protomaps.dev/builds.json",
    "builds": "https://build.protomaps.com/"
  },
  "s3": {
    "prefix": "",
    "accessKey": "gruber://unset",
    "secretKey": "gruber://unset",
    "bucketName": "gruber://unset",
    "endpoint": "gruber://unset"
  }
}
```

## notes

The CLI relies on minio `8.0.4` **specifically**, this is to remedy [this issue](https://github.com/minio/minio-js/issues/1395).
