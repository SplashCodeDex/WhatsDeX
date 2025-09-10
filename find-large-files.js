const { execSync } = require('child_process');

function findLargeFiles() {
  try {
    const revListCommand = 'git rev-list --objects --all';
    const revListOutput = execSync(revListCommand, { encoding: 'utf8' });

    const objects = revListOutput.split('\n').filter(line => line.trim() !== '');

    const largeFiles = [];

    for (const obj of objects) {
      const [hash, path] = obj.split(' ');
      try {
        const catFileCommand = `git cat-file -s ${hash}`;
        const size = parseInt(execSync(catFileCommand, { encoding: 'utf8' }).trim());

        const typeCommand = `git cat-file -t ${hash}`;
        const type = execSync(typeCommand, { encoding: 'utf8' }).trim();

        if (type === 'blob') {
          largeFiles.push({ hash, path, size });
        }
      } catch (error) {
        // Ignore errors for objects that are not found or are not blobs
      }
    }

    largeFiles.sort((a, b) => b.size - a.size);

    console.log('Top 20 largest files:');
    for (let i = 0; i < Math.min(20, largeFiles.length); i++) {
      console.log(`${largeFiles[i].size}\t${largeFiles[i].hash}\t${largeFiles[i].path}`);
    }

  } catch (error) {
    console.error('Error finding large files:', error.message);
  }
}

findLargeFiles();
