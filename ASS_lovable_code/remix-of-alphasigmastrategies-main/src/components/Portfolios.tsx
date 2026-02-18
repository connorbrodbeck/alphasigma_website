import { useEffect, useState, useCallback } from "react";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { AddHoldingModal } from "@/components/AddHoldingModal";
import { PortfolioDetailModal } from "@/components/PortfolioDetailModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Trash2, Maximize2, Trophy } from "lucide-react";

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

interface LeaderboardEntry {
  member: Member;
  avgReturn: number | null;
  count: number;
}

function PctBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-muted-foreground text-xs">—</span>;
  const isPos = value >= 0;
  return (
    <span className={`text-sm font-medium ${isPos ? "text-emerald-400" : "text-red-400"}`}>
      {isPos ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

function HoldingsSkeleton() {
  return (
    <div className="space-y-2 mt-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse flex items-center gap-3 py-2">
          <div className="h-4 bg-gold/20 rounded w-12" />
          <div className="h-4 bg-gold/20 rounded w-16" />
          <div className="flex-1 h-4 bg-gold/20 rounded" />
          <div className="h-4 bg-gold/20 rounded w-14" />
        </div>
      ))}
    </div>
  );
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-gold text-navy font-bold",
  2: "bg-slate-400 text-navy font-bold",
  3: "bg-amber-700 text-white font-bold",
};

