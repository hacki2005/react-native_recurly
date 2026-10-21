import PostHog, { PostHogPersistedProperty } from 'posthog-react-native'

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
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: [],
        },
      },
    })

if (posthog) {
  // Analytics are captured as events; discard logs queued by the removed OTLP logger.
  void posthog
    .ready()
    .then(() => {
      posthog.setPersistedProperty(PostHogPersistedProperty.LogsQueue, [])
    })
    .catch((error: unknown) => {
      console.error("Failed to clear pending PostHog logs", error)
    })
}
