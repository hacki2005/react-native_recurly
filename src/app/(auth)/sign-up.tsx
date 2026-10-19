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
import { Link } from "expo-router";
import { useSignUp } from "@clerk/expo";
import { SafeAreaView as RnSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";

const SafeAreaView = styled(RnSafeAreaView);

const SignUp = () => {
  const { signUp, fetchStatus } = useSignUp();
  const loading = fetchStatus === "fetching";

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [error, setError] = useState("");

  const msg = (e: any) =>
    e?.longMessage || e?.message || "Something went wrong. Please try again.";

  const onSignUpPress = async () => {
    if (loading) return;

    if (!emailAddress.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");

    const { error: createErr } = await signUp.password({
      emailAddress: emailAddress.trim(),
      password,
    });
    if (createErr) return setError(msg(createErr));

    const { error: sendErr } = await signUp.verifications.sendEmailCode();
    if (sendErr) return setError(msg(sendErr));

    setPendingVerification(true);
  };

  const onVerifyPress = async () => {
    if (loading) return;

    if (!code.trim()) {
      setError("Please enter the verification code from your email.");
      return;
    }
    setError("");

    const { error: verifyErr } = await signUp.verifications.verifyEmailCode({
      code: code.trim(),
    });
    if (verifyErr) return setError(msg(verifyErr));

    if (signUp.status === "complete") {
      await signUp.finalize(); // Stack.Protected handles the redirect
    } else {
      setError("Verification could not be completed. Please try again.");
    }
  };

  const onResendCodePress = async () => {
    if (loading) return;
    setError("");

    const { error: sendErr } = await signUp.verifications.sendEmailCode();
    if (sendErr) setError(msg(sendErr));
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

            <Text className="auth-title">
              {pendingVerification ? "Check your inbox" : "Create your account"}
            </Text>
            <Text className="auth-subtitle">
              {pendingVerification
                ? `We sent a verification code to ${emailAddress.trim()}`
                : "Sign up to start managing your subscriptions"}
            </Text>
          </View>

          <View className="auth-card">
            {pendingVerification ? (
              <View className="auth-form">
                <View className="auth-field">
                  <Text className="auth-label">Verification code</Text>
                  <TextInput
                    className="auth-input"
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="rgba(8, 17, 38, 0.4)"
                    autoCapitalize="none"
                    autoComplete="one-time-code"
                    keyboardType="number-pad"
                    value={code}
                    onChangeText={setCode}
                  />
                </View>

                {error ? <Text className="auth-error">{error}</Text> : null}

                <Pressable
                  className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
                  onPress={onVerifyPress}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Verify email</Text>
                  )}
                </Pressable>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">Did not get the code?</Text>
                  <Pressable onPress={onResendCodePress} disabled={loading}>
                    <Text className="auth-link">Resend code</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
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
                    placeholder="Create a password"
                    placeholderTextColor="rgba(8, 17, 38, 0.4)"
                    secureTextEntry
                    autoComplete="new-password"
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                {error ? <Text className="auth-error">{error}</Text> : null}

                <Pressable
                  className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
                  onPress={onSignUpPress}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Create account</Text>
                  )}
                </Pressable>

                <View className="auth-link-row">
                  <Text className="auth-link-copy">Already have an account?</Text>
                  <Link href="/(auth)/sign-in" className="auth-link">
                    Sign in
                  </Link>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;