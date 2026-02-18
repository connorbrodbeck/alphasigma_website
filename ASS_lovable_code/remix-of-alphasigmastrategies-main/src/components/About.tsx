import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
              About Alpha Sigma
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Founded in 2025, Alpha Sigma Strategies is a highly sophisticated, barely understandable hedge fund dedicated to squeezing alpha out of markets through complex sigma trading strategies and advanced risk management.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gold">Our Philosophy</h3>
            <p className="text-muted-foreground leading-relaxed">
              At Alpha Sigma Strategies, we view markets as complex adaptive systems best approached with advanced quantitative models and a healthy respect for uncertainty. Our team leverages cutting-edge technology and rigorous academic research to identify and capitalize on inefficiencies that others often overlook.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              With a disciplined approach to risk management and a diversified suite of strategies, we aim to deliver strong risk-adjusted returns while maintaining low correlation to broader market movements. We prefer our models precise, our signals obscure, and our volatility someone else's problem.
            </p>
          </div>
          
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gold">Our Approach</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gold rounded-full mt-2" />
                <div>
                  <div className="font-medium text-foreground">Alpha Research</div>
                  <div className="text-sm text-muted-foreground">Data-driven investment decisions backed by rigorous statistical analysis</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gold rounded-full mt-2" />
                <div>
                  <div className="font-medium text-foreground">Risk Management</div>
                  <div className="text-sm text-muted-foreground">Advanced portfolio optimization and dynamic hedging strategies</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gold rounded-full mt-2" />
                <div>
                  <div className="font-medium text-foreground">Technology</div>
                  <div className="text-sm text-muted-foreground">State-of-the-art execution systems and low-latency infrastructure</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-card/50 backdrop-blur-sm border-gold/20 text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gold mb-2">2025</div>
              <div className="text-muted-foreground">Founded</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-gold/20 text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gold mb-2">6</div>
              <div className="text-muted-foreground">Team Members</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-gold/20 text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gold mb-2">15+</div>
              <div className="text-muted-foreground">Markets Traded</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-gold/20 text-center">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gold mb-2">AAA</div>
              <div className="text-muted-foreground">Credit Rating</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default About;