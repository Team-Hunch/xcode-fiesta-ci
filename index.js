'use strict'

require('dotenv').load()

const secret = process.env.SECRET || 'keyboardcat'
const http = require('http')
const createHandler = require('github-webhook-handler')
const handler = createHandler({ path: '/webhook', secret: secret })

handler.on('error', function (err) {
    console.error('Error:', err.message)
})

handler.on('pull_request', function (event) {
    console.log('Received a pull_request event for %s to %s', event.payload)
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
