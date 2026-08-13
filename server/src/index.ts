import "dotenv/config";
import express from "express";
import { rateLimit } from "express-rate-limit";
import createUserSupabaseClient, { supabaseAdmin } from "./utils/supabase.js";

const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

app.use(express.json());
app.use("/supabase", apiLimiter);

const PORT = Number(process.env.PORT) || 3000;

// get habits
// retreives all habits data for one user
// used for calender and home page

app.get("/supabase/get_habits", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access token required",
    });
  }

  const accessToken = authHeader.slice("Bearer ".length);
  const supabase = createUserSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  res.status(200).json({
    message: "success",
    habits: data,
  });
});

//add_habits
//adds a habit to supabase
// used for home page

app.post("/supabase/add_habit", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access token required",
    });
  }
  const accessToken = authHeader.slice("Bearer ".length);
  const supabase = createUserSupabaseClient(accessToken);

  const { data, error: err } = await supabase.auth.getUser();

  if (err) {
    return res.status(500).json({
      message: err.message,
    });
  }

  const newHabits = {
    ...req.body,
    user_id: data.user.id,
  };

  const { data: createdHabit, error } = await supabase
    .from("habits")
    .insert(newHabits)
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  return res.status(200).json({
    message: "success",
    returnedHabit: createdHabit,
  });
});

// delete habit
// delets one habit
// used in home page

app.delete("/supabase/delete_habit", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access token required",
    });
  }

  const accessToken = authHeader.slice("Bearer ".length);
  const supabase = createUserSupabaseClient(accessToken);

  const { habitId } = req.body;

  const { error } = await supabase.from("habits").delete().eq("id", habitId);

  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  res.status(200).json({
    message: "success",
  });
});

//updates one habit
//updates one habit in calendar when user taps a date

app.patch("/supabase/update_habit", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access Token Required",
    });
  }

  const accessToken = authHeader.slice("Bearer ".length);
  const supabase = createUserSupabaseClient(accessToken);

  const { logs: newlog, habitId } = req.body;

  if (
    !Number.isInteger(habitId) ||
    typeof newlog !== "object" ||
    newlog === null
  ) {
    return res.status(400).json({
      message: "Valid habitId and logs are required",
    });
  }

  const { error } = await supabase
    .from("habits")
    .update({ logs: newlog })
    .eq("id", habitId);

  if (error) {
    return res.status(500).json({
      message: "Failed to update habit. Error code: " + error.message,
    });
  }

  res.status(200).json({
    message: "success",
  });
});

//retreive one single habit data
// used for notification section

app.get("/supabase/get_single_habit_data/:habitId", async (req, res) => {
  const authHeader = req.headers.authorization;
  const habitId = Number(req.params.habitId);

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access Token required",
    });
  }

  if (!Number.isInteger(habitId)) {
    return res.status(400).json({
      message: "Invalid habit ID",
    });
  }

  const accessToken = authHeader.slice("Bearer ".length);
  const supabase = createUserSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("id", habitId)
    .single();

  if (error) {
    return res.status(500).json({
      message: "Cannot retrieve data:" + error.message,
    });
  }

  return res.status(200).json({
    message: "success",
    habit: data,
  });
});

//Delete account
app.delete("/supabase/account_delete", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access token is required",
    });
  }

  const accessToken = authHeader.slice("Bearer ".length);
  const supabase = createUserSupabaseClient(accessToken);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return res.status(401).json({
      message: "Invalid or expired access token",
    });
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id,
  );

  if (deleteError) {
    console.error("Unable to delete account:", deleteError);

    return res.status(500).json({
      message: "Unable to delete account",
    });
  }

  return res.status(204).send();
});

app.listen(PORT, () => {
  console.log("Server Running on port:", { PORT });
});
