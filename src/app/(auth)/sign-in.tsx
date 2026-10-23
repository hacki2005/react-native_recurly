import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";
import { useSignIn } from "@clerk/expo";
import AuthScreen from "../../../components/auth/AuthScreen";
import { getAuthErrorMessage, isValidEmail, normalizeEmail } from "../../../lib/auth-utils";
import { posthog } from "../../../lib/posthog";

type AuthStep = "password" | "email-code" | "reset-code" | "new-password";

const MFA_STRATEGIES = ["email_code", "phone_code", "totp", "backup_code"];

const mfaLabel = (strategy: string) => {
  switch (strategy) {
    case "email_code":
      return "Email code";
    case "phone_code":
      return "Text message";
    case "totp":
      return "Authenticator app";
    case "backup_code":
      return "Backup code";
    default:
      return strategy;
  }
};

export default function SignIn() {
  const { signIn, fetchStatus } = useSignIn();
  const [step, setStep] = useState<AuthStep>("password");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedMfaStrategy, setSelectedMfaStrategy] = useState<string | null>(
    null
  );
  const [mfaCodeSent, setMfaCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [finalizeRequested, setFinalizeRequested] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const finalizeStarted = useRef(false);

  const loading = fetchStatus === "fetching" || isFinalizing;
  const supportedMfaStrategies = [
    ...new Set(
      signIn.supportedSecondFactors
        .map(({ strategy }) => strategy)
        .filter((strategy) => MFA_STRATEGIES.includes(strategy))
    ),
  ];
  const activeMfaStrategy =
    selectedMfaStrategy &&
    supportedMfaStrategies.includes(
      selectedMfaStrategy as (typeof supportedMfaStrategies)[number]
    )
      ? selectedMfaStrategy
      : supportedMfaStrategies[0];
  const isMfaStep =
    signIn.status === "needs_second_factor" ||
    signIn.status === "needs_client_trust";
  const showNewPassword =
    step === "new-password" || signIn.status === "needs_new_password";

  useEffect(() => {
    if (
      !finalizeRequested ||
      signIn.status !== "complete" ||
      finalizeStarted.current
    ) {
      return;
    }

    finalizeStarted.current = true;
    setIsFinalizing(true);
    void signIn
      .finalize()
      .then(({ error: finalizeError }) => {
        if (finalizeError) {
          setError(
            getAuthErrorMessage(
              finalizeError,
              "Your session could not be started. Please try again."
            )
          );
          finalizeStarted.current = false;
          return;
        }

        posthog?.capture("sign_in_completed");
      })
      .catch((finalizeError: unknown) => {
        setError(
          getAuthErrorMessage(
            finalizeError,
            "Your session could not be started. Please try again."
          )
        );
        finalizeStarted.current = false;
      })
      .finally(() => setIsFinalizing(false));
  }, [finalizeRequested, signIn, signIn.status]);

  const validateEmail = () => {
    if (!isValidEmail(emailAddress)) {
      setError("Enter a valid email address to continue.");
      return false;
    }
    return true;
  };

  const handlePasswordSignIn = async () => {
    if (loading) return;
    setError("");
    if (!validateEmail()) return;
    if (!password) {
      setError("Enter your password to continue.");
      return;
    }

    finalizeStarted.current = false;
    setFinalizeRequested(false);
    try {
      const { error: signInError } = await signIn.password({
        identifier: normalizeEmail(emailAddress),
        password,
      });
      if (signInError) {
        setError(
          getAuthErrorMessage(
            signInError,
            "We couldn’t sign you in. Check your details and try again."
          )
        );
        return;
      }
      setFinalizeRequested(true);
    } catch (signInError: unknown) {
      setError(
        getAuthErrorMessage(
          signInError,
          "We couldn’t sign you in. Please try again."
        )
      );
    }
  };

  const handleSendEmailCode = async () => {
    if (loading) return;
    setError("");
    if (!validateEmail()) return;

    try {
      const { error: createError } = await signIn.create({
        identifier: normalizeEmail(emailAddress),
      });
      if (createError) {
        setError(
          getAuthErrorMessage(
            createError,
            "We couldn’t start email sign-in. Please try again."
          )
        );
        return;
      }

      const { error: sendError } = await signIn.emailCode.sendCode();
      if (sendError) {
        setError(
          getAuthErrorMessage(
            sendError,
            "We couldn’t send a sign-in code. Please try again."
          )
        );
        return;
      }

      setCode("");
      setStep("email-code");
    } catch (sendError: unknown) {
      setError(
        getAuthErrorMessage(
          sendError,
          "We couldn’t send a sign-in code. Please try again."
        )
      );
    }
  };

  const handleRequestPasswordReset = async () => {
    if (loading) return;
    setError("");
    if (!validateEmail()) return;

    try {
      const { error: createError } = await signIn.create({
        identifier: normalizeEmail(emailAddress),
      });
      if (createError) {
        setError(
          getAuthErrorMessage(
            createError,
            "We couldn’t start password recovery. Please try again."
          )
        );
        return;
      }

      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setError(
          getAuthErrorMessage(
            sendError,
            "We couldn’t send a recovery code. Please try again."
          )
        );
        return;
      }

      setCode("");
      setStep("reset-code");
    } catch (resetError: unknown) {
      setError(
        getAuthErrorMessage(
          resetError,
          "We couldn’t start password recovery. Please try again."
        )
      );
    }
  };

  const handleVerifyCode = async () => {
    if (loading) return;
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Enter the code we sent you.");
      return;
    }
    setError("");

    try {
      const { error: verifyError } =
        step === "reset-code"
          ? await signIn.resetPasswordEmailCode.verifyCode({
              code: trimmedCode,
            })
          : await signIn.emailCode.verifyCode({ code: trimmedCode });
      if (verifyError) {
        setError(
          getAuthErrorMessage(
            verifyError,
            "That code could not be verified. Check it and try again."
          )
        );
        return;
      }

      if (step === "reset-code") {
        setStep("new-password");
      } else {
        setFinalizeRequested(true);
      }
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
        step === "reset-code"
          ? await signIn.resetPasswordEmailCode.sendCode()
          : await signIn.emailCode.sendCode();
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

  const handleSendMfaCode = async () => {
    if (loading || !activeMfaStrategy) return;
    setError("");
    try {
      const result =
        activeMfaStrategy === "email_code"
          ? await signIn.mfa.sendEmailCode()
          : activeMfaStrategy === "phone_code"
            ? await signIn.mfa.sendPhoneCode()
            : null;
      if (result?.error) {
        setError(
          getAuthErrorMessage(
            result.error,
            "We couldn’t send a verification code. Please try again."
          )
        );
        return;
      }
      setCode("");
      setMfaCodeSent(true);
    } catch (sendError: unknown) {
      setError(
        getAuthErrorMessage(
          sendError,
          "We couldn’t send a verification code. Please try again."
        )
      );
    }
  };

  const handleVerifyMfa = async () => {
    if (loading || !activeMfaStrategy) return;
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("Enter your verification code to continue.");
      return;
    }
    setError("");

    try {
      const result =
        activeMfaStrategy === "email_code"
          ? await signIn.mfa.verifyEmailCode({ code: trimmedCode })
          : activeMfaStrategy === "phone_code"
            ? await signIn.mfa.verifyPhoneCode({ code: trimmedCode })
            : activeMfaStrategy === "totp"
              ? await signIn.mfa.verifyTOTP({ code: trimmedCode })
              : await signIn.mfa.verifyBackupCode({ code: trimmedCode });
      if (result.error) {
        setError(
          getAuthErrorMessage(
            result.error,
            "That verification code could not be accepted. Try again."
          )
        );
        return;
      }
      setFinalizeRequested(true);
    } catch (verifyError: unknown) {
      setError(
        getAuthErrorMessage(
          verifyError,
          "That verification code could not be accepted. Try again."
        )
      );
    }
  };

  const handleSubmitNewPassword = async () => {
    if (loading) return;
    setError("");
    if (newPassword.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      const { error: passwordError } =
        await signIn.resetPasswordEmailCode.submitPassword({
          password: newPassword,
        });
      if (passwordError) {
        setError(
          getAuthErrorMessage(
            passwordError,
            "We couldn’t update your password. Please try again."
          )
        );
        return;
      }
      setFinalizeRequested(true);
    } catch (passwordError: unknown) {
      setError(
        getAuthErrorMessage(
          passwordError,
          "We couldn’t update your password. Please try again."
        )
      );
    }
  };

  const handleChangeEmail = async () => {
    if (loading) return;
    try {
      const { error: resetError } = await signIn.reset();
      if (resetError) {
        setError(
          getAuthErrorMessage(
            resetError,
            "We couldn’t restart sign-in. Please try again."
          )
        );
        return;
      }
      setStep("password");
      setCode("");
      setSelectedMfaStrategy(null);
      setMfaCodeSent(false);
      setError("");
    } catch (resetError: unknown) {
      setError(
        getAuthErrorMessage(
          resetError,
          "We couldn’t restart sign-in. Please try again."
        )
      );
    }
  };

  const title = isMfaStep
    ? "One more step"
    : showNewPassword
      ? "Choose a new password"
      : step === "email-code" || step === "reset-code"
        ? step === "email-code"
          ? "Check your inbox"
          : "Verify your email"
        : step === "password"
          ? "Welcome back"
          : "Sign in";
  const subtitle = isMfaStep
    ? "Verify it’s really you to keep your account secure."
    : showNewPassword
      ? "Create a new password to protect your account."
      : step === "email-code"
        ? `Enter the sign-in code sent to ${normalizeEmail(emailAddress)}.`
        : step === "reset-code"
          ? `Enter the recovery code sent to ${normalizeEmail(emailAddress)}.`
          : "Sign in to continue managing your subscriptions.";

  return (
    <AuthScreen title={title} subtitle={subtitle}>
      <View className="auth-form">
        {isMfaStep ? (
          <>
            {supportedMfaStrategies.length > 1 ? (
              <View className="gap-2">
                <Text className="auth-label">Choose a verification method</Text>
                <View className="flex-row flex-wrap gap-2">
                  {supportedMfaStrategies.map((strategy) => (
                    <Pressable
                      key={strategy}
                      className={`auth-method-chip ${
                        activeMfaStrategy === strategy
                          ? "auth-method-chip-active"
                          : ""
                      }`}
                      onPress={() => {
                        setSelectedMfaStrategy(strategy);
                        setMfaCodeSent(false);
                        setCode("");
                        setError("");
                      }}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: activeMfaStrategy === strategy,
                      }}
                    >
                      <Text
                        className={`auth-method-chip-text ${
                          activeMfaStrategy === strategy
                            ? "auth-method-chip-text-active"
                            : ""
                        }`}
                      >
                        {mfaLabel(strategy)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            {activeMfaStrategy &&
            (activeMfaStrategy === "email_code" ||
              activeMfaStrategy === "phone_code") &&
            !mfaCodeSent ? (
              <Pressable
                className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
                onPress={handleSendMfaCode}
                disabled={loading}
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color="#081126" />
                ) : (
                  <Text className="auth-button-text">
                    Send {activeMfaStrategy === "email_code" ? "email" : "text"}{" "}
                    code
                  </Text>
                )}
              </Pressable>
            ) : activeMfaStrategy ? (
              <>
                <View className="auth-field">
                  <Text className="auth-label">
                    {activeMfaStrategy === "totp"
                      ? "Authenticator code"
                      : activeMfaStrategy === "backup_code"
                        ? "Backup code"
                        : "Verification code"}
                  </Text>
                  <TextInput
                    className="auth-input"
                    placeholder="Enter your code"
                    placeholderTextColor="rgba(8, 17, 38, 0.4)"
                    autoCapitalize="characters"
                    autoComplete="one-time-code"
                    keyboardType="default"
                    value={code}
                    onChangeText={(value) => {
                      setCode(value);
                      setError("");
                    }}
                    returnKeyType="done"
                    onSubmitEditing={handleVerifyMfa}
                    accessibilityLabel="Verification code"
                  />
                </View>
                <Pressable
                  className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
                  onPress={handleVerifyMfa}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  {loading ? (
                    <ActivityIndicator color="#081126" />
                  ) : (
                    <Text className="auth-button-text">Verify and continue</Text>
                  )}
                </Pressable>
                {activeMfaStrategy === "email_code" ||
                activeMfaStrategy === "phone_code" ? (
                  <Pressable
                    onPress={handleSendMfaCode}
                    disabled={loading}
                    accessibilityRole="button"
                  >
                    <Text className="auth-link text-center">Resend code</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <Text className="auth-helper">
                No supported verification method is available for this account.
                Please contact support.
              </Text>
            )}
            <Pressable onPress={handleChangeEmail} disabled={loading}>
              <Text className="auth-link text-center">Use a different account</Text>
            </Pressable>
          </>
        ) : showNewPassword ? (
          <>
            <View className="auth-field">
              <Text className="auth-label">New password</Text>
              <TextInput
                className="auth-input"
                placeholder="At least 8 characters"
                placeholderTextColor="rgba(8, 17, 38, 0.4)"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                value={newPassword}
                onChangeText={(value) => {
                  setNewPassword(value);
                  setError("");
                }}
                returnKeyType="next"
                accessibilityLabel="New password"
              />
            </View>
            <View className="auth-field">
              <Text className="auth-label">Confirm new password</Text>
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
                onSubmitEditing={handleSubmitNewPassword}
                accessibilityLabel="Confirm new password"
              />
            </View>
            <Pressable
              className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
              onPress={handleSubmitNewPassword}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#081126" />
              ) : (
                <Text className="auth-button-text">Update password</Text>
              )}
            </Pressable>
          </>
        ) : step === "email-code" || step === "reset-code" ? (
          <>
            <View className="auth-field">
              <Text className="auth-label">
                {step === "email-code" ? "Sign-in code" : "Recovery code"}
              </Text>
              <TextInput
                className="auth-input"
                placeholder="Enter the code"
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
                onSubmitEditing={handleVerifyCode}
                accessibilityLabel={
                  step === "email-code" ? "Sign-in code" : "Recovery code"
                }
              />
            </View>
            {error ? <Text className="auth-error">{error}</Text> : null}
            <Pressable
              className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
              onPress={handleVerifyCode}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#081126" />
              ) : (
                <Text className="auth-button-text">
                  {step === "email-code" ? "Verify and sign in" : "Verify code"}
                </Text>
              )}
            </Pressable>
            <View className="auth-link-row">
              <Text className="auth-link-copy">Didn’t receive a code?</Text>
              <Pressable onPress={handleResendCode} disabled={loading}>
                <Text className="auth-link">Resend</Text>
              </Pressable>
            </View>
            <Pressable onPress={handleChangeEmail} disabled={loading}>
              <Text className="auth-link text-center">Use a different email</Text>
            </Pressable>
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
                placeholder="Enter your password"
                placeholderTextColor="rgba(8, 17, 38, 0.4)"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setError("");
                }}
                returnKeyType="done"
                onSubmitEditing={handlePasswordSignIn}
                accessibilityLabel="Password"
              />
            </View>
            <View className="items-end">
              <Pressable
                onPress={handleRequestPasswordReset}
                disabled={loading}
                accessibilityRole="button"
              >
                <Text className="auth-link">Forgot password?</Text>
              </Pressable>
            </View>
            {error ? <Text className="auth-error">{error}</Text> : null}
            <Pressable
              className={`auth-button ${loading ? "auth-button-disabled" : ""}`}
              onPress={handlePasswordSignIn}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#081126" />
              ) : (
                <Text className="auth-button-text">Sign in</Text>
              )}
            </Pressable>
            <Pressable
              className="auth-secondary-button"
              onPress={handleSendEmailCode}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text className="auth-secondary-button-text">
                Sign in with an email code
              </Text>
            </Pressable>
            <View className="auth-link-row">
              <Text className="auth-link-copy">New to Recurly?</Text>
              <Link href="/(auth)/sign-up" className="auth-link">
                Create an account
              </Link>
            </View>
          </>
        )}

        {error && (isMfaStep || showNewPassword) ? (
          <Text className="auth-error">{error}</Text>
        ) : null}
      </View>
    </AuthScreen>
  );
}
