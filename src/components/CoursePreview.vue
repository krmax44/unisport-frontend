<template>
  <a
    href="#!"
    class="block group focus:outline-none focus:ring focus:ring-green-500 transition-all rounded shadow border"
    title="Details zum Kurs…"
    @click.prevent="coursesStore.selectedCourse = course"
  >
    <article
      class="p-4 border-gray-300 group-hover:bg-green-50/50 dark:group-hover:bg-green-900/50 h-full space-y-2"
      @mouseover="coursesStore.setHighlightedCourse(course)"
      @mouseout="coursesStore.setHighlightedCourse(undefined)"
    >
      <h3 class="text-lg font-semibold">{{ course.name }}</h3>
      <dl>
        <dt>Anbieter*in</dt>
        <dd>
          <i-material-symbols-school-outline-rounded />
          {{ course.provider }}
        </dd>

        <template v-if="priceRange !== undefined">
          <dt>Preis</dt>
          <dd>
            <i-material-symbols-euro-rounded />
            {{ priceRange[0] }}
            <template v-if="priceRange[0] !== priceRange[1]">
              –
              {{ priceRange[1] }}
            </template>
          </dd>
        </template>
      </dl>

      <ul class="flex gap-2 pt-2 overflow-auto md:flex-wrap snap-x">
        <li
          v-for="slot in slots"
          :key="slot.id"
          class="p-2 rounded-md flex flex-col items-center content-center snap-start"
          :class="[
            slot.bookable === 'bookable' && 'bg-green-300/50',
            slot.bookable === 'waitlist' && 'bg-red-300/50',
          ]"
          :aria-label="`${slot.time?.day ? DAYS[slot.time?.day] : slot.dayStr}, um ${slot.time?.start ? timeToStr(slot.time.start) : slot.timeStr} Uhr${slot.time?.end && ' bis ' + timeToStr(slot.time?.end) + ' Uhr'}`"
        >
          <span class="uppercase text-sm font-bold">
            {{ slot.time?.day ?? slot.dayStr }}
          </span>

          <SlotTime :slot="slot" />
        </li>
      </ul>
    </article>
  </a>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Course, useCoursesStore, DAYS } from '../store/courses.ts';
import { slotFitsFilter, timeToStr } from '../utils';
import SlotTime from './SlotTime.vue';

const coursesStore = useCoursesStore();

const props = defineProps<{
  course: Course;
}>();

const slots = computed(() =>
  props.course.slots
    .filter(
      (s) =>
        s.dayStr !== '' &&
        s.timeStr !== '' &&
        slotFitsFilter(s, coursesStore.filters),
    )
    .sort((s) => (s.bookable === 'bookable' ? -1 : 1)),
);

const priceRange = computed(() => coursesStore.getPriceRange(props.course));
</script>

<style scoped>
span {
  @apply whitespace-nowrap inline-block;
}
</style>
