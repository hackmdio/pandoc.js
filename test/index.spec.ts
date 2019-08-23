import { Pandoc, InputFormat, OutputFormat } from '../src'
import { assert } from 'chai'

describe('Test index', function () {
  it('should convert markdown to html', async function () {
    const pdc = new Pandoc()

    const string = await pdc.run('# Heading', InputFormat.markdown, OutputFormat.html)
    assert.equal(string, '<h1 id="heading">Heading</h1>\n')
  })
})
