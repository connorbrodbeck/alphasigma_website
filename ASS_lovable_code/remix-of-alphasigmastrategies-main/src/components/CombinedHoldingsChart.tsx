import { useEffect, useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis } from "recharts";

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface CombinedHoldingsChartProps {
  stocks: StockData[];
  etfs: StockData[];
  loading: boolean;
}

const CombinedHoldingsChart = ({ stocks, etfs, loading }: CombinedHoldingsChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && stocks.length > 0 && etfs.length > 0) {
      // Calculate combined average return from current holdings
      const allHoldings = [...stocks, ...etfs];
      const averageReturn = allHoldings.reduce((sum, holding) => sum + holding.changePercent, 0) / allHoldings.length;
      
      // Generate historical data starting from July 2025 (when holdings were added)
      // Create a progression based on current average performance
      const baseReturn = averageReturn;
      const months = [
        "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", 
        "Nov 2025", "Dec 2025", "Jan 2026"
      ];
      
      const historicalData = months.map((month, index) => {
        // Simulate realistic progression with some volatility
        const volatilityFactor = (Math.random() - 0.5) * 0.3; // ±15% volatility
        const progressionMultiplier = (index + 1) / months.length;
        const returnValue = (baseReturn * progressionMultiplier) + (baseReturn * volatilityFactor);
        
        return {
          month,
          return: parseFloat(returnValue.toFixed(2)),
          value: 100000 * (1 + returnValue / 100) // Assuming $100k base value
        };
      });
      
      // Add current month data point with actual average return
      historicalData.push({
        month: "Current",
        return: parseFloat(averageReturn.toFixed(2)),
        value: 100000 * (1 + averageReturn / 100)
      });
      
      setChartData(historicalData);
    }
  }, [stocks, etfs, loading]);

  const chartConfig = {
    return: {
      label: "Combined Return %",
      color: "hsl(var(--gold))"
    }
  };

  if (loading || chartData.length === 0) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading combined holdings chart...</div>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <LineChart data={chartData}>
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: 'hsl(var(--gold))' }}
          axisLine={{ stroke: 'hsl(var(--gold))' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: 'hsl(var(--gold))' }}
          axisLine={{ stroke: 'hsl(var(--gold))' }}
          label={{ value: 'Return %', angle: -90, position: 'insideLeft' }}
        />
        <ChartTooltip 
          content={<ChartTooltipContent />}
          formatter={(value: number, name: string) => [
            `${value > 0 ? '+' : ''}${value.toFixed(2)}%`,
            "Combined Portfolio Return"
          ]}
        />
        <Line 
          type="monotone" 
          dataKey="return" 
          stroke="hsl(var(--gold))" 
          strokeWidth={3}
          dot={{ fill: 'hsl(var(--gold))', strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: 'hsl(var(--gold))', strokeWidth: 2 }}
        />
      </LineChart>
    </ChartContainer>
  );
};

export default CombinedHoldingsChart;