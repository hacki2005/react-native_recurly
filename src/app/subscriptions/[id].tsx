import { Link, useLocalSearchParams } from "expo-router";
import { ScrollView, Text } from "react-native";
import { SafeAreaView as RnSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import { DEMO_NOTICE, HOME_SUBSCRIPTIONS } from "../../../constants/data";
import { formatCurrency, formatStatusLabel, formatSubscriptionDateTime } from "../../../lib/utils";

const SafeAreaView = styled(RnSafeAreaView);

/** Generates pages for the known demo subscriptions in static web exports. */
export function generateStaticParams() {
  return HOME_SUBSCRIPTIONS.map(({ id }) => ({ id }));
}

/** Displays a demo subscription's details, or a not-found message for unknown IDs. */
export default function SubscriptionDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subscription = HOME_SUBSCRIPTIONS.find((item) => item.id === id);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView>
        <Text className="home-empty-state">{DEMO_NOTICE}</Text>
        {subscription ? (
          <>
            <Text className="list-title">{subscription.name}</Text>
            <Text className="sub-price">{formatCurrency(subscription.price, subscription.currency)}</Text>
            <Text className="sub-billing">{subscription.billing}</Text>
            <Text>Payment: {subscription.paymentMethod || "Not provided"}</Text>
            <Text>Category: {subscription.category || subscription.plan || "Not provided"}</Text>
            <Text>Started: {formatSubscriptionDateTime(subscription.startDate)}</Text>
            <Text>Renewal: {formatSubscriptionDateTime(subscription.renewalDate)}</Text>
            <Text>Status: {formatStatusLabel(subscription.status)}</Text>
          </>
        ) : (
          <Text className="list-title">Subscription not found</Text>
        )}
        <Link href="/(tabs)/subscriptions" className="list-action-text py-4">
          Back to subscriptions
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}
