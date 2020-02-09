#!/usr/bin/env node

const got = require('got')
const sade = require('sade')
const { version } = require('./package.json')

const prog = sade('cfwkv')

prog
	.version(version)
	.option('--email', 'The email associated with the authentication key. Exporting CLOUDFLARE_AUTH_EMAIL will override.')
	.option('--key', 'The authentication key for Cloudflare access. Exporting CLOUDFLARE_AUTH_KEY will override.')
	.option('--accountId', 'The Cloudflare account identifier. Exporting CLOUDFLARE_ACCOUNT_ID will override.')
	.option('--zoneId', 'The Cloudflare zone identifier. Exporting CLOUDFLARE_ZONE_ID will override.')

const envToProp = {
	CLOUDFLARE_AUTH_EMAIL: 'email',
	CLOUDFLARE_AUTH_KEY: 'key',
	CLOUDFLARE_ACCOUNT_ID: 'accountId',
	CLOUDFLARE_ZONE_ID: 'zoneId'
}

const initialize = (opts, required) => {
	opts = opts || {}
	Object
		.keys(envToProp)
		.forEach(key => {
			if (process.env[key]) {
				opts[envToProp[key]] = process.env[key]
			}
		})
	if (![ 'email', 'key', 'accountId' ].every(key => opts[key])) {
		console.error(`The following options must be set as environment variables or parameters: ${required.join(', ')}`)
		process.exit(1)
	}
}

const makeRequest = async request => {
	request.url = `https://api.cloudflare.com/client/v4/accounts/${request.url}`
	const response = await got(request)
	if (response.body) {
		try {
			const data = JSON.parse(response.body)
			process.stdout.write(JSON.stringify(data, undefined, 2))
		} catch (ignore) {
			if (typeof response.body === 'object') {
				process.stdout.write(JSON.stringify(response.body, undefined, 2))
			} else {
				process.stdout.write(response.body)
			}
		}
	}
	if (response.statusCode !== 200) {
		process.exit(1)
	} else {
		process.exit(0)
	}
}

/*
https://api.cloudflare.com/#workers-kv-namespace-list-namespaces

GET accounts/:account_identifier/storage/kv/namespaces

curl -X GET "https://api.cloudflare.com/client/v4/accounts/01a7362d577a6c3019a474fd6f485823/storage/kv/namespaces?page=1&per_page=20" \
     -H "X-Auth-Email: user@example.com" \
     -H "X-Auth-Key: c2547eb745079dac9320b638f5e225cf483cc5cfdda41"
*/
prog
	.command('namespace list')
	.describe('List namespaces owned by the account.')
	.option('--page', 'Pagination offset of the result set. Default: 1')
	.option('--perPage', 'Number of namespaces to include per request. Default: 20')
	.action(async opt => {
		initialize(opt)
		opt.page = parseInt(opt.page, 10) || 1
		opt.perPage = parseInt(opt.perPage, 10) || 20
		await makeRequest({
			url: `${opt.accountId}/storage/kv/namespaces?page=${opt.page}&per_page=${opt.perPage}`,
			method: 'GET',
			headers: {
				'X-Auth-Email': opt.email,
				'X-Auth-Key': opt.key
			},
			throwHttpErrors: false
		})
	})

/*
https://api.cloudflare.com/#workers-kv-namespace-create-a-namespace

POST accounts/:account_identifier/storage/kv/namespaces

curl -X POST "https://api.cloudflare.com/client/v4/accounts/01a7362d577a6c3019a474fd6f485823/storage/kv/namespaces" \
     -H "X-Auth-Email: user@example.com" \
     -H "X-Auth-Key: c2547eb745079dac9320b638f5e225cf483cc5cfdda41" \
     -H "Content-Type: application/json" \
     --data '{"title":"My Own Namespace"}'
*/
prog
	.command('namespace create <title>')
	.describe('Create a namespace.')
	.action(async (title, opt) => {
		initialize(opt)
		await makeRequest({
			url: `${opt.accountId}/storage/kv/namespaces`,
			method: 'POST',
			headers: {
				'X-Auth-Email': opt.email,
				'X-Auth-Key': opt.key,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ title }),
			throwHttpErrors: false
		})
	})

/*
https://api.cloudflare.com/#workers-kv-namespace-remove-a-namespace

DELETE accounts/:account_identifier/storage/kv/namespaces/:namespace_identifier

curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/01a7362d577a6c3019a474fd6f485823/storage/kv/namespaces/0f2ac74b498b48028cb68387c421e279" \
     -H "X-Auth-Email: user@example.com" \
     -H "X-Auth-Key: c2547eb745079dac9320b638f5e225cf483cc5cfdda41"
*/
prog
	.command('namespace delete <namespaceId>')
	.describe('Delete a namespace.')
	.action(async (namespaceId, opt) => {
		initialize(opt)
		await makeRequest({
			url: `${opt.accountId}/storage/kv/namespaces/${namespaceId}`,
			method: 'DELETE',
			headers: {
				'X-Auth-Email': opt.email,
				'X-Auth-Key': opt.key
			},
			throwHttpErrors: false
		})
	})

/*
https://api.cloudflare.com/#workers-kv-namespace-rename-a-namespace

PUT accounts/:account_identifier/storage/kv/namespaces/:namespace_identifier

curl -X PUT "https://api.cloudflare.com/client/v4/accounts/01a7362d577a6c3019a474fd6f485823/storage/kv/namespaces/0f2ac74b498b48028cb68387c421e279" \
     -H "X-Auth-Email: user@example.com" \
     -H "X-Auth-Key: c2547eb745079dac9320b638f5e225cf483cc5cfdda41" \
     -H "Content-Type: application/json" \
     --data '{"title":"My Own Namespace"}'
*/
prog
	.command('namespace rename <namespaceId> <title>')
	.describe('Rename the title of a namespace.')
	.action(async (namespaceId, title, opt) => {
		initialize(opt)
		await makeRequest({
			url: `${opt.accountId}/storage/kv/namespaces/${namespaceId}`,
			method: 'PUT',
			headers: {
				'X-Auth-Email': opt.email,
				'X-Auth-Key': opt.key,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ title }),
			throwHttpErrors: false
		})
	})

