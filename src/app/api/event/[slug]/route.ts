import { NextResponse } from "next/server";
import ical, { ICalCalendarMethod, ICalEventRepeatingFreq } from "ical-generator";
import { db } from "~/server/db";

interface EventConfig {
  title?: string;
  date: string;
  time?: string;
  recurrence: "none" | "weekly" | "biweekly" | "monthly";
  endDate?: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const cause = await db.cause.findUnique({
    where: { slug },
    include: { landingPage: true },
  });

  if (!cause || !cause.landingPage) {
    return new NextResponse("Not found", { status: 404 });
  }

  const config = (cause.landingPage.config ?? {}) as Record<string, unknown>;
  const event = config.event as EventConfig | undefined;

  if (!event?.date) {
    return new NextResponse("No event configured", { status: 404 });
  }

  const title = event.title ?? cause.title;
  const location = (config.location as string) ?? undefined;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://civilysta.com";

  const startDate = event.time
    ? new Date(`${event.date}T${event.time}:00`)
    : new Date(`${event.date}T00:00:00`);

  const endDate = new Date(startDate);
  if (event.time) {
    endDate.setHours(endDate.getHours() + 1);
  } else {
    endDate.setDate(endDate.getDate() + 1);
  }

  const cal = ical({ name: title, method: ICalCalendarMethod.PUBLISH });

  const icalEvent = cal.createEvent({
    start: startDate,
    end: endDate,
    allDay: !event.time,
    summary: title,
    description: cause.description,
    location,
    url: `${siteUrl}/p/${slug}`,
  });

  if (event.recurrence !== "none") {
    const freqMap: Record<string, ICalEventRepeatingFreq> = {
      weekly: ICalEventRepeatingFreq.WEEKLY,
      biweekly: ICalEventRepeatingFreq.WEEKLY,
      monthly: ICalEventRepeatingFreq.MONTHLY,
    };

    const rule: { freq: ICalEventRepeatingFreq; interval?: number; until?: Date } = {
      freq: freqMap[event.recurrence]!,
    };

    if (event.recurrence === "biweekly") {
      rule.interval = 2;
    }

    if (event.endDate) {
      rule.until = new Date(`${event.endDate}T23:59:59`);
    }

    icalEvent.repeating(rule);
  }

  const icsContent = cal.toString();

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
