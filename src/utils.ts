import { CourseSlot, TimeSlot } from './store/courses';

export function strToTime(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function timeToStr(time: number): string {
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return `${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
}

export function isInSlot(slot: CourseSlot, timeSlot: TimeSlot) {
  if (slot.time === undefined) {
    return false;
  }

  const { day, start, end } = slot.time;
  const { day: filterDay, start: filterStart, end: filterEnd } = timeSlot!;

  return (
    day === filterDay &&
    start >= filterStart &&
    end <= filterEnd &&
    start <= filterEnd
  );
}
