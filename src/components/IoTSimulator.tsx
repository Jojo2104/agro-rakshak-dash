import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const IoTSimulator = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const runSimulation = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("iot-simulator");

      if (error) throw error;
      
      console.log("Simulator response:", data);
    } catch (error) {
      console.error("Simulator error:", error);
      toast.error("Failed to run simulation");
    }
  };

  const startSimulation = () => {
    runSimulation(); // Run immediately
    const id = window.setInterval(() => {
      runSimulation();
    }, 5000); // Run every 5 seconds
    
    setIntervalId(id);
    setIsRunning(true);
    toast.success("IoT simulation started");
  };

  const stopSimulation = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsRunning(false);
    toast.info("IoT simulation stopped");
  };

  return (
    <Card className="p-6 border-border/50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-foreground mb-2">IoT Data Simulator</h3>
          <p className="text-sm text-muted-foreground">
            {isRunning ? "Generating sensor data every 5 seconds" : "Start the simulator to generate real-time data"}
          </p>
        </div>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={startSimulation} size="lg" className="gap-2">
              <Play className="w-4 h-4" />
              Start
            </Button>
          ) : (
            <>
              <Button onClick={stopSimulation} variant="outline" size="lg" className="gap-2">
                <Pause className="w-4 h-4" />
                Stop
              </Button>
              <Button onClick={runSimulation} variant="outline" size="lg" className="gap-2">
                <RotateCw className="w-4 h-4" />
                Run Once
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
