import { defineStore } from 'pinia';
import { UseOffsetPaginationReturn, useOffsetPagination } from '@vueuse/core';
import type Fuse from 'fuse.js';
import { groupBy } from 'lodash-es';

import { slotFitsFilter, uniqueCourses } from '../../utils';
import { loadCourses } from './loadCourses';

export type BookingStatus = 'bookable' | 'waitlist';

export interface CourseLocation {
  name: string;
  lon: number;
  lat: number;
  url: string;
}

export interface CourseSlot {
  id: string;
  prices: number[];
  location?: CourseLocation;
  bookable?: BookingStatus;
  name: string;
  time?: TimeSlot;
  dayStr: string;
  timeStr: string;
  date: string;
}

export interface Course {
  id: string;
  name: string;
  url: string;
  description: string;
  provider: Provider;
  slots: CourseSlot[];
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

export enum Provider {
  'buchung.hochschulsport-potsdam.de' = 'Uni Potsdam',
  'sport.htw-berlin.de' = 'HTW Berlin',
  'www.buchsys.de' = 'FU Berlin',
  'www.tu-sport.de' = 'TU Berlin',
  'zeh02.beuth-hochschule.de' = 'BHT Berlin',
  'zeh2.zeh.hu-berlin.de' = 'HU Berlin',
}

export interface Filters {
  bookable: BookingStatus[];
  day: Day | 'all';
  start: string;
  end: string;
  searchTerm: string;
}

export interface CourseEvent {
  course: Course;
  slot: CourseSlot;
  location?: CourseLocation;
}

export const useCourseStore = defineStore('courses', {
  state: () => ({
    loaded: false,
    error: false,

    courses: [] as Course[], // all courses
    locations: [] as CourseLocation[],
    eventsByLocation: {} as Record<string, CourseEvent[]>,

    // moused-over course
    highlightedCourse: undefined as Course | undefined,

    // course selected for detail view
    selectedCourse: undefined as Course | undefined,

    filters: {
      bookable: ['bookable'],
      day: 'all',
      start: '',
      end: '',
      searchTerm: '',
    } as Filters,

    fuse: undefined as Fuse<Course> | undefined,
  }),
  actions: {
    loadCourses,
    coursesAtLocation(location: CourseLocation): Course[] {
      return this.eventsByLocation[location.url]?.flatMap(
        (event) => event.course,
      );
    },
  },
  getters: {
    courseEvents(): CourseEvent[] {
      return this.courses.flatMap((course) =>
        course.slots.map((slot) => ({ course, slot, location: slot.location })),
      );
    },
    filteredCourseEvents(): CourseEvent[] {
      if (this.loaded === false || this.error === true) return [];

      let foundCourses: string[];

      if (this.filters.searchTerm.length > 2) {
        foundCourses = this.fuse!.search(this.filters.searchTerm).map(
          (r) => r.item.id,
        );
      }

      return this.courseEvents.filter((event) => {
        if (foundCourses?.includes(event.course.id) === false) return false;

        return slotFitsFilter(event.slot, this.filters);
      });
    },
    filteredCourses(): Course[] {
      return uniqueCourses(this.filteredCourseEvents);
    },
    pagination(): UseOffsetPaginationReturn {
      return useOffsetPagination({
        total: this.filteredCourses.length,
        page: 1,
        pageSize: 50,
      });
    },
    paginatedCourses(): Course[] {
      const { currentPage, currentPageSize } = this.pagination;

      return this.filteredCourses.slice(
        currentPage.value,
        currentPage.value + currentPageSize.value,
      );
    },
    filteredCourseEventsByLocation(): Record<string, Required<CourseEvent>[]> {
      let eventsByLocation = groupBy(
        this.filteredCourseEvents,
        (event) => event.location?.url,
      );
      delete eventsByLocation.undefined;

      return eventsByLocation as Record<string, Required<CourseEvent>[]>;
    },
  },
});
