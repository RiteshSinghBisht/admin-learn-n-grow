"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "flex w-full flex-col gap-4",
        nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 border-border/80 bg-white/70 p-0 text-foreground/85 hover:bg-white dark:border-white/20 dark:bg-white/[0.08] dark:text-foreground",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 border-border/80 bg-white/70 p-0 text-foreground/85 hover:bg-white dark:border-white/20 dark:bg-white/[0.08] dark:text-foreground",
        ),
        month_caption: "flex h-8 items-center justify-center px-9",
        caption_label: "text-sm font-medium tracking-tight",
        table: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-center text-[0.78rem] font-medium text-muted-foreground",
        weeks: "mt-2",
        week: "mt-1 flex w-full",
        day: "relative h-9 w-9 p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 rounded-md p-0 text-sm font-normal text-foreground/90 hover:bg-accent hover:text-foreground aria-selected:opacity-100 dark:text-foreground",
        ),
        selected:
          "rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "rounded-md bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-45",
        disabled: "text-muted-foreground opacity-35",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", chevronClassName)} {...chevronProps} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
