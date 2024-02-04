<template>
  <nav
    class="flex justify-between border-t border-gray-300 dark:border-gray-700 mt-[-1px]"
  >
    <a href="#!" @click.prevent="$emit('prev')">
      <i-material-symbols-arrow-left-alt-rounded />
      Zurück
    </a>
    <TransitionGroup tag="ol" name="list" class="flex space-x-2">
      <li v-for="item in pages" :key="item">
        <a
          href="#!"
          :aria-current="item === currentPage ? 'page' : undefined"
          @click.prevent="$emit('to', item)"
          class="px-4"
          :class="{
            active: item === currentPage,
          }"
        >
          {{ item }}
        </a>
      </li>
    </TransitionGroup>
    <a href="#!" @click.prevent="$emit('next')">
      Weiter
      <i-material-symbols-arrow-right-alt-rounded />
    </a>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
  isFirstPage: boolean;
  isLastPage: boolean;
  currentPage: number;
  pageCount: number;
}>();

defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'to', page: number): void;
}>();

const pages = computed(() =>
  new Array(props.pageCount)
    .fill(undefined)
    .map((_, i) => i + 1)
    .filter((i) => Math.abs(props.currentPage - i) <= 2),
);
</script>

<style scoped>
a {
  @apply inline-flex items-center gap-x-1 py-2 border-t-2 border-transparent hover:border-green-500 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 no-underline transition;
}

a.active {
  @apply border-green-300;
}

.list-move,
.list-enter-active,
.list-leave-active {
  @apply transition-all;
}

.list-enter-from,
.list-leave-to {
  @apply opacity-0 -translate-x-4;
}

.list-leave-active {
  @apply absolute;
}
</style>
