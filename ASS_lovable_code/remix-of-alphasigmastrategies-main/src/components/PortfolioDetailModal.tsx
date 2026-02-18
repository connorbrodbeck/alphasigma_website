import { useState, useEffect, useMemo } from "react";
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
  Legend,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, ArrowUpDown, LogOut } from "lucide-react";

interface Member {
  id: number;
  name: string;
}

interface Holding {
  id: number;
  ticker: string;
  name: string;
  type: "stock" | "etf";
  position: "long" | "short";
  purchase_price: number;
  current_price: number | null;
  daily_pct: number | null;
  total_pct: number | null;
}

interface ClosedHolding {
  id: number;
  ticker: string;
  name: string;
  type: "stock" | "etf";
  position: "long" | "short";
  purchase_price: number;
  close_price: number;
  closed_at: string;
  realized_pct: number | null;
}

interface PortfolioDetailModalProps {
  member: Member;
  holdings: Holding[];
  open: boolean;
  onClose: () => void;
  isOwn: boolean;
  token: string | null;
  onRefresh: () => void;
}

function PctCell({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground">—</span>;
  const isPos = value >= 0;
  return (
    <span className={isPos ? "text-emerald-400" : "text-red-400"}>
      {isPos ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

const ALLOC_COLORS = ["#d97706", "#6366f1"];

const tooltipStyle = {
  background: "hsl(222 47% 11%)",
  border: "1px solid rgba(212,175,55,0.3)",
  borderRadius: "6px",
  fontSize: "12px",
};

export function PortfolioDetailModal({
  member, holdings, open, onClose, isOwn, token, onRefresh,
}: PortfolioDetailModalProps) {

  // ── Sort state ──
  const [sortCol, setSortCol] = useState<"daily" | "total" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(col: "daily" | "total") {
    if (sortCol === col) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  const displayHoldings = useMemo(() => {
    if (!sortCol) return holdings;
    return [...holdings].sort((a, b) => {
      const aVal = (sortCol === "daily" ? a.daily_pct : a.total_pct) ?? -Infinity;
      const bVal = (sortCol === "daily" ? b.daily_pct : b.total_pct) ?? -Infinity;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [holdings, sortCol, sortDir]);

  // ── Close position state ──
  const [closingId, setClosingId] = useState<number | null>(null);
  const [closePrice, setClosePrice] = useState("");
  const [closeError, setCloseError] = useState<string | null>(null);
  const [closeSubmitting, setCloseSubmitting] = useState(false);

  // Reset closing state whenever holdings changes (e.g. after a close succeeds)
  useEffect(() => {
    setClosingId(null);
    setClosePrice("");
    setCloseError(null);
  }, [holdings]);

  async function handleClosePosition(holdingId: number) {
    const parsed = parseFloat(closePrice);
    if (isNaN(parsed) || parsed <= 0) {
      setCloseError("Enter a valid positive price.");
      return;
    }
    setCloseSubmitting(true);
    setCloseError(null);
    try {
      const res = await fetch(`/api/holdings/${holdingId}/close`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ close_price: parsed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setCloseError(data.error || "Failed to close position.");
        return;
      }
      onRefresh();             // card refetches open holdings → updates holdings prop
      fetchClosedHoldings();   // update closed list in modal
    } catch {
      setCloseError("Network error. Please try again.");
    } finally {
      setCloseSubmitting(false);
    }
  }

  // ── Closed holdings ──
  const [closedHoldings, setClosedHoldings] = useState<ClosedHolding[]>([]);

  async function fetchClosedHoldings() {
    try {
      const res = await fetch(`/api/holdings/closed/${member.id}`);
      if (res.ok) setClosedHoldings(await res.json());
    } catch {
      // silently fail
    }
  }

  // ── Portfolio history (line chart) ──
  const [historyData, setHistoryData] = useState<Record<string, { month: string; close: number }[]>>({});
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchClosedHoldings();

    if (holdings.length === 0) return;
    const uniqueTickers = [...new Set(holdings.map(h => h.ticker))];
    setHistoryLoading(true);
    fetch(`/api/holdings/history?tickers=${uniqueTickers.join(",")}`)
      .then(r => r.json())
      .then(data => setHistoryData(data))
      .catch(() => setHistoryData({}))
      .finally(() => setHistoryLoading(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const portfolioHistory = useMemo(() => {
    if (!Object.keys(historyData).length) return [];
    const firstTicker = Object.keys(historyData)[0];
    const months = (historyData[firstTicker] || [])
      .map(p => p.month)
      .filter(m => {
        const yearMatch = m.match(/'(\d{2})$/);
        return yearMatch ? parseInt(yearMatch[1]) >= 26 : false;
      });

    return months
      .map(month => {
        const returns: number[] = [];
        for (const h of holdings) {
          const points = historyData[h.ticker] || [];
          const point = points.find(p => p.month === month);
          if (point && h.purchase_price > 0) {
            const multiplier = h.position === "short" ? -1 : 1;
            returns.push(multiplier * ((point.close - h.purchase_price) / h.purchase_price) * 100);
          }
        }
        if (returns.length === 0) return null;
        const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
        return { month, portfolioReturn: parseFloat(avg.toFixed(2)) };
      })
      .filter((p): p is { month: string; portfolioReturn: number } => p !== null);
  }, [historyData, holdings]);

  // ── Allocation chart ──
  const stockCount = holdings.filter(h => h.type === "stock").length;
  const etfCount   = holdings.filter(h => h.type === "etf").length;
  const allocationData = [
    stockCount > 0 && { name: "Stocks", value: stockCount },
    etfCount   > 0 && { name: "ETFs",   value: etfCount   },
  ].filter(Boolean) as { name: string; value: number }[];

  function SortIcon({ col }: { col: "daily" | "total" }) {
    if (sortCol !== col) return <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-40" />;
    return sortDir === "desc"
      ? <ArrowDown className="inline h-3 w-3 ml-1 text-gold" />
      : <ArrowUp   className="inline h-3 w-3 ml-1 text-gold" />;
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="bg-card border-gold/30 sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gold text-xl flex items-baseline gap-2">
            {member.name}&apos;s Portfolio
            <span className="text-sm font-normal text-muted-foreground">
              {holdings.length} open · {closedHoldings.length} closed
            </span>
          </DialogTitle>
        </DialogHeader>

        {holdings.length === 0 && closedHoldings.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No holdings yet.</p>
        ) : (
          <div className="space-y-8 mt-2">

            {/* ── Open holdings table ── */}
            {holdings.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gold/10 text-xs text-muted-foreground">
                      <th className="text-left pb-2 font-medium">Ticker</th>
                      <th className="text-left pb-2 font-medium pl-2">Name</th>
                      <th className="text-center pb-2 font-medium">Type</th>
                      <th className="text-right pb-2 font-medium">Buy Price</th>
                      <th className="text-right pb-2 font-medium">Current</th>
                      <th
                        className="text-right pb-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => toggleSort("daily")}
                      >
                        Daily <SortIcon col="daily" />
                      </th>
                      <th
                        className="text-right pb-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors"
                        onClick={() => toggleSort("total")}
                      >
                        Total <SortIcon col="total" />
                      </th>
                      {isOwn && <th className="pb-2 w-16" />}
                    </tr>
                  </thead>
                  <tbody>
                    {displayHoldings.map(h => (
                      closingId === h.id ? (
                        /* ── Inline close form ── */
                        <tr key={h.id} className="border-b border-gold/5 bg-gold/5">
                          <td colSpan={isOwn ? 8 : 7} className="py-2.5 px-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-sm">{h.ticker}</span>
                              <span className="text-xs text-muted-foreground">Exit price:</span>
                              <input
                                type="number"
                                value={closePrice}
                                onChange={e => { setClosePrice(e.target.value); setCloseError(null); }}
                                className="h-7 w-28 text-xs bg-background border border-gold/40 rounded px-2 focus:outline-none focus:border-gold"
                                placeholder="0.00"
                                step="0.01"
                                min="0.01"
                                autoFocus
                                onKeyDown={e => {
                                  if (e.key === "Enter") handleClosePosition(h.id);
                                  if (e.key === "Escape") { setClosingId(null); setClosePrice(""); }
                                }}
                              />
                              <button
                                onClick={() => handleClosePosition(h.id)}
                                disabled={closeSubmitting}
                                className="h-7 px-3 text-xs bg-gold text-navy rounded font-semibold hover:bg-gold/90 disabled:opacity-60"
                              >
                                {closeSubmitting ? "Saving…" : "Confirm"}
                              </button>
                              <button
                                onClick={() => { setClosingId(null); setClosePrice(""); setCloseError(null); }}
                                className="h-7 px-3 text-xs border border-gold/30 rounded hover:bg-gold/10"
                              >
                                Cancel
                              </button>
                              {closeError && (
                                <span className="text-xs text-red-400">{closeError}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        /* ── Normal row ── */
                        <tr key={h.id} className="border-b border-gold/5 last:border-0">
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">{h.ticker}</span>
                              <Badge
                                variant="outline"
                                className={`text-xs px-1 py-0 h-4 ${
                                  h.position === "long"
                                    ? "border-emerald-400/50 text-emerald-400"
                                    : "border-red-400/50 text-red-400"
                                }`}
                              >
                                {h.position}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-2 pr-3 pl-2 text-muted-foreground max-w-[140px] truncate">
                            {h.name}
                          </td>
                          <td className="py-2 pr-3 text-center">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                              {h.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-muted-foreground text-xs">
                            ${h.purchase_price.toFixed(2)}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-xs">
                            {h.current_price != null ? `$${h.current_price.toFixed(2)}` : "—"}
                          </td>
                          <td className="py-2 pr-3 text-right text-xs">
                            <PctCell value={h.daily_pct} />
                          </td>
                          <td className="py-2 text-right text-xs">
                            <PctCell value={h.total_pct} />
                          </td>
                          {isOwn && (
                            <td className="py-2 pl-3 text-right">
                              <button
                                onClick={() => { setClosingId(h.id); setClosePrice(""); setCloseError(null); }}
                                className="text-muted-foreground hover:text-gold transition-colors"
                                title="Close position"
                              >
                                <LogOut className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Charts ── */}
            {holdings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Allocation donut — fixed height so legend doesn't overlap */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    Allocation
                  </p>
                  {allocationData.length > 0 && (
                    <div className="flex justify-center">
                      <PieChart width={220} height={220}>
                        <Pie
                          data={allocationData}
                          cx={110}
                          cy={80}
                          innerRadius={52}
                          outerRadius={76}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {allocationData.map((_, i) => (
                            <Cell key={i} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(value: number, name: string) => [
                            `${value} holding${value !== 1 ? "s" : ""}`,
                            name,
                          ]}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          verticalAlign="bottom"
                          wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                        />
                      </PieChart>
                    </div>
                  )}
                </div>

                {/* Portfolio return line chart */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    Portfolio Return (1 Year)
                  </p>
                  {historyLoading ? (
                    <div className="flex items-center justify-center h-[220px]">
                      <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
                    </div>
                  ) : portfolioHistory.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={portfolioHistory} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(212,175,55,0.1)" />
                        <XAxis
                          dataKey="month"
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickFormatter={v => `${v}%`}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          width={44}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v: number) => [
                            `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,
                            "Portfolio Return",
                          ]}
                          labelStyle={{ color: "#d97706", marginBottom: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="portfolioReturn"
                          stroke="#d97706"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#d97706", strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#d97706" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[220px]">
                      <p className="text-xs text-muted-foreground text-center px-4">
                        Not enough history to plot yet.
                        <br />More data will appear over time.
                      </p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ── Closed positions ── */}
            {closedHoldings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Closed Positions
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gold/10 text-xs text-muted-foreground">
                        <th className="text-left pb-2 font-medium">Ticker</th>
                        <th className="text-left pb-2 font-medium pl-2">Name</th>
                        <th className="text-center pb-2 font-medium">Type</th>
                        <th className="text-right pb-2 font-medium">Entry</th>
                        <th className="text-right pb-2 font-medium">Exit</th>
                        <th className="text-right pb-2 font-medium">Realized P&amp;L</th>
                        <th className="text-right pb-2 font-medium">Closed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {closedHoldings.map(h => (
                        <tr key={h.id} className="border-b border-gold/5 last:border-0">
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">{h.ticker}</span>
                              <Badge
                                variant="outline"
                                className={`text-xs px-1 py-0 h-4 ${
                                  h.position === "long"
                                    ? "border-emerald-400/50 text-emerald-400"
                                    : "border-red-400/50 text-red-400"
                                }`}
                              >
                                {h.position}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-2 pr-3 pl-2 text-muted-foreground max-w-[140px] truncate">
                            {h.name}
                          </td>
                          <td className="py-2 pr-3 text-center">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                              {h.type.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-muted-foreground text-xs">
                            ${h.purchase_price.toFixed(2)}
                          </td>
                          <td className="py-2 pr-3 text-right font-mono text-xs">
                            ${h.close_price.toFixed(2)}
                          </td>
                          <td className="py-2 pr-3 text-right text-xs font-semibold">
                            <PctCell value={h.realized_pct} />
                          </td>
                          <td className="py-2 text-right text-xs text-muted-foreground">
                            {new Date(h.closed_at).toLocaleDateString("en-US", {
                              month: "short", day: "numeric", year: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
