import { Button } from "@/components/ui/button";
import heroBackground from "@/assets/hero-background.jpg";
import lionLogo from "@/assets/lion-logo.png";
interface HeroProps {
  onNavigate: (tab: string) => void;
}

const Hero = ({ onNavigate }: HeroProps) => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{
      backgroundImage: `url(${heroBackground})`
    }} />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90" />
      
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in">
        {/* Lion Logo */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <img src={lionLogo} alt="Alpha Sigma Logo" className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain opacity-95 drop-shadow-2xl filter brightness-110 animate-glow" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight">
          <span className="bg-gradient-to-r from-gold via-amber-400 to-gold bg-clip-text text-transparent">
            Alpha Sigma
          </span>
          <br />
          <span className="text-foreground">Strategies</span>
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-2">
          Delivering exceptional returns through sophisticated quantitative strategies and 
          disciplined risk management in global markets.
        </p>
        
        <div className="flex justify-center items-center mb-12 max-w-2xl mx-auto">
          <Button 
            variant="premium" 
            size="lg" 
            className="w-full sm:w-auto min-w-[200px] animate-glow shadow-[0_0_20px_rgba(212,175,55,0.5)]"
            onClick={() => onNavigate("about")}
          >
            Learn More
          </Button>
        </div>
        
      </div>
    </section>;
};
export default Hero;