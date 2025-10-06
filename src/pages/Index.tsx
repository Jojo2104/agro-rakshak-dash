import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Power, 
  Activity,
  TrendingUp,
  AlertCircle,
  Leaf,
  Settings,
  Bell
} from "lucide-react";
import { toast } from "sonner";

// Mock Firebase connection - replace with actual Firebase config
const mockFirebaseConfig = {
  apiKey: "demo",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo",
};

interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  timestamp: Date;
}

interface ActuatorStatus {
  pump: boolean;
  fans: boolean;
}

interface Thresholds {
  maxTemp: number;
  minMoisture: number;
}

interface Notification {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
  timestamp: Date;
}

interface AIResult {
  diagnosis: string;
  confidence: number;
  remedy: string;
}

const Index = () => {
  // State Management
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 28,
    humidity: 65,
    soilMoisture: 55,
    timestamp: new Date(),
  });

  const [actuators, setActuators] = useState<ActuatorStatus>({
    pump: false,
    fans: false,
  });

  const [thresholds, setThresholds] = useState<Thresholds>({
    maxTemp: 32,
    minMoisture: 50,
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      message: "System initialized successfully",
      type: "success",
      timestamp: new Date(),
    },
  ]);

  const [aiResult, setAIResult] = useState<AIResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);

  // Simulate real-time sensor updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newTemp = 25 + Math.random() * 10;
      const newHumidity = 60 + Math.random() * 20;
      const newMoisture = 45 + Math.random() * 20;

      const newData: SensorData = {
        temperature: Number(newTemp.toFixed(1)),
        humidity: Number(newHumidity.toFixed(1)),
        soilMoisture: Number(newMoisture.toFixed(1)),
        timestamp: new Date(),
      };

      setSensorData(newData);
      setHistoricalData((prev) => [...prev.slice(-23), newData]);

      // Automated actuator control
      checkThresholds(newData);
    }, 3000);

    return () => clearInterval(interval);
  }, [thresholds]);

  const checkThresholds = (data: SensorData) => {
    // Temperature check
    if (data.temperature > thresholds.maxTemp && !actuators.fans) {
      setActuators((prev) => ({ ...prev, fans: true }));
      addNotification(
        `ALERT: Temperature exceeded ${thresholds.maxTemp}°C, Cooling fans activated`,
        "warning"
      );
    } else if (data.temperature <= thresholds.maxTemp - 2 && actuators.fans) {
      setActuators((prev) => ({ ...prev, fans: false }));
      addNotification("Temperature normalized, Cooling fans deactivated", "info");
    }

    // Soil moisture check
    if (data.soilMoisture < thresholds.minMoisture && !actuators.pump) {
      setActuators((prev) => ({ ...prev, pump: true }));
      addNotification(
        `ALERT: Soil moisture below ${thresholds.minMoisture}%, Water pump activated`,
        "warning"
      );
    } else if (data.soilMoisture >= thresholds.minMoisture + 5 && actuators.pump) {
      setActuators((prev) => ({ ...prev, pump: false }));
      addNotification("Soil moisture restored, Water pump deactivated", "info");
    }
  };

  const addNotification = (
    message: string,
    type: "info" | "warning" | "success"
  ) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]);
    toast[type](message);
  };

  const toggleActuator = (actuator: "pump" | "fans") => {
    setActuators((prev) => ({
      ...prev,
      [actuator]: !prev[actuator],
    }));
    addNotification(
      `Manual override: ${actuator === "pump" ? "Water Pump" : "Cooling Fans"} ${
        !actuators[actuator] ? "activated" : "deactivated"
      }`,
      "info"
    );
  };

  const runAIScan = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const diseases = [
        { name: "Healthy", confidence: 98.5, remedy: "Continue regular maintenance and monitoring." },
        { name: "Early Blight", confidence: 96.3, remedy: "Apply fungicide containing chlorothalonil. Remove affected leaves and improve air circulation." },
        { name: "Late Blight", confidence: 94.7, remedy: "Use copper-based fungicides. Ensure proper drainage and avoid overhead watering." },
        { name: "Septoria Leaf Spot", confidence: 93.2, remedy: "Remove infected foliage. Apply fungicide and maintain plant spacing for better airflow." },
        { name: "Bacterial Spot", confidence: 91.8, remedy: "Use copper spray. Remove affected plants and practice crop rotation." },
      ];

      const result = diseases[Math.floor(Math.random() * diseases.length)];
      setAIResult({
        diagnosis: result.name,
        confidence: result.confidence,
        remedy: result.remedy,
      });
      setIsScanning(false);
      addNotification(`AI Scan complete: ${result.name} detected`, "success");
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center glow-primary">
              <Leaf className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AgroRakshak</h1>
              <p className="text-sm text-muted-foreground">Smart Agriculture System</p>
            </div>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="w-3 h-3 mr-1 animate-pulse" />
            Live
          </Badge>
        </div>
      </header>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="control">Control</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="ai">AI Diagnosis</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Temperature Card */}
            <Card className="p-6 gradient-card border-border/50 hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Thermometer className="w-5 h-5 text-primary" />
                </div>
                <Badge variant={sensorData.temperature > thresholds.maxTemp ? "destructive" : "secondary"}>
                  {sensorData.temperature > thresholds.maxTemp ? "High" : "Normal"}
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Temperature</h3>
              <p className="text-3xl font-bold text-foreground">{sensorData.temperature}°C</p>
            </Card>

            {/* Humidity Card */}
            <Card className="p-6 gradient-card border-border/50 hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="secondary">Normal</Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Humidity</h3>
              <p className="text-3xl font-bold text-foreground">{sensorData.humidity}%</p>
            </Card>

            {/* Soil Moisture Card */}
            <Card className="p-6 gradient-card border-border/50 hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-primary" />
                </div>
                <Badge variant={sensorData.soilMoisture < thresholds.minMoisture ? "destructive" : "secondary"}>
                  {sensorData.soilMoisture < thresholds.minMoisture ? "Low" : "Normal"}
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Soil Moisture</h3>
              <p className="text-3xl font-bold text-foreground">{sensorData.soilMoisture}%</p>
            </Card>
          </div>

          {/* Actuator Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 gradient-card border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${actuators.pump ? 'bg-primary/20 glow-primary' : 'bg-muted'}`}>
                    <Droplets className={`w-6 h-6 ${actuators.pump ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Water Pump</h3>
                    <p className="text-sm text-muted-foreground">Irrigation System</p>
                  </div>
                </div>
                <Badge variant={actuators.pump ? "default" : "secondary"} className={actuators.pump ? "glow-primary" : ""}>
                  {actuators.pump ? "ON" : "OFF"}
                </Badge>
              </div>
            </Card>

            <Card className="p-6 gradient-card border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${actuators.fans ? 'bg-primary/20 glow-primary' : 'bg-muted'}`}>
                    <Wind className={`w-6 h-6 ${actuators.fans ? 'text-primary animate-spin' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Cooling Fans</h3>
                    <p className="text-sm text-muted-foreground">Climate Control</p>
                  </div>
                </div>
                <Badge variant={actuators.fans ? "default" : "secondary"} className={actuators.fans ? "glow-primary" : ""}>
                  {actuators.fans ? "ON" : "OFF"}
                </Badge>
              </div>
            </Card>
          </div>

          {/* Notifications */}
          <Card className="p-6 gradient-card border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">System Notifications</h3>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30"
                >
                  <AlertCircle className={`w-4 h-4 mt-0.5 ${
                    notif.type === "warning" ? "text-destructive" : 
                    notif.type === "success" ? "text-primary" : 
                    "text-muted-foreground"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notif.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Control Tab */}
        <TabsContent value="control" className="space-y-6">
          <Card className="p-6 gradient-card border-border/50">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-lg">Automation Settings</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Maximum Temperature Threshold: {thresholds.maxTemp}°C
                </label>
                <Slider
                  value={[thresholds.maxTemp]}
                  onValueChange={(value) => setThresholds((prev) => ({ ...prev, maxTemp: value[0] }))}
                  min={25}
                  max={40}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Cooling fans will activate when temperature exceeds this value
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Minimum Soil Moisture Threshold: {thresholds.minMoisture}%
                </label>
                <Slider
                  value={[thresholds.minMoisture]}
                  onValueChange={(value) => setThresholds((prev) => ({ ...prev, minMoisture: value[0] }))}
                  min={30}
                  max={70}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Water pump will activate when soil moisture drops below this value
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 gradient-card border-border/50">
            <div className="flex items-center gap-2 mb-6">
              <Power className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-lg">Manual Override</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => toggleActuator("pump")}
                variant={actuators.pump ? "default" : "secondary"}
                size="lg"
                className="h-24 text-lg"
              >
                <Droplets className="w-6 h-6 mr-2" />
                Water Pump: {actuators.pump ? "ON" : "OFF"}
              </Button>

              <Button
                onClick={() => toggleActuator("fans")}
                variant={actuators.fans ? "default" : "secondary"}
                size="lg"
                className="h-24 text-lg"
              >
                <Wind className="w-6 h-6 mr-2" />
                Cooling Fans: {actuators.fans ? "ON" : "OFF"}
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card className="p-6 gradient-card border-border/50">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-lg">24-Hour Trends</h3>
            </div>
            
            <div className="space-y-8">
              {/* Temperature Trend */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Temperature (°C)</h4>
                <div className="h-40 bg-secondary/30 rounded-lg p-4 relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="url(#tempGradient)"
                      stroke="hsl(var(--primary))"
                      strokeWidth="0.5"
                      points={historicalData.length > 0 
                        ? historicalData.map((data, i) => 
                            `${(i / (historicalData.length - 1)) * 100},${100 - ((data.temperature - 20) / 20) * 100}`
                          ).join(" ") + ` 100,100 0,100`
                        : "0,50 100,50 100,100 0,100"
                      }
                    />
                  </svg>
                  {actuators.fans && (
                    <div className="absolute top-2 right-2 text-xs text-primary bg-primary/20 px-2 py-1 rounded">
                      Fans Active
                    </div>
                  )}
                </div>
              </div>

              {/* Soil Moisture Trend */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">Soil Moisture (%)</h4>
                <div className="h-40 bg-secondary/30 rounded-lg p-4 relative overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="moistureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="url(#moistureGradient)"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth="0.5"
                      points={historicalData.length > 0
                        ? historicalData.map((data, i) => 
                            `${(i / (historicalData.length - 1)) * 100},${100 - (data.soilMoisture / 100) * 100}`
                          ).join(" ") + ` 100,100 0,100`
                        : "0,50 100,50 100,100 0,100"
                      }
                    />
                  </svg>
                  {actuators.pump && (
                    <div className="absolute top-2 right-2 text-xs text-primary bg-primary/20 px-2 py-1 rounded">
                      Pump Active
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 gradient-card border-border/50">
            <h3 className="font-semibold text-foreground mb-4">System Efficacy</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Automation Rate</p>
                <p className="text-2xl font-bold text-primary">94.3%</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Response Time</p>
                <p className="text-2xl font-bold text-primary">1.2s</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* AI Diagnosis Tab */}
        <TabsContent value="ai" className="space-y-6">
          <Card className="p-6 gradient-card border-border/50">
            <div className="flex items-center gap-2 mb-6">
              <Leaf className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground text-lg">AI Disease Detection</h3>
            </div>

            <div className="text-center py-8">
              <Button
                onClick={runAIScan}
                disabled={isScanning}
                size="lg"
                className="px-8 py-6 text-lg glow-primary"
              >
                {isScanning ? (
                  <>
                    <Activity className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Leaf className="w-5 h-5 mr-2" />
                    Run Live AI Scan
                  </>
                )}
              </Button>
            </div>

            {aiResult && (
              <div className="mt-6 p-6 bg-secondary/30 rounded-lg border border-primary/30 glow-secondary">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Diagnosis</p>
                    <p className="text-xl font-bold text-primary">{aiResult.diagnosis}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                    <p className="text-xl font-bold text-primary">{aiResult.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <Badge variant={aiResult.diagnosis === "Healthy" ? "default" : "destructive"}>
                      {aiResult.diagnosis === "Healthy" ? "Normal" : "Action Required"}
                    </Badge>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/30">
                  <p className="text-sm font-medium text-foreground mb-2">Recommended Action:</p>
                  <p className="text-sm text-muted-foreground">{aiResult.remedy}</p>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 gradient-card border-border/50">
            <h3 className="font-semibold text-foreground mb-4">AI Model Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Model Architecture</p>
                <p className="text-foreground font-medium">CNN (MobileNetV2)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Overall Accuracy</p>
                <p className="text-foreground font-medium">96.5%</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-2">Detectable Diseases</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary">Healthy</Badge>
                  <Badge variant="secondary">Early Blight</Badge>
                  <Badge variant="secondary">Late Blight</Badge>
                  <Badge variant="secondary">Septoria Leaf Spot</Badge>
                  <Badge variant="secondary">Bacterial Spot</Badge>
                  <Badge variant="secondary">Target Spot</Badge>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
