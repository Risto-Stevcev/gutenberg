const { isMainThread, parentPort, workerData } = require('worker_threads')
const { parseStringPromise } = require('xml2js')
const { gutenbergDir } = require('./package.json')
const { readFile } = require('./utils')

const parseGutenbergContent = async rdfContent => {
  const parsedContent = await parseStringPromise(rdfContent)

  const ebook = parsedContent?.['rdf:RDF']?.['pgterms:ebook']?.[0]

  const _id = ebook?.['$']?.['rdf:about']?.match(/^ebooks\/(?<id>\d+)$/)?.groups
    ?.id
  const id = _id ? parseInt(_id) : undefined

  const title = ebook?.['dcterms:title']?.[0]

  const authors = ebook?.['dcterms:creator']
    ?.map(creator => creator?.['pgterms:agent']?.[0]?.['pgterms:name']?.[0])
    ?.filter(e => !!e)

  const publisher = ebook?.['dcterms:publisher']?.[0]

  const _publicationDate = ebook?.['dcterms:issued']?.[0]?._
  const publicationDate = _publicationDate
    ? new Date(_publicationDate)
    : undefined

  const languages = ebook?.['dcterms:language']
    ?.map(language => language?.['rdf:Description']?.[0]?.['rdf:value']?.[0]?._)
    ?.filter(e => !!e)

  const subjects = ebook?.['dcterms:subject']?.map(
    subject => subject?.['rdf:Description']?.[0]?.['rdf:value']?.[0]
  )

  const licenseRights = ebook?.['dcterms:rights']?.[0]

  return {
    id,
    title,
    authors,
    publisher,
    publicationDate,
    languages,
    subjects,
    licenseRights
  }
}

const parseGutenbergEbooks = async ebookIds => {
  for (let ebookId of ebookIds) {
    const rdfContent = await readFile(
      `${gutenbergDir}/${ebookId}/pg${ebookId}.rdf`,
      { encoding: 'utf8' }
    )
    const result = await parseGutenbergContent(rdfContent)
    parentPort.postMessage(result)
  }
}

if (!isMainThread) {
  const ebookIds = workerData
  parseGutenbergEbooks(ebookIds)
}

exports.parseGutenbergContent = parseGutenbergContent
