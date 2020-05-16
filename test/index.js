const { expect } = require('chai')
const { promisify } = require('util')
const fs = require('fs')
const { gutenbergDir } = require('../package.json')
const { partitionEbookIds, flatten, stat, readDir, readFile } = require('../utils')
const { parseGutenbergContent } = require('../worker')
const { cpus } = require('os')

describe('Gutenberg', () => {
  it('should exist', async () => {
    await stat(gutenbergDir)
  })

  it('should contain one file per folder formatted by ebook id', async function () {
    this.timeout(1000 * 30)
    const ebookIds = await readDir(gutenbergDir)
    for (let ebookId of ebookIds) {
      const files = await readDir(`${gutenbergDir}/${ebookId}`)
      expect(files).to.have.lengthOf(1)
      const [file] = files
      expect(file).to.equal(`pg${ebookId}.rdf`)
    }
  })

  it('should partition the gutenberg dir by into subarrays based on num cores', async () => {
    const ebookIds = await readDir(gutenbergDir)
    const partitioned = partitionEbookIds(ebookIds)
    expect(partitioned).to.have.length(cpus().length)
    expect(flatten(partitioned)).to.deep.equal(ebookIds)
  })

  it('should parse a gutenberg file', async () => {
    const rdfContent = await readFile(`${gutenbergDir}/1/pg1.rdf`, {
      encoding: 'utf8'
    })

    const result = await parseGutenbergContent(rdfContent)

    expect(result).to.deep.equal({
      id: 1,
      title: 'The Declaration of Independence of the United States of America',
      authors: ['Jefferson, Thomas'],
      publisher: 'Project Gutenberg',
      publicationDate: new Date('1971-12-01T00:00:00.000Z'),
      languages: ['en'],
      subjects: [
        'United States. Declaration of Independence',
        'United States -- History -- Revolution, 1775-1783 -- Sources',
        'E201',
        'JK'
      ],
      licenseRights: 'Public domain in the USA.'
    })
  })
})
