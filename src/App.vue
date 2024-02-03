<template>
  <div class="container h-screen mx-auto py-12">
    <div class="md:grid md:grid-cols-2 gap-12 h-full">
      <div class="space-y-4 h-full overflow-auto">
        <Filter class="sticky top-0" />
        <CoursePreview
          :course="course"
          v-for="course in coursesStore.filteredCourses"
          :id="course.id"
        />
      </div>
      <Map />
    </div>
  </div>
</template>

<script lang="ts" setup>
import Filter from './components/Filter.vue';
import Map from './components/Map.vue';
import { useCoursesStore } from './store/courses.ts';
import CoursePreview from './components/CoursePreview.vue';

const coursesStore = useCoursesStore();
</script>
