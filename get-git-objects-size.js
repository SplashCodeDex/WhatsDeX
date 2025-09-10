const fs = require('fs');
const path = require('path');

function getDirectorySize(directoryPath) {
  let totalSize = 0;

  function walkSync(currentPath) {
    const files = fs.readdirSync(currentPath);
    for (const file of files) {
      const filePath = path.join(currentPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        totalSize += stats.size;
      } else if (stats.isDirectory()) {
        walkSync(filePath);
      }
    }
  }

  walkSync(directoryPath);
  return totalSize;
}

const gitObjectsPath = path.join(__dirname, '.git', 'objects');
const sizeInBytes = getDirectorySize(gitObjectsPath);
const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);

console.log(`Size of .git/objects: ${sizeInMB} MB`);
