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

    function isJsSpec(file) {
        return file.filename.match(/\.spec\.js$/)
    }

    function hasOnlyDirective(file) {
        return file.patch.match(/describe\.only|it\.only/)
    }

    var hasOnlyDirectiveTest = function (files) {
        return Promise.resolve()
            .then(() => {
                return files.filter(isJsSpec)
            })
            .then(filteredFiles => filteredFiles.filter(hasOnlyDirective))
            .then(files => {
                return { passed: files.length == 0, test: 'hasOnlyDirective' }
            })
    }

    var hasMisplacedViewTest = function (files) {
        return Promise.resolve()
            .then(() => files.filter(isXib))
            .then(filteredFiles => filteredFiles.filter(hasMisplacedView))
            .then(files => {
                return { passed: files.length == 0, test: 'hasMisplacedView' }
            })
    }

    return Promise.resolve()
        .then(() => fetchChangesFromPr(github, pr))
        .then(files => {
            return Promise.all([hasOnlyDirectiveTest(files), hasMisplacedViewTest(files)])
        })
        .then(results => {
            var failedTests = results.filter(res => !res.passed)

            if (failedTests.length == 0) {
                return { passed: true }
            }

            return { passed: false, failedTests: failedTests.map(t => t.test)}

        })
}

function validatePullRequest(apiEndpoint, pr) {
    debug('Validate for endpoint:', apiEndpoint)

    const github = getGithubConnector(apiEndpoint)

    return Promise.resolve()
        .then(() => updateStatus(github, pr, 'pending', 'Looking for common problems'))
        .then(() => validate(github, pr))
        .then(result => {
            if (!result.passed) {
                return updateStatus(github, pr, 'failure',`Failed tests: ${result.failedTests.join(', ')}`)
            }

            return updateStatus(github, pr, 'success', 'Seems fine!')
        })
}

module.exports = validatePullRequest
