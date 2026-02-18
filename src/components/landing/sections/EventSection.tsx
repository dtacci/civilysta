"use client";

import { Calendar, Download, ExternalLink } from "lucide-react";
import { Button } from "~/components/ui/button";

interface EventConfig {
  title?: string;
  date: string;
  time?: string;
  recurrence: "none" | "weekly" | "biweekly" | "monthly";
  endDate?: string;
}

interface EventSectionProps {
  event: EventConfig;
  causeTitle: string;
  causeDescription?: string;
  causeSlug: string;
  location?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h!, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function recurrenceLabel(recurrence: string, dateStr: string): string | null {
  if (recurrence === "none") return null;
  const date = new Date(dateStr + "T00:00:00");
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  if (recurrence === "weekly") return `Every ${dayName}`;
  if (recurrence === "biweekly") return `Every other ${dayName}`;
  if (recurrence === "monthly") {
    const day = date.toLocaleDateString("en-US", { day: "numeric" });
    return `Monthly on the ${day}${ordinalSuffix(parseInt(day))}`;
  }
  return null;
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0]!;
}

function buildGoogleCalendarUrl(
  event: EventConfig,
  causeTitle: string,
  description?: string,
  location?: string,
): string {
  const title = event.title ?? causeTitle;
  const dateClean = event.date.replace(/-/g, "");

  let startDate: string;
  let endDate: string;

  if (event.time) {
    const timeClean = event.time.replace(":", "") + "00";
    startDate = `${dateClean}T${timeClean}`;
    // Assume 1 hour duration
    const startHour = parseInt(event.time.split(":")[0]!, 10);
    const endHour = (startHour + 1).toString().padStart(2, "0");
    endDate = `${dateClean}T${endHour}${event.time.split(":")[1]}00`;
  } else {
    startDate = dateClean;
    endDate = dateClean;
  }

  let recur = "";
  if (event.recurrence !== "none") {
    if (event.recurrence === "weekly") recur = "RRULE:FREQ=WEEKLY";
    else if (event.recurrence === "biweekly")
      recur = "RRULE:FREQ=WEEKLY;INTERVAL=2";
    else if (event.recurrence === "monthly") recur = "RRULE:FREQ=MONTHLY";
    if (event.endDate) recur += `;UNTIL=${event.endDate.replace(/-/g, "")}`;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startDate}/${endDate}`,
    ...(description ? { details: description } : {}),
    ...(location ? { location } : {}),
    ...(recur ? { recur } : {}),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function EventSection({
  event,
  causeTitle,
  causeDescription,
  causeSlug,
  location,
}: EventSectionProps) {
  const label = recurrenceLabel(event.recurrence, event.date);
  const gcalUrl = buildGoogleCalendarUrl(
    event,
    causeTitle,
    causeDescription,
    location,
  );

  return (
    <section className="border-t px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-4 rounded-lg border bg-card p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold">
              {event.title ?? causeTitle}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {label ? (
                <>
                  {label}
                  {event.time && <> at {formatTime(event.time)}</>}
                  {event.endDate && (
                    <> &middot; through {formatDate(event.endDate)}</>
                  )}
                </>
              ) : (
                <>
                  {formatDate(event.date)}
                  {event.time && <> at {formatTime(event.time)}</>}
                </>
              )}
            </p>
            {location && (
              <p className="mt-0.5 text-sm text-muted-foreground">{location}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={gcalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Google Calendar
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a href={`/api/event/${causeSlug}/calendar.ics`} download>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download .ics
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
