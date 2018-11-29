# Releasing

Run `build/build.js version` to generate a new version (including git tagging).

You can also pass an argument to generate a specific type of version, run
`build/build.js help` to get more information.

## Tips

### Printing the generated PDF

Ensure to enable printing background images to print the signature.

![](http://i.imgur.com/Bnnoh0Q.png)

# Running locally

To run the extension locally, start by installing the dependencies:

```bash
yarn install
```

Then use `yarn start` to run the extension in your browser. You can force the browser to use like so:

```bash
yarn start -- -f /path/to/my/browser
```

Running tests is as simple as:

```bash
yarn test
```
