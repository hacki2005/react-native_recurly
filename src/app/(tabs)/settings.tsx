import { useState } from "react";
import { Text, View, Image, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView as RnSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { useClerk, useUser } from "@clerk/expo";
import { posthog } from "../../../lib/posthog";

const SafeAreaView = styled(RnSafeAreaView);

const Settings = () => {
  const { signOut } = useClerk();
  const { user, isLoaded } = useUser();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";

  // "hari.kumar_99@gmail.com" -> "Hari Kumar 99"
  const nameFromEmail = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const displayName =
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    nameFromEmail ||
    "User";

  const joined = user?.createdAt
    ? user.createdAt.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await signOut();
      posthog?.capture("user_signed_out");
      posthog?.reset();
      // _layout.tsx Stack.Protected guards redirect to (auth) once isSignedIn flips to false.
    } catch (error) {
      Alert.alert(
        "Sign out failed",
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
      setIsSigningOut(false);
    }
  };

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-5">
      <Text className="text-2xl font-sans-bold text-primary">Settings</Text>

      {/* Profile card */}
      <View className="mt-5 flex-row items-center rounded-2xl border border-border bg-card p-4">
        {user?.imageUrl ? (
          <Image
            source={{ uri: user.imageUrl }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
          />
        ) : (
          <View
            style={{ width: 56, height: 56, borderRadius: 28 }}
            className="items-center justify-center bg-accent"
          >
            <Text className="text-xl font-sans-bold text-background">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View className="ml-4 flex-1">
          <Text className="text-base font-sans-bold text-primary" numberOfLines={1}>
            {displayName}
          </Text>
          <Text className="mt-0.5 text-sm text-muted-foreground" numberOfLines={1}>
            {email}
          </Text>
        </View>
      </View>

      {/* Account card */}
      <View className="mt-4 rounded-2xl border border-border bg-card p-4">
        <Text className="text-base font-sans-bold text-primary">Account</Text>

        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">Account ID</Text>
          <Text
            className="ml-4 flex-1 text-right text-sm text-primary"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {user?.id}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-sm text-muted-foreground">Joined</Text>
          <Text className="text-sm text-primary">{joined}</Text>
        </View>
      </View>

      {/* Sign out */}
      <Pressable
        className="mt-6 mb-28 items-center rounded-2xl bg-accent py-4"
        onPress={handleSignOut}
        disabled={isSigningOut}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        {isSigningOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-base font-sans-bold text-background">Sign Out</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
};

export default Settings;