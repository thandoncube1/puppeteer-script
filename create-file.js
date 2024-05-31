const fs = require('fs');
const path = require('path');

function fileExists(filename, callback) {
    fs.access(filename, fs.constants.F_OK, (err) => {
        callback(!err);
    });
}

function readFile(filename, callback) {
    fs.readFile(filename, 'utf8', (err, data) => {
        callback(err, data);
    });
}

function writeFile(filename, data, callback) {
    fs.writeFile(filename, data, (err) => {
        callback(err);
    });
}

function createFile(data, format) {
    // Generate a unique filename in the local directory
    const filename = `./library/output_file.${format}`;

    // Convert data to string if not already a string
    const fileData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    const filePath = path.join(process.cwd(), filename); // Create full path to file

    fileExists(filePath, (exists) => {
        if (exists) {
            readFile(filePath, (err, existingData) => {
                if (!err && existingData === fileData) {
                    console.log('File already exists with same contents:', filename);
                    return;
                }
                replaceFile(filePath, fileData);
            });
        } else {
            writeFile(filePath, fileData, (err) => {
                if (err) {
                    console.error('Error creating file:', err);
                } else {
                    console.log('File created successfully:', filename);
                }
            });
        }
    });
}

function replaceFile(filename, data) {
    writeFile(filename, data, (err) => {
        if (err) {
            console.error('Error replacing file:', err);
        } else {
            console.log('File replaced successfully:', filename);
        }
    });
}

module.exports = createFile;