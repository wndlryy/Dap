import { useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MonthDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => format(new Date(2000, i, 1), "MMM"));

export function MonthDatePicker({ value, onChange }: MonthDatePickerProps) {
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState(value.getFullYear());
    const now = new Date();

    const handleOpenChange = (next: boolean) => {
        setOpen(next);
        if (next) setYear(value.getFullYear());
    };

    const handleSelect = (month: number) => {
        onChange(new Date(year, month, 1));
        setOpen(false);
    };

    const isFuture = (month: number) =>
        year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="h-9 w-full justify-start text-left text-sm font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(value, "MMMM yyyy")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="start">
                <div className="mb-3 flex items-center justify-between">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Previous year"
                        onClick={() => setYear((y) => y - 1)}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium tabular-nums">{year}</span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Next year"
                        disabled={year >= now.getFullYear()}
                        onClick={() => setYear((y) => y + 1)}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {MONTHS.map((label, month) => {
                        const selected = value.getFullYear() === year && value.getMonth() === month;
                        return (
                            <Button
                                key={label}
                                type="button"
                                variant={selected ? "default" : "ghost"}
                                size="sm"
                                disabled={isFuture(month)}
                                className={cn("h-9", !selected && "font-normal")}
                                onClick={() => handleSelect(month)}
                            >
                                {label}
                            </Button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}