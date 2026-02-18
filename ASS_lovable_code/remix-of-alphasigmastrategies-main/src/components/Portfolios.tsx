import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AddHoldingModal } from "@/components/AddHoldingModal";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Plus, Trash2 } from "lucide-react";

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

interface MemberCardProps {
  member: Member;
  isOwn: boolean;
  token: string | null;
}

function MemberCard({ member, isOwn, token }: MemberCardProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHoldings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/holdings/${member.id}`);
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
      const res = await fetch(`/api/holdings/${holdingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await fetchHoldings();
      }
    } finally {
      setDeletingId(null);
    }
  }

  const firstName = member.name.split(" ")[0];

  return (
    <>
      <Card className="bg-card/50 backdrop-blur-sm border-gold/20 hover:border-gold/40 transition-all duration-300 flex flex-col">
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
            {isOwn && (
              <Button
                size="sm"
                onClick={() => setAddModalOpen(true)}
                className="bg-gold hover:bg-gold/90 text-navy font-semibold h-8 px-3"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            )}
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
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-xs text-muted-foreground font-medium pb-1 border-b border-gold/10 mb-1">
                <span>Ticker</span>
                <span>Type</span>
                <span className="text-right">Daily</span>
                <span className="text-right">Total</span>
              </div>

              {/* Rows */}
              {holdings.map((h) => (
                <div
                  key={h.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center py-1.5 border-b border-gold/5 last:border-0 group"
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

                  <Badge
                    variant="secondary"
                    className="text-xs px-1.5 py-0 h-5 self-start mt-0.5"
                  >
                    {h.type.toUpperCase()}
                  </Badge>

                  <div className="text-right">
                    <PctBadge value={h.daily_pct} />
                  </div>

                  <div className="text-right flex items-center gap-1">
                    <PctBadge value={h.total_pct} />
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(h.id)}
                        disabled={deletingId === h.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 ml-1"
                        aria-label="Delete holding"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isOwn && (
        <AddHoldingModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onSuccess={fetchHoldings}
        />
      )}
    </>
  );
}

const Portfolios = () => {
  const { user, token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => setMembers(data))
      .catch(() => {})
      .finally(() => setMembersLoading(false));
  }, []);

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
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Portfolios;
