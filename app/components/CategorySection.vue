<script setup lang="ts">
import type { Category, Site } from '~/utils/types'

const props = defineProps<{
  category: Category
  sites: Site[]
  index: number
}>()

const emit = defineEmits<{
  open: [url: string]
}>()

const root = ref<HTMLElement | null>(null)
const visible = ref(false)
let observer: IntersectionObserver | null = null

function reveal() {
  if (visible.value) return
  visible.value = true
  observer?.disconnect()
  observer = null
}

// Keep skeleton height close to real grid (3-col desktop estimate)
const skeletonCount = computed(() => Math.max(props.sites.length, 1))
const skeletonMinHeight = computed(() => {
  const cols = 3
  const cardH = 78
  const gap = 12
  const rows = Math.ceil(skeletonCount.value / cols)
  return rows * cardH + Math.max(0, rows - 1) * gap
})

onMounted(() => {
  const el = root.value
  if (!el) return

  if (props.index < 2) {
    visible.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some(e => e.isIntersecting)) {
        reveal()
      }
    },
    { rootMargin: '320px 0px' }
  )
  observer.observe(el)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})

defineExpose({ reveal, root })
</script>

<template>
  <section
    :id="`category-${category.id}`"
    ref="root"
    class="mb-10 scroll-mt-24"
  >
    <div class="flex items-end justify-between mb-4">
      <div>
        <p class="text-[11px] tracking-[0.16em] text-ink-400 mb-1">
          {{ String(index + 1).padStart(2, '0') }}
        </p>
        <h2 class="text-xl font-semibold">
          {{ category.name }}
          <span class="ml-2 text-sm font-normal text-ink-400">{{ category.count }}</span>
        </h2>
      </div>
    </div>

    <div
      v-if="!visible"
      class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
      aria-hidden="true"
      :style="{ minHeight: `${skeletonMinHeight}px` }"
    >
      <div
        v-for="n in skeletonCount"
        :key="n"
        class="h-[78px] rounded-2xl bg-cream-200/70 animate-pulse"
      />
    </div>
    <div
      v-else-if="!sites.length"
      class="rounded-2xl border border-dashed border-cream-400 bg-cream-50 py-10 text-center text-ink-400 text-sm"
    >
      该分类下暂无站点
    </div>
    <div
      v-else
      class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      <button
        v-for="site in sites"
        :key="site.id"
        type="button"
        class="text-left rounded-2xl bg-white border border-cream-300/80 p-3.5 hover:border-orange-300 hover:shadow-md transition-all"
        @click="emit('open', site.url)"
      >
        <div class="flex items-start gap-3">
          <SiteAvatar
            :icon="site.icon"
            :color="site.color"
            :letter="site.letter"
            size="size-9"
            rounded="rounded-lg"
            class="text-sm"
          />
          <div class="min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <h3 class="font-semibold text-sm truncate">
                {{ site.name }}
              </h3>
              <span
                v-if="site.hot"
                class="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-orange-500 text-white"
              >HOT</span>
            </div>
            <p class="text-xs text-ink-400 line-clamp-2">
              {{ site.description }}
            </p>
          </div>
        </div>
      </button>
    </div>
  </section>
</template>
