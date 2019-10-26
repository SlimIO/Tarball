"use strict";

// Require Node.js Dependencies
const { join } = require("path");
const {
    existsSync, readFileSync,
    promises: { access, unlink, rmdir }
} = require("fs");

// Require Third-party Dependencies
const test = require("japa");

// Require Internal Dependencies
const { getFilesRecursive } = require("../src/utils");
const { pack, extract } = require("../");

// CONSTANTS
const FIXTURES = join(__dirname, "fixtures");

test("getFilesRecursive of fixtures/myArchive must return all files in it", async(assert) => {
    const files = ["test.txt", ".gitkeep"];
    const toCheck = [];
    files.sort();

    for await (const [file] of getFilesRecursive(join(FIXTURES, "myArchive"))) {
        toCheck.push(file);
    }
    toCheck.sort();
    assert.deepEqual(files, toCheck);
});

test("pack myArchive with no include", async(assert) => {
    assert.plan(1);
    const dest = join(__dirname, "myArchive.tar");

    try {
        await pack(join(FIXTURES, "myArchive"), dest);
        assert.isTrue(existsSync(dest));
    }
    finally {
        await unlink(dest);
    }
});

test("pack myArchive with include and extract", async(assert) => {
    assert.plan(4);
    const dest = join(__dirname, "myArchive.tar");
    const extractDest = join(__dirname, "extractedArchive");

    try {
        await pack(join(FIXTURES, "myArchive"), dest, {
            include: new Set(["test.txt"])
        });
        assert.isTrue(existsSync(dest));
        await extract(dest, extractDest, {
            deleteTar: true
        });
        assert.isFalse(existsSync(dest));
        await access(extractDest);

        const str = readFileSync(join(extractDest, "test.txt"), "utf-8").trim().replace(/\r?\n|\r/gm, "");
        assert.equal(str, "hello world!");

        for await (const [file] of getFilesRecursive(extractDest)) {
            assert.equal(file, "test.txt");
        }
    }
    finally {
        await rmdir(extractDest, { recursive: true });
    }
});
