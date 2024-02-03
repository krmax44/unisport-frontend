<template>
  <form
    @submit.prevent
    class="p-4 bg-white border-b border-green-300 dark:bg-black dark:shadow-gray-700 space-y-2"
  >
    <h2 class="text-gray-700 dark:text-gray-300">Kurse durchsuchen</h2>
    <label>
      <input type="checkbox" v-model="filters.onlyBookable" />
      <span class="ml-2">Nur buchbare Kurse</span>
    </label>
  </form>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useCoursesStore } from '../store/courses.ts';

const coursesStore = useCoursesStore();
const { filters } = storeToRefs(coursesStore);
</script>

<style>
input[type='checkbox'] {
  @apply rounded bg-gray-200 border-transparent focus:border-transparent focus:bg-gray-200 text-green-600 focus:ring-1 focus:ring-offset-2 focus:ring-gray-500;
}

label {
  @apply inline-flex items-center;
}
</style>
