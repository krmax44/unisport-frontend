import { defineStore } from 'pinia';
import Fuse from 'fuse.js';

import { data as rawCourses } from './courses.json';
import { data as locations } from './locations.json';
import { strToTime } from '../utils';

export interface CourseSlot {
  id: string;
  prices: number[];
  location: Location | undefined;
  bookable: boolean;
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

export enum Day {
  Monday = 'Mo',
  Tuesday = 'Di',
  Wednesday = 'We',
  Thursday = 'Do',
  Friday = 'Fr',
  Saturday = 'Sa',
  Sunday = 'So',
}
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

async function createShortHash(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .slice(0, 4)
    .join('');
}

const courses: Course[] = await Promise.all(
  rawCourses.map(async (course: any): Promise<Course> => {
    const { description, name, url } = course;

    const slots = course.courses
      .filter((s: any) => s.name !== null)
      .map((slot: any): CourseSlot => {
        let location: Location | undefined;

        const l = locations.find(
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

        const bookable = slot.bookable === 'buchen';

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

const fuse = new Fuse(courses, {
  keys: ['name', 'description'],
  threshold: 0.3,
});

export const useCoursesStore = defineStore('courses', {
  state: () => ({
    courses,
    highlightedCourse: undefined as Course | undefined,
    filters: {
      onlyBookable: true,
      timeSlots: [] as TimeSlot[],
      searchTerm: '',
    },
    paginatedCourses: [] as Course[],
  }),
  actions: {
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
      let { courses } = this;

      if (this.filters.searchTerm.length > 2) {
        courses = fuse.search(this.filters.searchTerm).map((r) => r.item);
      }

      if (this.filters.onlyBookable) {
        courses = courses.filter((course) =>
          course.slots.some((slot) => slot.bookable),
        );
      }

      return courses;
    },
  },
});
