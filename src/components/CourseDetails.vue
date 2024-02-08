<template>
  <Transition
    enter-from-class="translate-y-full"
    leave-to-class="translate-y-full"
    enter-active-class="transition-transform duration-500"
    leave-active-class="transition-transform duration-500"
    enter-class="ease-out"
    leave-class="ease-in"
  >
    <Panel
      tag="article"
      class="absolute inset-0 top-4 lg:top-0 lg:m-8 shadow-lg lg:shadow-2xl"
      v-if="course !== undefined"
    >
      <div
        class="border-gray-300 group-hover:bg-green-50/50 dark:group-hover:bg-green-900/50 relative"
      >
        <header
          class="px-4 py-8 mb-4 sticky top-0 z-10 bg-white border-b border-green-300 dark:bg-black dark:shadow-gray-700"
        >
          <div class="flex">
            <h2 class="text-xl font-semibold text-green-500 self-center">
              {{ course.name }}
            </h2>
            <div class="ml-auto">
              <button
                @click="coursesStore.selectedCourse = undefined"
                class="rounded-full w-auto"
              >
                <i-material-symbols-close />
                <span class="sr-only">Schließen</span>
              </button>
            </div>
          </div>
          <dl>
            <dt>Anbieter*in</dt>
            <dd>
              <i-material-symbols-school-outline-rounded />
              {{ course.provider }}
            </dd>
          </dl>
        </header>

        <div class="p-4 space-y-8">
          <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded relative">
            <div
              v-html="description"
              ref="descriptionEl"
              class="prose max-w-none bg-transparent transition-all"
              :class="
                descriptionExpanded
                  ? 'max-h-96 overflow-auto'
                  : 'max-h-24 overflow-hidden'
              "
              id="course-description"
            />
            <Transition
              leave-active-class="transition-opacity"
              leave-to-class="opacity-0"
            >
              <div
                class="flex justify-center items-end absolute bottom-2 inset-0 bg-gradient-to-t from-gray-50 dark:from-gray-900 from-25% to-transparent"
                v-if="!descriptionExpanded && descriptionClipped"
              >
                <button
                  :aria-expanded="descriptionExpanded"
                  aria-controls="course-description"
                  @click="descriptionExpanded = true"
                >
                  Beschreibung ausklappen…
                </button>
              </div>
            </Transition>
          </div>
          <div>
            <h3 class="mb-2">Termine</h3>
            <ul class="flex flex-col md:grid grid-cols-2 gap-2">
              <li
                v-for="slot in [...course.slots].sort((s) =>
                  s.bookable === 'bookable' ? -1 : 1,
                )"
                :key="slot.id"
                class="p-2 rounded"
                :class="
                  slot.bookable === 'bookable'
                    ? 'bg-green-100 dark:bg-green-300/50'
                    : 'bg-red-100 dark:bg-red-300/50'
                "
              >
                <dl>
                  <dt>Tag</dt>
                  <dd>
                    <i-material-symbols-today-rounded />
                    {{ slot.time?.day ?? slot.dayStr }}
                  </dd>
                  <dt>Uhrzeit</dt>
                  <dd>
                    <i-material-symbols-nest-clock-farsight-analog-outline-rounded />
                    <SlotTime :slot="slot" />
                  </dd>
                  <dt>Start des Kurses</dt>
                  <dd>
                    <i-material-symbols-calendar-month-outline-rounded />
                    {{ slot.date }}
                  </dd>
                  <dt>Buchbarkeit</dt>
                  <dd>
                    <template v-if="slot.bookable === 'bookable'">
                      <i-material-symbols-check-circle-outline-rounded />
                      buchbar
                    </template>
                    <template v-else-if="slot.bookable === 'waitlist'">
                      <i-material-symbols-lock-clock-outline-rounded />
                      Warteliste
                    </template>
                    <template v-else>
                      <i-material-symbols-error-outline-rounded />
                      nicht buchbar
                    </template>
                  </dd>
                  <template v-if="slot.location">
                    <dt>Ort</dt>
                    <dd>
                      <i-material-symbols-location-on-outline-rounded />
                      {{ slot.location.name }}
                    </dd>
                  </template>
                  <template v-if="slot.name">
                    <dt>Bezeichnung</dt>
                    <dd>
                      <i-material-symbols-chat-info-outline-rounded />
                      {{ slot.name }}
                    </dd>
                  </template>
                </dl>
              </li>
            </ul>
          </div>
        </div>

        <div
          class="sticky bottom-0 inset-x-0 py-4 flex justify-center items-end bg-white dark:bg-black border-t border-green-300"
        >
          <a
            class="btn btn-primary"
            :href="course.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i-material-symbols-sports-gymnastics-rounded class="mr-1" />
            Zur Buchung
          </a>
        </div>
      </div>
    </Panel>
  </Transition>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { parse, Renderer } from 'marked';
import DOMPurify from 'dompurify';
import { useCoursesStore } from '../store/courses';
import Panel from './Panel.vue';
import SlotTime from './SlotTime.vue';

const coursesStore = useCoursesStore();
const { selectedCourse: course } = storeToRefs(coursesStore);

const renderer = new Renderer();
renderer.em = (text) => '*' + text + '*'; // remove emphasis, since it interferes with gender*

const description = computed(() => {
  return DOMPurify.sanitize(
    parse(course.value?.description ?? '', { renderer }) as string,
  );
});

const descriptionEl = ref(undefined as HTMLDivElement | undefined);
const descriptionExpanded = ref(false);
const descriptionClipped = computed(
  () =>
    descriptionEl.value &&
    descriptionEl.value?.clientHeight < descriptionEl.value?.scrollHeight,
);

watch(course, () => (descriptionExpanded.value = false));
</script>

<style scoped>
.slide-in-enter-active,
.slide-in-leave-active {
  @apply transition-transform duration-500;
}

.slide-in-enter-from,
.slide-in-leave-to {
  transform: translateY(100%);
}
</style>
