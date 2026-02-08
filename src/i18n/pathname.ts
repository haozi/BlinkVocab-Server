import { defaultLocale, isLocale, type Locale } from './config'

function normalizePathname(pathname: string) {
  if (!pathname) return '/'
  return pathname.startsWith('/') ? pathname : `/${pathname}`
}

export function stripLocalePrefix(pathname: string) {
  const normalizedPathname = normalizePathname(pathname)
  const [, maybeLocale, ...rest] = normalizedPathname.split('/')

  if (maybeLocale && isLocale(maybeLocale)) {
    const suffix = rest.join('/')
    return suffix ? `/${suffix}` : '/'
  }

  return normalizedPathname
}

export function withLocalePrefix(pathname: string, locale: Locale) {
  const normalizedPathname = stripLocalePrefix(pathname)

  if (locale === defaultLocale) {
    return normalizedPathname
  }

  if (normalizedPathname === '/') {
    return `/${locale}`
  }

  return `/${locale}${normalizedPathname}`
}

