<script setup lang="ts">
import type { ReviewItem, ReviewStatus } from '~/utils/types'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: '提交审核 · 后台管理'
})

const filter = ref<'all' | ReviewStatus>('all')
const actingId = ref('')

const queryParams = computed(() => ({
  status: filter.value
}))

const { data, pending, refresh } = await useFetch<{
  data: ReviewItem[]
  meta: { counts: { all: number, pending: number, approved: number, rejected: number } }
}>('/api/reviews', { query: queryParams })

const items = computed(() => data.value?.data || [])
const counts = computed(() => data.value?.meta.counts || {
  all: 0,
  pending: 0,
  approved: 0,
  rejected: 0
})

async function updateStatus(id: string, status: ReviewStatus) {
  actingId.value = id
  try {
    await $fetch(`/api/reviews/${id}`, {
      method: 'PUT',
      body: { status }
    })
    await refresh()
  } finally {
    actingId.value = ''
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <p class="text-[12px] text-ink-400 mb-1">
        后台管理 / 提交审核
      </p>
      <h1 class="text-[30px] font-semibold tracking-tight">
        提交审核
        <span class="font-serif font-medium text-ink-400 ml-2">Review</span>
      </h1>
    </div>

    <div class="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
      <div class="flex items-center gap-2 flex-wrap">
        <button
          v-for="tab in [
            { key: 'all', label: `全部 ${counts.all}` },
            { key: 'pending', label: `待审核 ${counts.pending}` },
            { key: 'approved', label: `已通过 ${counts.approved}` },
            { key: 'rejected', label: `已驳回 ${counts.rejected}` }
          ]"
          :key="tab.key"
          type="button"
          class="h-9 px-3.5 rounded-full text-sm transition-colors"
          :class="filter === tab.key
            ? 'bg-ink-800 text-white'
            : 'bg-white border border-cream-300 text-ink-600 hover:border-ink-300'"
          @click="filter = tab.key as typeof filter"
        >
          {{ tab.label }}
        </button>
      </div>
      <p class="sm:ml-auto text-xs text-ink-400">
        最新提交优先 · 48小时内
      </p>
    </div>

    <div
      v-if="pending"
      class="py-16 text-center text-sm text-ink-400"
    >
      加载中...
    </div>
    <div
      v-else
      class="space-y-3"
    >
      <article
        v-for="item in items"
        :key="item.id"
        class="rounded-2xl bg-white border border-cream-300/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4"
      >
        <div class="flex items-start gap-3 flex-1 min-w-0">
          <SiteAvatar
            :icon="item.icon"
            :color="item.color"
            :letter="item.letter"
            size="size-14"
            rounded="rounded-2xl"
            class="text-lg text-ink-700"
          />
          <div class="min-w-0">
            <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-1">
              <h3 class="font-semibold text-[15px]">
                {{ item.name }}
              </h3>
              <a
                :href="item.url.startsWith('http') ? item.url : `https://${item.url}`"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-orange-500 hover:text-orange-600"
              >{{ item.url }}</a>
            </div>
            <p class="text-sm text-ink-400 leading-relaxed">
              {{ item.description }}
            </p>
          </div>
        </div>

        <div class="md:w-[220px] shrink-0 flex flex-col items-start md:items-end gap-2">
          <span class="text-xs px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 font-medium">
            {{ item.category || '未分类' }}
          </span>
          <p class="text-xs text-ink-400">
            提交人 · {{ item.submitter }}
            <span class="mx-1.5">·</span>
            {{ item.submittedAt }}
          </p>
          <div
            v-if="item.status === 'pending'"
            class="flex items-center gap-2 mt-1"
          >
            <button
              type="button"
              class="h-9 px-4 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-60"
              :disabled="actingId === item.id"
              @click="updateStatus(item.id, 'approved')"
            >
              通过
            </button>
            <button
              type="button"
              class="h-9 px-4 rounded-full bg-white border border-cream-300 text-sm text-ink-600 hover:border-ink-300 disabled:opacity-60"
              :disabled="actingId === item.id"
              @click="updateStatus(item.id, 'rejected')"
            >
              驳回
            </button>
          </div>
          <p
            v-else
            class="text-xs font-medium mt-1"
            :class="item.status === 'approved' ? 'text-emerald-600' : 'text-red-500'"
          >
            {{ item.status === 'approved' ? '已通过' : '已驳回' }}
          </p>
        </div>
      </article>

      <div
        v-if="!items.length"
        class="rounded-2xl border border-dashed border-cream-400 bg-cream-50 py-16 text-center text-ink-400 text-sm"
      >
        当前筛选下暂无提交
      </div>
    </div>
  </div>
</template>
