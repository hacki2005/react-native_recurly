import "../../../global.css";
import { useMemo, useState } from "react";
import { FlatList, Text, TextInput, View } from "react-native";
import { SafeAreaView as RnSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import SubscriptionCard from "../../../components/SubscriptionCard";
import { HOME_SUBSCRIPTIONS } from "../../../constants/data";

const SafeAreaView = styled(RnSafeAreaView);

const Subscriptions = () => {
  const [query, setQuery] = useState("");
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<
    string | null
  >(null);

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return HOME_SUBSCRIPTIONS;

    return HOME_SUBSCRIPTIONS.filter((subscription) =>
      [
        subscription.name,
        subscription.category,
        subscription.plan,
        subscription.paymentMethod,
        subscription.status,
        subscription.billing,
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery))
    );
  }, [query]);

  const handleSubscriptionPress = (subscriptionId: string) => {
    setExpandedSubscriptionId((currentId) =>
      currentId === subscriptionId ? null : subscriptionId
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-5">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            {...item}
            expanded={expandedSubscriptionId === item.id}
            onPress={() => handleSubscriptionPress(item.id)}
          />
        )}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-4" />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-30"
        ListHeaderComponent={
          <View className="mb-5">
            <Text className="text-2xl font-sans-bold text-primary">
              Subscriptions
            </Text>
            <TextInput
              className="mt-4 rounded-2xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
              value={query}
              onChangeText={setQuery}
              placeholder="Search subscriptions"
              placeholderTextColor="rgba(8, 17, 38, 0.45)"
              accessibilityLabel="Search subscriptions"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text className="mt-3 text-sm font-sans-medium text-muted-foreground">
              {filteredSubscriptions.length}{" "}
              {filteredSubscriptions.length === 1
                ? "subscription"
                : "subscriptions"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text className="home-empty-state">
            No subscriptions match your search.
          </Text>
        }
      />
    </SafeAreaView>
  );
};

export default Subscriptions;
