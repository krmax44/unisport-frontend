import { defineStore } from 'pinia';
import Fuse from 'fuse.js';

import { slotFitsFilter, strToTime } from '../utils';

type BookingStatus = 'bookable' | 'waitlist';
export interface CourseSlot {
  id: string;
  prices: number[];
  location: Location | undefined;
  bookable: BookingStatus | undefined;
  name: string;
  time: TimeSlot | undefined;
  dayStr: string;
  timeStr: string;
}

export interface Course {
  id: string;
  name: string;
  url: string;
  description: string;
  provider: Provider;
  slots: CourseSlot[];
}

export interface Location {
  name: string;
  lon: number;
  lat: number;
  url: string;
  aliases: string[];
}

export const DAYS = {
  Mo: 'Montag',
  Di: 'Dienstag',
  Mi: 'Mittwoch',
  Do: 'Donnerstag',
  Fr: 'Freitag',
  Sa: 'Samstag',
  So: 'Sonntag',
};
export type Day = keyof typeof DAYS;

export interface TimeSlot {
  day: Day;
  start: number;
  end: number;
}

enum Provider {
  'buchung.hochschulsport-potsdam.de' = 'Uni Potsdam',
  'sport.htw-berlin.de' = 'HTW Berlin',
  'www.buchsys.de' = 'FU Berlin',
  'www.tu-sport.de' = 'TU Berlin',
  'zeh02.beuth-hochschule.de' = 'BTH Berlin',
  'zeh2.zeh.hu-berlin.de' = 'HU Berlin',
}

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

export interface Filters {
  bookable: BookingStatus[];
  day: Day | 'all';
  start: string;
  end: string;
  searchTerm: string;
}

export const useCoursesStore = defineStore('courses', {
  state: () => ({
    loaded: false,
    error: false,
    courses: [] as Course[],
    highlightedCourse: undefined as Course | undefined,
    filters: {
      bookable: ['bookable'],
      day: 'all',
      start: '',
      end: '',
      searchTerm: '',
    } as Filters,
    paginatedCourses: [] as Course[],
    fuse: undefined as Fuse<Course> | undefined,
  }),
  actions: {
    async loadCourses() {
      let courseData: any[];
      let locationData: any[];

      try {
        try {
          const cache = localStorage.getItem('unisport-cache');
          const { courses, locations, timestamp } = JSON.parse(cache!);
          if (Date.now() - timestamp > 1000 * 60 * 60 * 24) {
            throw new Error('Cache expired');
          }

          courseData = courses;
          locationData = locations;
          console.log('Loaded from cache');
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
                let location: Location | undefined;

                const l = locationData.find(
                  (location: any) => location.name === slot.place,
                );
                if (l !== undefined) {
                  location = {
                    ...l,
                    aliases: [],
                  };
                }

                const prices = [];
                const priceRegex = /.*?([\d,\.]+)/;
                let m;
                while (
                  (m = priceRegex.exec(slot.price)) !== null &&
                  prices.length < 4
                ) {
                  prices.push(parseFloat(m[1].replace(',', '.')));
                }

                const bookable = Object.entries(bookingFilter).find(
                  ([_, values]) => values.includes(slot.bookable),
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

        localStorage.setItem(
          'unisport-cache',
          JSON.stringify({
            courses: courseData,
            locations: locationData,
            timestamp: Date.now(),
          }),
        );
      } catch (e) {
        console.error(e);
        this.error = true;
        localStorage.removeItem('unisport-cache');
      }

      this.loaded = true;

      this.fuse = new Fuse(this.courses, {
        keys: ['name', 'description'],
        threshold: 0.3,
      });
    },
    filter() {},
    paginateCourses(from: number, to: number) {
      this.paginatedCourses = this.filteredCourses.slice(from, to);
    },
    setHighlightedCourse(course: Course | undefined) {
      this.highlightedCourse = course;
    },
    getPriceRange(course: Course): [number, number] | undefined {
      const prices = course.slots
        .map((slot) => slot.prices[0]) // only use student prices for now
        .filter((p) => p !== undefined);

      return prices.length !== 0
        ? [Math.min(...prices), Math.max(...prices)]
        : undefined;
    },
  },
  getters: {
    filteredCourses(): Course[] {
      if (this.loaded === false || this.error === true) return [];

      let { courses } = this;

      if (this.filters.searchTerm.length > 2) {
        courses = this.fuse!.search(this.filters.searchTerm).map((r) => r.item);
      }

      const filterByBookable = this.filters.bookable.length !== 0;
      const filterByTime =
        this.filters.day !== 'all' ||
        this.filters.start !== '' ||
        this.filters.end !== '';

      if (!filterByBookable && !filterByTime) return courses;

      return courses.filter((course) =>
        course.slots.some((slot) => slotFitsFilter(slot, this.filters)),
      );
    },
  },
});
