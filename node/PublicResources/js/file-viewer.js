
/* **************************************************
                    Impot & Export
   ************************************************** */

export { FileTesting };
import {  } from './server.js';
import {  } from './app.js';

import fs from 'fs'; // https://nodejs.org/en/learn/manipulating-files/working-with-folders-in-nodejs

import path from 'path';
import process from 'process';
import { Pool } from 'pg';


const publicResources = '/node/PublicResources/'; // Change to '../PublicResources/' on Ubuntu.
const rootFileSystem = process.cwd(); // The path to the project (P2_Project).
let selectedFile = null; // Store the selected file

// TEST: - Lortet virker ikke
function FileTesting(path) {
    console.log("HELLO?")
    const folderPath = `${path}`;
    fs.readdirSync(folderPath);

    console.log(fs.readdirSync(folderPath));
}
document.getElementById('fileTester').addEventListener('click', FileTesting('C:/Users/Emil/.ssh/'));

// Upload File



// Download File



// Create Folder
function createFolder(folderName) { 
    try {
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }
    } catch (err) {
      console.error(err);
    }
}


// Rename File
function renameDirectory(oldDir, newDir) { // This would properly also include files
    fs.rename(`${oldDir}`, `${newDir}`, err => {
        if (err) {
          console.error(err);
        }
        console.log(`Renamed to ${newDir}`);
      });
}


// Move File
function moveFile(sourcePath, destinationPath) {
    const dest = path.join(destinationPath, path.basename(sourcePath));
    fs.rename(sourcePath, dest, (err) => {
        if (err) {
            console.error("Error moving file:", err);
        } else {
            console.log(`File moved to ${dest}`);
        }
    });
}


// Function to delete a file
function deleteFile(filePath) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error("Error deleting file:", err);
        } else {
            console.log(`File deleted at ${filePath}`);
        }
    });
}

// Function to delete a directory (including non-empty ones)
function deleteDirectory(directoryPath) {
    fs.rm(directoryPath, { recursive: true, force: true }, (err) => { // using recursive will enable deleting non-empty directories and force is to delete write-protected documents.
        if (err) {
            console.error("Error deleting directory:", err);
        } else {
            console.log(`Directory deleted at ${directoryPath}`);
        }
    });
}



// Select File
function selectFile(filePath) {
    selectedFile = filePath;
    console.log(`Selected file: ${selectedFile}`);
}


// Navigate the file path

