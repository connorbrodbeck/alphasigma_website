import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, TrendingUp, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Article {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
}

interface StockNews {
  symbol: string;
  name: string;
  articles: Article[];
  loading: boolean;
}

const Articles = () => {
  const { toast } = useToast();
  const [stockNews, setStockNews] = useState<StockNews[]>([
    { symbol: "ACHR", name: "Archer Aviation", articles: [], loading: true },
    { symbol: "EOSE", name: "Eos Energy Enterprises", articles: [], loading: true },
    { symbol: "TER", name: "Teradyne", articles: [], loading: true },
    { symbol: "UFO", name: "Procure Space ETF", articles: [], loading: true },
    { symbol: "QTUM", name: "Defiance Quantum ETF", articles: [], loading: true },
  ]);

  const [selectedStock, setSelectedStock] = useState<string>("ACHR");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchArticlesFromDatabase();
  }, []);

  const fetchArticlesFromDatabase = async () => {
    // Articles feature not yet connected to backend
    setStockNews(prev => prev.map(stock => ({ ...stock, loading: false })));
  };

  const triggerArticleFetch = async () => {
    setIsRefreshing(true);
    toast({
      title: "Coming soon",
      description: "Article fetching will be available in a future update.",
    });
    setIsRefreshing(false);
  };

  const selectedStockData = stockNews.find(stock => stock.symbol === selectedStock);

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-4xl font-bold mb-4 text-center">
            <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
              Market Articles
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-center">
            Latest news and insights for our portfolio holdings. Updates automatically every month.
          </p>
          <Button 
            onClick={triggerArticleFetch}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="mt-4 mx-auto flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Articles'}
          </Button>
        </div>

        {/* Stock Selection */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          {stockNews.map((stock) => (
            <Button
              key={stock.symbol}
              variant={selectedStock === stock.symbol ? "gold" : "outline"}
              onClick={() => setSelectedStock(stock.symbol)}
              className="flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              {stock.symbol}
              <Badge variant="secondary" className="ml-2">
                {stock.articles.length}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Articles Display */}
        {selectedStockData && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-semibold mb-2">
                {selectedStockData.name} ({selectedStockData.symbol})
              </h3>
              <p className="text-muted-foreground">
                {selectedStockData.loading 
                  ? "Loading latest articles..." 
                  : `${selectedStockData.articles.length} recent articles`
                }
              </p>
            </div>

            {selectedStockData.loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-card/50 backdrop-blur-sm border-gold/20 animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {selectedStockData.articles.map((article, index) => (
                  <Card key={index} className="bg-card/50 backdrop-blur-sm border-gold/20 hover:border-gold/40 transition-all duration-300 group">
                    <CardHeader>
                      <CardTitle className="text-lg leading-tight group-hover:text-gold transition-colors duration-300">
                        {article.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {article.publishedDate}
                        <span>•</span>
                        <span>{article.source}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-3">
                        {article.snippet}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full group-hover:border-gold group-hover:text-gold transition-all duration-300"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        Read Full Article
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!selectedStockData.loading && selectedStockData.articles.length === 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border-gold/20 text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground text-lg">
                    No recent articles found for {selectedStockData.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back later for the latest market updates.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Articles;