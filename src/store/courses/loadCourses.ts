import Fuse from 'fuse.js';
import {
  useCourseStore,
  Course,
  CourseSlot,
  BookingStatus,
  Provider,
  CourseLocation,
} from '.';
import { strToTime } from '../../utils';

const bookingFilter = {
  bookable: [
    'buchen',
    'nur über Büro',
    'Karte kaufen',
    'anmeldefrei',
    'buchen 🔒',
    'Basisangebot',
    'siehe Text',
    'Kursdaten',
    'ohne Anmeldung',
  ],
  waitlist: ['Warteliste', 'Warteliste 🔒'],
} as Record<BookingStatus, string[]>;

async function createShortHash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .slice(0, 4)
    .join('');
}

const LOCAL_STORAGE_KEY = 'unisport-cache';

export async function loadCourses(this: ReturnType<typeof useCourseStore>) {
  let courseData: any[];
  let locationData: any[];

  try {
    try {
      const cache = localStorage.getItem(LOCAL_STORAGE_KEY);
      const { courses, locations, timestamp } = JSON.parse(cache!);
      if (Date.now() - timestamp > 1000 * 60 * 60 * 24) {
        throw new Error('Cache expired');
      }

      courseData = courses;
      locationData = locations;
    } catch (e) {
      const [_courses, _locations] = await Promise.all(
        [
          'https://api.unisport.berlin/classes',
          'https://api.unisport.berlin/locations',
        ].map((url) =>
          fetch(url)
            .then((r) => r.json())
            .then((r) => r.data),
        ),
      );

      courseData = _courses;
      locationData = _locations;
    }

    this.courses = await Promise.all(
      courseData.map(async (course: any): Promise<Course> => {
        const { description, name, url } = course;

        const slots = course.courses
          .filter((s: any) => s.name !== null)
          .map((slot: any): CourseSlot => {
            const location = locationData.find(
              (location: any) => location.name === slot.place,
            ) as CourseLocation | undefined;

            const prices = [];
            const priceRegex = /.*?([\d,\.]+)/;
            let m;
            while (
              (m = priceRegex.exec(slot.price)) !== null &&
              prices.length < 4
            ) {
              prices.push(parseFloat(m[1].replace(',', '.')));
            }

            const bookable = Object.entries(bookingFilter).find(([_, values]) =>
              values.includes(slot.bookable),
            )?.[0] as BookingStatus | undefined;

            let time;
            if (
              slot.day !== null &&
              slot.time !== null &&
              slot.time.includes('-')
            ) {
              const [start, end] = slot.time.split('-').map(strToTime);
              time = {
                day: slot.day,
                start,
                end,
              };
            }

            return {
              id: crypto.randomUUID(),
              name: slot.name,
              prices,
              location,
              bookable,
              time,
              timeStr: slot.time,
              dayStr: slot.day,
              date: slot.timeframe,
            };
          });

        const host = new URL(url).hostname;
        const provider = Provider[host as keyof typeof Provider];

        return {
          id: await createShortHash(url),
          description,
          name,
          url,
          provider,
          slots,
        };
      }),
    );

    for (const course of this.courses) {
      for (const slot of course.slots) {
        if (slot.location === undefined) continue;

        this.eventsByLocation[slot.location.url] ??= [];
        this.eventsByLocation[slot.location.url].push({
          course,
          slot,
          location: slot.location,
        });
      }
    }

    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        courses: courseData,
        locations: locationData,
        timestamp: Date.now(),
      }),
    );
  } catch (e) {
    console.error(e);
    this.error = true;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }

  this.loaded = true;

  this.fuse = new Fuse(this.courses, {
    keys: [
      { name: 'name', weight: 1 },
      {
        name: 'description',
        weight: 0.5,
      },
      { name: 'slots.location.name', weight: 0.3 },
    ],
    threshold: 0.3,
  });
}
