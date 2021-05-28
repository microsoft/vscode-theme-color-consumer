/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import * as jsonc from 'jsonc-parser';
import { Color } from './color';
import { colorDefaults, ColorIdentifier } from './colorDefaults';
import { resolveColorValue } from './colorValue';

/**
 * Setting of a TextMate color token.
 */
export interface ITokenColorSetting {
  foreground?: string;
  background?: string;
  fontStyle?: string;
}

/**
 * Describes the color of a TextMate token.
 */
export interface ITMTokenColor {
  name: string;
  scope: string;
  colorGroup: string | ITokenColorSetting;
  settings: ITokenColorSetting;
}

/**
 * Interface for the a VS Code theme JSON file.
 */
export interface IThemeJson {
  colors: { [name: string]: string };
  tokenColors: string | readonly ITMTokenColor[];
  semanticHighlighting: boolean;
  semanticTokenColors: object;
}

/**
 * Theme archetype.
 */
export const enum ThemeType {
  Dark = 'dark',
  Light = 'light',
  HighContrast = 'hc',
}

export const enum UITheme {
  Dark = 'vs-dark',
  Light = 'vs',
  HighContrast = 'hc-black',
}

/**
 * Interface for the theme as it appears in the package.json.
 */
export interface IThemeContribution {
  id: string;
  label: string;
  uiTheme: UITheme;
  path: string;
}

const getUiThemeType = (uiTheme: UITheme) => {
  switch (uiTheme) {
    case UITheme.Dark:
      return ThemeType.Dark;
    case UITheme.Light:
      return ThemeType.Light;
    default:
      return ThemeType.HighContrast;
  }
};

/**
 * Color theme class that be created from the contents of a color theme.json.
 */
export class ColorTheme {
  /**
   * Parses the jsonc theme file into a {@link ColorTheme}.
   */
  public static parse(json: string, contribution: IThemeContribution) {
    return new ColorTheme(jsonc.parse(json, []), contribution);
  }

  /**
   * Parses the jsonc theme file into a {@link ColorTheme}. Throw if there
   * is any syntax error in the file.
   */
  public static parseStrict(json: string, contribution: IThemeContribution) {
    const errors: jsonc.ParseError[] = [];
    const source = jsonc.parse(json, errors);
    if (errors.length) {
      throw errors[0];
    }

    return new ColorTheme(source, contribution);
  }

  /**
   * Loads themes from the package.json located at the given url, using the
   * specified "loader" function. Returns the array of loaded themes, which
   * may be empty.
   */
  public static async load(
    packageJsonUrl: string,
    loader: (url: string) => string | Promise<string>,
  ) {
    const packageJson = jsonc.parse(await loader(packageJsonUrl));
    const themes = packageJson?.contributes?.themes;
    if (!(themes instanceof Array)) {
      return [];
    }

    const expectedOrigin = new URL(packageJsonUrl).origin;
    return Promise.all(
      themes.map(async contribution => {
        const themeUrl = new URL(contribution.path, packageJsonUrl);
        if (themeUrl.origin !== expectedOrigin) {
          throw new Error(`Invalid origin ${expectedOrigin}`);
        }

        return ColorTheme.parse(await loader(themeUrl.toString()), contribution);
      }),
    );
  }

  private readonly resolved = new Map<ColorIdentifier, Color | undefined>();

  /**
   * Gets the original configured uiTheme.
   */
  public readonly uiTheme = this.contribution.uiTheme;

  /**
   * Gets the theme archetype
   */
  public readonly type = getUiThemeType(this.uiTheme);

  private readonly typeIndex =
    this.type === ThemeType.Light ? 0 : this.type === ThemeType.Dark ? 1 : 2;

  constructor(
    public readonly source: IThemeJson,
    public readonly contribution: IThemeContribution,
  ) {}

  /**
   * Gets the extension author defined name of the theme.
   */
  public get name() {
    return this.contribution.label;
  }

  /**
   * Gets the value of a color from its identifier.
   * @returns The color, or undefined if the identifier is invalid or the color is not set
   */
  public getColor(identifier: ColorIdentifier) {
    const saved = this.resolved.get(identifier);
    if (saved) {
      return saved;
    }

    if (this.source.colors.hasOwnProperty(identifier)) {
      const color = Color.fromHex(this.source.colors[identifier]);
      this.resolved.set(identifier, color);
      return color;
    }

    const defaultValue = colorDefaults.get(identifier)?.[this.typeIndex];
    if (defaultValue) {
      const color = resolveColorValue(defaultValue, this);
      if (color) this.resolved.set(identifier, color);
      return color;
    }

    return undefined;
  }

  /**
   * Iterates over all theme colors.
   */
  *[Symbol.iterator]() {
    for (const color of colorDefaults.keys()) {
      yield [color, this.getColor(color)] as const;
    }
  }
}
