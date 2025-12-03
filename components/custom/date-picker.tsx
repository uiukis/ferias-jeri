"use client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, getDaysInMonth, isDate, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X as ClearIcon } from "lucide-react";
import * as React from "react";

export type DateRange = { from: Date | null; to: Date | null };

export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRange;
  onChange: (r: DateRange) => void;
  className?: string;
}) {
  const toInputValue = (d: Date | null) =>
    d
      ? new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 10)
      : "";
  const parseInput = (v: string) => (v ? new Date(v + "T00:00:00") : null);

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="date_from">De</Label>
          <Input
            id="date_from"
            type="date"
            value={toInputValue(value.from)}
            onChange={(e) =>
              onChange({ ...value, from: parseInput(e.target.value) })
            }
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date_to">Até</Label>
          <Input
            id="date_to"
            type="date"
            value={toInputValue(value.to)}
            onChange={(e) =>
              onChange({ ...value, to: parseInput(e.target.value) })
            }
          />
        </div>
      </div>
    </div>
  );
}

type DatePickerProps = {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
  placeholder?: string;
  label?: string;
  id?: string;
  markAsRequired?: boolean;
  size?: "default" | "sm" | "lg" | "xl";
  errors?: string;
  disabled?: boolean;
};

const formatDate = (d: Date, fmt: string, _useLocale?: boolean) => {
  void _useLocale;
  return format(d, fmt, { locale: ptBR });
};

export function DatePicker({
  date,
  setDate,
  className,
  placeholder,
  label,
  id,
  markAsRequired = false,
  size = "default",
  errors,
  disabled = false,
}: DatePickerProps) {
  const [inputValue, setInputValue] = React.useState<string>("");
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (date && isValid(date)) {
      setInputValue(formatDate(date, "dd/MM/yyyy", true));
    } else {
      setInputValue("");
    }
  }, [date]);

  const formatDateInput = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, "");

    if (numbers.length === 0) return "";

    let day = numbers.substring(0, 2);
    let month = numbers.length > 2 ? numbers.substring(2, 4) : "";
    let year = numbers.length > 4 ? numbers.substring(4, 8) : "";

    if (day.length === 2) {
      const dayNum = Number.parseInt(day, 10);
      if (dayNum < 1) day = "01";
      else if (dayNum > 31) day = "31";
    }

    if (month.length === 2) {
      const monthNum = Number.parseInt(month, 10);
      if (monthNum < 1) month = "01";
      else if (monthNum > 12) month = "12";
    }

    if (year.length === 4) {
      let yearNum = Number.parseInt(year, 10);
      if (yearNum < 1900) yearNum = 1900;
      if (yearNum > 2100) yearNum = 2100;
      year = yearNum.toString();
    }

    if (day.length === 2 && (year.length === 4 || year.length === 0)) {
      const dayNum = Number.parseInt(day, 10);
      const yearNum =
        year.length === 4
          ? Number.parseInt(year, 10)
          : new Date().getFullYear();
      const tempDate = new Date(yearNum, Number.parseInt(month, 10) - 1, 1);
      const daysInMonth = getDaysInMonth(tempDate);
      if (dayNum > daysInMonth) {
        day = daysInMonth.toString().padStart(2, "0");
      }
    }

    if (numbers.length <= 2) {
      return day;
    } else if (numbers.length <= 4) {
      return `${day}/${month}`;
    } else {
      return `${day}/${month}/${year}`;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatDateInput(rawValue);
    setInputValue(formattedValue);

    if (formattedValue.length < 10) {
      setDate(undefined);
      return;
    }

    if (formattedValue.length === 10) {
      try {
        const parsedDate = parse(formattedValue, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate) && isDate(parsedDate)) {
          setDate(parsedDate);
        }
      } catch {
        setDate(undefined);
      }
    }
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      setInputValue(formatDate(selectedDate, "dd/MM/yyyy", true));
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (inputValue.length === 10) {
        try {
          const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date());
          if (isValid(parsedDate) && isDate(parsedDate)) {
            setDate(parsedDate);
            e.currentTarget.blur();
          }
        } catch {
          setDate(undefined);
        }
      }
    }
  };

  const handleBlur = () => {
    if (inputValue.length === 10) {
      try {
        const parsedDate = parse(inputValue, "dd/MM/yyyy", new Date());
        if (!isValid(parsedDate) || !isDate(parsedDate)) {
          setDate(undefined);
        }
      } catch {
        setDate(undefined);
      }
    }
  };

  return (
    <div className={className ? className : "flex flex-col gap-2"}>
      <Popover open={open} onOpenChange={setOpen}>
        {label && (
          <Label
            data-size={size}
            className="text-sm font-normal data-[size=lg]:font-medium data-[size=xl]:font-medium"
            htmlFor={id}
          >
            {label} {markAsRequired && <span className="text-red-500">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            id={id}
            type="text"
            disabled={disabled}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="pr-20 bg-white"
          />
          {inputValue && (
            <Button
              variant="ghost"
              disabled={disabled}
              size="icon"
              className="absolute right-10 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
              aria-label="Limpar data"
              onClick={() => {
                setDate(undefined);
                setInputValue("");
              }}
            >
              <ClearIcon className="size-4" />
            </Button>
          )}
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              disabled={disabled}
              size="icon"
              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
              aria-label="Abrir calendário"
            >
              <CalendarIcon className="size-4" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            disabled={disabled}
            mode="single"
            selected={date}
            onSelect={handleCalendarSelect}
            initialFocus
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
      <span className="text-xs text-red-500">{errors}</span>
    </div>
  );
}
