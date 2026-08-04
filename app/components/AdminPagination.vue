<script setup lang="ts">
const props = withDefaults(defineProps<{
  page: number
  totalPages: number
}>(), {})

const emit = defineEmits<{
  'update:page': [value: number]
}>()

type PageItem = number | 'ellipsis'

/**
 * Pattern matches:  < 1 2 3 4 5 ... 100 >
 * Near middle:      < 1 ... 48 49 50 51 52 ... 100 >
 * Near end:         < 1 ... 96 97 98 99 100 >
 */
const items = computed<PageItem[]>(() => {
  const total = Math.max(1, props.totalPages)
  const current = Math.min(Math.max(1, props.page), total)

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // Always aim to show ~5 consecutive pages in the sliding window
  const windowSize = 5
  let start: number
  let end: number

  if (current <= 4) {
    start = 1
    end = windowSize + 1 // 1..6
  } else if (current >= total - 3) {
    start = total - windowSize
    end = total
  } else {
    start = current - 2
    end = current + 2
  }

  const pages: PageItem[] = []

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('ellipsis')
  }

  for (let p = start; p <= end; p++) {
    if (p >= 1 && p <= total) pages.push(p)
  }

  if (end < total) {
    if (end < total - 1) pages.push('ellipsis')
    pages.push(total)
  }

  // remove accidental duplicates
  const cleaned: PageItem[] = []
  for (const item of pages) {
    if (cleaned[cleaned.length - 1] === item) continue
    cleaned.push(item)
  }
  return cleaned
})

function go(p: number) {
  const next = Math.min(Math.max(1, p), Math.max(1, props.totalPages))
  if (next !== props.page) emit('update:page', next)
}

function onEllipsisClick(index: number) {
  const list = items.value
  const prev = list[index - 1]
  // Left ellipsis → back 5 pages; right ellipsis → forward 5 pages
  if (typeof prev === 'number' && prev < props.page) {
    go(props.page - 5)
  } else {
    go(props.page + 5)
  }
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <button
      type="button"
      class="size-8 rounded-md bg-[#f5f5f5] border border-transparent text-ink-500 grid place-items-center hover:text-ink-800 disabled:opacity-35 disabled:cursor-not-allowed"
      :disabled="page <= 1"
      aria-label="上一页"
      @click="go(page - 1)"
    >
      <UIcon
        name="i-lucide-chevron-left"
        class="size-4"
      />
    </button>

    <template
      v-for="(item, index) in items"
      :key="`${item}-${index}`"
    >
      <button
        v-if="typeof item === 'number'"
        type="button"
        class="min-w-8 h-8 px-2 rounded-md text-sm tabular-nums grid place-items-center transition-colors"
        :class="page === item
          ? 'bg-[#2f6bff] text-white'
          : 'bg-[#f5f5f5] text-ink-600 hover:text-ink-900'"
        @click="go(item)"
      >
        {{ item }}
      </button>
      <button
        v-else
        type="button"
        class="size-8 rounded-md bg-[#f5f5f5] text-ink-500 grid place-items-center hover:text-ink-800"
        aria-label="跳转更多页"
        @click="onEllipsisClick(index)"
      >
        …
      </button>
    </template>

    <button
      type="button"
      class="size-8 rounded-md bg-[#f5f5f5] border border-transparent text-ink-500 grid place-items-center hover:text-ink-800 disabled:opacity-35 disabled:cursor-not-allowed"
      :disabled="page >= totalPages"
      aria-label="下一页"
      @click="go(page + 1)"
    >
      <UIcon
        name="i-lucide-chevron-right"
        class="size-4"
      />
    </button>
  </div>
</template>
