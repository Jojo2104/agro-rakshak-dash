          {/* Live Sensors Tab */}
          <TabsContent value="sensors" className="space-y-8">
            <Card className="p-6 border-border/50 bg-gradient-to-br from-green-500/5 to-green-500/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-xl text-foreground mb-2">
                    ESP32 Hardware Sensors
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time data from your physical ESP32 device via Firebase
                  </p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Hardware
                </Badge>
              </div>
            </Card>

            <LiveSensorData />

            <Card className="p-6 border-border/50 bg-muted/20">
              <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary" />
                Setup Instructions
              </h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">1</span>
                  <span>Connect your ESP32 device to your laptop via USB</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">2</span>
                  <span>Run the bridge script: <code className="bg-muted px-2 py-1 rounded">python agrorakshak_bridge.py</code></span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">3</span>
                  <span>Data will automatically flow: ESP32 → Laptop → Firebase → This Dashboard</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">4</span>
                  <span>Monitor live sensor readings updated every ~5 seconds</span>
                </li>
              </ol>
            </Card>
          </TabsContent>
          import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Brain, Info } from "lucide-react";
import LiveSensorData from '@/components/LiveSensorData';
import AgroChatbot from '@/components/AgroChatbot'; // Adjust path as needed
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
import { getDatabase, ref, onValue, set } from "firebase/database";
import { app } from "@/lib/firebase";

interface FirebaseSensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  timestamp: number;
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

