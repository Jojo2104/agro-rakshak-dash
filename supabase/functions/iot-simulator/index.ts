import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch current thresholds
    const { data: thresholds } = await supabase
      .from("system_thresholds")
      .select("*")
      .limit(1)
      .single();

    if (!thresholds) {
      throw new Error("No thresholds found");
    }

    // Fetch current actuator status
    const { data: currentStatus } = await supabase
      .from("actuator_status")
      .select("*")
      .limit(1)
      .single();

    if (!currentStatus) {
      throw new Error("No actuator status found");
    }

    // Generate realistic sensor data
    const baseTemp = 28;
    const baseHumidity = 65;
    const baseMoisture = 55;

    const temperature = Number(
      (baseTemp + (Math.random() * 8 - 4)).toFixed(1)
    );
    const humidity = Number(
      (baseHumidity + (Math.random() * 15 - 7.5)).toFixed(1)
    );
    let soilMoisture = Number(
      (baseMoisture + (Math.random() * 15 - 7.5)).toFixed(1)
    );

    // Adjust soil moisture if pump is active
    if (currentStatus.pump_active) {
      soilMoisture = Math.min(soilMoisture + 5, 100);
    }

    // Adjust temperature if fans are active
    let adjustedTemp = temperature;
    if (currentStatus.fans_active) {
      adjustedTemp = Math.max(temperature - 2, 20);
    }

    // Insert sensor reading
    const { error: sensorError } = await supabase
      .from("sensor_readings")
      .insert({
        temperature: adjustedTemp,
        humidity,
        soil_moisture: soilMoisture,
      });

    if (sensorError) throw sensorError;

    // Check thresholds and update actuators
    let pumpActive = currentStatus.pump_active;
    let fansActive = currentStatus.fans_active;
    const notifications = [];

    // Temperature check
    if (adjustedTemp > thresholds.max_temperature && !fansActive) {
      fansActive = true;
      notifications.push({
        message: `ALERT: Temperature exceeded ${thresholds.max_temperature}°C, Cooling fans activated`,
        type: "warning",
      });
    } else if (adjustedTemp <= thresholds.max_temperature - 2 && fansActive) {
      fansActive = false;
      notifications.push({
        message: "Temperature normalized, Cooling fans deactivated",
        type: "info",
      });
    }

    // Soil moisture check
    if (soilMoisture < thresholds.min_soil_moisture && !pumpActive) {
      pumpActive = true;
      notifications.push({
        message: `ALERT: Soil moisture below ${thresholds.min_soil_moisture}%, Water pump activated`,
        type: "warning",
      });
    } else if (soilMoisture >= thresholds.min_soil_moisture + 5 && pumpActive) {
      pumpActive = false;
      notifications.push({
        message: "Soil moisture restored, Water pump deactivated",
        type: "info",
      });
    }

    // Update actuator status if changed
    if (pumpActive !== currentStatus.pump_active || fansActive !== currentStatus.fans_active) {
      const { error: actuatorError } = await supabase
        .from("actuator_status")
        .update({
          pump_active: pumpActive,
          fans_active: fansActive,
        })
        .eq("id", currentStatus.id);

      if (actuatorError) throw actuatorError;
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifError) throw notifError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          temperature: adjustedTemp,
          humidity,
          soil_moisture: soilMoisture,
          pump_active: pumpActive,
          fans_active: fansActive,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("IoT Simulator error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
