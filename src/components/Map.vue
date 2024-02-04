<template>
  <div class="relative w-full h-full" aria-hidden="true">
    <div
      class="absolute w-full h-full rounded-t-xl md:rounded-xl overflow-hidden"
      ref="mapContainer"
    ></div>
  </div>
</template>

<script lang="ts" setup>
import { shallowRef, onMounted, onUnmounted, markRaw } from 'vue';
import {
  Map as MaplibreMap,
  NavigationControl,
  Marker,
  LngLatBounds,
  LngLatLike,
  FullscreenControl,
} from 'maplibre-gl';
import { usePreferredDark, useDebounceFn } from '@vueuse/core';
import { useCoursesStore, CourseSlot } from '../store/courses.ts';

const isDark = usePreferredDark();

const mapContainer = shallowRef(null);
const map = shallowRef(null as MaplibreMap | null);
const markers = new Map<string, Marker>();

const duration = 700; // default map animation duration

const coursesStore = useCoursesStore();

let preHighlightCenter: LngLatLike | undefined;
let preHighlightZoom: number | undefined;

const updateHighlightedCourse = useDebounceFn(() => {
  markers.forEach((m) => m.setOpacity('1'));
  if (coursesStore.highlightedCourse !== undefined) {
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
    if (coursesStore.paginatedCourses.find((c) => c.id === id) === undefined) {
      marker.remove();
      markers.delete(id);
    }
  }

  for (const course of coursesStore.paginatedCourses) {
    for (const slot of course.slots) {
      if (markers.has(slot.id)) continue;
      if (slot.location === undefined) continue;

      const marker = new Marker({ color: '#FF0000' })
        .setLngLat([slot.location.lon, slot.location.lat])
        .addTo(map.value!);

      const markerEl = marker.getElement();

      markerEl.addEventListener('click', () => {
        console.log('click');
      });

      markerEl.setAttribute('title', course.name);

      markers.set(slot.id, marker);
    }
  }
};

const updateMarkersDebounced = useDebounceFn(updateMarkers, duration);

coursesStore.$onAction(({ name }) => {
  if (name === 'paginateCourses') {
    updateMarkersDebounced();
  } else if (name === 'setHighlightedCourse') {
    updateHighlightedCourse();
  }
});

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
      style: `https://api.maptiler.com/maps/streets-v2${isDark.value ? '-dark' : ''}/style.json?key=${import.meta.env.VITE_MAPBOX_API_KEY}`,
      center: [13.405, 52.52],
      zoom: 10,
    }),
  );

  map.value?.addControl(new NavigationControl(), 'top-right');
  map.value?.addControl(new FullscreenControl(), 'top-right');

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
</style>
