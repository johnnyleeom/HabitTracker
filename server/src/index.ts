import "dotenv/config";
import express from "express";
import createUserSupabaseClient from "./utils/supabase.js";

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log("Server Running on port:", { PORT });
});

// get habits
app.get("/supabase/get_habits", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access to token required",
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

//update habits
app.post("/supabase/add_habit", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access to token required",
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

  const { error } = await supabase.from("habits").insert(newHabits);

  if (error) {
    return res.status(500).json({
      message: error.message,
    });
  }

  res.status(200).json({
    message: "success",
  });
});

// delete habit
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
