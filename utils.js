const fs = require('fs')
const { cpus } = require('os')
const { promisify } = require('util')

// Ebook ids partitioned into subarrays based on number of cores
const partitionEbookIds = ebookIds => {
  const numberOfCores = cpus().length
  const range = Math.floor(ebookIds.length / numberOfCores)

  const array = []
  for (let i = 0; i < numberOfCores; i++) {
    const isLast = i === numberOfCores - 1
    const subArray = isLast
      ? ebookIds.slice(range * i)
      : ebookIds.slice(range * i, range * (i + 1))
    array.push(subArray)
  }
  return array
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

const flatten = arrays => [].concat.apply([], arrays)

const readDir = promisify(fs.readdir)

const readFile = promisify(fs.readFile)

const stat = promisify(fs.stat)

module.exports = { partitionEbookIds, sleep, flatten, readDir, readFile, stat }
