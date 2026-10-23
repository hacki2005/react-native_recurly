import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import clsx from "clsx";
import dayjs from "dayjs";

import { icons } from "../../constants/icons";

const CATEGORIES = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

type SubscriptionCategory = (typeof CATEGORIES)[number];
type BillingFrequency = "Monthly" | "Yearly";

const CATEGORY_COLORS: Record<SubscriptionCategory, string> = {
  Entertainment: "#b8d4e3",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#f5c542",
  Productivity: "#b8e8d0",
  Cloud: "#c7d8f5",
  Music: "#f2c6de",
  Other: "#eee4cf",
};

interface CreateSubscriptionModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
}

export default function CreateSubscriptionModal({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<BillingFrequency>("Monthly");
  const [category, setCategory] = useState<SubscriptionCategory>("Other");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Other");
    setError("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

    const trimmedName = name.trim();
    const parsedPrice = Number(price.trim());

    if (!trimmedName) {
      setError("Enter a name for this subscription.");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Enter a price greater than zero.");
      return;
    }
    setIsSubmitting(true);
    const now = dayjs();
    const subscription: Subscription = {
      id: `subscription-${now.valueOf()}-${Math.random().toString(36).slice(2, 8)}`,
      name: trimmedName,
      price: parsedPrice,
      frequency,
      category,
      status: "active",
      startDate: now.toISOString(),
      renewalDate: now
        .add(1, frequency === "Monthly" ? "month" : "year")
        .toISOString(),
      icon: icons.figma,
      billing: frequency,
      color: CATEGORY_COLORS[category],
    };

    try {
      onCreate(subscription);
      resetForm();
      onClose();
    } catch (creationError: unknown) {
      setIsSubmitting(false);
      setError(
        creationError instanceof Error && creationError.message
          ? creationError.message
          : "We couldn’t add this subscription. Please try again."
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="modal-overlay justify-end"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          className="absolute inset-0"
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close new subscription form"
        />
        <View className="modal-container">
          <View className="modal-header">
            <Text className="modal-title">New Subscription</Text>
            <Pressable
              className="modal-close"
              onPress={handleClose}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
            >
              <Text className="modal-close-text">X</Text>
            </Pressable>
          </View>

          <ScrollView
            className="shrink"
            contentContainerClassName="modal-body"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="auth-field">
              <Text className="auth-label">Name</Text>
              <TextInput
                className="auth-input"
                placeholder="e.g. Netflix"
                placeholderTextColor="rgba(8, 17, 38, 0.4)"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  setError("");
                }}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                accessibilityLabel="Subscription name"
              />
            </View>

            <View className="auth-field">
              <Text className="auth-label">Price</Text>
              <TextInput
                className="auth-input"
                placeholder="0.00"
                placeholderTextColor="rgba(8, 17, 38, 0.4)"
                value={price}
                onChangeText={(value) => {
                  setPrice(value);
                  setError("");
                }}
                keyboardType="decimal-pad"
                returnKeyType="done"
                accessibilityLabel="Subscription price"
              />
            </View>

            <View className="gap-2">
              <Text className="auth-label">Frequency</Text>
              <View className="picker-row">
                {(["Monthly", "Yearly"] as const).map((option) => {
                  const selected = frequency === option;
                  return (
                    <Pressable
                      key={option}
                      className={clsx(
                        "picker-option",
                        selected && "picker-option-active"
                      )}
                      onPress={() => setFrequency(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                    >
                      <Text
                        className={clsx(
                          "picker-option-text",
                          selected && "picker-option-text-active"
                        )}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View className="gap-2">
              <Text className="auth-label">Category</Text>
              <View className="category-scroll">
                {CATEGORIES.map((option) => {
                  const selected = category === option;
                  return (
                    <Pressable
                      key={option}
                      className={clsx(
                        "category-chip",
                        selected && "category-chip-active"
                      )}
                      onPress={() => {
                        setCategory(option);
                        setError("");
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                    >
                      <Text
                        className={clsx(
                          "category-chip-text",
                          selected && "category-chip-text-active"
                        )}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {error ? (
              <Text className="auth-error" accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            <Pressable
              className={clsx(
                "auth-button",
                isSubmitting && "auth-button-disabled"
              )}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#081126" />
              ) : (
                <Text className="auth-button-text">Add subscription</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
