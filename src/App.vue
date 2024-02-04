<template>
  <div class="mx-auto">
    <div class="flex flex-col lg:flex-row relative h-screen">
      <div class="lg:w-2/3 lg:p-8">
        <div
          class="bg-white dark:bg-black px-4 lg:px-8 rounded-xl h-full overflow-auto"
        >
          <Filter
            class="pb-8 lg:p-8 lg:pt-12 lg:sticky top-0"
            @update="filterUpdate"
          />
          <div class="pt-4 lg:p-8 flex md:grid md:grid-cols-2 flex-col gap-4">
            <CoursePreview
              :course="course"
              v-for="course in coursesStore.paginatedCourses"
              :id="course.id"
            />
          </div>
          <div class="pt-4 lg:p-8 lg:sticky bottom-0 bg-white dark:bg-black">
            <Pagination
              :current-page="pagination.currentPage.value"
              :page-count="pagination.pageCount.value"
              :is-first-page="pagination.isFirstPage.value"
              :is-last-page="pagination.isLastPage.value"
              @prev="pagination.prev"
              @next="pagination.next"
              @to="(i) => (pagination.currentPage.value = i)"
            />
          </div>
        </div>
      </div>
      <div class="lg:w-1/3 sticky bottom-0 md:static">
        <div class="bg-white dark:bg-black lg:!bg-transparent h-full lg:p-8">
          <Map class="min-h-48" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useOffsetPagination } from '@vueuse/core';
import { useCoursesStore } from './store/courses.ts';
import Filter from './components/Filter.vue';
import Map from './components/Map.vue';
import CoursePreview from './components/CoursePreview.vue';
import Pagination from './components/Pagination.vue';
import { computed, onMounted } from 'vue';

const coursesStore = useCoursesStore();

const updatePaginatedCourses = ({
  currentPage,
  currentPageSize,
}: {
  currentPage: number;
  currentPageSize: number;
}) => {
  coursesStore.paginateCourses(currentPage, currentPage + currentPageSize);
};

const pagination = computed(() =>
  useOffsetPagination({
    total: coursesStore.filteredCourses.length,
    page: 1,
    pageSize: 50,
    onPageChange: updatePaginatedCourses,
    onPageSizeChange: updatePaginatedCourses,
  }),
);

const filterUpdate = () => {
  pagination.value.currentPage.value = 1;
  updatePaginatedCourses({
    currentPage: pagination.value.currentPage.value,
    currentPageSize: pagination.value.currentPageSize.value,
  });
};

onMounted(() =>
  updatePaginatedCourses({
    currentPage: pagination.value.currentPage.value,
    currentPageSize: pagination.value.currentPageSize.value,
  }),
);
</script>

<style>
body {
  scrollbar-color: theme('colors.gray.500') theme('colors.white');
}

@media (prefers-color-scheme: dark) {
  body {
    scrollbar-color: theme('colors.gray.500') theme('colors.gray.900');
  }
}
</style>
