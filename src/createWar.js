#!/usr/bin/env node

const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const [, , inputDir, filename] = process.argv;

if (!filename) {
    process.stdout.write('ERROR: No filename specified.' + '\n\n');
    process.exit(1);
}

process.stdout.write(`Creating WAR from folder ${inputDir}` + '\n');

const inputDirPath = path.resolve(inputDir);

// create a file to stream archive data to.
const filenameDir = path.resolve(process.argv[1], '../../..');
const fileNamePath = path.resolve(filenameDir, filename);
const output = fs.createWriteStream(fileNamePath);

const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
});

output.on('close', function () {
    process.stdout.write(`✅ Created ${fileNamePath}` + '\n\n');
    process.stdout.write(archive.pointer() + ' total bytes' + '\n');
});

archive.on('error', function (err) {
    throw err;
});

archive.pipe(output);

archive.directory(inputDirPath, false);
archive.directory('WEB-INF', 'WEB-INF');

archive.finalize();
