import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, isSameWeek } from "date-fns";

interface WeekDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

export function WeekDatePicker({ value, onChange }: WeekDatePickerProps) {
    const [open, setOpen] = useState(false);

    const weekStart = startOfWeek(value, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(value, { weekStartsOn: 1 });

    const handleSelect = (date: Date | undefined) => {
        if (!date) return;
        onChange(date);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className="h-9 w-full justify-start text-sm font-normal"
                >
                    {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={handleSelect}
                    weekStartsOn={1}
                    disabled={(date) => date > new Date()}
                    modifiers={{
                        selectedWeek: (day) =>
                            isSameWeek(day, value, { weekStartsOn: 1 }),
                    }}
                    modifiersClassNames={{
                        selectedWeek:
                            "bg-accent text-accent-foreground rounded-none",
                    }}
                />
            </PopoverContent>
        </Popover>
    );
}