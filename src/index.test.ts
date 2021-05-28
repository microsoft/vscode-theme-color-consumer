import { createHash } from 'crypto';
import { createWriteStream, promises as fs } from 'fs';
import got from 'got';
import { join, resolve } from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { getWebviewProperties } from '.';
import { ColorTheme } from './theme';

const pipelineAsync = promisify(pipeline);
const varRe = /--vscode-.*?;/g;
const extensionColors = ['gitDecoration-', 'remoteHub-', 'statusBarItem-errorForeground'];

/**
 * Process for updating these tests as things change:
 *
 * 1. Run `yarn generate` to update colorDefault.ts
 * 1. On the latest Insiders, in a new profile, (code-insiders --user-data-dir ./tmp1 --extensions-dir ./tmp2)
 *    instal the named extensions.
 * 1. Open a webview, like the release notes. Copy the HTML structure into
 *    the snapshots folder.
 * 1. Run tests. They assert all colors are identical.
 */

describe('theme e2e', () => {
  const cacheDir = resolve(__dirname, '..', '.theme-cache');

  const loadAndCacheUrl = async (url: string) => {
    const hash = createHash('sha256').update(url).digest('hex').slice(0, 8);
    const fname = join(cacheDir, hash);

    try {
      await fs.stat(fname);
    } catch {
      await fs.mkdir(cacheDir, { recursive: true });
      await pipelineAsync(got.stream(url), createWriteStream(fname));
    }

    return fs.readFile(join(cacheDir, hash), 'utf-8');
  };

  const testThemeE2e = async (url: string, ...expected: (string | null)[]) => {
    const themes = await ColorTheme.load(url, loadAndCacheUrl);
    for (const theme of themes) {
      const fixture = expected.shift();
      if (!fixture) {
        continue;
      }

      const file = await fs.readFile(
        join(__dirname, '..', 'src', 'snapshots', `${fixture}.txt`),
        'utf-8',
      );

      const properties = getWebviewProperties(theme, {
        uiFontFamily: '"Segoe WPC", "Segoe UI", sans-serif',
        uiFontSize: '13px',
        uiFontWeight: 'normal',
        editorFontFamily: 'Consolas, "Courier New", monospace',
        editorFontSize: '14px',
        editorFontWeight: 'normal',
      });

      const actualVars = new Map(
        properties.style.split(';').map(v => v.split(':') as [string, string]),
      );

      const normalizedFile = file.replace(/&quot;/g, '"').replace(/\\./g, '.');

      for (const cssVar of normalizedFile.matchAll(varRe)) {
        const [key, expected] = cssVar[0].replace(/;$/, '').split(':');
        if (extensionColors.some(c => key.startsWith(`--vscode-${c}`))) {
          continue;
        }

        const actual = actualVars.get(key);
        expect(`${key}:${actual}`).toEqual(`${key}:${expected}`);
      }
    }
  };

  it('codesong', () =>
    testThemeE2e(
      'https://raw.githubusercontent.com/connor4312/codesong/28584b09affbf40589362834d945d46e452fd593/package.json',
      'codesong',
    ));

  it('nord', () =>
    testThemeE2e(
      'https://raw.githubusercontent.com/arcticicestudio/nord-visual-studio-code/31236d8885f2281a3dcc797e4ccf4e67eae6969a/package.json',
      'nord',
    ));

  it('ayu light', () =>
    testThemeE2e(
      'https://raw.githubusercontent.com/ayu-theme/vscode-ayu/48eab0dc3d9ea4bcf209cd355337977ddbd7a5d1/package.json',
      null,
      null,
      'ayu-light',
    ));
});
