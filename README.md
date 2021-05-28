# @vscode/theme-color-consumer

This module can consume a VS Code color theme JSON file and output a complete list off _all_ VS Code [colors](https://code.visualstudio.com/api/references/theme-color), with defaults and overrides filled in.

## Usage

Here's how you might load a VS Code theme in order to make the current document fully capable of styling code made to run in a VS Code webview:

```ts
import { ColorTheme, getWebviewProperties } from '@vscode/theme-color-consumer';

const myThemeJson = 'https://raw.githubusercontent.com/connor4312/codesong/master/package.json';

// Use .load() to load the json, passing in a fetcher function. Returns all
// themes defined in the package.json.
const themes = ColorTheme.load(myThemeJson, async url => {
  const res = fetch(url);
  return res.text();
});

const webviewProps = getWebviewProperties(themes[0]);

// This returns the 'style' property, as well as a class and data which should
// be applied to the body:
document.body.style = webviewProps.style;
document.body.classList.add(webviewProps.style);
Object.assign(document.body.dataset, webviewProps.dataset);
```

## Contributing

### Setup

1. Clone VS Code somewhere (by default, in a `vscode` folder beside this repo)
1. Set up VS Code, see its [contributing guide](https://github.com/microsoft/vscode/wiki/How-to-Contribute)
1. Clone this repo, and run `yarn` to install dependencies.
1. Run `yarn extract [../path/to/vscode]` to create a mapping.js file

### Process

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
