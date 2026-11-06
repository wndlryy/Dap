import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { DayDatePicker } from "./day-date-picker";
import { WeekDatePicker } from "./week-date-picker";

type ExportType = "day" | "week" | "month";

interface Category {
    id: number;
    name: string;
}

interface ItemExportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categories: Category[];
    defaultSearch?: string;
    defaultCategory?: string;
}

function thisMonthIso() {
    return new Date().toISOString().slice(0, 7);
}

export function ItemExportDialog({
    open,
    onOpenChange,
    categories,
    defaultSearch = "",
    defaultCategory = "all",
}: ItemExportDialogProps) {
    const [type, setType] = useState<ExportType>("month");
    const [pickedDate, setPickedDate] = useState<Date>(new Date());
    const [month, setMonth] = useState(thisMonthIso());
    const [search, setSearch] = useState(defaultSearch);
    const [category, setCategory] = useState(defaultCategory);
    const [exporting, setExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    function downloadName(): string {
        if (type === "month") return `ending-inventory-${month}.pdf`;
        const d = format(pickedDate, "yyyy-MM-dd");
        return type === "week" ? `weekly-inventory-${d}.pdf` : `daily-inventory-${d}.pdf`;
    }

    async function handleExport() {
        setError(null);
        setExporting(true);
        setProgress(0);

        const params: Record<string, string> = { type };

        if (type === "month") {
            params.month = month;
        } else {
            params.date = format(pickedDate, "yyyy-MM-dd");
        }

        if (search.trim()) params.search = search.trim();
        if (category && category !== "all") params.category = category;

        try {
            const response = await fetch(
                `${route("items.export")}?${new URLSearchParams(params).toString()}`,
                { credentials: "same-origin" },
            );

            if (!response.ok || !response.body) {
                throw new Error("Export failed");
            }

            const contentLength = response.headers.get("Content-Length");
            const total = contentLength ? parseInt(contentLength, 10) : 0;

            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let received = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                chunks.push(value);
                received += value.length;

                if (total > 0) {
                    setProgress(Math.round((received / total) * 100));
                }
            }

            const blob = new Blob(chunks as BlobPart[]);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = downloadName();
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            toast.success("Report downloaded successfully");
            onOpenChange(false);
        } catch (e) {
            console.error(e);
            setError("Something went wrong generating the report. Please try again.");
            toast.error("Failed to generate the report");
        } finally {
            setExporting(false);
            setProgress(0);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !exporting && onOpenChange(v)}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Export Inventory Report</DialogTitle>
                    <DialogDescription>
                        Generates a PDF of ending inventory for the selected period.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label>Report type</Label>
                        <Select
                            value={type}
                            onValueChange={(v) => setType(v as ExportType)}
                            disabled={exporting}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Daily</SelectItem>
                                <SelectItem value="week">Weekly</SelectItem>
                                <SelectItem value="month">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {type === "month" && (
                        <div className="grid gap-2">
                            <Label htmlFor="export-month">Month</Label>
                            <Input
                                id="export-month"
                                type="month"
                                value={month}
                                max={thisMonthIso()}
                                disabled={exporting}
                                onChange={(e) => setMonth(e.target.value)}
                            />
                        </div>
                    )}

                    {type === "week" && (
                        <div className="grid gap-2">
                            <Label>Any date in the week</Label>
                            <WeekDatePicker value={pickedDate} onChange={setPickedDate} />
                        </div>
                    )}

                    {type === "day" && (
                        <div className="grid gap-2">
                            <Label>Date</Label>
                            <DayDatePicker value={pickedDate} onChange={setPickedDate} />
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="export-search">Search filter (optional)</Label>
                        <Input
                            id="export-search"
                            value={search}
                            disabled={exporting}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter by item name..."
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Category filter</Label>
                        <Select value={category} onValueChange={setCategory} disabled={exporting}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {exporting && (
                        <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}

                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
                        Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={exporting}>
                        <Download className="h-4 w-4" />
                        {exporting ? `Exporting... ${progress}%` : "Download PDF"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}