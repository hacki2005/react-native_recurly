import { View, Text, Pressable } from 'react-native'
import React from 'react'

const ListHeading = ({ title, onPress }: ListHeadingProps) => {
  return (
    <View>
      <Text className="list-title">{title}</Text>
      {onPress ? (
        <Pressable
          className="list-action"
          onPress={onPress}
          accessibilityRole="button"
        >
          <Text className="list-action-text">View all</Text>
        </Pressable>
      ) : (
        <View className="list-action">
          <Text className="list-action-text">View all</Text>
        </View>
      )}
    </View>
  )
}

export default ListHeading