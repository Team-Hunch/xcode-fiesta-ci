const Octocat = require('octokat')

const settings = {
    'api.github.com': {
        token: process.env.GITHUB_TOKEN,
        rootURL: 'https://api.github.com'
    }
}

var githubConnectors = {}

function getGithubConnector(apiEndpoint) {
    if (typeof githubConnectors[apiEndpoint] != 'undefined') {
        return githubConnectors[apiEndpoint]
    }

    const options = settings[apiEndpoint]
    const github = new Octocat(options)

    githubConnectors[apiEndpoint] = github

    return github
}

module.exports = getGithubConnector
