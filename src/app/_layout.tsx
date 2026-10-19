import {SplashScreen, Stack} from "expo-router";
import {ClerkProvider, useAuth, useSession} from "@clerk/expo";
import {tokenCache} from "@clerk/expo/token-cache";

import "../../global.css";
import {useFonts} from "expo-font";
import {useEffect} from "react";

SplashScreen.preventAutoHideAsync()

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!

if (!publishableKey) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

function RootNavigator() {
  const {isLoaded, isSignedIn} = useAuth()
  const {session} = useSession()

  
  const [fontsLoaded] = useFonts({
    'sans-regular': require('@/assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('@/assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('@/assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('@/assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('@/assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('@/assets/fonts/PlusJakartaSans-Light.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded && isLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, isLoaded]);

  if (!fontsLoaded || !isLoaded) return null

  return (
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Protected guard={!!isSignedIn}>
        <Stack.Screen name="(tabs)"/>
        <Stack.Screen name="onboarding"/>
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="(auth)"/>
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <RootNavigator/>
    </ClerkProvider>
  )
}