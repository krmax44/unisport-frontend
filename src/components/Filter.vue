<template>
  <form
    @submit.prevent
    class="bg-white border-b border-green-300 dark:bg-black dark:shadow-gray-700 space-y-2"
  >
    <h1 class="mt-6 lg:mt-0 mb-2 text-green-800">Unisport in Berlin</h1>
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

      <label>
        <input type="checkbox" v-model="filters.onlyBookable" />
        <span class="ml-2">Nur buchbare Kurse</span>
      </label>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useCoursesStore } from '../store/courses.ts';
import { refDebounced } from '@vueuse/core';
import { reactive, watch } from 'vue';

const emit = defineEmits<{
  (e: 'update'): void;
}>();

const coursesStore = useCoursesStore();
const { filters } = storeToRefs(coursesStore);
const filtersDebounced = refDebounced(filters, 500);
watch(coursesStore.filters, () => emit('update'));
</script>

<style>
input[type='text'] {
  @apply mt-1 block w-full rounded-md bg-gray-100 dark:bg-gray-900 border-transparent focus:border-gray-500 focus:bg-white focus:dark:bg-black focus:ring-0;
}

input[type='checkbox'] {
  @apply rounded bg-gray-200 border-transparent focus:border-transparent focus:bg-gray-200 text-green-600 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500;
}

label {
  @apply inline-flex items-center;
}
</style>