function Leaderboard({ entries, loading }: { entries: LeaderboardEntry[]; loading: boolean }) {
  return (
    <div className="mb-10 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-gold" />
        <h3 className="text-lg font-bold text-foreground">Leaderboard</h3>
        <span className="text-xs text-muted-foreground">— ranked by average portfolio return</span>
      </div>

      {loading ? (
        <div className="flex gap-3 flex-wrap">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse h-16 w-36 bg-card/50 rounded-lg border border-gold/10" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {entries.map((entry, i) => {
            const rank = i + 1;
            const rankStyle = RANK_STYLES[rank] ?? "bg-card text-muted-foreground font-semibold";
            const isPos = entry.avgReturn != null && entry.avgReturn >= 0;

            return (
              <div
                key={entry.member.id}
                className="flex flex-col gap-1 rounded-lg border border-gold/15 bg-card/50 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center shrink-0 ${rankStyle}`}>
                    {rank}
                  </span>
                  <span className="text-sm font-semibold text-foreground truncate">{entry.member.name.split(" ")[0]}</span>
                </div>
                <div className="pl-7">
                  {entry.avgReturn != null ? (
                    <span className={`text-base font-bold ${isPos ? "text-emerald-400" : "text-red-400"}`}>
                      {isPos ? "+" : ""}{entry.avgReturn.toFixed(2)}%
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No data</span>
                  )}
                  <p className="text-xs text-muted-foreground">{entry.count} holding{entry.count !== 1 ? "s" : ""}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface MemberCardProps {
  member: Member;
  isOwn: boolean;
  token: string | null;
  onRefreshLeaderboard: () => void;
}

function MemberCard({ member, isOwn, token, onRefreshLeaderboard }: MemberCardProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/holdings/${member.id}`));
      if (res.ok) {
        const data = await res.json();
        setHoldings(data);
      }
    } catch {
      // silently fail — card shows empty state
    } finally {
      setLoading(false);
    }
  }, [member.id]);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  async function handleDelete(holdingId: number) {
    if (!token) return;
    setDeletingId(holdingId);
    try {
      const res = await fetch(apiUrl(`/api/holdings/${holdingId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchHoldings();
        onRefreshLeaderboard();
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAddSuccess() {
    await fetchHoldings();
    onRefreshLeaderboard();
  }

  // Top 5 by total return (nulls sorted last)
  const top5 = [...holdings]
    .sort((a, b) => (b.total_pct ?? -Infinity) - (a.total_pct ?? -Infinity))
    .slice(0, 5);
  const extra = holdings.length - 5;

  // Average total return across all holdings that have data
  const withPct = holdings.filter(h => h.total_pct != null);
  const avgReturn = withPct.length
    ? withPct.reduce((s, h) => s + h.total_pct!, 0) / withPct.length
    : null;

  return (
    <>
      <Card
        className="bg-card/50 backdrop-blur-sm border-gold/20 hover:border-gold/40 transition-all duration-300 flex flex-col cursor-pointer group/card"
        onClick={() => setDetailOpen(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gold/20 to-amber-400/20 rounded-full flex items-center justify-center border border-gold/30 shrink-0">
                <Briefcase className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground leading-tight">{member.name}</h3>
                <p className="text-xs text-muted-foreground">{holdings.length} holding{holdings.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover/card:opacity-60 transition-opacity" />
              {isOwn && (
                <Button
                  size="sm"
                  onClick={e => { e.stopPropagation(); setAddModalOpen(true); }}
                  className="bg-gold hover:bg-gold/90 text-navy font-semibold h-8 px-3"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1">
          {loading ? (
            <HoldingsSkeleton />
          ) : holdings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isOwn ? "No holdings yet. Click Add to get started." : "No holdings yet."}
            </p>
          ) : (
            <div className="mt-2">
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_auto_5rem_5rem_1.25rem] gap-x-2 text-xs text-muted-foreground font-medium pb-1 border-b border-gold/10 mb-1">
                    <span>Ticker</span>
                    <span>Type</span>
                    <span className="text-right">Daily</span>
                    <span className="text-right">Total</span>
                    <span />
                  </div>

                  {/* Top-5 rows */}
                  {top5.map((h) => (
                    <div
                      key={h.id}
                      className="grid grid-cols-[1fr_auto_5rem_5rem_1.25rem] gap-x-2 items-center py-1.5 border-b border-gold/5 last:border-0 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground">{h.ticker}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs px-1.5 py-0 h-4 ${
                              h.position === "long"
                                ? "border-emerald-400/50 text-emerald-400"
                                : "border-red-400/50 text-red-400"
                            }`}
                          >
                            {h.position}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{h.name}</p>
                      </div>

                      <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 self-start mt-0.5">
                        {h.type.toUpperCase()}
                      </Badge>

                      <div className="flex justify-end">
                        <PctBadge value={h.daily_pct} />
                      </div>

                      <div className="flex justify-end">
                        <PctBadge value={h.total_pct} />
                      </div>

                      {isOwn ? (
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(h.id); }}
                          disabled={deletingId === h.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                          aria-label="Delete holding"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  ))}

                  {/* "+N more" hint */}
                  {extra > 0 && (
                    <p className="text-xs text-muted-foreground text-center pt-2 pb-0.5">
                      +{extra} more — click to view all
                    </p>
                  )}

                  {/* Average portfolio return */}
                  {avgReturn != null && (
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-gold/10">
                      <span className="text-xs text-muted-foreground">Avg Portfolio Return</span>
                      <span className={`text-sm font-semibold ${avgReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {avgReturn >= 0 ? "+" : ""}{avgReturn.toFixed(2)}%
                      </span>
                    </div>
                  )}
            </div>
          )}
        </CardContent>
      </Card>

      {isOwn && (
        <AddHoldingModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      <PortfolioDetailModal
        member={member}
        holdings={holdings}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        isOwn={isOwn}
        token={token}
        onRefresh={() => { fetchHoldings(); onRefreshLeaderboard(); }}
      />
    </>
  );
}

const Portfolios = () => {
  const { user, token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // ── Leaderboard state ──
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const fetchLeaderboard = useCallback(async (currentMembers: Member[]) => {
    if (!currentMembers.length) return;
    setLeaderboardLoading(true);
    try {
      const results = await Promise.all(
        currentMembers.map(async (m) => {
          try {
            const res = await fetch(apiUrl(`/api/holdings/${m.id}`));
            if (!res.ok) return { member: m, avgReturn: null, count: 0 };
            const holdings: Holding[] = await res.json();
            const withPct = holdings.filter(h => h.total_pct != null);
            const avgReturn = withPct.length
              ? withPct.reduce((s, h) => s + h.total_pct!, 0) / withPct.length
              : null;
            return { member: m, avgReturn, count: holdings.length };
          } catch {
            return { member: m, avgReturn: null, count: 0 };
          }
        })
      );
      setLeaderboard(
        results.sort((a, b) => (b.avgReturn ?? -Infinity) - (a.avgReturn ?? -Infinity))
      );
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch(apiUrl("/api/members"))
      .then((r) => r.json())
      .then((data) => {
        setMembers(data);
        fetchLeaderboard(data);
      })
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, [fetchLeaderboard]);

  const refreshLeaderboard = useCallback(() => {
    fetchLeaderboard(members);
  }, [fetchLeaderboard, members]);

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
              Team Portfolios
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Individual holdings and positions managed by each team member.
          </p>
        </div>

        {!membersLoading && (
          <Leaderboard entries={leaderboard} loading={leaderboardLoading} />
        )}

        {membersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="bg-card/50 backdrop-blur-sm border-gold/20 h-48 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isOwn={user?.id === member.id}
                token={token}
                onRefreshLeaderboard={refreshLeaderboard}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolios;
