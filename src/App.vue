<template>
  <main class="dark:bg-green-500/10">
    <TabGroup
      :selectedIndex="selectedTab"
      @change="(tab) => (selectedTab = tab)"
    >
      <div class="flex flex-col lg:flex-row h-screen">
        <div class="lg:w-2/3 lg:p-8 h-full">
          <div class="relative h-full overflow-hidden">
            <Panel
              class="h-full transition-transform duration-500 origin-center"
              :class="{
                'scale-90': coursesStore.selectedCourse,
              }"
            >
              <CourseOverview />
            </Panel>
            <CourseDetails />
          </div>
        </div>

        <div class="hidden lg:block lg:w-1/3">
          <div class="h-full lg:p-8">
            <Map />
          </div>
        </div>
      </div>
    </TabGroup>
  </main>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted, ref } from 'vue';
import { TabGroup } from '@headlessui/vue';
import { useCoursesStore } from './store/courses.ts';
import Panel from './components/Panel.vue';
import Map from './components/Map.vue';
import CourseOverview from './components/CourseOverview.vue';

const coursesStore = useCoursesStore();

const selectedTab = ref(0);

const CourseDetails = defineAsyncComponent(
  () => import('./components/CourseDetails.vue'),
);

onMounted(() => {
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) selectedTab.value = 0;
  });
});
</script>
