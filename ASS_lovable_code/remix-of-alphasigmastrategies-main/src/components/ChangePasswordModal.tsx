import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Password change failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // Non-dismissible — do nothing
      }}
    >
      <DialogContent
        className="bg-card border border-gold/30 text-foreground sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-5 w-5 text-gold" />
            <DialogTitle className="text-gold text-lg font-semibold">
              Change Your Password
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            You're using a temporary password. Please set a new password to continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="current-password" className="text-sm text-muted-foreground">
              Current Password
            </Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-background border-gold/30 focus:border-gold focus:ring-gold/20 text-foreground"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="new-password" className="text-sm text-muted-foreground">
              New Password
            </Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-background border-gold/30 focus:border-gold focus:ring-gold/20 text-foreground"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirm-password" className="text-sm text-muted-foreground">
              Confirm New Password
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-background border-gold/30 focus:border-gold focus:ring-gold/20 text-foreground"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gold hover:bg-amber-500 text-navy font-semibold transition-colors"
          >
            {loading ? "Saving..." : "Set New Password"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
