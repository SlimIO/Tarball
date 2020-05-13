"use strict";

// Require Node.js Dependencies
const zlib = require("zlib");
const { tmpdir } = require("os");
const { join, extname, relative, dirname } = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const {
    createWriteStream,
    createReadStream,
    promises: { mkdir, stat, unlink, rmdir }
} = require("fs");

// Require Third-party Dependencies
const tar = require("tar-fs");
const uuid = require("@lukeed/uuid");

// Require Internal Dependencies
const { getFilesRecursive } = require("./src/utils");

// Vars
const pipestreams = promisify(pipeline);

/**
 * @async
 * @function extract
 * @param {!string} location location
 * @param {!string} destination archive destination
 * @param {object} [options] output archive
 * @param {boolean} [options.deleteTar=false] delete tar when everything is done
 * @param {boolean} [options.deleteDestinationOnFail=false] delete the destination if something fail.
 * @returns {Promise<void>}
 *
 * @throws {TypeError}
 * @throws {Error}
 */
async function extract(location, destination, options = Object.create(null)) {
    if (typeof location !== "string") {
        throw new TypeError("location must be a string");
    }
    if (typeof destination !== "string") {
        throw new TypeError("destination must be a string");
    }
    if (extname(location) !== ".tar") {
        throw new Error("location extension must be .tar");
    }
    const { deleteTar = false, deleteDestinationOnFail = false } = options;

    // Create temporary & destination location
    const tempLocation = join(tmpdir(), uuid());
    await Promise.all([
        mkdir(tempLocation, { recursive: true }),
        mkdir(destination, { recursive: true })
    ]);

    try {
        await pipestreams(createReadStream(location), tar.extract(tempLocation));

        const streamPromises = [];
        const memcache = new Set();
        for await (const [file, fileLocation] of getFilesRecursive(tempLocation)) {
            const rel = dirname(relative(tempLocation, fileLocation));
            if (rel !== "." && !memcache.has(rel)) {
                await mkdir(join(destination, rel), { recursive: true });
                memcache.add(rel);
            }

            const pendingPromise = pipestreams(
                createReadStream(fileLocation),
                zlib.createBrotliDecompress(),
                createWriteStream(join(destination, rel, file))
            );
            streamPromises.push(pendingPromise);
        }

        await Promise.all(streamPromises);
        if (deleteTar) {
            await unlink(location);
        }
    }
    catch (err) {
        /* istanbul ignore next */
        if (deleteDestinationOnFail) {
            await rmdir(destination, { recursive: true });
        }

        throw err;
    }
    finally {
        await rmdir(tempLocation, { recursive: true });
    }
}

/**
 * @async
 * @function pack
 * @param {!string} location location
 * @param {!string} destination archive destination
 * @param {object} [options] output archive
 * @param {Set<string>} [options.include]
 * @returns {Promise<void>}
 *
 * @throws {TypeError}
 * @throws {Error}
 */
async function pack(location, destination, options = Object.create(null)) {
    if (typeof location !== "string") {
        throw new TypeError("location must be a string");
    }
    if (typeof destination !== "string") {
        throw new TypeError("destination must be a string");
    }

    if (!(await stat(location)).isDirectory()) {
        throw new Error("location must be a directory!");
    }

    const { include = new Set() } = options;
    const destinationRw = extname(destination) === ".tar" ? destination : `${destination}.tar`;

    // Create temporary location
    const tempLocation = join(tmpdir(), uuid());
    await mkdir(tempLocation, { recursive: true });

    try {
        const streamPromises = [];
        const memcache = new Set();
        for await (const [file, fileLocation] of getFilesRecursive(location)) {
            if (include.size > 0 && !include.has(file)) {
                continue;
            }

            const rel = dirname(relative(location, fileLocation));
            if (rel !== "." && !memcache.has(rel)) {
                await mkdir(join(tempLocation, rel), { recursive: true });
                memcache.add(rel);
            }

            const pendingPromise = pipestreams(
                createReadStream(fileLocation),
                zlib.createBrotliCompress(),
                createWriteStream(join(tempLocation, rel, file))
            );
            streamPromises.push(pendingPromise);
        }

        await Promise.all(streamPromises);
        await pipestreams(tar.pack(tempLocation), createWriteStream(destinationRw));
    }
    finally {
        await rmdir(tempLocation, { recursive: true });
    }
}

module.exports = { extract, pack };
