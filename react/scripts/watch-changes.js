const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const directoryPath = path.join(__dirname, '..', 'src');

const buildAndMoveFiles = () => {
  exec('yarn parcel build && yarn move', (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error}`);
      return;
    }
    if (stdout) console.log(`stdout: ${stdout}`);
    if (stderr) console.error(`stderr: ${stderr}`);
  });
}

buildAndMoveFiles();

fs.watch(directoryPath, { recursive: true }, (eventType, filename) => {
  if (filename) {
    console.log(`File ${filename} has been changed`);
    buildAndMoveFiles();
  }
});

console.log('Watching for changes in the src directory...');