const Index = () => {
  const navigate = useNavigate();
  const [firebaseSensorData, setFirebaseSensorData] = useState<FirebaseSensorData | null>(null);
  const [historicalData, setHistoricalData] = useState<FirebaseSensorData[]>([]);
  const [actuators, setActuators] = useState<ActuatorStatus | null>(null);
  const [thresholds, setThresholds] = useState<Thresholds | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Toggle states for each component
  const [toggleStates, setToggleStates] = useState({
    temperature: true,
    humidity: true,
    soilMoisture: true,
    waterPump: true,
    coolingFans: true,
    notifications: true,
  });

  const toggleComponent = (key: keyof typeof toggleStates) => {
    setToggleStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Firebase real-time listener for sensor data
  useEffect(() => {
    const db = getDatabase(app);
    const sensorRef = ref(db, 'esp32_001');
    
    const unsubscribe = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const newData: FirebaseSensorData = {
          temperature: data.temperature || 0,
          humidity: data.humidity || 0,
          soilMoisture: data.soilMoisture || 0,
          timestamp: data.timestamp || Date.now()
        };
        
        setFirebaseSensorData(newData);
        
        // Add to historical data (keep last 24 readings)
        setHistoricalData(prev => {
          const updated = [...prev, newData];
          return updated.slice(-24);
        });

        // Check thresholds ONLY if we have valid threshold data
        if (thresholds && actuators) {
          checkThresholdsAndNotify(newData);
        }
      }
    });

    return () => unsubscribe();
  }, [thresholds, actuators]);

  // Check thresholds and create notifications based on real sensor data
  const checkThresholdsAndNotify = async (data: FirebaseSensorData) => {
    if (!thresholds) return;

    // Check temperature threshold
    if (data.temperature > thresholds.max_temperature) {
      const message = `High temperature detected: ${data.temperature.toFixed(1)}°C (Threshold: ${thresholds.max_temperature}°C)`;
      await createNotification(message, 'warning');
      
     // // Auto-activate fans if not already active
      if (actuators && !actuators.fans_active) {
        await toggleActuator('fans_active');
      }
    }

    // Check soil moisture threshold
    if (data.soilMoisture < thresholds.min_soil_moisture) {
      const message = `Low soil moisture: ${data.soilMoisture.toFixed(1)}% (Threshold: ${thresholds.min_soil_moisture}%)`;
      await createNotification(message, 'warning');
      
      // Auto-activate pump if not already active
      if (actuators && !actuators.pump_active) {
        await toggleActuator('pump_active');
      }
    }

    // Normal conditions notification (optional, less frequent)
    if (data.temperature <= thresholds.max_temperature && 
        data.soilMoisture >= thresholds.min_soil_moisture) {
      // You can add success notifications here if needed
    }
  };

  // Create notification in Supabase
  const createNotification = async (message: string, type: "info" | "warning" | "success") => {
    // Check if similar notification exists in last minute to avoid spam
    const recentNotif = notifications.find((n: Notification) => 
      n.message === message && 
      Date.now() - new Date(n.created_at).getTime() < 2000
    );
    
    if (recentNotif) return;

    const { data, error } = await supabase
      .from('notifications')
      .insert({ message, type })
      .select()
      .single();

    if (!error && data) {
      setNotifications((prev: Notification[]) => [data as Notification, ...prev.slice(0, 9)]);
      toast[type](message);
    }
  };

  // Fetch initial data
  useEffect(() => {
    fetchActuatorStatus();
    fetchThresholds();
    fetchNotifications();
  }, []);

  // Set up realtime subscriptions for actuators, thresholds, and notifications
  useEffect(() => {
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
      supabase.removeChannel(actuatorChannel);
      supabase.removeChannel(thresholdChannel);
      supabase.removeChannel(notificationChannel);
    };
  }, []);

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

    try {
      // Update Supabase first
      const { error } = await supabase
        .from('system_thresholds')
        .update({ [field]: value })
        .eq('id', thresholds.id);

      if (error) {
        toast.error('Failed to update threshold');
        return;
      }
      
      toast.success(`Threshold updated to ${value}`);
      
    } catch (err) {
      console.error('Threshold update error:', err);
      toast.error('Failed to update threshold');
    }
  };

  const toggleActuator = async (field: 'pump_active' | 'fans_active') => {
    if (!actuators) return;

    const newValue = !actuators[field];
    const actuatorName = field === 'pump_active' ? 'Water Pump' : 'Cooling Fans';
    
    try {
      // SEND COMMAND TO FIREBASE for ESP32 control
      const db = getDatabase(app);
      const controlRef = ref(db, 'esp32_001/controlCommands');
      
      await set(controlRef, {
        pump: field === 'pump_active' ? newValue : actuators.pump_active,
        fan: field === 'fans_active' ? newValue : actuators.fans_active,
        timestamp: Date.now()
      });
      
      // Update Supabase
      const { error } = await supabase
        .from('actuator_status')
        .update({ [field]: newValue })
        .eq('id', actuators.id);

      if (error) {
        console.error('Supabase update error:', error);
      }
      
      // Create notification
      await createNotification(
        `Manual override: ${actuatorName} ${newValue ? 'activated' : 'deactivated'}`,
        'info'
      );
      
      toast.success(`${actuatorName} ${newValue ? 'activated' : 'deactivated'}`);
      
    } catch (firebaseError) {
      console.error('Firebase control error:', firebaseError);
      toast.error('Failed to send command to ESP32');
    }
  };

  // Use Firebase sensor data for display
  const displayTemp = firebaseSensorData?.temperature ?? 0;
  const displayHumidity = firebaseSensorData?.humidity ?? 0;
  const displaySoilMoisture = firebaseSensorData?.soilMoisture ?? 0;

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
              <Button 
                variant="outline" 
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate("/");
                }}
              >
                Sign Out
              </Button>
              <Badge variant="outline" className="px-4 py-2 border-primary/30 hidden md:flex">
                <Activity className="w-3 h-3 mr-2 text-primary animate-pulse" />
                Live Hardware
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
  const element = document.querySelector('[value="agroai"]');
  element?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}}>
  <Brain className="mr-2 h-4 w-4" />
  AgroAI
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
          <TabsList className="w-full max-w-3xl bg-muted">
            <TabsTrigger value="dashboard" className="flex-1">Dashboard</TabsTrigger>
            <TabsTrigger value="control" className="flex-1">Control</TabsTrigger>
            <TabsTrigger value="agroai" className="flex-1">AgroAI</TabsTrigger>            <TabsTrigger value="ai" className="flex-1">AI Diagnosis</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* ESP32 Hardware Sensors Header */}
            <Card className="p-6 border-border/50 bg-gradient-to-br from-green-500/5 to-green-500/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-xl text-foreground mb-2">
                    ESP32 Hardware Sensors
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time data from your physical ESP32 device via Firebase
                  </p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Hardware
                </Badge>
              </div>
            </Card>

            {/* Firebase Live Sensor Component */}
            <LiveSensorData />

            {/* Notifications - Based on Real Sensor Data */}
            <Card className="p-6 border-border/50 hover:card-glow transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg text-foreground">System Notifications</h3>
                  <Badge variant="outline" className="text-xs">Real-time Alerts</Badge>
                </div>
                <Switch checked={toggleStates.notifications} onCheckedChange={() => toggleComponent('notifications')} />
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {firebaseSensorData ? "All systems normal" : "Waiting for sensor data..."}
                  </p>
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

          {/* Live Sensors Tab */}
          <TabsContent value="sensors" className="space-y-8">
            <Card className="p-6 border-border/50 bg-gradient-to-br from-green-500/5 to-green-500/10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-xl text-foreground mb-2">
                    ESP32 Hardware Sensors
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time data from your physical ESP32 device via Firebase
                  </p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  <Activity className="w-3 h-3 mr-1 animate-pulse" />
                  Hardware
                </Badge>
              </div>
            </Card>

            <LiveSensorData />

            <Card className="p-6 border-border/50 bg-muted/20">
              <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary" />
                Setup Instructions
              </h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">1</span>
                  <span>Connect your ESP32 device to your laptop via USB</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">2</span>
                  <span>Run the bridge script: <code className="bg-muted px-2 py-1 rounded">python agrorakshak_bridge.py</code></span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">3</span>
                  <span>Data will automatically flow: ESP32 → Laptop → Firebase → This Dashboard</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">4</span>
                  <span>Monitor live sensor readings updated every ~5 seconds</span>
                </li>
              </ol>
            </Card>
          </TabsContent>

          {/* Control Tab */}
          <TabsContent value="control" className="space-y-8">

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

         {/* AgroAI Tab */}
