<script setup lang="ts">
import type { Category, Site, SiteStatus } from '~/utils/types'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: '站点管理 · 后台管理'
})

const keyword = ref('')
const filter = ref<'all' | SiteStatus>('all')
const page = ref(1)
const pageSize = 8
const saving = ref(false)
const showForm = ref(false)
const editing = ref<Site | null>(null)
const formError = ref('')

const form = reactive({
  name: '',
  description: '',
  url: '',
  categoryId: '',
  status: 'online' as SiteStatus,
  hot: false,
  color: '#1a1714',
  letter: '',
  icon: ''
})

const queryParams = computed(() => ({
  q: keyword.value || undefined,
  status: filter.value,
  page: page.value,
  pageSize
}))

const { data, pending, refresh } = await useFetch<{
  data: Site[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    counts: { all: number, online: number, hidden: number }
  }
}>('/api/sites', { query: queryParams })

const { data: categoryData } = await useFetch<{ data: Category[] }>('/api/categories')

const sites = computed(() => data.value?.data || [])
const meta = computed(() => data.value?.meta || {
  total: 0,
  page: 1,
  pageSize,
  totalPages: 1,
  counts: { all: 0, online: 0, hidden: 0 }
})
const categories = computed(() => categoryData.value?.data || [])

watch([keyword, filter], () => {
  page.value = 1
})

function openCreate() {
  editing.value = null
  Object.assign(form, {
    name: '',
    description: '',
    url: '',
    categoryId: categories.value[0]?.id || '',
    status: 'online',
    hot: false,
    color: '#1a1714',
    letter: '',
    icon: ''
  })
  formError.value = ''
  showForm.value = true
}

function openEdit(site: Site) {
  editing.value = site
  Object.assign(form, {
    name: site.name,
    description: site.description,
    url: site.url,
    categoryId: site.categoryId,
    status: site.status,
    hot: !!site.hot,
    color: site.color,
    letter: site.letter,
    icon: site.icon || ''
  })
  formError.value = ''
  showForm.value = true
}

async function saveSite() {
  saving.value = true
  formError.value = ''
  try {
    if (editing.value) {
      await $fetch(`/api/sites/${editing.value.id}`, {
        method: 'PUT',
        body: { ...form }
      })
    } else {
      await $fetch('/api/sites', {
        method: 'POST',
        body: { ...form }
      })
    }
    showForm.value = false
    await refresh()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || '保存失败'
  } finally {
    saving.value = false
  }
}

