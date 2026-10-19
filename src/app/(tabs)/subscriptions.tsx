import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView as RnSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import SubscriptionCard from "../../../components/SubscriptionCard";
import { DEMO_NOTICE, HOME_SUBSCRIPTIONS } from "../../../constants/data";

const SafeAreaView = styled(RnSafeAreaView);

/** Lists the demo subscriptions with expandable summaries and links to details. */
export default function Subscriptions() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        data={HOME_SUBSCRIPTIONS}
        keyExtractor={(item) => item.id}
        extraData={expandedId}
        ListHeaderComponent={
          <View>
            <Text className="list-title">Subscriptions</Text>
            <Text className="home-empty-state">{DEMO_NOTICE}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View>
            <SubscriptionCard
              {...item}
              expanded={expandedId === item.id}
              onPress={() => setExpandedId((current) => current === item.id ? null : item.id)}
            />
            {expandedId === item.id && (
              <Link
                href={{ pathname: "/subscriptions/[id]", params: { id: item.id } }}
                className="list-action-text py-3"
              >
                View details for {item.name}
              </Link>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View className="h-4" />}
        ListEmptyComponent={<Text className="home-empty-state">No subscriptions yet.</Text>}
        contentContainerClassName="pb-30"
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
