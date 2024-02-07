<template>
  <component
    :is="tag ?? 'div'"
    class="flex flex-col bg-white dark:bg-black px-4 lg:px-8 lg:shadow rounded-xl overflow-auto"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
defineProps<{ tag?: string }>();
</script>
