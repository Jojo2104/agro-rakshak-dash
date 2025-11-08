import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Droplets, Thermometer, Activity, Brain, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Thermometer,
      title: "Real-time Monitoring",
      description: "Track temperature, humidity, and soil moisture in real-time with IoT sensors"
    },
    {
      icon: Droplets,
      title: "Smart Irrigation",
      description: "Automated water management based on soil moisture levels"
    },
    {
      icon: Activity,
      title: "Climate Control",
      description: "Intelligent cooling systems that respond to environmental conditions"
    },
    {
      icon: Brain,
      title: "AI Disease Detection",
      description: "Advanced AI-powered plant disease identification and diagnosis"
    },
    {
      icon: Shield,
      title: "Crop Protection",
      description: "Proactive alerts and recommendations to protect your crops"
    },
    {
      icon: Leaf,
      title: "Sustainable Farming",
      description: "Optimize resource usage for eco-friendly agriculture"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Smart Agriculture
              <span className="block text-primary mt-2">Made Simple</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AgroRakshak combines IoT sensors, automated controls, and AI-powered disease detection 
              to help you monitor and protect your crops with precision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8">
                Launch Dashboard
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/about")} className="text-lg px-8">
                Learn More
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Modern Farming
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to transform your agricultural operations
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="hover:card-glow transition-all duration-300">
                <CardContent className="p-6 space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto hover:card-glow transition-all duration-300">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Transform Your Farm?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join the future of agriculture with AgroRakshak's intelligent monitoring system
              </p>
              <Button size="lg" onClick={() => navigate("/login")} className="text-lg px-8">
                Get Started Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Landing;