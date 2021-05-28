/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

import { Color } from './color';
import { ColorIdentifier } from './colorDefaults';
import { ColorTheme } from './theme';

export function resolveColorValue(
  colorValue: ColorValue | null | undefined,
  theme: ColorTheme,
): Color | undefined {
  if (!colorValue) {
    return undefined;
  } else if (typeof colorValue === 'string') {
    if (colorValue[0] === '#') {
      return Color.fromHex(colorValue);
    }
    return theme.getColor(colorValue as ColorIdentifier);
  } else if (colorValue instanceof Color) {
    return colorValue;
  } else if (typeof colorValue === 'object') {
    return executeTransform(colorValue, theme);
  }
  return undefined;
}

export const enum ColorTransformType {
  Darken,
  Lighten,
  Transparent,
  OneOf,
  LessProminent,
}

export type ColorTransform =
  | { op: ColorTransformType.Darken; value: ColorValue; factor: number }
  | { op: ColorTransformType.Lighten; value: ColorValue; factor: number }
  | { op: ColorTransformType.Transparent; value: ColorValue; factor: number }
  | { op: ColorTransformType.OneOf; values: readonly ColorValue[] }
  | {
      op: ColorTransformType.LessProminent;
      value: ColorValue;
      background: ColorValue;
      factor: number;
      transparency: number;
    };

export type ColorDefaults = [
  light: ColorValue | null,
  dark: ColorValue | null,
  hc: ColorValue | null,
];

export type ColorHex = string;
export type ColorValue = Color | ColorHex | ColorIdentifier | ColorTransform;

function executeTransform(transform: ColorTransform, theme: ColorTheme) {
  switch (transform.op) {
    case ColorTransformType.Darken:
      return resolveColorValue(transform.value, theme)?.darken(transform.factor);

    case ColorTransformType.Lighten:
      return resolveColorValue(transform.value, theme)?.lighten(transform.factor);

    case ColorTransformType.Transparent:
      return resolveColorValue(transform.value, theme)?.transparent(transform.factor);

    case ColorTransformType.OneOf:
      for (const candidate of transform.values) {
        const color = resolveColorValue(candidate, theme);
        if (color) {
          return color;
        }
      }
      return undefined;

    case ColorTransformType.LessProminent:
      const from = resolveColorValue(transform.value, theme);
      if (!from) {
        return undefined;
      }

      const backgroundColor = resolveColorValue(transform.background, theme);
      if (!backgroundColor) {
        return from.transparent(transform.factor * transform.transparency);
      }

      return from.isDarkerThan(backgroundColor)
        ? Color.getLighterColor(from, backgroundColor, transform.factor).transparent(
            transform.transparency,
          )
        : Color.getDarkerColor(from, backgroundColor, transform.factor).transparent(
            transform.transparency,
          );
    default:
      const s = JSON.stringify(transform);
      console.warn(`Unknown transform ${s}, please report to @vscode/theme-color-consumer`);
      return undefined; // unknown transform
  }
}
