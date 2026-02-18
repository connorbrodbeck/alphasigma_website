import { Card, CardContent } from "@/components/ui/card";
import crisPhoto from "@/assets/cris-photo.jpg";
import peterPhoto from "@/assets/peter-photo.jpg";

const People = () => {
  const team = [
    {
      name: "Connor Brodbeck",
      title: "Alpha",
      background: "The architect of our most sophisticated trading algorithms. Master of market psychology.",
      expertise: "Alpha Generation, Behavioral Finance",
      image: "/lovable-uploads/05d1714c-d4f5-43a4-ad24-cae9bedb62a3.png"
    },
    {
      name: "Nick Verzello",
      title: "Director of Everything",
      background: "Oversees all operations with an iron fist and a keen eye for detail. MBA from nowhere important.",
      expertise: "Strategic Operations, Crisis Management",
      image: "/lovable-uploads/a1a465cc-caea-4540-b111-2966b61411fb.png"
    },
    {
      name: "Josh Miller",
      title: "CPO and Director of Rug Pulls",
      background: "Specializing in tactical market exits and strategic repositioning.",
      expertise: "Position Management, Exit Strategies",
      image: "/lovable-uploads/2474b7c0-99af-4957-8541-3dfe65db4cba.png"
    },
    {
      name: "Luke Kovensky",
      title: "CIO/Intern",
      background: "Our youngest and brightest, handling both coffee runs and investment decisions with equal precision.",
      expertise: "Everything and Nothing, Coffee Optimization",
      image: "/lovable-uploads/2f4761ba-7a63-4ee2-b1ac-92f637e45a82.png"
    },
    {
      name: "Cristian Devincenzo",
      title: "Virus",
      background: "Specializing in identifying high-potential stocks moments before they demonstrate remarkable commitment to staying flat.",
      expertise: "Hypotheticals",
      image: crisPhoto
    },
    {
      name: "Peter Severino",
      title: "CMO",
      background: "Specializing in impeccable market timing. Serving as the team's most reliable leading indicator of immediate reversals.",
      expertise: "Market Timing, Contrarian Signals",
      image: peterPhoto
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
              Our Team
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto px-2">
            A highly specialized team of six exceptional professionals dedicated to 
            extracting alpha from markets through innovative strategies and unconventional thinking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {team.map((member, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm border-gold/20 hover:border-gold/40 transition-all duration-300">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-gold/20 to-amber-400/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-gold/30 overflow-hidden">
                    {member.image ? (
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-gold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{member.name}</h3>
                  <div className="text-gold font-medium mb-3">{member.title}</div>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-muted-foreground leading-relaxed">
                      {member.background}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gold/20">
                    <div className="text-gold font-medium mb-1">Expertise:</div>
                    <div className="text-muted-foreground">{member.expertise}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="bg-card/30 backdrop-blur-sm border-gold/20 max-w-4xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-gold mb-4">Join Our Team</h3>
              <p className="text-muted-foreground mb-6">
                We're always looking for exceptional talent to join our world-class team. 
                If you're passionate about quantitative finance and cutting-edge technology, 
                we'd love to hear from you.
              </p>
              <div className="text-gold font-medium">
                careers@alphasigmastrategies.com
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default People;