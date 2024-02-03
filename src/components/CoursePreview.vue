<template>
  <article
    class="p-4 rounded shadow border border-gray-300"
    @mouseover="coursesStore.$patch({ highlightedCourse: course })"
    @mouseout="coursesStore.$patch({ highlightedCourse: undefined })"
  >
    <span class="text-gray-800 dark:text-gray-300">{{ course.provider }}</span>
    <h3 class="text-lg font-semibold">{{ course.name }}</h3>

    <ul class="flex flex-wrap gap-2">
      <li
        v-for="slot in slots"
        :key="slot.id"
        class="p-2 rounded-md flex flex-col items-center content-center"
        :class="[slot.bookable ? 'bg-green-300/50' : 'bg-red-300/50']"
        :aria-label="`${slot.time?.day}, von ${slot.time?.start} bis ${slot.time?.end}`"
      >
        <span class="uppercase text-sm font-bold">
          {{ slot.time?.day }}
        </span>
        <span>
          {{ timeToStr(slot.time!.start) }}
          –
          {{ timeToStr(slot.time!.end) }}
        </span>
      </li>
    </ul>
  </article>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { Course, useCoursesStore, Day } from '../store/courses.ts';
import { timeToStr } from '../utils';
const coursesStore = useCoursesStore();

const props = defineProps<{
  course: Course;
}>();

const slots = computed(() => {
  const s = props.course.slots.filter((s) => s.time !== undefined);
  if (coursesStore.filters.onlyBookable) {
    return s.filter((s) => s.bookable);
  }
  return s;
});
</script>
