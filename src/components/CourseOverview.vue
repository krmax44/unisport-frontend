<template>
  <Filter class="pb-8 lg:p-8 lg:pt-12 lg:sticky top-0" />

  <div class="lg:hidden">
    <TabList class="flex space-x-1 border-b border-green-300">
      <Tab as="template" v-slot="{ selected }">
        <button
          class="rounded-none rounded-t-md w-full"
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
          class="rounded-none rounded-t-md w-full"
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

  <TabPanels class="flex-1">
    <TabPanel>
      <div class="pt-4 lg:p-8 flex md:grid md:grid-cols-2 flex-col gap-4">
        <div v-if="coursesStore.error === true">
          Fehler beim Laden. Versuche es später erneut.
        </div>
        <div v-else-if="coursesStore.loaded === false">Lade Kurse…</div>
        <template v-else-if="coursesStore.paginatedCourses.length !== 0">
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
</template>

<script lang="ts" setup>
import { TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
import { useCoursesStore } from '../store/courses.ts';
import Filter from './Filter.vue';
import Map from './Map.vue';
import CoursePreview from './CoursePreview.vue';
import Pagination from './Pagination.vue';
import { storeToRefs } from 'pinia';

const coursesStore = useCoursesStore();
const { pagination } = storeToRefs(coursesStore);
</script>
