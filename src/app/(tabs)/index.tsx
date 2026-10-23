import "../../../global.css"
import { FlatList, Image, Pressable,Text, View } from "react-native";
import { useUser } from "@clerk/expo";
import dayjs from "dayjs"
import {SafeAreaView as RnSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
import images from "../../../constants/images";
import {
  addSubscription,
  HOME_BALANCE,
  HOME_USER,
  UPCOMING_SUBSCRIPTIONS,
  useSubscriptions,
} from "../../../constants/data";
import { icons } from "../../../constants/icons";
import { formatCurrency } from "./../../../lib/utils";
import ListHeading from "../../../components/ListHeading";
import UpcomingSubscriptionCard from "../../../components/UpcomingSubscriptionCard";
import SubscriptionCard from "./../../../components/SubscriptionCard";
import {useState} from "react";
import { posthog } from "../../../lib/posthog";
import CreateSubscriptionModal from "../../components/CreateSubscriptionModal";
const SafeAreaView = styled(RnSafeAreaView);
 
/**
 * Renders the home dashboard from the predefined user, balance, and subscription
 * data. Pressing a subscription toggles its details; at most one is expanded.
 */
export default function App() {
  const { user, isLoaded } = useUser();
  const homeUserName =
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.username?.trim() ||
    (isLoaded ? `${HOME_USER.name}` : "");
  const
  [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null)
  const subscriptions = useSubscriptions();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const handleCreateSubscription = (subscription: Subscription) => {
    addSubscription(subscription);
    setExpandedSubscriptionId(subscription.id);
  };

  const handleSubscriptionPress = (subscriptionId: string) => {
    if (expandedSubscriptionId !== subscriptionId) {
      posthog?.capture("subscription_details_opened", {
        subscription_id: subscriptionId,
      });
    }

    setExpandedSubscriptionId((currentId) =>
      currentId === subscriptionId ? null : subscriptionId
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background p-5">


          <FlatList
              ListHeaderComponent={() => (
                 <>
                 <View className="home-header">
                     <View className="home-user">
                         <Image source={images.avatar} className="home-avatar" />
                         <Text className="home-user-name">{homeUserName}</Text>
                     </View>
                     <Pressable
                       onPress={() => setIsCreateModalVisible(true)}
                       accessibilityRole="button"
                       accessibilityLabel="Add subscription"
                       hitSlop={8}
                     >
                       <Image source={icons.add} className="home-add-icon" />
                     </Pressable>
                 </View>
                 <View className="home-balance-card">

                     <Text className="home-balance-label">Balance</Text>
                     <View className="home-balance-row">
                         <Text className="home-balance-amount">
                             {formatCurrency(HOME_BALANCE.amount)}
                         </Text>
                         <Text className="home-balance-date">
                             {dayjs(HOME_BALANCE.nextRenewalDate).format('MM/DD')}
                         </Text>
                     </View>
                 </View>

                 <View className="mb-5">
                     <ListHeading title="Upcoming" />
                     <FlatList data={UPCOMING_SUBSCRIPTIONS} renderItem={({ item }) => (
                         <UpcomingSubscriptionCard{...item} />)}
                               keyExtractor={(item) => item.id}
                               horizontal
                               showsHorizontalScrollIndicator={false}
                               ListEmptyComponent={
                                   <Text className="home-empty-state">
                                       No upcoming subscription renewals yet.
                                   </Text>
                               }
                     />
                 </View>

                     <ListHeading title="All Subscriptions" />
                 </>
              )}
              data={subscriptions}
              keyExtractor={(item)=>item.id}
                    renderItem={({item}) =>
                        (<SubscriptionCard
                            {...item}
                            expanded={expandedSubscriptionId === item.id}
                            onPress={() => handleSubscriptionPress(item.id)}
                        />
                        )}
              extraData={expandedSubscriptionId}
              ItemSeparatorComponent={()=><View
              className="h-4"/>}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text className="home-empty-state">
                  No subscription yet
              </Text>}
              contentContainerClassName="pb-30"
          />

      <CreateSubscriptionModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onCreate={handleCreateSubscription}
      />
    </SafeAreaView>
  )
}