import { StyleSheet } from 'react-native';

import { darkColors, lightColors } from './colors';

// Map light colors to dark colors based on property context and values
function getMappedColor(prop: string, val: unknown): unknown {
  const isDark = true;
  if (typeof val !== 'string' || !isDark) {
    return val;
  }

  // 1. Backgrounds
  if (prop === 'backgroundColor') {
    if (val === lightColors.background) {
      return darkColors.background;
    }
    if (val === lightColors.surface) {
      return darkColors.surface;
    }
    if (val === lightColors.surfaceVariant) {
      return darkColors.surfaceVariant;
    }
    if (val === lightColors.surfaceHigh) {
      return darkColors.surfaceHigh;
    }
    if (val === lightColors.primarySubtle) {
      return darkColors.primarySubtle;
    }
    if (val === lightColors.successLight) {
      return darkColors.successLight;
    }
    if (val === lightColors.warningLight) {
      return darkColors.warningLight;
    }
    if (val === lightColors.errorLight) {
      return darkColors.errorLight;
    }
    if (val === lightColors.infoLight) {
      return darkColors.infoLight;
    }
  }

  // 2. Text, Icon, & SVG color properties
  if (
    prop === 'color' ||
    prop === 'tintColor' ||
    prop === 'fill' ||
    prop === 'stroke' ||
    prop === 'stopColor'
  ) {
    if (val === lightColors.onSurface) {
      return darkColors.onSurface;
    }
    if (val === lightColors.onSurfaceMuted) {
      return darkColors.onSurfaceMuted;
    }
    if (val === lightColors.onSurfaceDisabled) {
      return darkColors.onSurfaceDisabled;
    }
    if (val === lightColors.background) {
      return darkColors.background;
    }
    if (val === lightColors.offlineGray) {
      return darkColors.offlineGray;
    }
  }

  // 3. Borders & Dividers
  if (prop.startsWith('border') && prop.endsWith('Color')) {
    if (val === lightColors.border) {
      return darkColors.border;
    }
    if (val === lightColors.borderStrong) {
      return darkColors.borderStrong;
    }
    if (val === lightColors.divider) {
      return darkColors.divider;
    }
    if (val === lightColors.surface) {
      return darkColors.border;
    }
  }

  // Fallbacks: Map common base light tokens generally if found
  if (val === lightColors.background) {
    return darkColors.background;
  }
  if (val === lightColors.surface) {
    return darkColors.surface;
  }
  if (val === lightColors.surfaceVariant) {
    return darkColors.surfaceVariant;
  }
  if (val === lightColors.onSurface) {
    return darkColors.onSurface;
  }
  if (val === lightColors.onSurfaceMuted) {
    return darkColors.onSurfaceMuted;
  }
  if (val === lightColors.border) {
    return darkColors.border;
  }
  if (val === lightColors.divider) {
    return darkColors.divider;
  }

  return val;
}

// Override StyleSheet.create to return a dynamic getter-based object
StyleSheet.create = function <
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<unknown>,
>(styles: T): T {
  const proxyStyles = {} as T;
  for (const styleKey in styles) {
    Object.defineProperty(proxyStyles, styleKey, {
      get() {
        const styleObj = styles[styleKey] as unknown as Record<string, unknown>;
        if (!styleObj) {
          return undefined;
        }

        const evaluated = {} as Record<string, unknown>;
        for (const prop in styleObj) {
          const val = styleObj[prop];
          if (Array.isArray(val)) {
            evaluated[prop] = val.map(item => {
              if (item && typeof item === 'object') {
                const newItem = {} as Record<string, unknown>;
                const itemObj = item as Record<string, unknown>;
                for (const k in itemObj) {
                  newItem[k] = getMappedColor(k, itemObj[k]);
                }
                return newItem;
              }
              return item;
            });
          } else {
            evaluated[prop] = getMappedColor(prop, val);
          }
        }
        return evaluated;
      },
      enumerable: true,
      configurable: true,
    });
  }
  return proxyStyles;
};
