import { CourseSlot, Filters, TimeSlot } from './store/courses';

export function strToTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function timeToStr(time: number): string {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
}

export function slotFitsFilter(slot: CourseSlot, filters: Filters): boolean {
  const bookable =
    filters.bookable.length === 0 ||
    (slot.bookable !== undefined && filters.bookable.includes(slot.bookable));

  const day = filters.day === 'all' || slot.time?.day === filters.day;

  const start =
    filters.start === '' ||
    (slot.time?.start !== undefined &&
      slot.time!.start >= strToTime(filters.start));

  const end =
    filters.end === '' ||
    (slot.time?.end !== undefined &&
      slot.time!.end <= strToTime(filters.end) &&
      slot.time!.start <= strToTime(filters.end));

  return bookable && day && start && end;
}
