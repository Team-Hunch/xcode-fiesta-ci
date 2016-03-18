'use strict'

const debug = require('debug')('fiestaci:validate')
const getGithubConnector = require('./github_connector')

function updateStatus(github, pr, state, description) {
    const user = pr.user
    const repo = pr.repo
    const commitHash = pr.commitHash

    const msg = {
        user,
        repo,
        sha: commitHash,
        state,
        description,
        context: 'Fiesta CI'
    }

    debug('Updating pull request for: ', JSON.stringify(msg))

    return github.repos(user, repo).statuses(commitHash).create(msg)
}

function fetchChangesFromPr(github, pr) {
    const user = pr.user
    const repo = pr.repo
    const number = pr.number

    debug(`Fetching changes from pull request #${number}`)

    return github.repos(user, repo).pulls(number).files.fetch()
}

function validate(github, pr) {

    function isXib(file) {
        return file.filename.match(/\.xib$/)
    }

    function hasMisplacedView(file) {
        return file.patch.match(/misplaced="YES"/)
    }

    return Promise.resolve()
        .then(() => fetchChangesFromPr(github, pr))
        .then(files => files.filter(isXib))
        .then(files => files.filter(hasMisplacedView))
        .then(files => {
            return files.length == 0
        })
}

function validateToolVersions(apiEndpoint, pr) {
    const github = getGithubConnector(apiEndpoint)

    return Promise.resolve()
        .then(() => updateStatus(github, pr, 'pending'))
        .then(() => validate(github, pr))
        .then(success => {
            if (!success) {
                return updateStatus(github, pr, 'failure', 'There is misplaced view :(')
            }

            return updateStatus(github, pr, 'success')
        })
}

module.exports = validateToolVersions
