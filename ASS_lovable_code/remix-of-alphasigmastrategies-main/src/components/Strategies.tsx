import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Strategies = () => {
  const strategies = [
    {
      name: "Equity Market Neutral",
      description: "Long/short equity strategies that aim to generate alpha while maintaining market neutrality.",
      allocation: "30%",
      features: ["Statistical Arbitrage", "Pairs Trading", "Factor Models", "Risk Parity"],
      performance: "+15.2% (2024 YTD)"
    },
    {
      name: "Global Macro",
      description: "Systematic trading across currencies, commodities, and fixed income based on macroeconomic trends.",
      allocation: "25%",
      features: ["Currency Arbitrage", "Interest Rate Models", "Commodity Trading", "Volatility Strategies"],
      performance: "+22.1% (2024 YTD)"
    },
    {
      name: "Event Driven",
      description: "Capitalize on corporate events including mergers, acquisitions, and restructurings.",
      allocation: "20%",
      features: ["Merger Arbitrage", "Distressed Securities", "Spin-off Arbitrage", "Credit Events"],
      performance: "+18.7% (2024 YTD)"
    },
    {
      name: "High Frequency",
      description: "Ultra-low latency strategies exploiting short-term market microstructure inefficiencies.",
      allocation: "15%",
      features: ["Market Making", "Latency Arbitrage", "Order Flow Analysis", "Cross-venue Trading"],
      performance: "+12.4% (2024 YTD)"
    },
    {
      name: "Quantitative Momentum",
      description: "Systematic momentum strategies across multiple asset classes and time horizons.",
      allocation: "10%",
      features: ["Cross-sectional Momentum", "Time Series Models", "Multi-factor Approach", "Dynamic Hedging"],
      performance: "+19.8% (2024 YTD)"
    }
  ];

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
              Investment Strategies
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Diversified portfolio of systematic strategies designed to generate consistent alpha 
            across different market environments and conditions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {strategies.map((strategy, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm border-gold/20 hover:border-gold/40 transition-all duration-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-gold text-xl">{strategy.name}</CardTitle>
                  <div className="text-right">
                    <div className="text-lg font-bold text-accent">{strategy.allocation}</div>
                    <div className="text-sm text-muted-foreground">Allocation</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {strategy.description}
                </p>
                
                <div className="mb-4">
                  <h4 className="font-medium text-foreground mb-2">Key Features:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {strategy.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gold/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">2024 Performance:</span>
                    <span className="font-semibold text-gold">{strategy.performance}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-card/30 backdrop-blur-sm border-gold/20">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gold mb-4">Risk Management Framework</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our comprehensive risk management system ensures optimal portfolio construction 
                and downside protection across all strategies.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-amber-400/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-gold/30">
                  <div className="text-gold font-bold text-xl">VaR</div>
                </div>
                <h4 className="font-semibold text-foreground mb-2">Value at Risk</h4>
                <p className="text-sm text-muted-foreground">Daily VaR monitoring with stress testing and scenario analysis</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-amber-400/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-gold/30">
                  <div className="text-gold font-bold text-xl">Δ</div>
                </div>
                <h4 className="font-semibold text-foreground mb-2">Dynamic Hedging</h4>
                <p className="text-sm text-muted-foreground">Real-time portfolio optimization and automatic rebalancing</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-amber-400/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-gold/30">
                  <div className="text-gold font-bold text-xl">σ</div>
                </div>
                <h4 className="font-semibold text-foreground mb-2">Volatility Control</h4>
                <p className="text-sm text-muted-foreground">Target volatility management with dynamic position sizing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default Strategies;