async function removeSite(site: Site) {
  if (!confirm(`确认删除站点「${site.name}」？`)) return
  await $fetch(`/api/sites/${site.id}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div>
    <div class="mb-6">
      <p class="text-[12px] text-ink-400 mb-1">
        后台管理 / 站点管理
      </p>
      <h1 class="text-[30px] font-semibold tracking-tight">
        站点管理
        <span class="font-serif font-medium text-ink-400 ml-2">Sites</span>
      </h1>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-5">
      <label class="flex items-center gap-2 h-11 rounded-full bg-white border border-cream-300 px-4 w-full max-w-sm shadow-sm">
        <UIcon
          name="i-lucide-search"
          class="size-4 text-ink-400"
        />
        <input
          v-model="keyword"
          type="search"
          placeholder="搜索站点名称 / 分类..."
          class="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-300"
        >
      </label>

      <div class="flex items-center gap-2">
        <button
          v-for="tab in [
            { key: 'all', label: `全部 ${meta.counts.all}` },
            { key: 'online', label: `上线 ${meta.counts.online}` },
            { key: 'hidden', label: `隐藏 ${meta.counts.hidden}` }
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

      <div class="flex items-center gap-2 ml-auto">
        <button
          type="button"
          class="h-10 px-4 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
          @click="openCreate"
        >
          + 新增站点
        </button>
      </div>
    </div>

    <div class="rounded-2xl bg-white border border-cream-300/80 shadow-sm overflow-hidden">
      <div
        v-if="pending"
        class="py-16 text-center text-sm text-ink-400"
      >
        加载中...
      </div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-sm min-w-[860px]">
          <thead>
            <tr class="bg-cream-100 text-ink-400 text-left">
              <th class="font-medium px-5 py-3">
                站点
              </th>
              <th class="font-medium px-4 py-3">
                分类
              </th>
              <th class="font-medium px-4 py-3">
                状态
              </th>
              <th class="font-medium px-4 py-3">
                更新时间
              </th>
              <th class="font-medium px-5 py-3 text-right">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="site in sites"
              :key="site.id"
              class="border-t border-cream-200"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <SiteAvatar
                    :icon="site.icon"
                    :color="site.color"
                    :letter="site.letter"
                    size="size-9"
                    rounded="rounded-lg"
                    class="text-xs"
                  />
                  <div class="min-w-0">
                    <p class="font-medium truncate">
                      {{ site.name }}
                    </p>
                    <p class="text-xs text-ink-400 truncate">
                      {{ site.description }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-3.5 text-ink-600">
                {{ site.category }}
              </td>
              <td class="px-4 py-3.5">
                <span
                  class="inline-flex items-center gap-1.5 text-xs font-medium"
                  :class="site.status === 'online' ? 'text-emerald-600' : 'text-ink-400'"
                >
                  <span
                    class="size-1.5 rounded-full"
                    :class="site.status === 'online' ? 'bg-emerald-500' : 'bg-ink-300'"
                  />
                  {{ site.status === 'online' ? '上线' : '隐藏' }}
                </span>
              </td>
              <td class="px-4 py-3.5 tabular-nums text-ink-500">
                {{ site.updatedAt }}
              </td>
              <td class="px-5 py-3.5 text-right whitespace-nowrap">
                <button
                  type="button"
                  class="text-ink-600 hover:text-ink-800 mr-3"
                  @click="openEdit(site)"
                >
                  编辑
                </button>
                <button
                  type="button"
                  class="text-red-500 hover:text-red-600"
                  @click="removeSite(site)"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between px-5 py-3.5 border-t border-cream-200 bg-cream-50/50">
        <p class="text-xs text-ink-400">
          共 {{ meta.total }} 条 · 第 {{ meta.page }} / {{ meta.totalPages }} 页
        </p>
        <AdminPagination
          v-model:page="page"
          :total-pages="meta.totalPages"
        />
      </div>
    </div>

    <div
      v-if="showForm"
      class="fixed inset-0 z-50 bg-ink-900/40 flex items-center justify-center p-4"
      @click.self="showForm = false"
    >
      <form
        class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4"
        @submit.prevent="saveSite"
      >
        <h3 class="text-lg font-semibold">
          {{ editing ? '编辑站点' : '新增站点' }}
        </h3>
        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">名称</span>
          <input
            v-model="form.name"
            required
            class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none border border-transparent focus:border-orange-300"
          >
        </label>
        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">链接</span>
          <input
            v-model="form.url"
            required
            class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none border border-transparent focus:border-orange-300"
          >
        </label>
        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">网站图标</span>
          <div class="flex items-center gap-3">
            <SiteAvatar
              :icon="form.icon"
              :color="form.color"
              :letter="form.letter || form.name"
              size="size-10"
              rounded="rounded-xl"
              class="text-sm"
            />
            <input
              v-model="form.icon"
              placeholder="https://example.com/favicon.ico"
              class="flex-1 h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none border border-transparent focus:border-orange-300"
            >
          </div>
        </label>
        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">描述</span>
          <textarea
            v-model="form.description"
            rows="2"
            class="w-full rounded-xl bg-cream-100 px-3 py-2 text-sm outline-none border border-transparent focus:border-orange-300"
          />
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs text-ink-400 mb-1 block">分类</span>
            <select
              v-model="form.categoryId"
              required
              class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none"
            >
              <option
                v-for="cat in categories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="text-xs text-ink-400 mb-1 block">状态</span>
            <select
              v-model="form.status"
              class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none"
            >
              <option value="online">
                上线
              </option>
              <option value="hidden">
                隐藏
              </option>
            </select>
          </label>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs text-ink-400 mb-1 block">颜色</span>
            <input
              v-model="form.color"
              type="text"
              class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none"
            >
          </label>
          <label class="block">
            <span class="text-xs text-ink-400 mb-1 block">字母</span>
            <input
              v-model="form.letter"
              maxlength="8"
              class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none"
            >
          </label>
        </div>
        <label class="inline-flex items-center gap-2 text-sm">
          <input
            v-model="form.hot"
            type="checkbox"
            class="accent-orange-500"
          >
          热门推荐
        </label>
        <p
          v-if="formError"
          class="text-sm text-red-500"
        >
          {{ formError }}
        </p>
        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="h-10 px-4 rounded-full border border-cream-300 text-sm"
            @click="showForm = false"
          >
            取消
          </button>
          <button
            type="submit"
            class="h-10 px-4 rounded-full bg-orange-500 text-white text-sm disabled:opacity-60"
            :disabled="saving"
          >
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
