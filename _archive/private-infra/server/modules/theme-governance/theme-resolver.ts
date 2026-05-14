import { RuntimeThemeManifest } from './theme-governance.schemas';

export function mergeTheme(
  base: RuntimeThemeManifest,
  override?: Partial<RuntimeThemeManifest> | null
): RuntimeThemeManifest {
  if (!override) return base;

  return {
    ...base,
    // Sadece izin verilen alanları shallow merge yapıyoruz
    colors: { ...(base.colors ?? {}), ...(override.colors ?? {}) },
    fontFamily: { ...(base.fontFamily ?? {}), ...(override.fontFamily ?? {}) },
    fontSize: { ...(base.fontSize ?? {}), ...(override.fontSize ?? {}) },
    spacing: { ...(base.spacing ?? {}), ...(override.spacing ?? {}) },
    radius: { ...(base.radius ?? {}), ...(override.radius ?? {}) },
    shadow: { ...(base.shadow ?? {}), ...(override.shadow ?? {}) },
    easing: { ...(base.easing ?? {}), ...(override.easing ?? {}) }
  };
}

export function resolveRuntimeTheme(params: {
  baseManifest: RuntimeThemeManifest;
  tenantOverride?: Partial<RuntimeThemeManifest> | null;
}): RuntimeThemeManifest {
  return mergeTheme(params.baseManifest, params.tenantOverride ?? null);
}
