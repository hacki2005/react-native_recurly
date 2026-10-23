import { useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView as RnSafeAreaView } from "react-native-safe-area-context";
import { styled } from "nativewind";
import dayjs from "dayjs";

import { useSubscriptions } from "../../../constants/data";
import { colors } from "../../../constants/Theme";
import { posthog } from "../../../lib/posthog";
import { formatCurrency } from "../../../lib/utils";

const SafeAreaView = styled(RnSafeAreaView);
const CHART_DAYS = 7;
const VISIBLE_SUBSCRIPTION_COUNT = 3;

const isActive = (subscription: Subscription) =>
  (subscription.status ?? "active").toLocaleLowerCase() === "active";

const getMonthlyEquivalent = (subscription: Subscription) => {
  const billing = subscription.billing.toLocaleLowerCase();

  if (billing.includes("year") || billing.includes("annual")) {
    return subscription.price / 12;
  }
  if (billing.includes("week")) {
    return (subscription.price * 52) / 12;
  }
  if (billing.includes("day")) {
    return (subscription.price * 365) / 12;
  }

  return subscription.price;
};

const getCurrency = (subscription: Subscription) =>
  subscription.currency?.toUpperCase() || "USD";

const formatStartDate = (value?: string) => {
  if (!value || !dayjs(value).isValid()) return "Added to your tracker";
  return `Started ${dayjs(value).format("MMM D, YYYY")}`;
};

const getTimestamp = (value?: string) =>
  value && dayjs(value).isValid() ? dayjs(value).valueOf() : 0;

