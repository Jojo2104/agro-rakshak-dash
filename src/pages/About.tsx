import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Leaf, Target, Users, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">AgroRakshak</span>
          </div>
          <Button onClick={() => navigate("/")} variant="ghost">
            Back to Home
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
            About AgroRakshak
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Empowering farmers with intelligent technology for sustainable agriculture
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:card-glow transition-all duration-300">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Our Mission</h2>
                <p className="text-muted-foreground">
                  To revolutionize agriculture through innovative IoT solutions and AI technology, 
                  making precision farming accessible to every farmer while promoting sustainable 
                  practices that protect our environment.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:card-glow transition-all duration-300">
              <CardContent className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Our Vision</h2>
                <p className="text-muted-foreground">
                  A future where every farm operates at peak efficiency with minimal waste, 
                  where technology bridges the gap between traditional farming wisdom and 
                  modern innovation, ensuring food security for generations to come.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold mb-8 text-center">What We Do</h2>
          <div className="space-y-6 text-muted-foreground">
            <p>
              AgroRakshak is an advanced IoT-based smart agriculture monitoring and automation system 
              designed to help farmers optimize their operations. Our platform combines real-time sensor 
              data, automated control systems, and artificial intelligence to provide comprehensive 
              farm management solutions.
            </p>
            <p>
              Through our system, farmers can monitor critical parameters like soil moisture, temperature, 
              and humidity in real-time. Our intelligent automation handles irrigation and climate control, 
              ensuring optimal growing conditions while conserving resources.
            </p>
            <p>
              What sets us apart is our AI-powered disease detection system. By analyzing plant images, 
              our technology can identify diseases early, providing farmers with actionable insights 
              and treatment recommendations before problems escalate.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:card-glow transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Sustainability</h3>
                <p className="text-muted-foreground">
                  Promoting eco-friendly practices that protect our planet for future generations
                </p>
              </CardContent>
            </Card>

            <Card className="hover:card-glow transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Innovation</h3>
                <p className="text-muted-foreground">
                  Constantly pushing boundaries to deliver cutting-edge agricultural solutions
                </p>
              </CardContent>
            </Card>

            <Card className="hover:card-glow transition-all duration-300">
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Accessibility</h3>
                <p className="text-muted-foreground">
                  Making advanced technology available and easy to use for all farmers
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Experience the future of farming with AgroRakshak
          </p>
          <Button size="lg" onClick={() => navigate("/dashboard")} className="text-lg px-8">
            Launch Dashboard
          </Button>
        </div>
      </section>
    </div>
  );
};

export default About;
