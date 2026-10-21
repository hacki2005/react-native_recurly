import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useSignUp } from "@clerk/expo";
import AuthScreen from "../../../components/auth/AuthScreen";
import {
  getAuthErrorMessage,
  isValidEmail,
  normalizeEmail,
} from "../../../lib/auth-utils";
import { posthog } from "../../../lib/posthog";

type SignUpStep = "details" | "verification" | "additional-details";

export default function SignUp() {
  const { signUp, fetchStatus } = useSignUp();
  const [step, setStep] = useState<SignUpStep>("details");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verificationAccepted, setVerificationAccepted] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const finalizeStarted = useRef(false);

  const loading = fetchStatus === "fetching" || isFinalizing;
  const missingFirstName = signUp.missingFields.some((field) => {
    const normalized = String(field).replaceAll("_", "").toLowerCase();
    return normalized === "firstname";
  });
  const missingLastName = signUp.missingFields.some((field) => {
    const normalized = String(field).replaceAll("_", "").toLowerCase();
    return normalized === "lastname";
  });
  const missingNames = missingFirstName || missingLastName;
  const activeStep =
    verificationAccepted && signUp.status === "missing_requirements"
      ? "additional-details"
      : step;

  useEffect(() => {
    if (!verificationAccepted) return;

    if (signUp.status !== "complete" || finalizeStarted.current) {
      return;
    }

    finalizeStarted.current = true;
    setIsFinalizing(true);
    void signUp
      .finalize()
      .then(({ error: finalizeError }) => {
        if (finalizeError) {
          setError(
            getAuthErrorMessage(
              finalizeError,
              "Your account could not be started. Please try again."
            )
          );
          finalizeStarted.current = false;
          return;
        }

        posthog?.capture("sign_up_completed");
      })
      .catch((finalizeError: unknown) => {
        setError(
          getAuthErrorMessage(
            finalizeError,
            "Your account could not be started. Please try again."
          )
        );
        finalizeStarted.current = false;
      })
      .finally(() => setIsFinalizing(false));
  }, [signUp, signUp.status, verificationAccepted]);

  const handleCreateAccount = async () => {
    if (loading) return;
    setError("");

    if (!isValidEmail(emailAddress)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    finalizeStarted.current = false;
    setVerificationAccepted(false);
    try {
      const { error: createError } = await signUp.password({
        emailAddress: normalizeEmail(emailAddress),
        password,
      });
      if (createError) {
        setError(
          getAuthErrorMessage(
            createError,
            "We couldn’t create your account. Check your details and try again."
          )
        );
        return;
      }

      const { error: sendError } =
        await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(
          getAuthErrorMessage(
            sendError,
            "Your account was started, but we couldn’t send the verification code. Try again."
          )
        );
        return;
      }

      setCode("");
      setStep("verification");
    } catch (createError: unknown) {
      setError(
        getAuthErrorMessage(
          createError,
          "We couldn’t create your account. Please try again."
        )
      );
    }
  };

  const handleVerifyEmail = async () => {
    if (loading) return;
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Enter the verification code from your email.");
      return;
    }
    setError("");

    try {
      const { error: verifyError } =
        await signUp.verifications.verifyEmailCode({ code: trimmedCode });
      if (verifyError) {
        setError(
          getAuthErrorMessage(
            verifyError,
            "That code could not be verified. Check it and try again."
          )
        );
        return;
      }
      setVerificationAccepted(true);
    } catch (verifyError: unknown) {
      setError(
        getAuthErrorMessage(
          verifyError,
          "That code could not be verified. Check it and try again."
        )
      );
    }
  };

  const handleResendCode = async () => {
    if (loading) return;
    setError("");
    try {
      const { error: sendError } =
        await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(
          getAuthErrorMessage(
            sendError,
            "We couldn’t send another code. Please try again."
          )
        );
      }
    } catch (sendError: unknown) {
      setError(
        getAuthErrorMessage(
          sendError,
          "We couldn’t send another code. Please try again."
        )
      );
    }
  };

  const handleCompleteProfile = async () => {
    if (loading) return;
    setError("");
    if (missingFirstName && !firstName.trim()) {
      setError("Enter your first name to finish creating your account.");
      return;
    }
    if (missingLastName && !lastName.trim()) {
      setError("Enter your last name to finish creating your account.");
      return;
    }

    try {
      const { error: updateError } = await signUp.update({
        ...(missingFirstName ? { firstName: firstName.trim() } : {}),
        ...(missingLastName ? { lastName: lastName.trim() } : {}),
      });
      if (updateError) {
        setError(
          getAuthErrorMessage(
            updateError,
            "We couldn’t save your account details. Please try again."
          )
        );
        return;
      }
    } catch (updateError: unknown) {
      setError(
        getAuthErrorMessage(
          updateError,
          "We couldn’t save your account details. Please try again."
        )
      );
    }
  };

  const handleChangeEmail = async () => {
    if (loading) return;
    try {
      const { error: resetError } = await signUp.reset();
      if (resetError) {
        setError(
          getAuthErrorMessage(
            resetError,
            "We couldn’t restart sign-up. Please try again."
          )
        );
        return;
      }
      setStep("details");
      setVerificationAccepted(false);
      setCode("");
      setError("");
    } catch (resetError: unknown) {
      setError(
        getAuthErrorMessage(
          resetError,
          "We couldn’t restart sign-up. Please try again."
        )
      );
    }
  };

  const title =
    activeStep === "verification"
      ? "Check your inbox"
      : activeStep === "additional-details"
        ? "Almost there"
        : "Create your account";
  const subtitle =
    activeStep === "verification"
      ? `We sent a verification code to ${normalizeEmail(emailAddress)}.`
      : activeStep === "additional-details"
        ? "Add the required details to finish setting up your account."
        : "Keep every renewal clear, organized, and in one place.";

  return (
    <AuthScreen title={title} subtitle={subtitle}>
      <View className="auth-form">
        {activeStep === "verification" ? (
          <>
            <View className="auth-field">
              <Text className="auth-label">Email verification code</Text>
              <TextInput
                className="auth-input"
                placeholder="Enter the code from your email"
                placeholderTextColor="rgba(8, 17, 38, 0.4)"
                autoCapitalize="none"
                autoComplete="one-time-code"
                keyboardType="number-pad"
                value={code}
                onChangeText={(value) => {
                  setCode(value);
                  setError("");
                }}
                returnKeyType="done"
                onSubmitEditing={handleVerifyEmail}
                accessibilityLabel="Email verification code"
              />
            </View>
            {error ? <Text className="auth-error">{error}</Text> : null}
            <Pressable
              className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
              onPress={handleVerifyEmail}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#081126" />
              ) : (
                <Text className="auth-button-text">Verify email</Text>
              )}
            </Pressable>
            <View className="auth-link-row">
              <Text className="auth-link-copy">Didn’t receive a code?</Text>
              <Pressable onPress={handleResendCode} disabled={loading}>
                <Text className="auth-link">Resend</Text>
              </Pressable>
            </View>
            <Pressable onPress={handleChangeEmail} disabled={loading}>
              <Text className="auth-link text-center">Change email address</Text>
            </Pressable>
          </>
        ) : activeStep === "additional-details" ? (
          <>
            {missingFirstName ? (
              <>
                <View className="auth-field">
                  <Text className="auth-label">First name</Text>
                  <TextInput
                    className="auth-input"
                    placeholder="Your first name"
                    placeholderTextColor="rgba(8, 17, 38, 0.4)"
                    autoCapitalize="words"
                    autoComplete="given-name"
                    value={firstName}
                    onChangeText={(value) => {
                      setFirstName(value);
                      setError("");
                    }}
                    accessibilityLabel="First name"
                  />
                </View>
              </>
            ) : null}
            {missingLastName ? (
              <>
                <View className="auth-field">
                  <Text className="auth-label">Last name</Text>
                  <TextInput
                    className="auth-input"
                    placeholder="Your last name"
                    placeholderTextColor="rgba(8, 17, 38, 0.4)"
                    autoCapitalize="words"
                    autoComplete="family-name"
                    value={lastName}
                    onChangeText={(value) => {
                      setLastName(value);
                      setError("");
                    }}
                    accessibilityLabel="Last name"
                  />
                </View>
              </>
            ) : null}
            {!missingNames ? (
              <Text className="auth-helper">
                Some required account details could not be collected here.
                Please contact support so we can help you finish signing up.
              </Text>
            ) : null}
            {error ? <Text className="auth-error">{error}</Text> : null}
            {missingNames ? (
              <Pressable
                className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
                onPress={handleCompleteProfile}
                disabled={loading}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#081126" />
                ) : (
                  <Text className="auth-button-text">Continue</Text>
                )}
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            <View className="auth-field">
              <Text className="auth-label">Email</Text>
              <TextInput
                className="auth-input"
                placeholder="you@example.com"
                placeholderTextColor="rgba(8, 17, 38, 0.4)"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                value={emailAddress}
                onChangeText={(value) => {
                  setEmailAddress(value);
                  setError("");
                }}
                returnKeyType="next"
                accessibilityLabel="Email address"
              />
            </View>
            <View className="auth-field">
              <Text className="auth-label">Password</Text>
              <TextInput
                className="auth-input"
                placeholder="At least 8 characters"
                placeholderTextColor="rgba(8, 17, 38, 0.4)"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError("");
                }}
                returnKeyType="next"
                accessibilityLabel="Password"
              />
            </View>
            <View className="auth-field">
              <Text className="auth-label">Confirm password</Text>
              <TextInput
                className="auth-input"
                placeholder="Enter your password again"
                placeholderTextColor="rgba(8, 17, 38, 0.4)"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  setError("");
                }}
                returnKeyType="done"
                onSubmitEditing={handleCreateAccount}
                accessibilityLabel="Confirm password"
              />
            </View>
            {error ? <Text className="auth-error">{error}</Text> : null}
            <Pressable
              className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
              onPress={handleCreateAccount}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#081126" />
              ) : (
                <Text className="auth-button-text">Create account</Text>
              )}
            </Pressable>
          </>
        )}

        {activeStep !== "verification" ? (
          <View className="auth-link-row">
            <Text className="auth-link-copy">Already have an account?</Text>
            <Link href="/(auth)/sign-in" className="auth-link">
              Sign in
            </Link>
          </View>
        ) : null}
      </View>
    </AuthScreen>
  );
}
