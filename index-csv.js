const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');

async function main() {
  console.log('--- main running');
  const csvDirectory = './bulk-csv';
  const directory = fs.readdirSync(csvDirectory);
  const files = directory.filter((file) => {
    return path.extname(file) === '.csv';
  });

  const outputDirectory = './output';
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
    console.log('--- main: folder created - ', outputDirectory);
  }
  
  console.log('--- main: files - ', files.length);
  files.forEach(async (file) => {
    const output = [];
    const issues = [];

    const csvFile = fs.readFileSync(path.join(csvDirectory, file));
    const csvData = csvFile.toString();
    const csvRows = csvData.split('\n');
    csvRows.forEach((row) => {
      const splitRow = row.split(',');

      const value = {
        type: 'redirect',
        timestamp: getTimestamp(),
        redirect: splitRow[1],
        userdata: {
          id: 'system-event',
          name: 'Automated Process',
          email: 'none',
        }
      };
      const stringifiedValue = JSON.stringify(value);
      const object = {
        base64: false,
        key: getVanity(splitRow[0]),
        value: stringifiedValue,
        metadata: value,
      };
  
      if (isDuplicate(object, output) === false) {
        output.push(object);
      } else {
        issues.push({
          vanityURL: object.key,
          destinationURL: object.metadata.redirect,
          type: 'DUPLICATE',
        })
      }
    });

    console.log('---- file: processed', file);
    fs.writeFileSync(path.join(outputDirectory, toJSON(file)), JSON.stringify(output, null, 4), 'utf8');
    fs.writeFileSync(path.join(outputDirectory, 'issues--' + toJSON(file)), JSON.stringify(issues, null, 4), 'utf8');

    console.log('===== file: redirection', output.length, ', issues', issues.length);
    console.log('===== file: counts', output.length);
  });
}
main();

function toJSON(file) {
  return file.replace('.csv', '.json');
}

function getVanity(key) {
  const regex = /https:\/\/([^.]*)\.([^.]*)\.(com|ca)/i;
  const result = regex.exec(key);
  const domain = result[0];
  return key.replace(domain, '');
}

function isDuplicate(object, output) {
  let duplicate = false;
  for (let i = 0, len = output.length; i < len; i++) {
    if (output[i].key === object.key) {
      duplicate = true;
      break;
    }
  }
  return duplicate;
}

function getTimestamp () {
  return new this.Date().toISOString();
};
