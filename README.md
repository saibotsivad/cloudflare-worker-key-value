# cloudflare-worker-key-value

CLI tool for interacting with the Cloudflare Worker Key Value store. 

This CLI tool interacts with the Cloudflare API, documented [here](https://api.cloudflare.com/#workers-kv-namespace-properties). The response from the API is piped to stdout, so you can pipe it to files or other tools.

## install

The usual way:

```bash
npm install -g cloudflare-worker-key-value
```

This adds the CLI command `cfwkv` to your environment.

## configure

You will need to pass in configuration details, such as your Cloudflare account email address, zone identifier, and the token key.

Pass those properties in by either setting them with the CLI parameter, e.g. `--email=me@site.com` or by setting the appropriate environment variable. (Pass in the `--help` flag for more details.)

## use it

Create a namespace:

```bash
$ cfwkv namespace create "My Test Namespace"

{
  "result": {
    "id": "b39d89e33d3c4cc99697afde12958bf9",
    "title": "My Test Namespace",
    "supports_url_encoding": true
  },
  "success": true,
  "errors": [],
  "messages": []
}
```

Set a key value in that namespace:

```bash
$ cfwkv key set b39d89e33d3c4cc99697afde12958bf9 key1 "hello world"

{
  "result": null,
  "success": true,
  "errors": [],
  "messages": []
}
```

Get a key value in that namespace:

```bash
$ cfwkv key get b39d89e33d3c4cc99697afde12958bf9 key1

hello world
```

## compatability

This CLI tool doesn't yet support the bulk operations, but if you need them please open a new issue in Github and I can add them.

## license

All content released and published under the [Very Open License](http://veryopenlicense.com).

Made with love ❤️ by [Tobias Davis](https://davistobias.com)
