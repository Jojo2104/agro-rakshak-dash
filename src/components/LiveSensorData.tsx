import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, Droplets, Sprout, Activity, Wind, Droplet } from 'lucide-react';

// Firebase configuration - MATCHES your serial_to_firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyB0bGAI398tSHiplyNVlfs-PbvS3blVWE",
  authDomain: "agrorakshak-project.firebaseapp.com",
  databaseURL: "https://agrorakshak-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agrorakshak-project",
  storageBucket: "agrorakshak-project.firebasestorage.app",
  messagingSenderId: "1051851958973",
  appId: "1:1051851958973:web:c96dcf3c142485078625d4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig, 'agrorakshak-sensors');
const database = getDatabase(app);

interface SensorData {
  temperature?: number;
  humidity?: number;
  soilMoisture?: number;
  fan_active?: boolean;
  pump_active?: boolean;
  location?: string;
  computer_timestamp?: number;
  session_id?: string;
}

export default function LiveSensorData() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const sensorRef = ref(database, 'esp32_001');
    
    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSensorData(data);
          setIsConnected(true);
          setLastUpdate(new Date());
        }
      },
      (error) => {
        console.error('Firebase error:', error);
        setIsConnected(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const isDataStale = lastUpdate && (Date.now() - lastUpdate.getTime()) > 30000;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between bg-card p-4 rounded-lg border">
        <div>
          <h3 className="text-xl font-semibold">Live Sensor Readings</h3>
          <p className="text-sm text-muted-foreground">
            {sensorData?.location || 'Dual Board Garden'}
          </p>
        </div>
        <Badge variant={isConnected && !isDataStale ? "default" : "secondary"}>
          <Activity className={`w-3 h-3 mr-1 ${isConnected && !isDataStale ? 'animate-pulse' : ''}`} />
          {isConnected && !isDataStale ? 'Live' : 'Waiting...'}
        </Badge>
      </div>

      {/* Sensor Cards */}
      {sensorData && sensorData.temperature !== undefined ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Temperature */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Temperature
                  </CardTitle>
                  <Thermometer className="w-5 h-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-600">
                  {sensorData.temperature.toFixed(1)}°C
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {sensorData.temperature > 35 ? '🔥 High' : 
                   sensorData.temperature < 15 ? '❄️ Low' : '✅ Normal'}
                </p>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span>Fan:</span>
                    <Badge variant={sensorData.fan_active ? "default" : "secondary"}>
                      <Wind className="w-3 h-3 mr-1" />
                      {sensorData.fan_active ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Humidity */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Humidity
                  </CardTitle>
                  <Droplets className="w-5 h-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-600">
                  {sensorData.humidity?.toFixed(1)}%
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {sensorData.humidity! > 80 ? '💧 High' : 
                   sensorData.humidity! < 30 ? '🏜️ Low' : '✅ Normal'}
                </p>
              </CardContent>
            </Card>

            {/* Soil Moisture */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Soil Moisture
                  </CardTitle>
                  <Sprout className="w-5 h-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">
                  {sensorData.soilMoisture}%
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {sensorData.soilMoisture! < 30 ? '🌵 Dry' : 
                   sensorData.soilMoisture! > 70 ? '💦 Wet' : '✅ Good'}
                </p>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span>Pump:</span>
                    <Badge variant={sensorData.pump_active ? "default" : "secondary"}>
                      <Droplet className="w-3 h-3 mr-1" />
                      {sensorData.pump_active ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actuator Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={sensorData.fan_active ? 'border-2 border-blue-500' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wind className={`w-8 h-8 ${sensorData.fan_active ? 'text-blue-500 animate-spin' : 'text-muted-foreground'}`} />
                    <div>
                      <h4 className="font-semibold">Cooling Fan</h4>
                      <p className="text-sm text-muted-foreground">
                        {sensorData.fan_active ? 'Cooling' : 'Standby'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={sensorData.fan_active ? "default" : "outline"}>
                    {sensorData.fan_active ? 'ACTIVE' : 'OFF'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className={sensorData.pump_active ? 'border-2 border-green-500' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Droplet className={`w-8 h-8 ${sensorData.pump_active ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <div>
                      <h4 className="font-semibold">Water Pump</h4>
                      <p className="text-sm text-muted-foreground">
                        {sensorData.pump_active ? 'Watering' : 'Standby'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={sensorData.pump_active ? "default" : "outline"}>
                    {sensorData.pump_active ? 'ACTIVE' : 'OFF'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Activity className="w-16 h-16 mx-auto mb-4 animate-pulse text-muted-foreground" />
            <p className="font-medium">Waiting for sensor data...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Run: node serial_to_firebase.js
            </p>
          </CardContent>
        </Card>
      )}

      {lastUpdate && (
        <div className="text-xs text-center text-muted-foreground">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}