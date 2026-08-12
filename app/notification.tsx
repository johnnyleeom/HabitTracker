import { formatDate, formatScheduleLine, getHabitStreak } from "@/utils/helper";
import { supabase } from "@/utils/supabase";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { StoredHabit } from "../types/habit";

type Selection = "yes" | "no" | null;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CHECK_PATH_LENGTH = 150;
const CIRCLE_PATH_LENGTH = 440;

const SUCCESS_COLOR = "#39D97A";
const FAILURE_COLOR = "#FF5A5F";

export default function NotificationScreen() {
  const { habitId } = useLocalSearchParams<{
    habitId?: string;
  }>();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const [habit, setHabit] = useState<StoredHabit | null>(null);
  const [streaks, setStreaks] = useState(0);
  const [scheduleText, setScheduleText] = useState("");
  const [selection, setSelection] = useState<Selection>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // fetch habits when it first mounts
  // set habit
  // set streaks
  // set schedule text all happens here
  useEffect(() => {
    async function getHabitData() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        Alert.alert(error.message);
        return;
      }

      const accessToken = data.session?.access_token;

      if (!accessToken) {
        Alert.alert("Access token is missing");
        return;
      }

      const res = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/supabase/get_single_habit_data/${habitId}`,
        {
          method: "GET",
          headers: {
            authorization: "Bearer " + accessToken,
          },
        },
      );

      const response = await res.json();

      if (!res.ok) {
        Alert.alert(response.message);
        return;
      }

      const retrievedHabit = response.habit;
      setHabit(retrievedHabit);
      setStreaks(getHabitStreak(retrievedHabit));
      setScheduleText(formatScheduleLine(retrievedHabit));
    }

    void getHabitData();
  }, [habitId]);

  // time out thingy
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  function returnToApp() {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }

    router.replace("/(app)");
  }

  async function addNewLog(selection: Exclude<Selection, null>) {
    if (!habit) {
      Alert.alert("Habit data is not loaded");
      return false;
    }
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      Alert.alert("No user signed in");
      return false;
    }

    const accessToken = data.session?.access_token;

    if (!accessToken) {
      Alert.alert("Cannot retrieve accessToken");
      return false;
    }

    const today = formatDate(new Date());

    const newLog = {
      ...habit.logs,
      [today]: selection === "yes" ? true : false,
    };

    const res = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/supabase/update_habit`,
      {
        method: "PATCH",
        headers: {
          authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId: Number(habitId),
          logs: newLog,
        }),
      },
    );

    const result = await res.json();

    if (!res.ok) {
      Alert.alert(result.message);
      return false;
    }

    return true;
  }

  //
  // ANIMATION SECTION STARTS -----------------------------------------------------------------
  //
  const exitProgress = useSharedValue(0);
  const resultProgress = useSharedValue(0);
  const circleProgress = useSharedValue(0);
  const symbolProgress = useSharedValue(0);

  const resultColor = selection === "no" ? FAILURE_COLOR : SUCCESS_COLOR;

  async function handleSelection(nextSelection: Exclude<Selection, null>) {
    if (isAnimating) {
      return;
    }

    setIsAnimating(true);

    if (nextSelection === "yes") {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const success = await addNewLog(nextSelection);

    if (!success) {
      setIsAnimating(false);
      return;
    }

    setSelection(nextSelection);

    exitProgress.value = withTiming(1, {
      duration: 620,
      easing: Easing.inOut(Easing.cubic),
    });

    circleProgress.value = withDelay(
      450,
      withTiming(1, {
        duration: 650,
        easing: Easing.inOut(Easing.cubic),
      }),
    );

    symbolProgress.value = withDelay(
      760,
      withTiming(1, {
        duration: 520,
        easing: Easing.out(Easing.cubic),
      }),
    );

    resultProgress.value = withDelay(
      590,
      withTiming(1, {
        duration: 430,
        easing: Easing.out(Easing.cubic),
      }),
    );

    redirectTimeoutRef.current = setTimeout(() => {
      router.replace("/(app)");
    }, 3000);
  }

  function resetAnimation() {
    resultProgress.value = withTiming(0, {
      duration: 220,
    });

    exitProgress.value = withDelay(
      120,
      withTiming(0, {
        duration: 480,
        easing: Easing.inOut(Easing.cubic),
      }),
    );

    circleProgress.value = 0;
    symbolProgress.value = 0;

    setSelection(null);
    setIsAnimating(false);
  }

  const eyebrowStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [
      {
        translateY: interpolate(exitProgress.value, [0, 1], [0, -180]),
      },
    ],
  }));

  const streakStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [
      {
        translateX: interpolate(exitProgress.value, [0, 1], [0, -180]),
      },
      {
        translateY: interpolate(exitProgress.value, [0, 1], [0, -110]),
      },
      {
        rotate: `${interpolate(exitProgress.value, [0, 1], [0, -12])}deg`,
      },
    ],
  }));

  const habitNameStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [
      {
        translateY: interpolate(exitProgress.value, [0, 1], [0, -230]),
      },
      {
        scale: interpolate(exitProgress.value, [0, 1], [1, 0.78]),
      },
    ],
  }));

  const scheduleStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [
      {
        translateX: interpolate(exitProgress.value, [0, 1], [0, 220]),
      },
      {
        translateY: interpolate(exitProgress.value, [0, 1], [0, -90]),
      },
    ],
  }));

  const questionStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [
      {
        translateX: interpolate(exitProgress.value, [0, 1], [0, -220]),
      },
    ],
  }));

  const yesButtonStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [
      {
        translateX: interpolate(exitProgress.value, [0, 1], [0, -210]),
      },
      {
        translateY: interpolate(exitProgress.value, [0, 1], [0, 230]),
      },
      {
        rotate: `${interpolate(exitProgress.value, [0, 1], [0, -18])}deg`,
      },
      {
        scale: interpolate(exitProgress.value, [0, 1], [1, 0.75]),
      },
    ],
  }));

  const noButtonStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [
      {
        translateX: interpolate(exitProgress.value, [0, 1], [0, 210]),
      },
      {
        translateY: interpolate(exitProgress.value, [0, 1], [0, 230]),
      },
      {
        rotate: `${interpolate(exitProgress.value, [0, 1], [0, 18])}deg`,
      },
      {
        scale: interpolate(exitProgress.value, [0, 1], [1, 0.75]),
      },
    ],
  }));

  const bottomStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
    transform: [
      {
        translateY: interpolate(exitProgress.value, [0, 1], [0, 170]),
      },
    ],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultProgress.value,
    transform: [
      {
        translateY: interpolate(resultProgress.value, [0, 1], [34, 0]),
      },
      {
        scale: interpolate(resultProgress.value, [0, 1], [0.88, 1]),
      },
    ],
  }));

  const circleAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_PATH_LENGTH * (1 - circleProgress.value),
  }));

  const symbolAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_PATH_LENGTH * (1 - symbolProgress.value),
  }));

  //
  // ANIMATION SECTION ENDS ---------------------------------------------------------
  //

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.Text style={[styles.eyebrow, eyebrowStyle]}>
          CHECK IN
        </Animated.Text>

        <Animated.View style={[styles.streakPill, streakStyle]}>
          <View style={styles.streakDot} />

          <Text style={styles.streakText}>{streaks} day streak</Text>
        </Animated.View>

        <View style={styles.habitSection}>
          <Animated.Text
            style={[styles.habitName, habitNameStyle]}
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {habit?.name}
          </Animated.Text>

          <Animated.Text style={[styles.schedule, scheduleStyle]}>
            {scheduleText}
          </Animated.Text>
        </View>

        <View style={styles.questionSection}>
          <Animated.Text style={[styles.question, questionStyle]}>
            Did you get it done?
          </Animated.Text>

          <View style={styles.actionsRow}>
            <Animated.View style={[styles.actionColumn, yesButtonStyle]}>
              <View style={styles.yesGlow}>
                <Pressable
                  disabled={isAnimating || !habit}
                  onPress={() => void handleSelection("yes")}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.yesButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.yesIcon}>✓</Text>
                </Pressable>
              </View>

              <Text style={[styles.actionLabel, styles.yesLabel]}>Yes</Text>
            </Animated.View>

            <Animated.View style={[styles.actionColumn, noButtonStyle]}>
              <Pressable
                disabled={isAnimating || !habit}
                onPress={() => void handleSelection("no")}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.noButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.noIcon}>×</Text>
              </Pressable>

              <Text style={styles.actionLabel}>No</Text>
            </Animated.View>
          </View>
        </View>

        <Animated.View style={[styles.bottomSection, bottomStyle]}>
          <Pressable
            onPress={returnToApp}
            style={({ pressed }) => [
              styles.returnButton,
              pressed && styles.returnButtonPressed,
            ]}
          >
            <Text style={styles.returnText}>Return to app</Text>
          </Pressable>
        </Animated.View>
      </View>

      <Animated.View
        pointerEvents={selection ? "auto" : "none"}
        style={[styles.resultOverlay, resultStyle]}
      >
        <View
          style={[
            styles.resultGlow,
            {
              shadowColor: resultColor,
            },
          ]}
        >
          <Svg width={190} height={190} viewBox="0 0 190 190">
            <AnimatedCircle
              cx="95"
              cy="95"
              r="70"
              fill="none"
              stroke={resultColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCLE_PATH_LENGTH}
              animatedProps={circleAnimatedProps}
              transform="rotate(-90 95 95)"
            />

            {selection === "yes" ? (
              <AnimatedPath
                d="M56 98 L82 124 L136 67"
                fill="none"
                stroke={resultColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={CHECK_PATH_LENGTH}
                animatedProps={symbolAnimatedProps}
              />
            ) : (
              <AnimatedPath
                d="M65 65 L125 125 M125 65 L65 125"
                fill="none"
                stroke={resultColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CHECK_PATH_LENGTH}
                animatedProps={symbolAnimatedProps}
              />
            )}
          </Svg>
        </View>

        <Text
          style={[
            styles.resultTitle,
            {
              color: resultColor,
            },
          ]}
        >
          {selection === "yes" ? "Completed." : "Not today."}
        </Text>

        <Text style={styles.resultSubtitle}>
          {selection === "yes"
            ? "Another step forward."
            : "Tomorrow is another chance."}
        </Text>
      </Animated.View>
    </View>
  );
}

function createStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: "hidden",
      backgroundColor: "#000000",
    },

    content: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: 82,
      paddingBottom: 32,
    },

    eyebrow: {
      alignSelf: "center",
      color: "#66666B",
      fontSize: 13,
      fontWeight: "800",
      letterSpacing: 4,
      marginBottom: 25,
    },

    streakPill: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 999,
      backgroundColor: "#111113",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "#343438",
    },

    streakDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: SUCCESS_COLOR,
      marginRight: 9,
      shadowColor: SUCCESS_COLOR,
      shadowOpacity: 1,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 0,
      },
    },

    streakText: {
      color: "#D4D4D8",
      fontSize: 15,
      fontWeight: "700",
    },

    habitSection: {
      alignItems: "center",
      marginTop: 44,
    },

    habitName: {
      maxWidth: 330,
      color: "#FFFFFF",
      fontSize: 48,
      lineHeight: 53,
      fontWeight: "900",
      letterSpacing: -1.8,
      textAlign: "center",
    },

    schedule: {
      color: "#69696F",
      fontSize: 14,
      fontWeight: "800",
      letterSpacing: 1.4,
      marginTop: 23,
    },

    questionSection: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
    },

    question: {
      color: "#F4F4F5",
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: -0.35,
      marginBottom: 44,
    },

    actionsRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "center",
      gap: 34,
    },

    actionColumn: {
      alignItems: "center",
    },

    yesGlow: {
      borderRadius: 69,
      shadowColor: SUCCESS_COLOR,
      shadowOpacity: 0.62,
      shadowRadius: 32,
      shadowOffset: {
        width: 0,
        height: 0,
      },
    },

    actionButton: {
      width: 138,
      height: 138,
      borderRadius: 69,
      alignItems: "center",
      justifyContent: "center",
    },

    yesButton: {
      backgroundColor: "#FAFAFA",
    },

    noButton: {
      backgroundColor: "#121214",
      borderWidth: 1.5,
      borderColor: "#303034",
    },

    buttonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.96 }],
    },

    yesIcon: {
      color: "#080808",
      fontSize: 59,
      fontWeight: "300",
      lineHeight: 64,
    },

    noIcon: {
      color: "#B3B3B8",
      fontSize: 67,
      fontWeight: "200",
      lineHeight: 71,
      marginTop: -6,
    },

    actionLabel: {
      color: "#8C8C92",
      fontSize: 16,
      fontWeight: "800",
      marginTop: 18,
    },

    yesLabel: {
      color: SUCCESS_COLOR,
    },

    remindButton: {
      paddingHorizontal: 22,
      paddingVertical: 14,
      marginTop: 48,
      borderRadius: 999,
    },

    remindButtonPressed: {
      backgroundColor: "#111113",
    },

    remindText: {
      color: "#56565C",
      fontSize: 16,
      fontWeight: "600",
    },

    bottomSection: {
      alignItems: "center",
    },

    pageIndicators: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      marginBottom: 18,
    },

    pageDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#29292D",
    },

    pageDotActive: {
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: "#FFFFFF",
      shadowColor: "#FFFFFF",
      shadowOpacity: 0.85,
      shadowRadius: 7,
      shadowOffset: {
        width: 0,
        height: 0,
      },
    },

    returnButton: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 999,
    },

    returnButtonPressed: {
      backgroundColor: "#111113",
    },

    returnText: {
      color: "#6A6A70",
      fontSize: 13,
      fontWeight: "700",
    },

    debugText: {
      color: "#333338",
      fontSize: 11,
      marginTop: 7,
    },

    resultOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      backgroundColor: "#000000",
    },

    resultGlow: {
      borderRadius: 95,
      shadowOpacity: 0.42,
      shadowRadius: 32,
      shadowOffset: {
        width: 0,
        height: 0,
      },
    },

    resultTitle: {
      fontSize: 44,
      fontWeight: "900",
      letterSpacing: -1.4,
      textAlign: "center",
      marginTop: 24,
    },

    resultSubtitle: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 17,
      lineHeight: 25,
      fontWeight: "600",
      textAlign: "center",
      marginTop: 10,
    },

    continueButton: {
      minWidth: 180,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FFFFFF",
      borderRadius: 999,
      marginTop: 42,
      paddingHorizontal: 28,
      paddingVertical: 16,
    },

    continueButtonPressed: {
      opacity: 0.84,
      transform: [{ scale: 0.97 }],
    },

    continueButtonText: {
      color: "#111111",
      fontSize: 16,
      fontWeight: "800",
    },

    goBackButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
      marginTop: 8,
    },

    goBackButtonPressed: {
      backgroundColor: "rgba(255,255,255,0.12)",
    },

    goBackText: {
      color: "rgba(255,255,255,0.78)",
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
