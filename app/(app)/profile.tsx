import { router } from "expo-router";
import { Button, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View>
      <Text style={{ color: "red" }}>Profile</Text>
      <Button
        title={"sign out"}
        onPress={() => {
          router.replace("/(auth)");
        }}
      />
    </View>
  );
}
