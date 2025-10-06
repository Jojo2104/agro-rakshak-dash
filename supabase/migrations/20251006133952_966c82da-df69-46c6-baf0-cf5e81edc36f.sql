-- Create sensor_readings table for real-time IoT data
CREATE TABLE public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  temperature DECIMAL(5,2) NOT NULL,
  humidity DECIMAL(5,2) NOT NULL,
  soil_moisture DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create actuator_status table
CREATE TABLE public.actuator_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pump_active BOOLEAN DEFAULT false NOT NULL,
  fans_active BOOLEAN DEFAULT false NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create system_thresholds table
CREATE TABLE public.system_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_temperature DECIMAL(5,2) DEFAULT 32.0 NOT NULL,
  min_soil_moisture DECIMAL(5,2) DEFAULT 50.0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'success')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuator_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create public read policies (public dashboard - no auth needed)
CREATE POLICY "Public read sensor_readings" ON public.sensor_readings FOR SELECT USING (true);
CREATE POLICY "Public read actuator_status" ON public.actuator_status FOR SELECT USING (true);
CREATE POLICY "Public read system_thresholds" ON public.system_thresholds FOR SELECT USING (true);
CREATE POLICY "Public read notifications" ON public.notifications FOR SELECT USING (true);

-- Create public write policies for IoT device simulation
CREATE POLICY "Public insert sensor_readings" ON public.sensor_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update actuator_status" ON public.actuator_status FOR UPDATE USING (true);
CREATE POLICY "Public update system_thresholds" ON public.system_thresholds FOR UPDATE USING (true);
CREATE POLICY "Public insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Insert initial actuator status
INSERT INTO public.actuator_status (pump_active, fans_active) VALUES (false, false);

-- Insert initial thresholds
INSERT INTO public.system_thresholds (max_temperature, min_soil_moisture) VALUES (32.0, 50.0);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.actuator_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_thresholds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;