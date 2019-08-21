# Tarball
![version](https://img.shields.io/badge/version-0.1.0-blue.svg)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/SlimIO/is/commit-activity)
![MIT](https://img.shields.io/github/license/mashape/apistatus.svg)

SlimIO archive (for addons and modules) tarball packer/extractor.

## Requirements
- [Node.js](https://nodejs.org/en/) v10 or higher

## Getting Started

This package is available in the Node Package Repository and can be easily installed with [npm](https://docs.npmjs.com/getting-started/what-is-npm) or [yarn](https://yarnpkg.com).

```bash
$ npm i @slimio/tarball
# or
$ yarn add @slimio/tarball
```

## Usage example
```js
const { pack, extract } = require("@slimio/tarball");
const { resolve } = require("path");

async function main() {
    const archiveName = resolve("myArchive.tar");

    // Create .tar archive
    await pack(resolve("directory"), archiveName);

    // Extract .tar to the given directory
    await extract(archiveName, resolve("directoryBis"), {
        deleteTar: true
    });
}
main().catch(console.error);
```

## API

### pack(location: string, destination: string, options?: PackOptions): Promise< void >
Pack a location (that must be a directory) into a **tar** archive.

Options is described by the following interface:
```ts
interface PackOptions {
    include?: Set<string>;
}
```

Example that include only `index.js` & `slimio.toml`:
```js
await pack("./myAddon", "myAddon.tar", {
    include: new Set(["index.js", "slimio.toml"])
});
```

### extract(location: string, destination: string, options?: ExtractOptions): Promise< void >
Extract a **tar** archive to a given destination.

Options is described by the following interface:
```ts
interface ExtractOptions {
    deleteTar?: boolean;
    deleteDestinationOnFail?: boolean;
}
```

By default **deleteTar** and **deleteDestinationOnFail** are equal to **false**.

## Dependencies

|Name|Refactoring|Security Risk|Usage|
|---|---|---|---|
|[premove](https://github.com/lukeed/premove#readme)|Minor|Low|Recursive unlink/rmdir|
|[tar-fs](https://github.com/mafintosh/tar-fs)|Minor|High|Pack and extract .tar archive|
|[uuid](https://github.com/kelektiv/node-uuid#readme)|Minor|Low|Generate unique id for temporary filename|

## License
MIT
