<template>
  <span v-if="slot.time?.start !== undefined">
    {{ timeToStr(slot.time.start) }}
    <span v-if="slot.time.end !== undefined && !isNaN(slot.time.end)">
      –
      {{ timeToStr(slot.time.end) }}
    </span>
  </span>
  <span v-else>
    {{ slot.timeStr }}
  </span>
</template>

<script lang="ts" setup>
import type { CourseSlot } from '../store/courses';
import { timeToStr } from '../utils';

defineProps<{ slot: CourseSlot }>();
</script>
../store/courses/courses