<TabsContent value="agroai" className="space-y-6">
  <Card className="p-6 border-border/50 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-xl text-foreground mb-2">
          AgroAI Chat Assistant
        </h3>
        <p className="text-sm text-muted-foreground">
          Get expert farming advice - Chat with our AI assistant
        </p>
      </div>
      <Badge variant="default" className="bg-emerald-500">
        <Brain className="w-3 h-3 mr-1" />
        AI Powered
      </Badge>
    </div>
  </Card>

  <AgroChatbot />

  <Card className="p-6 border-border/50 bg-muted/20">
    <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center">
      <Info className="w-5 h-5 mr-2 text-primary" />
      How to Use AgroAI
    </h3>
    <ol className="space-y-3 text-sm text-muted-foreground">
      <li className="flex items-start">
        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">1</span>
        <span>Type your farming or gardening question in the chat</span>
      </li>
      <li className="flex items-start">
        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">2</span>
        <span>Get instant expert advice from our AI assistant</span>
      </li>
      <li className="flex items-start">
        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">3</span>
        <span>Use suggested follow-up questions for deeper insights</span>
      </li>
    </ol>
  </Card>
</TabsContent>

          {/* AI Diagnosis Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card className="p-6 border-border/50 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-xl text-foreground mb-2">
                    AI Plant Disease Detection
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Upload plant images for instant disease classification using YOLOv8
                  </p>
                </div>
                <Badge variant="default" className="bg-green-500">
                  <Activity className="w-3 h-3 mr-1" />
                  Live Model
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
                  <p className="text-2xl font-bold text-primary">8</p>
                  <p className="text-xs text-muted-foreground mt-1">Disease Types</p>
                </div>
                <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
                  <p className="text-2xl font-bold text-primary">80%+</p>
                  <p className="text-xs text-muted-foreground mt-1">Accuracy</p>
                </div>
                <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
                  <p className="text-2xl font-bold text-primary">&lt;5s</p>
                  <p className="text-xs text-muted-foreground mt-1">Response Time</p>
                </div>
                <div className="bg-background/50 backdrop-blur-sm p-4 rounded-lg border border-border/50">
                  <p className="text-2xl font-bold text-primary">YOLOv8</p>
                  <p className="text-xs text-muted-foreground mt-1">Model Version</p>
                </div>
              </div>
            </Card>

            <Card className="p-0 border-border/50 overflow-hidden">
              <div className="relative bg-background" style={{ height: '650px' }}>
                <div className="absolute inset-0 flex items-center justify-center bg-muted/30 z-10" id="yolo-loader">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Loading Detection System...</p>
                  </div>
                </div>

                <iframe 
                  src="https://app2-gamma-three.vercel.app"
                  className="w-full h-full border-0"
                  title="YOLO Disease Detection System"
                  allow="camera; microphone; clipboard-read; clipboard-write; accelerometer; gyroscope"
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
                  onLoad={() => {
                    const loader = document.getElementById('yolo-loader');
                    if (loader) loader.style.display = 'none';
                  }}
                />
              </div>
            </Card>

            <Card className="p-6 border-border/50">
              <h3 className="font-semibold text-lg text-foreground mb-6 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-primary" />
                Model Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Architecture</p>
                  <p className="text-foreground font-medium">YOLOv8 Small (Ultralytics)</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Framework</p>
                  <p className="text-foreground font-medium">Ultralytics + PyTorch 2.0.1</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Training Dataset</p>
                  <p className="text-foreground font-medium">Custom Plant Disease Dataset</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Validation Accuracy</p>
                  <p className="text-foreground font-medium">80% mAP@0.5</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-3">Detectable Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                      ✓ Healthy
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                      Early Blight
                    </Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/20">
                      Late Blight
                    </Badge>
                    <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500/20">
                      Leaf Miner
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      Magnesium Deficiency
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      Nitrogen Deficiency
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                      Potassium Deficiency
                    </Badge>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-700 border-purple-500/20">
                      Spotted Wilt Virus
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-muted/20">
              <h3 className="font-semibold text-lg text-foreground mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary" />
                How to Use
              </h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">1</span>
                  <span>Click the upload area or drag and drop a plant leaf image</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">2</span>
                  <span>Wait for the AI model to process the image (typically 1-2 seconds)</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">3</span>
                  <span>Review the detection results showing disease classification and confidence scores</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-xs font-bold">4</span>
                  <span>Follow the recommended treatment actions based on the diagnosis</span>
                </li>
              </ol>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;