const Insights = () => {
  const subscriptions = useSubscriptions();
  const [showUpcoming, setShowUpcoming] = useState(false);
  const [showAllSubscriptions, setShowAllSubscriptions] = useState(false);

  useEffect(() => {
    posthog?.capture("insights_viewed");
  }, []);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter(isActive),
    [subscriptions],
  );

  const monthlyTotals = useMemo(() => {
    const totals = new Map<string, number>();

    activeSubscriptions.forEach((subscription) => {
      const currency = getCurrency(subscription);
      totals.set(
        currency,
        (totals.get(currency) ?? 0) + getMonthlyEquivalent(subscription),
      );
    });

    return Array.from(totals, ([currency, total]) => ({ currency, total }));
  }, [activeSubscriptions]);

  const todayKey = dayjs().format("YYYY-MM-DD");
  const weekDays = useMemo(
    () => {
      const today = dayjs(todayKey).startOf("day");
      return Array.from({ length: CHART_DAYS }, (_, index) =>
        today.add(index, "day"),
      );
    },
    [todayKey],
  );

  const allUpcomingSubscriptions = useMemo(
    () => {
      const today = dayjs(todayKey).startOf("day");
      return activeSubscriptions
        .filter((subscription) => {
          if (!subscription.renewalDate) return false;
          const renewalDate = dayjs(subscription.renewalDate);
          return renewalDate.isValid() && !renewalDate.isBefore(today);
        })
        .sort(
          (first, second) =>
            dayjs(first.renewalDate).valueOf() -
            dayjs(second.renewalDate).valueOf(),
        );
    },
    [activeSubscriptions, todayKey],
  );

  const upcomingSubscriptions = useMemo(
    () => {
      const weekEnd = dayjs(todayKey).startOf("day").add(CHART_DAYS, "day");
      return allUpcomingSubscriptions.filter((subscription) =>
        dayjs(subscription.renewalDate).isBefore(weekEnd),
      );
    },
    [allUpcomingSubscriptions, todayKey],
  );

  const upcomingCounts = weekDays.map(
    (day) =>
      upcomingSubscriptions.filter((subscription) =>
        dayjs(subscription.renewalDate).isSame(day, "day"),
      ).length,
  );
  const peakDayIndex = upcomingCounts.indexOf(Math.max(...upcomingCounts));
  const maxRenewals = Math.max(...upcomingCounts, 1);

  const recentSubscriptions = useMemo(
    () =>
      [...subscriptions].sort(
        (first, second) =>
          getTimestamp(second.startDate) - getTimestamp(first.startDate),
      ),
    [subscriptions],
  );
  const displayedSubscriptions = showAllSubscriptions
    ? recentSubscriptions
    : recentSubscriptions.slice(0, VISIBLE_SUBSCRIPTION_COUNT);

  const toggleUpcoming = () => {
    setShowUpcoming((visible) => !visible);
    posthog?.capture("insights_upcoming_list_toggled");
  };

  const toggleSubscriptions = () => {
    setShowAllSubscriptions((visible) => !visible);
    posthog?.capture("insights_subscriptions_list_toggled");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 150,
        }}
      >
        <View className="mb-8 min-h-14 flex-row items-center justify-center">
          <Text className="text-2xl font-sans-bold text-primary">
            Monthly Insights
          </Text>
          <Pressable
            onPress={() =>
              Alert.alert(
                "Monthly insights",
                "Estimates are calculated from your saved subscription details.",
              )
            }
            accessibilityRole="button"
            accessibilityLabel="About monthly insights"
            hitSlop={12}
            className="absolute right-0 h-11 w-11 items-center justify-center rounded-full border border-border"
          >
            <Text className="text-lg font-sans-bold text-primary">•••</Text>
          </Pressable>
        </View>

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-sans-bold text-primary">Upcoming</Text>
          <Pressable
            onPress={toggleUpcoming}
            accessibilityRole="button"
            accessibilityState={{ expanded: showUpcoming }}
            className="rounded-full border border-border bg-background px-4 py-2"
          >
            <Text className="text-base font-sans-semibold text-primary">
              {showUpcoming ? "Show less" : "View all"}
            </Text>
          </Pressable>
        </View>

        <View className="rounded-3xl p-5" style={{ backgroundColor: colors.muted }}>
          <Text className="mb-4 text-sm font-sans-semibold text-muted-foreground">
            Renewals over the next 7 days
          </Text>
          <View className="flex-row items-end justify-between">
            {weekDays.map((day, index) => {
              const count = upcomingCounts[index];
              const barHeight = count ? Math.max(12, (count / maxRenewals) * 148) : 2;

              return (
                <View
                  key={day.format("YYYY-MM-DD")}
                  className="flex-1 items-center"
                >
                  <View
                    className="w-full items-center justify-end"
                    style={{ height: 178 }}
                  >
                    {count > 0 && index === peakDayIndex ? (
                      <View
                        className="mb-2 rounded-xl bg-background px-2 py-1"
                        accessibilityLabel={`${count} ${
                          count === 1 ? "renewal" : "renewals"
                        }`}
                      >
                        <Text className="text-xs font-sans-bold text-accent">
                          {count} due
                        </Text>
                      </View>
                    ) : (
                      <View className="mb-2 h-6" />
                    )}
                    <View
                      className="rounded-full"
                      style={{
                        height: barHeight,
                        width: 18,
                        backgroundColor:
                          index === peakDayIndex && count > 0
                            ? colors.accent
                            : colors.primary,
                      }}
                    />
                  </View>
                  <Text className="mt-3 text-xs font-sans-semibold text-muted-foreground">
                    {day.format("ddd")}
                  </Text>
                </View>
              );
            })}
          </View>
          {upcomingSubscriptions.length === 0 && (
            <Text className="mt-4 text-center text-sm font-sans-medium text-muted-foreground">
              No renewals scheduled this week.
            </Text>
          )}
        </View>

        {showUpcoming && (
          <View className="mt-3 rounded-2xl border border-border bg-card">
            {allUpcomingSubscriptions.length ? (
              allUpcomingSubscriptions.map((subscription) => (
                <View
                  key={subscription.id}
                  className="flex-row items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
                >
                  <View className="mr-3 flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-base font-sans-semibold text-primary"
                    >
                      {subscription.name}
                    </Text>
                    <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                      {dayjs(subscription.renewalDate).format("ddd, MMM D")}
                    </Text>
                  </View>
                  <Text className="text-base font-sans-bold text-primary">
                    {formatCurrency(subscription.price, getCurrency(subscription))}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="px-4 py-4 text-sm font-sans-medium text-muted-foreground">
                No upcoming renewals to show.
              </Text>
            )}
          </View>
        )}

        <View className="mt-4 flex-row items-center justify-between rounded-3xl border border-border bg-background p-5">
          <View className="mr-3 flex-1">
            <Text className="text-xl font-sans-bold text-primary">Expenses</Text>
            <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
              Monthly equivalent · {activeSubscriptions.length} active
            </Text>
          </View>
          <View className="items-end">
            {monthlyTotals.length ? (
              monthlyTotals.map(({ currency, total }) => (
                <Text
                  key={currency}
                  className="text-xl font-sans-bold text-primary"
                >
                  {formatCurrency(total, currency)}
                </Text>
              ))
            ) : (
              <Text className="text-lg font-sans-bold text-primary">
                {formatCurrency(0)}
              </Text>
            )}
          </View>
        </View>

        <View className="mb-4 mt-10 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-sans-bold text-primary">
              Subscription history
            </Text>
            <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
              Saved subscriptions, newest first
            </Text>
          </View>
          {recentSubscriptions.length > VISIBLE_SUBSCRIPTION_COUNT && (
            <Pressable
              onPress={toggleSubscriptions}
              accessibilityRole="button"
              accessibilityState={{ expanded: showAllSubscriptions }}
              className="ml-3 rounded-full border border-border bg-background px-4 py-2"
            >
              <Text className="text-base font-sans-semibold text-primary">
                {showAllSubscriptions ? "Show less" : "View all"}
              </Text>
            </Pressable>
          )}
        </View>

        {displayedSubscriptions.length ? (
          displayedSubscriptions.map((subscription) => (
            <View
              key={subscription.id}
              className="mb-4 flex-row items-center justify-between rounded-3xl p-4"
              style={{
                backgroundColor: subscription.color ?? colors.subscription,
              }}
            >
              <View className="mr-3 flex-1 flex-row items-center">
                <View className="mr-3 h-14 w-14 items-center justify-center rounded-2xl bg-white/35">
                  <Image
                    source={subscription.icon}
                    resizeMode="contain"
                    style={{ width: 36, height: 36 }}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-lg font-sans-bold text-primary"
                  >
                    {subscription.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="mt-1 text-sm font-sans-medium text-muted-foreground"
                  >
                    {formatStartDate(subscription.startDate)}
                  </Text>
                  {subscription.status &&
                    subscription.status.toLocaleLowerCase() !== "active" && (
                      <Text className="mt-1 text-xs font-sans-semibold text-muted-foreground">
                        {subscription.status}
                      </Text>
                    )}
                </View>
              </View>
              <View className="items-end">
                <Text className="text-lg font-sans-bold text-primary">
                  {formatCurrency(subscription.price, getCurrency(subscription))}
                </Text>
                <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                  per {subscription.billing.toLocaleLowerCase()}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text className="rounded-2xl border border-border p-5 text-sm font-sans-medium text-muted-foreground">
            Add a subscription to see your insights.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Insights;
