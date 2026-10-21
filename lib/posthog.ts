import PostHog from 'posthog-react-native'

const projectToken = process.env.EXPO_PUBLIC_POSTHOG_KEY
const host = process.env.EXPO_PUBLIC_POSTHOG_HOST

const missingConfiguration = !projectToken || !host

if (missingConfiguration && __DEV__) {
  const missingVariable = !projectToken
    ? 'EXPO_PUBLIC_POSTHOG_KEY'
    : 'EXPO_PUBLIC_POSTHOG_HOST'

  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  )
}

export const posthog = missingConfiguration
  ? undefined
  : new PostHog(projectToken, {
      host,
      captureAppLifecycleEvents: true,
      logs: {
        serviceName: 'recurrly-mobile',
        environment: __DEV__ ? 'development' : 'production',
      },
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: [],
        },
      },
    })

export const posthogLog = {
  info: (message: string, attributes: Record<string, string>) =>
    posthog?.logger.info(message, attributes),
}
