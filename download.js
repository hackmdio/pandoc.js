const { promisify } = require('util');
const path = require('path');
const fs = require('fs-extra');
const got = require('got');
const ProgressBar = require('progress');
const extractC = require('extract-zip');
const tar = require('tar');
const globC = require('glob');
const cp = require('child_process');

const platformMap = {
  win32: process.arch === 'x64' ? 'windows-x86_64' : 'windows-i386',
  linux: 'linux',
  darwin: 'macOS'
};

const filterAssets = asset => {
  const archStr = platformMap[process.platform] || platformMap.linux;
  return asset.name.indexOf(archStr) >= 0 && (asset.name.indexOf('.zip') >= 0 || asset.name.indexOf('.tar.gz') >= 0);
};

const extract = promisify(extractC);
const glob = promisify(globC);

async function extractAsset(zipPath, downloadDir) {
  if (zipPath.includes('.zip')) {
    // windows & macOS
    await extract(zipPath, { dir: downloadDir });
  }
  else {
    // linux
    await tar.extract({
      file: zipPath,
      cwd: downloadDir
    });
  }
}

async function checkLocalPandoc(version) {
  const donwloadRoot = path.join(__dirname, './.pandoc-local');
  const binaryPath = path.join(donwloadRoot, 'pandoc');

  if (fs.existsSync(binaryPath)) {
    try {
      const stdout = cp.execSync(`${binaryPath} --version`).toString();
      const localVersion = stdout.match(/pandoc (\d+\.\d+\.\d+)/)[1];
      return localVersion === version;
    } catch (e) {
      return false;
    }
  }

  return false;
}

const VERSION = '3.1.11'
async function run() {
  if (await checkLocalPandoc(VERSION)) {
    console.log('local pandoc already installed');
    return;
  }

  const { body: release } = await got(`https://api.github.com/repos/jgm/pandoc/releases/tags/${VERSION}`, { json: true });
  const donwloadRoot = path.join(__dirname, './.pandoc-local');
  const downloadDir = path.join(donwloadRoot, release.tag_name);

  fs.ensureDirSync(downloadDir);

  const asset = release.assets.find(filterAssets);

  if (asset) {
    const bar = new ProgressBar('  downloading [:bar] :percent :etas', { total: 15 });
    const zipPath = `${downloadDir}/${asset.name}`;

    if (!fs.existsSync(zipPath)) {
      await new Promise((resolve, reject) => {
        got
          .stream(asset.browser_download_url)
          .on('downloadProgress', progress => {
          bar.update(progress.percent);
        })
          .pipe(fs.createWriteStream(zipPath))
          .on('finish', resolve)
          .on('error', reject);
      });
    }

    await extractAsset(zipPath, downloadDir);

    const files = await glob(`${downloadDir}/**/{pandoc,pandoc-citeproc}`);
    files.forEach(f => {
      fs.copyFileSync(f, path.join(donwloadRoot, path.basename(f)));
    });

    // clean up
    fs.removeSync(downloadDir);
  }
}

run();
