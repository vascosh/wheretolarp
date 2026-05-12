"use client"

import { cn } from "@/lib/utils"
import { getLocalTimeZone, today } from "@internationalized/date"
import { ComponentProps } from "react"
import {
  Button,
  CalendarCell as CalendarCellRac,
  CalendarGridBody as CalendarGridBodyRac,
  CalendarGridHeader as CalendarGridHeaderRac,
  CalendarGrid as CalendarGridRac,
  CalendarHeaderCell as CalendarHeaderCellRac,
  Calendar as CalendarRac,
  Heading as HeadingRac,
  composeRenderProps,
} from "react-aria-components"
import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons"

interface BaseCalendarProps {
  className?: string
}

type CalendarProps = ComponentProps<typeof CalendarRac> & BaseCalendarProps

const CalendarHeader = () => (
  <header className="flex w-full items-center gap-1 pb-2">
    <Button
      slot="previous"
      className="flex size-8 items-center justify-center text-cream/40 outline-none transition-colors hover:text-champagne focus:outline-none"
    >
      <ChevronLeftIcon width={16} height={16} />
    </Button>
    <HeadingRac className="grow text-center font-sans text-xs tracking-[0.2em] uppercase text-cream/70" />
    <Button
      slot="next"
      className="flex size-8 items-center justify-center text-cream/40 outline-none transition-colors hover:text-champagne focus:outline-none"
    >
      <ChevronRightIcon width={16} height={16} />
    </Button>
  </header>
)

const CalendarGridComponent = () => {
  const now = today(getLocalTimeZone())

  return (
    <CalendarGridRac>
      <CalendarGridHeaderRac>
        {(day) => (
          <CalendarHeaderCellRac className="size-8 p-0 text-center font-sans text-[10px] tracking-wider uppercase text-cream/30">
            {day}
          </CalendarHeaderCellRac>
        )}
      </CalendarGridHeaderRac>
      <CalendarGridBodyRac className="[&_td]:px-0">
        {(date) => (
          <CalendarCellRac
            date={date}
            className={cn(
              "relative flex size-8 cursor-pointer items-center justify-center rounded-sm border border-transparent font-sans text-xs text-cream/70 outline-none transition-all duration-150",
              "hover:bg-champagne/15 hover:text-cream",
              "data-[selected]:border-champagne/40 data-[selected]:bg-champagne/20 data-[selected]:text-champagne",
              "data-[disabled]:pointer-events-none data-[disabled]:opacity-20",
              "data-[unavailable]:pointer-events-none data-[unavailable]:opacity-20",
              "data-[focus-visible]:outline data-[focus-visible]:outline-2 data-[focus-visible]:outline-champagne/50",
              // Today indicator
              date.compare(now) === 0 &&
                "after:absolute after:bottom-1 after:left-1/2 after:size-[3px] after:-translate-x-1/2 after:rounded-full after:bg-champagne after:content-[''] data-[selected]:after:bg-navy",
            )}
          />
        )}
      </CalendarGridBodyRac>
    </CalendarGridRac>
  )
}

const Calendar = ({ className, ...props }: CalendarProps) => {
  return (
    <CalendarRac
      {...props}
      className={composeRenderProps(className, (className) =>
        cn("w-fit", className),
      )}
    >
      <CalendarHeader />
      <CalendarGridComponent />
    </CalendarRac>
  )
}

export { Calendar }
