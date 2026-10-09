import { View, Text } from 'react-native'
import {SafeAreaView as RnSafeAreaView} from "react-native-safe-area-context";
import {styled} from "nativewind";
const SafeAreaView = styled(RnSafeAreaView);

const insights = () => {
  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <Text>insights</Text>
    </SafeAreaView>
  )
}

export default insights