'use strict'

require('dotenv').load()

const debug = require('debug')('fiestaci:core')

const secret = process.env.WEBHOOK_SECRET || 'keyboardcat'
const http = require('http')
const createHandler = require('github-webhook-handler')
const handler = createHandler({ path: '/webhook', secret: secret })
const validateToolVersions = require('./src/validate_tool_versions')

handler.on('error', function (err) {
    console.error('Error:', err.message)
})

handler.on('pull_request', function (event) {
    const payload = event.payload
    const user = payload.repository.owner.login
    const repo = payload.repository.name
    const commitHash = payload.pull_request.head.sha
    const number = payload.pull_request.number

    const pr = {
        user,
        repo,
        commitHash,
        number
    }

    validateToolVersions('api.github.com', pr, () => {
        debug('Validation done!')
    })
})

http
    .createServer(function (req, res) {
        handler(req, res, function (err) {
            res.statusCode = 404
            res.end('no such location')
        })
    })
    .listen(process.env.PORT || 3000)

console.log('Waiting for webhooks....')
