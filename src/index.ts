import { ColorTheme, ThemeType } from './theme';

export * from './color';
export * from './colorDefaults';
export * from './colorValue';

export interface IWebviewBaseOptions {
  uiFontFamily: string;
  uiFontWeight: string;
  uiFontSize: string;
  editorFontFamily: string;
  editorFontWeight: string;
  editorFontSize: string;
}

export const getWebviewProperties = (theme: ColorTheme, options: IWebviewBaseOptions) => {
  let style = [
    `--vscode-font-family:${options.uiFontFamily}`,
    `--vscode-font-weight:${options.uiFontWeight}`,
    `--vscode-font-size:${options.uiFontSize}`,
    `--vscode-editor-font-family:${options.editorFontFamily}`,
    `--vscode-editor-font-weight:${options.editorFontWeight}`,
    `--vscode-editor-font-size:${options.editorFontSize}`,
  ];

  for (const [key, color] of theme) {
    if (color) {
      style.push(`--vscode-${key.replace('.', '-')}:${color}`);
    }
  }

  const activeTheme =
    theme.type === ThemeType.Dark
      ? 'vscode-dark'
      : theme.type === ThemeType.Light
      ? 'vscode-light'
      : 'vscode-high-contrast';

  return {
    style: style.join(';'),
    class: activeTheme,
    dataset: {
      vscodeThemeKind: activeTheme,
      vscodeThemeName: theme.name,
    },
  };
};
