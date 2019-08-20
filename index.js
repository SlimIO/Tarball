"use strict";

// Require Node.js Dependencies
const zlib = require("zlib");
const { tmpdir } = require("os");
const { join, extname } = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const {
    createWriteStream,
    createReadStream,
    promises: { mkdir, stat }
} = require("fs");

// Require Third-party Dependencies
const tar = require("tar-fs");
const premove = require("premove");
const uuid = require("uuid/v4");

// Require Internal Dependencies
const { getFilesRecursive } = require("./src/utils");

// Vars
const pipestreams = promisify(pipeline);

/**
 * @function extract
 */
function extract() {
    // TBC
}

/**
 * @async
 * @function pack
 * @param {!string} location location
 * @param {object} [options] output archive
 * @param {string} [options.destination] archive destination
 * @param {Set<string>} [options.include]
 * @returns {Promise<void>}
 *
 * @throws {TypeError}
 */
async function pack(location, options = Object.create(null)) {
    if (typeof location !== "string") {
        throw new TypeError("location must be a string");
    }
    const locationSt = await stat(location);
    if (!locationSt.isDirectory()) {
        throw new Error("location must be a directory!");
    }
    const { destination, include = new Set() } = options;

    if (typeof destination !== "string") {
        throw new TypeError("destination must be a string");
    }
    const destinationRw = extname(destination) === ".tar" ? destination : `${destination}.tar`;

    // Create temporary location
    const tempLocation = join(tmpdir(), uuid());
    await mkdir(tempLocation, { recursive: true });

    try {
        const streamPromises = [];
        for await (const file of getFilesRecursive(location)) {
            if (include.size > 0 && !include.has(file)) {
                continue;
            }

            const pendingPromise = pipestreams(
                createReadStream(join(location, file)),
                zlib.createBrotliCompress(),
                createWriteStream(join(tempLocation, file))
            );
            streamPromises.push(pendingPromise);
        }

        await Promise.all(streamPromises);
        await pipestreams(tar.pack(tempLocation), createWriteStream(destinationRw));
    }
    finally {
        await premove(tempLocation);
    }
}

module.exports = { extract, pack };
