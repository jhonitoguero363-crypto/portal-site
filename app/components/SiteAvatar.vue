<script setup lang="ts">
const props = withDefaults(defineProps<{
  icon?: string | null
  color?: string
  letter?: string
  size?: string
  rounded?: string
}>(), {
  color: '#1a1714',
  letter: '?',
  size: 'size-11',
  rounded: 'rounded-xl'
})

const failed = ref(false)

watch(() => props.icon, () => {
  failed.value = false
})

const showIcon = computed(() => Boolean(props.icon?.trim()) && !failed.value)
</script>

<template>
  <span
    class="grid place-items-center shrink-0 overflow-hidden font-semibold text-white"
    :class="[size, rounded, showIcon ? 'bg-cream-100 border border-cream-300/80 p-1' : '']"
    :style="showIcon ? undefined : { background: color }"
  >
    <img
      v-if="showIcon"
      :src="icon!"
      alt=""
      class="size-full object-contain"
      loading="lazy"
      referrerpolicy="no-referrer"
      @error="failed = true"
    >
    <span v-else>{{ (letter || '?').slice(0, 1) }}</span>
  </span>
</template>