/*
https://api.cloudflare.com/#workers-kv-namespace-list-a-namespace-s-keys

GET accounts/:account_identifier/storage/kv/namespaces/:namespace_identifier/keys

curl -X GET "https://api.cloudflare.com/client/v4/accounts/01a7362d577a6c3019a474fd6f485823/storage/kv/namespaces/0f2ac74b498b48028cb68387c421e279/keys?limit=1000&cursor=6Ck1la0VxJ0djhidm1MdX2FyDGxLKVeeHZZmORS_8XeSuhz9SjIJRaSa2lnsF01tQOHrfTGAP3R5X1Kv5iVUuMbNKhWNAXHOl6ePB0TUL8nw&prefix=My-Prefix" \
     -H "X-Auth-Email: user@example.com" \
     -H "X-Auth-Key: c2547eb745079dac9320b638f5e225cf483cc5cfdda41"
*/
prog
	.command('key list <namespaceId>')
	.describe('List all keys in a namespace.')
	.option('--limit', 'The number of keys to include in the result set. Default: 25. Min: 10. Max: 1000')
	.option('--cursor', 'Token indicating the position from which to continue when requesting the next set of records. See the "result_info" for a value.')
	.option('--prefix', 'Filter which keys will be returned. Exact matches and any key names that begin with the prefix will be returned.')
	.action(async (namespaceId, opt) => {
		initialize(opt)
		opt.limit = parseInt(opt.limit, 10) || 25
		let url = `${opt.accountId}/storage/kv/namespaces/${namespaceId}/keys?limit=${opt.limit}`
		if (opt.cursor) {
			url += `&cursor=${opt.cursor}`
		}
		if (opt.prefix) {
			url += `&prefix=${opt.prefix}`
		}
		await makeRequest({
			url,
			method: 'GET',
			headers: {
				'X-Auth-Email': opt.email,
				'X-Auth-Key': opt.key
			},
			throwHttpErrors: false
		})
	})

/*
https://api.cloudflare.com/#workers-kv-namespace-read-key-value-pair

GET accounts/:account_identifier/storage/kv/namespaces/:namespace_identifier/values/:key_name

curl -X GET "https://api.cloudflare.com/client/v4/accounts/01a7362d577a6c3019a474fd6f485823/storage/kv/namespaces/0f2ac74b498b48028cb68387c421e279/values/My-Key" \
     -H "X-Auth-Email: user@example.com" \
     -H "X-Auth-Key: c2547eb745079dac9320b638f5e225cf483cc5cfdda41"
*/
prog
	.command('key get <namespaceId> <key>')
	.describe('Read the key value for the namespace.')
	.action(async (namespaceId, key, opt) => {
		initialize(opt)
		await makeRequest({
			url: `${opt.accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`,
			method: 'GET',
			headers: {
				'X-Auth-Email': opt.email,
				'X-Auth-Key': opt.key
			},
			throwHttpErrors: false
		})
	})

/*
https://api.cloudflare.com/#workers-kv-namespace-write-key-value-pair

PUT accounts/:account_identifier/storage/kv/namespaces/:namespace_identifier/values/:key_name

curl -X PUT "https://api.cloudflare.com/client/v4/accounts/01a7362d577a6c3019a474fd6f485823/storage/kv/namespaces/0f2ac74b498b48028cb68387c421e279/values/My-Key" \
     -H "X-Auth-Email: user@example.com" \
     -H "X-Auth-Key: c2547eb745079dac9320b638f5e225cf483cc5cfdda41" \
     -H "Content-Type: text/plain" \
     --data '{}'
*/
prog
	.command('key set <namespace> <key> <value>')
	.describe('Create or update the key value for the namespace.')
	.action(async (namespace, key, value, opt) => {
		initialize(opt)
		await makeRequest({
			url: `${opt.accountId}/storage/kv/namespaces/${namespace}/values/${key}`,
			method: 'PUT',
			headers: {
				'X-Auth-Email': opt.email,
				'X-Auth-Key': opt.key,
				'Content-Type': 'text/plain'
			},
			body: value,
			throwHttpErrors: false
		})
	})

/*
https://api.cloudflare.com/#workers-kv-namespace-write-key-value-pair

PUT accounts/:account_identifier/storage/kv/namespaces/:namespace_identifier/values/:key_name

curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/01a7362d577a6c3019a474fd6f485823/storage/kv/namespaces/0f2ac74b498b48028cb68387c421e279/values/My-Key" \
     -H "X-Auth-Email: user@example.com" \
     -H "X-Auth-Key: c2547eb745079dac9320b638f5e225cf483cc5cfdda41"
*/
prog
	.command('key delete <namespace> <key>')
	.describe('Delete the key from the namespace.')
	.action(async (namespace, key, opt) => {
		initialize(opt)
		await makeRequest({
			url: `${opt.accountId}/storage/kv/namespaces/${namespace}/values/${key}`,
			method: 'PUT',
			headers: {
				'X-Auth-Email': opt.email,
				'X-Auth-Key': opt.key,
				'Content-Type': 'text/plain'
			},
			body: value,
			throwHttpErrors: false
		})
	})

prog.parse(process.argv)
