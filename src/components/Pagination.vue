<template>
  <nav
    class="flex justify-between border-t border-gray-300 dark:border-gray-700 mt-[-1px]"
  >
    <a href="#!" @click.prevent="$emit('prev')">
      <i-material-symbols-arrow-left-alt-rounded />
      Zurück
    </a>
    <TransitionGroup tag="ol" name="list" class="hidden md:flex space-x-2">
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
    <span class="md:hidden"> Seite {{ currentPage }} von {{ pageCount }} </span>
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

const pages = computed(() => {
  const range = 2; // Number of visible pages before and after the current page
  let start = Math.max(1, props.currentPage - range);
  let end = Math.min(props.pageCount, props.currentPage + range);

  if (props.currentPage <= range) {
    end = Math.min(props.pageCount, start + 2 * range);
  } else if (props.currentPage >= props.pageCount - range) {
    start = Math.max(1, end - 2 * range);
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});
</script>

<style scoped>
a,
span {
  @apply items-center gap-x-1 py-2 border-t-2 border-transparent text-gray-500 dark:text-gray-300;
}

a {
  @apply inline-flex hover:border-green-500 hover:text-gray-700 dark:hover:text-gray-100 no-underline transition;
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
