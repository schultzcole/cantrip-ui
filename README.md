<h1 align="center"><em>cantrip</em> ui</h1>

A small framework for creating reactive UIs using _just typescript_, with no special build steps, IDE plugins or
tooling, and just a _little_ magic :pinching_hand:

## Development

***cantrip* ui** uses [vite+](https://viteplus.dev) for development tooling.

Install `vp`:

```bash
# unix
curl -fsSL https://vite.plus | bash

# win
irm https://vite.plus/ps1 | iex
```

Install dependencies:

```bash
vp install
```

### Running the examples

Use `vp dev` to run examples:

```bash
vp dev examples/7guis
```

### Running the tests

Use `vp test` to run library tests:

```bash
vp test
```
