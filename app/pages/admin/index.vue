<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: '仪表盘 · 后台管理'
})

const { data, pending, error, refresh } = await useFetch<{
  data: {
    stats: Array<{ label: string, value: string, delta: string, icon: string }>
    popularSites: Array<{
      id: string
      name: string
      category: string
      color: string
      letter: string
      icon?: string
    }>
  }
}>('/api/dashboard')

const stats = computed(() => data.value?.data.stats || [])
const popularSites = computed(() => data.value?.data.popularSites || [])
</script>

<template>
  <div>
    <div class="mb-6">
      <p class="text-[12px] text-ink-400 mb-1">
        后台管理 / 仪表盘
      </p>
      <h1 class="text-[30px] font-semibold tracking-tight">
        仪表盘
        <span class="font-serif font-medium text-ink-400 ml-2">Dashboard</span>
      </h1>
    </div>

    <div
      v-if="pending"
      class="py-20 text-center text-ink-400 text-sm"
    >
      加载中...
    </div>
    <div
      v-else-if="error"
      class="py-20 text-center text-sm"
    >
      <p class="text-red-500 mb-3">
        仪表盘加载失败
      </p>
      <button
        type="button"
        class="text-orange-500"
        @click="refresh()"
      >
        重试
      </button>
    </div>
    <template v-else>
      <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-2xl bg-white border border-cream-300/80 p-5 shadow-sm"
        >
          <div class="flex items-start justify-between mb-4">
            <p class="text-sm text-ink-400">
              {{ stat.label }}
            </p>
            <span class="size-9 rounded-xl bg-cream-100 text-ink-600 grid place-items-center">
              <UIcon
                :name="stat.icon"
                class="size-4"
              />
            </span>
          </div>
          <p class="text-[32px] leading-none font-semibold tabular-nums mb-2">
            {{ stat.value }}
          </p>
          <p class="text-xs text-orange-500 font-medium">
            {{ stat.delta }}
          </p>
        </div>
      </div>

      <section class="rounded-2xl bg-white border border-cream-300/80 p-5 shadow-sm max-w-xl">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-semibold text-lg">
            热门站点
          </h2>
          <NuxtLink
            to="/admin/sites"
            class="text-xs text-orange-500 hover:text-orange-600"
          >
            查看全部
          </NuxtLink>
        </div>
        <ul class="space-y-3">
          <li
            v-for="(site, index) in popularSites"
            :key="site.id"
            class="flex items-center gap-3"
          >
            <span class="w-5 text-xs tabular-nums text-ink-300">{{ String(index + 1).padStart(2, '0') }}</span>
            <SiteAvatar
              :icon="site.icon"
              :color="site.color"
              :letter="site.letter"
              size="size-8"
              rounded="rounded-lg"
              class="text-xs"
            />
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium truncate">
                {{ site.name }}
              </p>
              <p class="text-[11px] text-ink-400 truncate">
                {{ site.category }}
              </p>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
