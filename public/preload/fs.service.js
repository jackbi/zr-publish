const fs = require('node:fs');

const readFile = (file) => fs.readFileSync(file, { encoding: 'utf-8' });

const readDir = (dir) => fs.readdirSync(dir);

const isDir = (filePath) => fs.statSync(filePath).isDirectory();

const writeFile = (filePath, content) => {
  try {
    fs.writeFileSync(filePath, content, { encoding: 'utf-8' });
    return true;
  } catch (error) {
    console.error('writeFile error:', error);
    return false;
  }
};

module.exports = {
  readFile,
  readDir,
  isDir,
  writeFile,
};
