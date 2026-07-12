import { supabase } from "@/utils/supabase";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";

export default function LogInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleUserSignIn() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log("error.message");
      Alert.alert("Login failed", "Incorrect email or password.");
      return;
    }

    console.log(data);
    router.replace("/(app)");
  }

  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ color: "white" }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        style={{ color: "white" }}
      />

      <Button
        title={"Sign In"}
        onPress={() => {
          handleUserSignIn();
        }}
      />
    </View>
  );
}
