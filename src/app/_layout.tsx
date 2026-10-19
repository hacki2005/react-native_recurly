import {Stack} from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import "../../global.css";
import {useFonts} from "expo-font";
import {useEffect} from "react";

void SplashScreen.preventAutoHideAsync().catch(console.warn);

/**
 * Keeps the splash screen visible while fonts load, then renders navigation.
 * If font loading fails, navigation still renders with fallback fonts.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'sans-regular': require('@/assets/fonts/PlusJakartaSans-Regular.ttf'),
    'sans-bold': require('@/assets/fonts/PlusJakartaSans-Bold.ttf'),
    'sans-medium': require('@/assets/fonts/PlusJakartaSans-Medium.ttf'),
    'sans-semibold': require('@/assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'sans-extrabold': require('@/assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'sans-light': require('@/assets/fonts/PlusJakartaSans-Light.ttf'),

  })

  useEffect(() => {
    if(fontsLoaded || fontError){
      SplashScreen.hide()
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null
  return <Stack screenOptions={{headerShown:false}}/>;
}
