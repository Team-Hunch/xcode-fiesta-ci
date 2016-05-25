require('dotenv').load()

const argv = require('minimist')(process.argv.slice(2));
const validateToolVersion = require('../src/validate_pull_request')

const apiEndpoint = argv._[0]
const user = argv._[1]
const repo = argv._[2]
const commitHash = argv._[3]
const number = argv._[4]

const pr = {
    user,
    repo,
    commitHash,
    number
}

validateToolVersion(apiEndpoint, pr)
    .then(() => {
        console.log('DONE')
    })
    .catch(err => {
        console.log(err)
    })
