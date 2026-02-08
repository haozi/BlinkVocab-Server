import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale, localeCookieName } from './i18n/config'

export const proxy = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
  localeDetection: true,
  localeCookie: {
    name: localeCookieName,
    maxAge: 365 * 24 * 60 * 60,
    sameSite: 'lax',
  },
})

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
