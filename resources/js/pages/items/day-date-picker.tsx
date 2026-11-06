import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DayDatePickerProps {
    value: Date;
    onChange: (date: Date) => void;
}

export function DayDatePicker({ value, onChange }: DayDatePickerProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "h-9 w-full justify-start text-left text-sm font-normal",
                        !value && "text-muted-foreground",
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {value ? format(value, "MMM d, yyyy") : "Pick a date"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={value}
                    onSelect={(date) => date && onChange(date)}
                    disabled={(date) => date > new Date()}
                />
            </PopoverContent>
        </Popover>
    );
}