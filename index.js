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
  // if (fs.existsSync(outputDirectory)) {
  //   fs.rm(outputDirectory, { recursive: true, force: true}, (error) => {
  //     console.log(error);
  //   });
  //   console.log('--- main: folder removed - ', outputDirectory);
  // }
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
      const regex = /^\/[a-zA-Z0-9\-]+\/.*/i;

      let destination = item.action_data.url;

      // can it be fixed by removing ^ at beginning and/or adding a slash at end
      let vanity = handleVanity(item.url.toLowerCase(), regex);

      // check for improperly formatted vanity
      if (regex.exec(vanity) === null) {
        issues.push({
          vanityURL: vanity,
          destinationURL: destination,
        });
        continue;
      }
      // does the destination have incorrect pattern or not start with domain in filename
      if(regex.exec(destination) === null && !destination.startsWith(`https://${domain}`)) {
        issues.push({
          vanityURL: vanity,
          destinationURL: destination,
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

      /*
        {
          "type": "redirect",
          "timestamp": "2024-08-26T20:05:15.966Z",
          "redirect": "/testing-3/",
          "userdata": {
            "id": "bob.fornal@leafhome.com",
            "name": "Fornal, Bob",
            "email": "bob.fornal@leafhome.com"
          }
        }
      */
      // destination = destination.replace(`https://${domain}`, '');
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
      const object = {
        name: vanity,
        // vanityURL: vanity,
        // destinationURL: destination,
        value: value,
        metadata: value,
      };
      output.push(object);

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

function handleVanity(vanity, regex) {
  let result = vanity;
  let altVanity = result.replace(/^\^/, '');
  if (regex.exec(altVanity) !== null && result !== altVanity) {
    result = altVanity;
  }
  if (result.at(-1) !== '/') {
    altVanity = altVanity + '/';
    if (regex.exec(altVanity) !== null) {
      result = altVanity;
    }
  }
  return result;
}

function getDomain(filename) {
  const regex = /www-[a-z]+-com/i;
  const result = regex.exec(filename);
  return result[0].replaceAll('-', '.');
}

function getTimestamp () {
  return new this.Date().toISOString();
};
