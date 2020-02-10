import { assert } from 'chai'
import * as fs from 'fs'
import tmp from 'tmp'

import { Pandoc, InputFormat, OutputFormat } from '../src'

describe('Test index', function () {
  it('should convert markdown to html', async function () {
    const pdc = new Pandoc()

    const string = await pdc.convert('# Heading', InputFormat.markdown, OutputFormat.html)
    assert.equal(string, '<h1 id="heading">Heading</h1>\n')
  })

  it('should convert markdown to html output file', async function () {
    const pdc = new Pandoc()

    const file = tmp.fileSync({
      postfix: '.html'
    })

    await pdc.convertToFile('# Heading', InputFormat.markdown, OutputFormat.html, file.name)

    const str = fs.readFileSync(file.name, 'utf-8')
    assert.equal(str, '<h1 id="heading">Heading</h1>\n' )
  })

  it('can convert markdown file to html file', async function () {
    const pdc = new Pandoc()
    const md = tmp.fileSync({
      postfix: '.md'
    })
    fs.writeFileSync(md.name, '# Heading', { encoding: 'utf-8' })

    const file = tmp.fileSync({
      postfix: '.html'
    })

    await pdc.convertFromFile(md.name, OutputFormat.html, file.name)

    const str = fs.readFileSync(file.name, 'utf-8')
    assert.equal(str, '<h1 id="heading">Heading</h1>\n' )
  })
})
