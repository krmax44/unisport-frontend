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
import { uniqueCourses } from '../utils';

const isDark = usePreferredDark();

const coursesStore = useCourseStore();
const { filteredCourseEventsByLocation, highlightedCourse, selectedCourse } =
  storeToRefs(coursesStore);
//const locationKeys = computed(() => Object.keys(matchingCourseEvents.value));

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
    const locationIds = slots
      .map((s) => s.location?.url)
      .filter((l) => l !== undefined);

    if (locationIds.some((s) => markers.has(s!))) {
      markers.forEach(
        (m, id) => !locationIds.includes(id) && m.setOpacity('0'),
      );

      const bounds = slotsToBounds(slots);
      if (bounds !== undefined) {
        if (preHighlightCenter === undefined) {
          preHighlightCenter = map.value?.getCenter();
          preHighlightZoom = map.value?.getZoom();
        }

        const canvas = map.value!.getCanvas();

        const zoom = getBoundsZoomLevel(bounds, [
          canvas.width / 2,
          canvas.height / 2,
        ]);

        map.value?.fitBounds(bounds, { duration, zoom });
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
    if (!(id in filteredCourseEventsByLocation)) {
      marker.remove();
      markers.delete(id);
    }
  }

  for (const events of Object.values(filteredCourseEventsByLocation.value)) {
    if (events.length === 0) continue;
    const { location } = events[0];

    if (markers.has(location.url)) continue;

    const marker = new Marker({ color: '#FF0000' })
      .setLngLat([location.lon, location.lat])
      .addTo(map.value!);

    const markerEl = marker.getElement();

    markerEl.addEventListener('click', async () => {
      const events = coursesStore.filteredCourseEventsByLocation[location.url];
      const courses = uniqueCourses(events);
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
            try {
              document.exitFullscreen();
            } catch {}

            coursesStore.selectedCourse = courses.find(
              (c) => c.id === el.dataset.course,
            );
            popup.remove();
          }),
        );

      popupOpen.value = true;
    });

    const courses = uniqueCourses(events);
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

watch(highlightedCourse, () => updateHighlightedCourse());
watch(filteredCourseEventsByLocation, () => updateMarkers());

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

// cc-by-sa 3.0 https://stackoverflow.com/a/13274361
function getBoundsZoomLevel(bounds: LngLatBounds, mapDim: [number, number]) {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 14;

  const latRad = (lat: number) => {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  };

  const zoom = (mapPx: number, worldPx: number, fraction: number) => {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  };

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  const latFraction = (latRad(ne.lat) - latRad(sw.lat)) / Math.PI;

  const lngDiff = ne.lng - sw.lng;
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;

  const latZoom = zoom(mapDim[1], WORLD_DIM.height, latFraction);
  const lngZoom = zoom(mapDim[0], WORLD_DIM.width, lngFraction);

  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}
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
