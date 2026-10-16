import { Image, Text, View } from "react-native";
import { formatCurrency } from "../lib/utils";

/**
 * Renders a subscription's icon, price, name, and supplied days remaining.
 * Displays "Last day" when `daysLeft` is at most 1, including zero or negatives.
 */
const UpcomingSubscriptionCard = ({
  name,
  price,
  daysLeft,
  icon,
  currency,
}: UpcomingSubscription) => {
  return (
    <View className="upcoming-card">
      <View className="upcoming-row">
        <Image source={icon} className="upcoming-icon" />
      </View>
      <Text className="upcoming-price">{formatCurrency(price, currency)}</Text>
      <Text className="upcoming-meta" numberOfLines={1}>
        {daysLeft > 1 ? `${daysLeft} days Left` : "Last day"}
      </Text>
    
    <Text className="upcoming-name" numberOfLines={1}>
        {name}
    </Text>
    </View>
  );
};

export default UpcomingSubscriptionCard;
