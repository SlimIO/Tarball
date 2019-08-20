"use strict";

/**
 * @namespace Utils
 */

// Require Node.js Dependencies
const { readdir } = require("fs").promises;
const { join } = require("path");

// CONSTANTS
const EXCLUDE_DIRS = new Set(["node_modules", ".vscode", ".git", ".nyc_output", "coverage", "docs", "test"]);

/**
 * @async
 * @generator
 * @function getFilesRecursive
 * @memberof Utils#
 * @param {!string} dir root directory
 * @returns {AsyncIterableIterator<string>}
 */
async function* getFilesRecursive(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });

    for (const dirent of dirents) {
        if (EXCLUDE_DIRS.has(dirent.name)) {
            continue;
        }

        if (dirent.isFile()) {
            yield dirent.name;
        }
        else if (dirent.isDirectory()) {
            yield* getFilesRecursive(join(dir, dirent.name));
        }
    }
}

module.exports = {
    getFilesRecursive
};
