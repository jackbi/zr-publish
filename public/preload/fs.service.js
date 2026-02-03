const fs = require('node:fs');
const path = require('node:path');

const readFile = (file) => fs.readFileSync(file, { encoding: 'utf-8' });

const readDoc = () => {
  const file = path.join(__dirname, 'read.md');
  return fs.readFileSync(file, { encoding: 'utf-8' });
};

const readDir = (dir) => fs.readdirSync(dir);

const isDir = (filePath) => fs.statSync(filePath).isDirectory();

const writeTextFile = (text) => {
  const filePath = path.join(window.utools.getPath('downloads'), Date.now().toString() + '.txt');
  fs.writeFileSync(filePath, text, { encoding: 'utf-8' });
  return filePath;
};

const writeImageFile = (base64Url) => {
  const matchs = /^data:image\/([a-z]{1,20});base64,/i.exec(base64Url);
  if (!matchs) return;
  const filePath = path.join(
    window.utools.getPath('downloads'),
    Date.now().toString() + '.' + matchs[1],
  );
  fs.writeFileSync(filePath, base64Url.substring(matchs[0].length), { encoding: 'base64' });
  return filePath;
};

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
  readDoc,
  readDir,
  isDir,
  writeTextFile,
  writeImageFile,
  writeFile,
};
