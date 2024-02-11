<template>
  <component
    :is="tag ?? 'div'"
    class="flex flex-col bg-white dark:bg-black lg:shadow rounded-xl overflow-auto"
  >
    <slot />
  </component>
</template>

<script lang="ts" setup>
defineProps<{ tag?: string }>();
</script>
