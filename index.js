const fs = require('fs');
const path = require('path');

async function main() {
  console.log('--- main running');
  const jsonDirectory = './data';
  const directory = fs.readdirSync(jsonDirectory);
  console.log('--- main: directory - ', directory.length);
  const files = directory.filter((file) => {
    return path.extname(file) === '.json';
  });

  const outputDirectory = './output';
  if (!fs.existsSync(outputDirectory)) {
    fs.mkdirSync(outputDirectory);
    console.log('--- main: folder created - ', outputDirectory);
  }
  
  console.log('--- main: files - ', files.length);
  files.forEach((file) => {
    const data = fs.readFileSync(path.join(jsonDirectory, file));
    const json = JSON.parse(data.toString());
    const domain = getDomain(file);

    const output = [];
    const disabled = [];
    const issues = [];
    for (let i = 0, len = json.redirects.length; i < len; i++) {
      const item = json.redirects[i];
      const regex = /^[^()*]+$/i;

      let destination = item.action_data.url;

      // can it be fixed by removing ^ at beginning and/or adding a slash at end
      let vanity = handleVanity(item.url.toLowerCase(), regex);

      // check for improperly formatted vanity
      if (regex.exec(vanity) === null) {
        issues.push({
          vanityURL: vanity,
          destinationURL: destination,
          type: 'IMPROPER VANITY URL',
        });
        continue;
      }
      // does the destination have incorrect pattern
      if(regex.exec(destination) === null) {
        issues.push({
          vanityURL: vanity,
          destinationURL: destination,
          type: 'IMPROPER DESTINATION URL',
        });
        continue;
      }

      // enabled?
      if(item.enabled === false) {
        disabled.push({
          vanityURL: vanity,
          destinationURL: destination,
        });
        continue;
      }

      const value = {
        type: 'redirect',
        timestamp: getTimestamp(),
        redirect: destination,
        userdata: {
          id: 'system-event',
          name: 'Automated Process',
          email: 'none',
        }
      };
      const stringifiedValue = JSON.stringify(value);
      const object = {
        base64: false,
        key: vanity,
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
    }
    console.log('---- file: processed', file);

    fs.writeFileSync(path.join(outputDirectory, file), JSON.stringify(output, null, 4), 'utf8');
    fs.writeFileSync(path.join(outputDirectory, 'disabled--' + file), JSON.stringify(disabled, null, 4), 'utf8');
    fs.writeFileSync(path.join(outputDirectory, 'issues--' + file), JSON.stringify(issues, null, 4), 'utf8');

    console.log('===== file: redirection', output.length, ', disabled', disabled.length, ', issues', issues.length);
    console.log('===== file: counts', json.redirects.length, '=', output.length + disabled.length + issues.length);
  });
}
main();

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

function handleVanity(vanity, regex) {
  let result = vanity;
  let altVanity = result.replace(/^\^/, '');
  if (regex.exec(altVanity) !== null && result !== altVanity) {
    result = altVanity;
  }
  if (result.substr(result.length - 4) === '.php') {
    result = altVanity;
  } else if (result.at(-1) !== '/') {
    altVanity = altVanity + '/';
    if (regex.exec(altVanity) !== null) {
      result = altVanity;
      // console.log(result);
    }
  }
  return result;
}

function getDomain(filename) {
  const regex = /www-[a-z]+-(com|ca)/i;
  const result = regex.exec(filename);
  return result[0].replaceAll('-', '.');
}

function getTimestamp () {
  return new this.Date().toISOString();
};
