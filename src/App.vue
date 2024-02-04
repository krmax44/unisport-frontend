<template>
  <div class="mx-auto">
    <TabGroup
      :selectedIndex="selectedTab"
      @change="(tab) => (selectedTab = tab)"
    >
      <div class="flex flex-col lg:flex-row relative h-screen">
        <div class="lg:w-2/3 lg:p-8 h-full">
          <div
            class="flex flex-col bg-white dark:bg-black px-4 lg:px-8 rounded-xl h-full overflow-auto"
          >
            <Filter
              class="pb-8 lg:p-8 lg:pt-12 lg:sticky top-0"
              @update="filterUpdate"
            />

            <div class="lg:hidden">
              <TabList class="flex space-x-1 border-b border-green-300">
                <Tab as="template" v-slot="{ selected }">
                  <button
                    class="rounded-t-md w-full"
                    :class="{
                      'bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300':
                        selected,
                    }"
                  >
                    Liste
                  </button>
                </Tab>
                <Tab as="template" v-slot="{ selected }">
                  <button
                    class="rounded-t-md w-full"
                    :class="{
                      'bg-green-50 dark:bg-green-900/50 text-green-800 dark:text-green-300':
                        selected,
                    }"
                  >
                    Karte
                  </button>
                </Tab>
              </TabList>
            </div>

            <TabPanels class="mt-2 flex-1">
              <TabPanel>
                <div
                  class="pt-4 lg:p-8 flex md:grid md:grid-cols-2 flex-col gap-4"
                >
                  <template v-if="coursesStore.paginatedCourses.length !== 0">
                    <CoursePreview
                      :course="course"
                      v-for="course in coursesStore.paginatedCourses"
                      :id="course.id"
                    />
                  </template>
                  <div class="" v-else>Keine passenden Kurse gefunden.</div>
                </div>
              </TabPanel>
              <TabPanel class="h-full">
                <Map class="min-h-48 h-full" />
              </TabPanel>
            </TabPanels>
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
        <div class="hidden lg:block lg:w-1/3">
          <div class="bg-white dark:bg-black lg:!bg-transparent h-full lg:p-8">
            <Map />
          </div>
        </div>
      </div>
    </TabGroup>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useOffsetPagination } from '@vueuse/core';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
import { useCoursesStore } from './store/courses.ts';
import Filter from './components/Filter.vue';
import Map from './components/Map.vue';
import CoursePreview from './components/CoursePreview.vue';
import Pagination from './components/Pagination.vue';

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

const selectedTab = ref(0);

onMounted(() => {
  updatePaginatedCourses({
    currentPage: pagination.value.currentPage.value,
    currentPageSize: pagination.value.currentPageSize.value,
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) selectedTab.value = 0;
  });
});
</script>
