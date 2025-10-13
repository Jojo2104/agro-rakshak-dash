import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Power, 
  Activity,
  TrendingUp,
  Settings,
  Leaf,
  Bell,
  Menu,
  BarChart
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { IoTSimulator } from "@/components/IoTSimulator";

interface SensorData {
  id: string;
  temperature: number;
  humidity: number;
  soil_moisture: number;
  created_at: string;
}

interface ActuatorStatus {
  id: string;
  pump_active: boolean;
  fans_active: boolean;
  updated_at: string;
}

interface Thresholds {
  id: string;
  max_temperature: number;
  min_soil_moisture: number;
  updated_at: string;
}

interface Notification {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
  created_at: string;
}

interface AIResult {
  diagnosis: string;
  confidence: number;
  remedy: string;
}

const Index = () => {
  const [latestSensorData, setLatestSensorData] = useState<SensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<SensorData[]>([]);
  const [actuators, setActuators] = useState<ActuatorStatus | null>(null);
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [aiResult, setAIResult] = useState<AIResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchLatestSensorData();
    fetchHistoricalData();
    fetchActuatorStatus();
    fetchThresholds();
    fetchNotifications();
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    const sensorChannel = supabase
      .channel('sensor-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings'
        },
        (payload) => {
          setLatestSensorData(payload.new as SensorData);
          setHistoricalData(prev => [...prev.slice(-23), payload.new as SensorData]);
        }
      )
      .subscribe();

    const actuatorChannel = supabase
      .channel('actuator-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'actuator_status'
        },
        (payload) => {
          setActuators(payload.new as ActuatorStatus);
        }
      )
      .subscribe();

    const thresholdChannel = supabase
      .channel('threshold-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_thresholds'
        },
        (payload) => {
          setThresholds(payload.new as Thresholds);
        }
      )
      .subscribe();

    const notificationChannel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
          toast[newNotif.type](newNotif.message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sensorChannel);
      supabase.removeChannel(actuatorChannel);
      supabase.removeChannel(thresholdChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, []);

  const fetchLatestSensorData = async () => {
    const { data } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) setLatestSensorData(data);
  };

  const fetchHistoricalData = async () => {
    const { data } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(24);
    
    if (data) setHistoricalData(data.reverse());
  };

  const fetchActuatorStatus = async () => {
    const { data } = await supabase
      .from('actuator_status')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (data) setActuators(data);
  };

  const fetchThresholds = async () => {
    const { data } = await supabase
      .from('system_thresholds')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    if (data) setThresholds(data);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setNotifications(data as Notification[]);
  };

  const updateThreshold = async (field: 'max_temperature' | 'min_soil_moisture', value: number) => {
    if (!thresholds) return;

    const { error } = await supabase
      .from('system_thresholds')
      .update({ [field]: value })
      .eq('id', thresholds.id);

    if (error) {
      toast.error('Failed to update threshold');
    } else {
      toast.success('Threshold updated');
    }
  };

  const toggleActuator = async (field: 'pump_active' | 'fans_active') => {
    if (!actuators) return;

    const newValue = !actuators[field];
    const { error } = await supabase
      .from('actuator_status')
      .update({ [field]: newValue })
      .eq('id', actuators.id);

    if (error) {
      toast.error('Failed to update actuator');
    } else {
      const actuatorName = field === 'pump_active' ? 'Water Pump' : 'Cooling Fans';
      await supabase.from('notifications').insert({
        message: `Manual override: ${actuatorName} ${newValue ? 'activated' : 'deactivated'}`,
        type: 'info'
      });
    }
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
      
      supabase.from('notifications').insert({
        message: `AI Scan complete: ${result.name} detected`,
        type: 'success'
      });
    }, 2500);
  };

  // Show UI even if no sensor data yet - user needs to start simulator
  const displayTemp = latestSensorData?.temperature ?? 0;
  const displayHumidity = latestSensorData?.humidity ?? 0;
  const displaySoilMoisture = latestSensorData?.soil_moisture ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold text-foreground">AgroRakshak</h1>
                <p className="text-muted-foreground mt-1">Smart Agriculture System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-4 py-2 border-primary/30 hidden md:flex">
                <Activity className="w-3 h-3 mr-2 text-primary" />
                Live
              </Badge>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-2 mt-6">
                    <Button variant="ghost" className="justify-start" onClick={() => {
                      const element = document.querySelector('[value="dashboard"]');
                      element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }}>
                      <Activity className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => {
                      const element = document.querySelector('[value="control"]');
                      element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }}>
                      <Settings className="mr-2 h-4 w-4" />
                      Control
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => {
                      const element = document.querySelector('[value="analytics"]');
                      element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }}>
                      <BarChart className="mr-2 h-4 w-4" />
                      Analytics
                    </Button>
                    <Button variant="ghost" className="justify-start" onClick={() => {
                      const element = document.querySelector('[value="ai"]');
                      element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                    }}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      AI Diagnosis
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>

        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="w-full max-w-2xl bg-muted">
            <TabsTrigger value="dashboard" className="flex-1">Dashboard</TabsTrigger>
            <TabsTrigger value="control" className="flex-1">Control</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">AI Diagnosis</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* IoT Simulator */}
            <IoTSimulator />

            {/* Sensor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 border-border/50">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Thermometer className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant={displayTemp > (thresholds?.max_temperature ?? 32) ? "destructive" : "secondary"}>
                    {displayTemp > (thresholds?.max_temperature ?? 32) ? "High" : "Normal"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Temperature</p>
                  <p className="text-4xl font-semibold text-foreground">{displayTemp.toFixed(1)}°C</p>
                </div>
              </Card>

              <Card className="p-6 border-border/50">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant="secondary">Normal</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Humidity</p>
                  <p className="text-4xl font-semibold text-foreground">{displayHumidity.toFixed(1)}%</p>
                </div>
              </Card>

              <Card className="p-6 border-border/50">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant={displaySoilMoisture < (thresholds?.min_soil_moisture ?? 50) ? "destructive" : "secondary"}>
                    {displaySoilMoisture < (thresholds?.min_soil_moisture ?? 50) ? "Low" : "Normal"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Soil Moisture</p>
                  <p className="text-4xl font-semibold text-foreground">{displaySoilMoisture.toFixed(1)}%</p>
                </div>
              </Card>
            </div>

            {/* Actuator Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-colors ${
                      actuators?.pump_active ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Droplets className={`w-7 h-7 ${
                        actuators?.pump_active ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">Water Pump</h3>
                      <p className="text-sm text-muted-foreground">Irrigation System</p>
                    </div>
                  </div>
                  <Badge variant={actuators?.pump_active ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {actuators?.pump_active ? "ON" : "OFF"}
                  </Badge>
                </div>
              </Card>

              <Card className="p-6 border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-colors ${
                      actuators?.fans_active ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      <Wind className={`w-7 h-7 ${
                        actuators?.fans_active ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">Cooling Fans</h3>
                      <p className="text-sm text-muted-foreground">Climate Control</p>
                    </div>
                  </div>
                  <Badge variant={actuators?.fans_active ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {actuators?.fans_active ? "ON" : "OFF"}
                  </Badge>
                </div>
              </Card>
            </div>

            {/* Notifications */}
            <Card className="p-6 border-border/50">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">System Notifications</h3>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 border border-border/30"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notif.type === "warning" ? "bg-destructive" : 
                        notif.type === "success" ? "bg-primary" : 
                        "bg-muted-foreground"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{notif.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(notif.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Control Tab */}
          <TabsContent value="control" className="space-y-8">
            <Card className="p-6 border-border/50">
              <div className="flex items-center gap-3 mb-8">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">Automation Settings</h3>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="text-sm font-medium text-foreground mb-4 block">
                    Maximum Temperature Threshold: {thresholds?.max_temperature ?? 32}°C
                  </label>
                  <Slider
                    value={[Number(thresholds?.max_temperature ?? 32)]}
                    onValueChange={(value) => updateThreshold('max_temperature', value[0])}
                    min={25}
                    max={40}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    Cooling fans will activate when temperature exceeds this value
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-4 block">
                    Minimum Soil Moisture Threshold: {thresholds?.min_soil_moisture ?? 50}%
                  </label>
                  <Slider
                    value={[Number(thresholds?.min_soil_moisture ?? 50)]}
                    onValueChange={(value) => updateThreshold('min_soil_moisture', value[0])}
                    min={30}
                    max={70}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    Water pump will activate when soil moisture drops below this value
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50">
              <div className="flex items-center gap-3 mb-8">
                <Power className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">Manual Override</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => toggleActuator("pump_active")}
                  variant={actuators?.pump_active ? "default" : "outline"}
                  size="lg"
                  className="h-28 flex-col gap-3"
                >
                  <Droplets className="w-7 h-7" />
                  <span className="text-base">Water Pump: {actuators?.pump_active ? "ON" : "OFF"}</span>
                </Button>

                <Button
                  onClick={() => toggleActuator("fans_active")}
                  variant={actuators?.fans_active ? "default" : "outline"}
                  size="lg"
                  className="h-28 flex-col gap-3"
                >
                  <Wind className="w-7 h-7" />
                  <span className="text-base">Cooling Fans: {actuators?.fans_active ? "ON" : "OFF"}</span>
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8">
            <Card className="p-6 border-border/50">
              <div className="flex items-center gap-3 mb-8">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">24-Hour Trends</h3>
              </div>
              
              <div className="space-y-10">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-4">Temperature (°C)</h4>
                  <div className="h-48 bg-muted/30 rounded-lg p-6 relative">
                    {historicalData.length > 1 ? (
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polyline
                          fill="url(#tempGradient)"
                          stroke="hsl(var(--primary))"
                          strokeWidth="0.5"
                          points={historicalData
                            .map((data, i) => {
                              const x = (i / (historicalData.length - 1)) * 100;
                              const y = 100 - ((Number(data.temperature) - 20) / 20) * 100;
                              return `${x},${y}`;
                            })
                            .join(" ") + ` 100,100 0,100`}
                        />
                      </svg>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-12">Collecting data...</p>
                    )}
                    {actuators?.fans_active && (
                      <div className="absolute top-4 right-4 text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Fans Active
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-4">Soil Moisture (%)</h4>
                  <div className="h-48 bg-muted/30 rounded-lg p-6 relative">
                    {historicalData.length > 1 ? (
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="moistureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polyline
                          fill="url(#moistureGradient)"
                          stroke="hsl(var(--chart-2))"
                          strokeWidth="0.5"
                          points={historicalData
                            .map((data, i) => {
                              const x = (i / (historicalData.length - 1)) * 100;
                              const y = 100 - (Number(data.soil_moisture) / 100) * 100;
                              return `${x},${y}`;
                            })
                            .join(" ") + ` 100,100 0,100`}
                        />
                      </svg>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-12">Collecting data...</p>
                    )}
                    {actuators?.pump_active && (
                      <div className="absolute top-4 right-4 text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Pump Active
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* AI Diagnosis Tab */}
          <TabsContent value="ai" className="space-y-8">
            <Card className="p-6 border-border/50">
              <div className="flex items-center gap-3 mb-8">
                <Leaf className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">AI Disease Detection</h3>
              </div>

              <div className="text-center py-10">
                <Button
                  onClick={runAIScan}
                  disabled={isScanning}
                  size="lg"
                  className="px-10 py-6 text-base"
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
                <div className="mt-8 p-6 bg-muted/30 rounded-lg border border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Diagnosis</p>
                      <p className="text-xl font-semibold text-primary">{aiResult.diagnosis}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Confidence</p>
                      <p className="text-xl font-semibold text-primary">{aiResult.confidence}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Status</p>
                      <Badge variant={aiResult.diagnosis === "Healthy" ? "default" : "destructive"}>
                        {aiResult.diagnosis === "Healthy" ? "Normal" : "Action Required"}
                      </Badge>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-border">
                    <p className="text-sm font-medium text-foreground mb-3">Recommended Action:</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{aiResult.remedy}</p>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 border-border/50">
              <h3 className="font-semibold text-lg text-foreground mb-6">AI Model Information</h3>
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
                  <p className="text-sm text-muted-foreground mb-3">Detectable Diseases</p>
                  <div className="flex flex-wrap gap-2">
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
    </div>
  );
};

export default Index;
