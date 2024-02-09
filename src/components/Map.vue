<template>
  <div class="relative w-full h-full" aria-hidden="true">
    <div
      class="absolute w-full h-full rounded-b-xl md:rounded-xl lg:shadow overflow-hidden"
      ref="mapContainer"
    ></div>

    <div class="hidden" ref="preview">
      <div
        class="flex flex-col divide-y divide-gray-200 dark:divide-gray-600 max-h-48 max-w-72 w-[80vw] overflow-y-auto"
      >
        <CoursePreview
          :course="course"
          v-for="course in previewCourses"
          :key="course.id"
          class="w-full"
          :data-course="course.id"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  shallowRef,
  onMounted,
  onUnmounted,
  markRaw,
  ref,
  nextTick,
  watch,
  computed,
} from 'vue';
import {
  Map as MaplibreMap,
  NavigationControl,
  Marker,
  LngLatBounds,
  LngLatLike,
  FullscreenControl,
  Popup,
} from 'maplibre-gl';
import { usePreferredDark, useDebounceFn } from '@vueuse/core';
import { useCourseStore, CourseSlot, Course } from '../store/courses/index.ts';
import CoursePreview from './CoursePreview.vue';
import { storeToRefs } from 'pinia';

const isDark = usePreferredDark();

const coursesStore = useCourseStore();
const { matchingCourseEvents, highlightedCourse, selectedCourse } =
  storeToRefs(coursesStore);
const locationKeys = computed(() => Object.keys(matchingCourseEvents.value));

const mapContainer = shallowRef(null);
const map = shallowRef(null as MaplibreMap | null);
const markers = new Map<string, Marker>();

const popupOpen = ref(false);
const shouldZoomIn = computed(
  () => !popupOpen.value && selectedCourse.value === undefined,
);

const duration = 700; // default map animation duration

const preview = ref(undefined as HTMLTemplateElement | undefined);
const previewCourses = ref([] as Course[]);

let preHighlightCenter: LngLatLike | undefined;
let preHighlightZoom: number | undefined;

const updateHighlightedCourse = useDebounceFn(() => {
  markers.forEach((m) => m.setOpacity('1'));
  if (coursesStore.highlightedCourse !== undefined && shouldZoomIn.value) {
    const { slots } = coursesStore.highlightedCourse;
    const slotIds = slots.map((s) => s.id);

    if (slotIds.some((s) => markers.has(s))) {
      markers.forEach((m, id) => !slotIds.includes(id) && m.setOpacity('0'));

      const bounds = slotsToBounds(slots);
      if (bounds !== undefined) {
        if (preHighlightCenter === undefined) {
          preHighlightCenter = map.value?.getCenter();
          preHighlightZoom = map.value?.getZoom();
        }

        map.value?.fitBounds(bounds, { duration, zoom: 15 });
      }

      return;
    }
  }

  if (preHighlightCenter !== undefined) {
    map.value?.flyTo({
      center: preHighlightCenter,
      zoom: preHighlightZoom,
      duration,
    });
  }
}, duration);

const updateMarkers = () => {
  for (const [id, marker] of markers.entries()) {
    if (!locationKeys.value.includes(id)) {
      marker.remove();
      markers.delete(id);
    }
  }

  for (const events of Object.values(matchingCourseEvents.value)) {
    if (events.length === 0) continue;
    const { location } = events[0];
    const courses = [...new Set(events.map((e) => e.course))];

    if (markers.has(location.url)) continue;

    const marker = new Marker({ color: '#FF0000' })
      .setLngLat([location.lon, location.lat])
      .addTo(map.value!);

    const markerEl = marker.getElement();

    markerEl.addEventListener('click', async () => {
      previewCourses.value = courses;
      await nextTick();
      await new Promise((r) => window.requestAnimationFrame(r));

      const popup = new Popup({ closeButton: false })
        .setLngLat([location!.lon, location!.lat])
        .setHTML(preview.value!.innerHTML)
        .setMaxWidth('none')
        .addTo(map.value!)
        .on('close', () => {
          popupOpen.value = false;
        });

      popup
        .getElement()
        .querySelectorAll('a')
        .forEach((el) =>
          el.addEventListener('click', () => {
            coursesStore.selectedCourse = courses.find(
              (c) => c.id === el.dataset.course,
            );
            popup.remove();
          }),
        );

      popupOpen.value = true;
    });

    const l = courses.length;
    const firstName = events[0].course.name;
    const title =
      l === 1
        ? firstName
        : `„${firstName}” und ${l - 1} weitere${l - 1 === 1 ? 'r' : ''} Kurs${l - 1 === 1 ? '' : 'e'}`;

    markerEl.setAttribute('title', title);

    markers.set(location.url, marker);
  }
};

const updateMarkersDebounced = useDebounceFn(updateMarkers, duration);

watch(highlightedCourse, () => updateHighlightedCourse());
watch(matchingCourseEvents, () => updateMarkersDebounced());

function slotsToBounds(slots: CourseSlot[]): LngLatBounds | undefined {
  const coords = slots
    .filter((s) => s.location?.lat !== undefined)
    .map((s) => ({ lon: s.location!.lon, lat: s.location!.lat }));

  if (coords.length !== 0) {
    coords.push(coords[0]);
  } else {
    return undefined;
  }

  return coords.reduce(
    (acc, coordinates) => acc.extend(coordinates),
    new LngLatBounds(coords[0], coords[1]),
  );
}

onMounted(() => {
  map.value = markRaw(
    new MaplibreMap({
      container: mapContainer.value!,
      style: `https://api.maptiler.com/maps/streets-v2${isDark.value ? '-dark' : ''}/style.json?key=${import.meta.env.VITE_MAPTILER_API_KEY}`,
      center: [13.405, 52.52],
      zoom: 8,
    }),
  );

  map.value.addControl(new NavigationControl(), 'top-right');
  map.value.addControl(new FullscreenControl(), 'top-right');

  updateMarkers();
});

onUnmounted(() => {
  map.value?.remove();
});
</script>

<style>
@import 'maplibre-gl/dist/maplibre-gl.css';

.maplibregl-marker {
  cursor: pointer;
}

.maplibregl-popup-content {
  @apply dark:bg-black font-sans text-base p-0;
}

.maplibregl-popup-anchor-top .maplibregl-popup-tip {
  @apply dark:border-b-black;
}

.maplibregl-popup-anchor-bottom .maplibregl-popup-tip {
  @apply dark:border-t-black;
}

.maplibregl-popup-anchor-left .maplibregl-popup-tip {
  @apply dark:border-r-black;
}

.maplibregl-popup-anchor-right .maplibregl-popup-tip {
  @apply dark:border-l-black;
}
</style>
