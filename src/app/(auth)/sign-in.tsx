import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useSignIn } from "@clerk/expo";
import { SafeAreaView as RnSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RnSafeAreaView);
const HOME_ROUTE = "/";

const SignIn = () => {
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const loading = fetchStatus === "fetching";

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSignInPress = async () => {
    if (loading) return;

    if (!emailAddress.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");

    const { error: signInErr } = await signIn.password({
      identifier: emailAddress.trim(),
      password,
    });

    if (signInErr) {
      setError(
        (signInErr as any).longMessage ||
          (signInErr as any).message ||
          "Something went wrong. Please try again."
      );
      return;
    }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          // A required extra step (MFA, etc.) is still pending
          if (session?.currentTask) {
            console.log("Pending task:", session.currentTask);
            setError("Additional verification is required to finish signing in.");
            return;
          }

          const url = decorateUrl(HOME_ROUTE);
          if (url.startsWith("http")) {
            window.location.href = url; // web
          } else {
            router.replace(url as any); // native
          }
        },
      });
    } else {
      setError("Sign-in could not be completed. Please try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerClassName="auth-content grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Recurly</Text>
                <Text className="auth-wordmark-sub">Smart Billing</Text>
              </View>
            </View>

            <Text className="auth-title">Welcome back</Text>
            <Text className="auth-subtitle">
              Sign in to continue managing your subscriptions
            </Text>
          </View>

          <View className="auth-card">
            <View className="auth-form">
              <View className="auth-field">
                <Text className="auth-label">Email</Text>
                <TextInput
                  className="auth-input"
                  placeholder="Enter your email"
                  placeholderTextColor="rgba(8, 17, 38, 0.4)"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                />
              </View>

              <View className="auth-field">
                <Text className="auth-label">Password</Text>
                <TextInput
                  className="auth-input"
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(8, 17, 38, 0.4)"
                  secureTextEntry
                  autoComplete="password"
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {error ? <Text className="auth-error">{error}</Text> : null}

              <Pressable
                className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
                onPress={onSignInPress}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#081126" />
                ) : (
                  <Text className="auth-button-text">Sign in</Text>
                )}
              </Pressable>

              <View className="auth-link-row">
                <Text className="auth-link-copy">New to Recurly?</Text>
                <Link href="/(auth)/sign-up" className="auth-link">
                  Create an account
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignIn;