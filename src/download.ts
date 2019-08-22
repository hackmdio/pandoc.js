import * as fs from 'fs-extra'
import * as path from 'path'
import got from 'got'
import ProgressBar from 'progress'

type supportedPlastform = 'darwin' | 'linux' | 'win32'

const platformMap : { [key in supportedPlastform]: string } = {
  win32: process.arch === 'x64' ? 'windows-x86_64' : 'windows-i386',
  linux: 'linux',
  darwin: 'macOS'
}

const filterAssets = asset => {
  const archStr = platformMap[process.platform] || platformMap.linux
  return asset.name.indexOf(archStr) >= 0 && asset.name.indexOf('.zip') >= 0;
}

async function run () {
  const { body: release } = await got('https://api.github.com/repos/jgm/pandoc/releases/latest', { json: true })

  const downloadDir = path.join(__dirname, `../.pandoc-local/${release.tag_name}`)
  fs.ensureDirSync(downloadDir)

  const asset = release.assets.find(filterAssets)
  if (asset) {
    var bar = new ProgressBar('  downloading [:bar] :percent :etas', { total: 15 })

    return new Promise((resolve, reject) => {
      got
        .stream(asset.browser_download_url)
        .on('downloadProgress', progress => {
          bar.update(progress.percent)
        })
        .pipe(fs.createWriteStream(`${downloadDir}/${asset.name}`))
        .on('finish', resolve)
        .on('error', reject)
    })
  }
}

run()

