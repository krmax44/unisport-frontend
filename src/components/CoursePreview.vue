<template>
  <a href="#!" class="group">
    <article
      class="p-4 rounded shadow border border-gray-300 group-hover:bg-green-50/50 dark:group-hover:bg-green-900/50 h-full space-y-2"
      @mouseover="coursesStore.setHighlightedCourse(course)"
      @mouseout="coursesStore.setHighlightedCourse(undefined)"
    >
      <h3 class="text-lg font-semibold">{{ course.name }}</h3>
      <dl class="flex gap-4">
        <dt>Anbieter*in</dt>
        <dd>
          <i-material-symbols-school-outline-rounded class="mr-1" />
          {{ course.provider }}
        </dd>

        <template v-if="priceRange !== undefined">
          <dt>Preis</dt>
          <dd>
            <i-material-symbols-euro-rounded class="mr-1" />
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
          <span v-if="slot.time?.start !== undefined">
            {{ timeToStr(slot.time.start) }}
            <template
              v-if="slot.time.end !== undefined && !isNaN(slot.time.end)"
            >
              –
              {{ timeToStr(slot.time.end) }}
            </template>
          </span>
          <span v-else>
            {{ slot.timeStr }}
          </span>
        </li>
      </ul>
    </article>
  </a>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Course, useCoursesStore, DAYS } from '../store/courses.ts';
import { isInSlot, timeToStr } from '../utils';
const coursesStore = useCoursesStore();

const props = defineProps<{
  course: Course;
}>();

const slots = computed(() => {
  let slots = props.course.slots.filter(
    (s) => s.dayStr !== '' && s.timeStr !== '',
  );
  if (coursesStore.filters.bookable) {
    slots = slots.filter(
      (s) => s.bookable && coursesStore.filters.bookable.includes(s.bookable),
    );
  }
  if (coursesStore.filters.timeSlot) {
    slots = slots.filter((s) => isInSlot(s, coursesStore.filters.timeSlot!));
  }
  return slots;
});

const priceRange = computed(() => coursesStore.getPriceRange(props.course));
</script>

<style scoped>
dt {
  @apply sr-only;
}

dd {
  @apply text-gray-700 dark:text-gray-300 flex items-center;
}

span {
  @apply whitespace-nowrap inline-block;
}
</style>
