import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchResult {
  symbol: string;
  name: string;
  quoteType: string;
  exchange: string;
}

const schema = z.object({
  ticker: z
    .string()
    .min(1, "Ticker is required")
    .max(10, "Ticker too long")
    .transform((v) => v.toUpperCase().trim()),
  type: z.enum(["stock", "etf"], { required_error: "Select a type" }),
  position: z.enum(["long", "short"], { required_error: "Select a position" }),
  purchase_price: z
    .string()
    .min(1, "Purchase price is required")
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
      message: "Must be a positive number",
    }),
});

type FormValues = z.infer<typeof schema>;

interface AddHoldingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddHoldingModal({ open, onClose, onSuccess }: AddHoldingModalProps) {
  const { token } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ticker: "",
      purchase_price: "",
    },
  });

  function handleTickerChange(value: string, fieldOnChange: (v: string) => void) {
    fieldOnChange(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value) {
      setSearchResults([]);
      setDropdownOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/holdings/search?q=${encodeURIComponent(value)}`);
        const data: SearchResult[] = await res.json();
        setSearchResults(data);
        setDropdownOpen(data.length > 0);
      } catch {
        setSearchResults([]);
        setDropdownOpen(false);
      }
    }, 300);
  }

  function handleSelect(result: SearchResult, fieldOnChange: (v: string) => void) {
    fieldOnChange(result.symbol);
    form.setValue('type', result.quoteType === 'ETF' ? 'etf' : 'stock');
    setDropdownOpen(false);
    setSearchResults([]);
  }

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ticker: values.ticker,
          type: values.type,
          position: values.position,
          purchase_price: parseFloat(values.purchase_price),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add holding");
      }

      form.reset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Failed to add holding");
    }
  }

  function handleClose() {
    form.reset();
    setServerError(null);
    setDropdownOpen(false);
    setSearchResults([]);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-card border-gold/30 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gold text-xl">Add Holding</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="ticker"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticker Symbol</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        onChange={e => handleTickerChange(e.target.value, field.onChange)}
                        onBlur={() => {
                          field.onBlur();
                          // small delay so a click on a result fires before the dropdown closes
                          setTimeout(() => setDropdownOpen(false), 150);
                        }}
                        placeholder="e.g. AAPL"
                        className="bg-background/50 border-gold/30 focus:border-gold uppercase"
                        autoComplete="off"
                      />
                      {dropdownOpen && searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-gold/20 bg-card shadow-lg overflow-hidden">
                          {searchResults.map(r => (
                            <button
                              key={r.symbol}
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gold/10 cursor-pointer"
                              onMouseDown={e => {
                                // prevent input blur from firing before onClick
                                e.preventDefault();
                                handleSelect(r, field.onChange);
                              }}
                            >
                              <span className="font-mono font-semibold">{r.symbol}</span>
                              <span className="text-muted-foreground truncate">{r.name}</span>
                              <span className="ml-auto text-xs text-muted-foreground shrink-0">{r.exchange}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 border-gold/30">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="etf">ETF</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background/50 border-gold/30">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purchase_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Price ($)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 150.00"
                      className="bg-background/50 border-gold/30 focus:border-gold"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {serverError && (
              <p className="text-sm text-red-400">{serverError}</p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 border-gold/30 hover:bg-gold/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex-1 bg-gold hover:bg-gold/90 text-navy font-semibold"
              >
                {form.formState.isSubmitting ? "Adding..." : "Add Holding"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
