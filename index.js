const { parseStringPromise } = require('xml2js')
const { MongoClient } = require('mongodb')
const { Worker } = require('worker_threads')
const { gutenbergDir } = require('./package.json')
const { partitionEbookIds, sleep, readDir } = require('./utils')

const parseGutenberg = ebookIds => {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData: ebookIds })
    const ebooks = []
    worker.on('message', ebook => ebooks.push(ebook))
    worker.on('error', reject)
    worker.on('exit', code => {
      if (code === 0) resolve(ebooks)
      else reject(new Error(`Worker stopped with exit code ${code}`))
    })
  })
}

const createGutenbergDbIndexes = async ebooks => {
  await ebooks.createIndex({ id: 1 })
  await ebooks.createIndex({ title: 1 })
  await ebooks.createIndex({ authors: 1 })
  await ebooks.createIndex({ publicationDate: 1 })
}

const indexGutenberg = async ebooks => {
  const ebookIds = await readDir(gutenbergDir)

  await createGutenbergDbIndexes(ebooks)

  const result = await Promise.all(
    partitionEbookIds(ebookIds).map(parseGutenberg)
  )

  for (let entries of result) {
    await ebooks.insertMany(entries)
  }
}

const connect = async () => {
  const interval = 1000
  let client

  while (!client) {
    try {
      client = await MongoClient.connect(
        `mongodb://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@mongo:27017`
      )
      console.info('Successfully connected to mongo!')
    } catch (e) {
      console.warn(`Couldn't connect to mongo, trying again in ${interval} ms`)
      console.error(e.stack)
      await sleep(interval) // wait a bit before trying again
    }
  }

  return client
}

const main = async () => {
  const client = await connect()
  const db = client.db('gutenberg')
  const ebooks = db.collection('ebooks')
  await indexGutenberg(ebooks)
}

// Entrypoint
main()
