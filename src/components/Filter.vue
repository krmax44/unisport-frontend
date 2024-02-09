<template>
  <div
    class="bg-white lg:border-b border-green-300 dark:bg-black dark:shadow-gray-700 space-y-2"
  >
    <h1 class="mt-6 lg:mt-0 mb-2 text-green-800">
      Unisport in Berlin und Potsdam
    </h1>
    <h2 class="text-gray-700 dark:text-gray-300">
      <span class="font-semibold">
        {{ coursesStore.courses.length }} Kurse durchsuchen
      </span>
      <template
        v-if="
          coursesStore.courses.length !== coursesStore.filteredCourses.length
        "
      >
        ({{ coursesStore.filteredCourses.length }} Treffer)
      </template>
    </h2>
    <div class="flex flex-col lg:grid grid-cols-2 gap-4">
      <input
        type="text"
        v-model="filtersDebounced.searchTerm"
        placeholder="Suchbegriff (Basketball, Yoga…)"
      />

      <select v-model="bookableFilter">
        <option value="bookable">nur buchbare Kurse</option>
        <option value="waitlist">buchbare Kurse und mit Warteliste</option>
        <option value="all">alle Kurse (auch nicht buchbare)</option>
      </select>

      <div class="flex flex-col md:flex-row gap-2 col-span-2">
        <select v-model="filters.day">
          <option value="all">Alle Tage</option>
          <option
            v-for="[id, day] in Object.entries(DAYS)"
            :key="id"
            :value="id"
          >
            {{ day }}
          </option>
        </select>
        <label class="time-label">
          von:
          <input type="time" v-model="filters.start" />
        </label>
        <label class="time-label">
          bis:
          <input type="time" v-model="filters.end" />
        </label>
      </div>
    </div>

    <slot />
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { refDebounced } from '@vueuse/core';

import { useCourseStore, DAYS } from '../store/courses/index.ts';

const coursesStore = useCourseStore();
const { filters } = storeToRefs(coursesStore);
const filtersDebounced = refDebounced(filters, 500);

const bookableFilter = ref('bookable');
watch(bookableFilter, (bookableFilter) => {
  if (bookableFilter === 'bookable')
    coursesStore.$patch({ filters: { bookable: ['bookable'] } });
  else if (bookableFilter === 'bookable')
    coursesStore.$patch({ filters: { bookable: ['bookable', 'waitlist'] } });
  else coursesStore.$patch({ filters: { bookable: [] } });
});
</script>

<style scoped>
input[type='text'],
label.time-label {
  @apply block w-full rounded-md bg-gray-100 dark:bg-gray-900 border-transparent focus:border-gray-500 focus:bg-white focus:dark:bg-black focus:ring-0;
}

label.time-label {
  @apply flex px-4 justify-evenly border border-transparent;
}

label.time-label input[type='time'] {
  @apply bg-transparent border-0 ring-0;
}

label.time-label:has(:focus) {
  @apply bg-white dark:bg-black ring-0 border border-gray-500;
}

input[type='checkbox'] {
  @apply rounded bg-gray-200 border-transparent focus:border-transparent focus:bg-gray-200 text-green-600 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500;
}

select {
  @apply block w-full rounded-md bg-gray-100 dark:bg-gray-900 border-transparent focus:border-gray-500 focus:bg-white dark:focus:bg-black focus:ring-0;
}

label {
  @apply inline-flex items-center;
}
</style>
