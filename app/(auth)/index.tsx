import { router } from "expo-router";
import { Button, View } from "react-native";

export default function LogInScreen() {
  return (
    <View>
      <Button
        title={"Log In"}
        onPress={() => {
          router.replace("/(app)");
        }}
      />
    </View>
  );
}
