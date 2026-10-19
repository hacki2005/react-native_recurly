import { View, Text, TouchableOpacity } from "react-native";

/** Renders a section title with a "View all" action when a handler is supplied. */
const ListHeading = ({ title, onPress }: ListHeadingProps) => (
  <View className="list-head">
    <Text className="list-title">{title}</Text>
    {onPress && (
      <TouchableOpacity
        className="list-action"
        accessibilityRole="button"
        onPress={onPress}
      >
        <Text className="list-action-text">View all</Text>
      </TouchableOpacity>
    )}
  </View>
);

export default ListHeading;
