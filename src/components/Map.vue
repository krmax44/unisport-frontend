<template>
  <div class="relative w-full h-full" aria-hidden="true">
    <div
      class="absolute w-full h-full rounded-xl overflow-hidden"
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
  LngLatBoundsLike,
} from 'maplibre-gl';
import { usePreferredDark, useDebounceFn } from '@vueuse/core';
import { useCoursesStore, CourseSlot } from '../store/courses.ts';

const isDark = usePreferredDark();

const mapContainer = shallowRef(null);
const map = shallowRef(null);
const markers = new Map<string, Marker>();

const duration = 700; // default map animation duration

const coursesStore = useCoursesStore();
coursesStore.$onAction(({ name }) => {
  if (name === 'filter') {
    updateMarkers();
  }
});

let preHighlightCenter;
let preHighlightZoom;

const applyHighlight = useDebounceFn((bounds: LngLatBounds | undefined) => {
  if (bounds === undefined) {
    map.value?.flyTo({
      center: preHighlightCenter,
      zoom: preHighlightZoom,
      duration,
    });

    preHighlightCenter = undefined;
  } else {
    if (preHighlightCenter === undefined) {
      preHighlightCenter = map.value?.getCenter();
      preHighlightZoom = map.value?.getZoom();
    }

    map.value?.fitBounds(bounds, { duration, zoom: 15 });
  }
}, duration);

coursesStore.$subscribe((_mutation, { highlightedCourse }) => {
  if (highlightedCourse !== undefined) {
    const { slots } = highlightedCourse;
    const slotIds = slots.map((s) => s.id);

    if (slotIds.some((s) => markers.has(s))) {
      markers.forEach((m, id) => !slotIds.includes(id) && m.setOpacity(0));

      const bounds = slotsToBounds(slots);
      if (bounds !== undefined) {
        applyHighlight(bounds);
      }

      return;
    }
  }

  markers.forEach((m) => m.setOpacity(1));
  applyHighlight();
});

function updateMarkers() {
  for (const [id, marker] of markers.entries()) {
    if (coursesStore.filteredCourses.find((c) => c.id === id) === undefined) {
      marker.remove();
      markers.delete(id);
    }
  }

  for (const course of coursesStore.filteredCourses) {
    for (const slot of course.slots) {
      if (markers.has(slot.id)) continue;
      if (slot.location === undefined) continue;

      const marker = new Marker({ color: '#FF0000', cluster: true })
        .setLngLat([slot.location.lon, slot.location.lat])
        .addTo(map.value);

      marker.getElement().addEventListener('click', () => {
        console.log('click');
      });

      markers.set(slot.id, marker);
    }
  }
}

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
      container: mapContainer.value,
      style: `https://api.maptiler.com/maps/streets-v2${isDark.value ? '-dark' : ''}/style.json?key=${import.meta.env.VITE_MAPBOX_API_KEY}`,
      center: [13.405, 52.52],
      zoom: 10,
    }),
  );

  map.value?.addControl(new NavigationControl(), 'top-right');

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
