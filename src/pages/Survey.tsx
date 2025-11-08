import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Leaf } from "lucide-react";
import { toast } from "sonner";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const SOIL_TYPES = [
  "Alluvial Soil", "Black Soil", "Red Soil", "Laterite Soil", 
  "Desert Soil", "Mountain Soil", "Saline Soil", "Peaty Soil"
];

const SEASONS = ["Summer", "Winter", "Monsoon"];

const Survey = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    region: "",
    soilType: "",
    crop: "",
    season: "",
    pincode: "",
  });

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);

      // Check if profile already exists
      checkExistingProfile(session.user.id);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkExistingProfile = async (id: string) => {
    const { data: profile } = await supabase
      .from("user_profile")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (profile) {
      navigate("/dashboard");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User not authenticated");
      return;
    }

    if (!formData.region || !formData.soilType || !formData.crop || !formData.season || !formData.pincode) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.pincode.length !== 6 || !/^\d+$/.test(formData.pincode)) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("user_profile").insert({
      id: userId,
      region: formData.region,
      soil_type: formData.soilType,
      crop: formData.crop,
      season: formData.season,
      pincode: formData.pincode,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Profile created successfully!");
    navigate("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Leaf className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Welcome to Smart Agriculture</h1>
          <p className="text-muted-foreground">Help us personalize your experience by sharing some details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData({ ...formData, region: value })}>
                <SelectTrigger id="region">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="soilType">Soil Type</Label>
              <Select value={formData.soilType} onValueChange={(value) => setFormData({ ...formData, soilType: value })}>
                <SelectTrigger id="soilType">
                  <SelectValue placeholder="Select soil type" />
                </SelectTrigger>
                <SelectContent>
                  {SOIL_TYPES.map((soil) => (
                    <SelectItem key={soil} value={soil}>
                      {soil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crop">Crop</Label>
              <Input
                id="crop"
                type="text"
                placeholder="e.g., Rice, Wheat, Cotton"
                value={formData.crop}
                onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Select value={formData.season} onValueChange={(value) => setFormData({ ...formData, season: value })}>
                <SelectTrigger id="season">
                  <SelectValue placeholder="Select season" />
                </SelectTrigger>
                <SelectContent>
                  {SEASONS.map((season) => (
                    <SelectItem key={season} value={season}>
                      {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                type="text"
                placeholder="Enter 6-digit pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                maxLength={6}
                pattern="\d{6}"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Complete Setup"}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Survey;
