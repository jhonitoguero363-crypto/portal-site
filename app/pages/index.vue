<script setup lang="ts">
import type { Category, Site } from '~/utils/types'

interface HomeSection {
  category: Category
  sites: Site[]
}

const route = useRoute()
const router = useRouter()

const search = ref('')
const activeCategory = ref(typeof route.query.cat === 'string' ? route.query.cat : 'all')

const { data, pending, error, refresh } = await useFetch<{
  data: {
    stats: { totalSites: number, onlineSites: number, categoryCount: number }
    categories: Category[]
    hotSites: Site[]
    sections: HomeSection[]
  }
}>('/api/portal/home')

const categories = computed(() => data.value?.data.categories || [])
const hotSites = computed(() => data.value?.data.hotSites || [])
const sections = computed(() => data.value?.data.sections || [])
const stats = computed(() => data.value?.data.stats || { totalSites: 0, onlineSites: 0, categoryCount: 0 })

const showOverview = computed(() => !search.value.trim())

const searchQuery = computed(() => ({
  status: 'online',
  q: search.value.trim() || undefined,
  page: 1,
  pageSize: 100
}))

const {
  data: searchData,
  pending: searchPending,
  refresh: refreshSearch
} = await useFetch<{ data: Site[], meta: { total: number } }>('/api/sites', {
  query: searchQuery,
  watch: [search],
  immediate: !showOverview.value
})

const searchSites = computed(() => searchData.value?.data || [])
const searchTotal = computed(() => searchData.value?.meta.total || 0)

watch(search, (q) => {
  if (q.trim()) refreshSearch()
})

watch(activeCategory, (id) => {
  router.replace({ query: id === 'all' ? {} : { cat: id } })
})

const todayLabel = computed(() => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${days[d.getDay()]} · ${d.getFullYear()}.${mm}.${dd}`
})

function openSite(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

const HEADER_OFFSET = 96 // sticky header + scroll-mt-24
const sectionRefs = ref<Record<string, { reveal: () => void } | null>>({})
const lockScrollSpy = ref(false)
let unlockTimer: ReturnType<typeof setTimeout> | null = null

function setSectionRef(id: string, el: { reveal: () => void } | null) {
  if (el) sectionRefs.value[id] = el
  else delete sectionRefs.value[id]
}

function unlockSpySoon() {
  if (unlockTimer) clearTimeout(unlockTimer)
  const done = () => {
    lockScrollSpy.value = false
    window.removeEventListener('scrollend', done)
    if (unlockTimer) {
      clearTimeout(unlockTimer)
      unlockTimer = null
    }
  }
  window.addEventListener('scrollend', done, { once: true })
  unlockTimer = setTimeout(done, 1200)
}

async function scrollToCategory(id: string) {
  lockScrollSpy.value = true

  if (id === 'all') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    unlockSpySoon()
    return
  }

  // Reveal target and preceding sections so layout height is accurate
  const list = sections.value
  const targetIndex = list.findIndex(s => s.category.id === id)
  if (targetIndex >= 0) {
    for (let i = 0; i <= targetIndex; i++) {
      sectionRefs.value[list[i].category.id]?.reveal()
    }
  } else {
    sectionRefs.value[id]?.reveal()
  }

  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

  const el = document.getElementById(`category-${id}`)
  if (!el) {
    unlockSpySoon()
    return
  }

  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  unlockSpySoon()
}

function selectCategory(id: string) {
  activeCategory.value = id
  if (search.value.trim()) {
    search.value = ''
    nextTick(() => {
      nextTick(() => scrollToCategory(id))
    })
    return
  }
  scrollToCategory(id)
}

// Sync highlight while scrolling through sections
let sectionObserver: IntersectionObserver | null = null

onMounted(() => {
  if (!import.meta.client) return

  sectionObserver = new IntersectionObserver(
    (entries) => {
      if (search.value.trim() || lockScrollSpy.value) return
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      const first = visible[0]
      if (!first?.target?.id?.startsWith('category-')) return
      const id = first.target.id.replace('category-', '')
      if (id && activeCategory.value !== id) {
        activeCategory.value = id
      }
    },
    { rootMargin: '-20% 0px -65% 0px', threshold: 0 }
  )

  watch(
    sections,
    (list) => {
      sectionObserver?.disconnect()
      nextTick(() => {
        for (const section of list) {
          const el = document.getElementById(`category-${section.category.id}`)
          if (el) sectionObserver?.observe(el)
        }
      })
    },
    { immediate: true }
  )

  // Honor ?cat= on first load
  if (activeCategory.value !== 'all') {
    nextTick(() => scrollToCategory(activeCategory.value))
  }
})

onBeforeUnmount(() => {
  sectionObserver?.disconnect()
  sectionObserver = null
  if (unlockTimer) clearTimeout(unlockTimer)
})

const showSubmitModal = ref(false)
const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)
const submitForm = reactive({
  name: '',
  url: '',
  description: '',
  categoryId: '',
  submitter: '',
  icon: ''
})

const submitCategories = computed(() =>
  categories.value.filter(c => c.id !== 'all')
)

function openSubmitModal() {
  submitError.value = ''
  submitSuccess.value = false
  submitForm.name = ''
  submitForm.url = ''
  submitForm.description = ''
  submitForm.categoryId = submitCategories.value[0]?.id || ''
  submitForm.submitter = ''
  submitForm.icon = ''
  showSubmitModal.value = true
}

function closeSubmitModal() {
  if (submitting.value) return
  showSubmitModal.value = false
}

async function submitSite() {
  submitError.value = ''
  submitSuccess.value = false
  submitting.value = true
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: {
        name: submitForm.name,
        url: submitForm.url,
        description: submitForm.description,
        categoryId: submitForm.categoryId || undefined,
        submitter: submitForm.submitter || undefined,
        icon: submitForm.icon || undefined
      }
    })
    submitSuccess.value = true
    setTimeout(() => {
      showSubmitModal.value = false
    }, 1200)
  } catch (e: any) {
    submitError.value = e?.data?.statusMessage || e?.statusMessage || '提交失败，请稍后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-cream-100">
    <header class="sticky top-0 z-20 border-b border-cream-300/70 bg-cream-100/90 backdrop-blur">
      <div class="mx-auto max-w-[1200px] px-5 h-16 flex items-center gap-4">
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5 shrink-0"
          @click="selectCategory('all')"
        >
          <img
            src="/logo.png"
            alt="程序员导航网"
            class="size-9 rounded-xl object-cover shadow-sm"
          >
          <span class="font-semibold text-[15px]">程序员导航网</span>
        </NuxtLink>

        <div class="flex-1 max-w-xl mx-auto">
          <label class="flex items-center gap-2 h-10 rounded-full bg-white border border-cream-300 px-3.5 shadow-sm focus-within:border-orange-400 transition-colors">
            <UIcon
              name="i-lucide-search"
              class="size-4 text-ink-400"
            />
            <input
              v-model="search"
              type="search"
              placeholder="搜索网站 / 工具 / 社区"
              class="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-300"
            >
            <button
              type="button"
              class="h-7 px-3.5 rounded-full bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition-colors"
            >
              搜索
            </button>
          </label>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <span class="hidden md:block text-[12px] tracking-[0.08em] text-ink-400 tabular-nums">
            {{ todayLabel }}
          </span>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-ink-800 text-white text-sm font-medium hover:bg-ink-700 transition-colors"
            @click="openSubmitModal"
          >
            <UIcon
              name="i-lucide-plus"
              class="size-3.5"
            />
            提交站点
          </button>
        </div>
      </div>
    </header>

    <div class="mx-auto max-w-[1200px] px-5 py-8 grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8">
      <div class="min-w-0">
        <section class="mb-10">
          <p class="text-[12px] tracking-[0.14em] text-orange-500 font-medium mb-3">
            PROGRAMMER NAVIGATION
            <span class="text-ink-300"> / 程序员导航</span>
          </p>
          <h1 class="text-[34px] md:text-[40px] leading-[1.15] font-semibold tracking-tight text-ink-800 mb-3">
            一站式程序员工作学习导航网站
          </h1>
          <p class="text-ink-500 text-[15px] leading-relaxed max-w-2xl mb-5">
            精选开发者日常必备的工具、社区与学习资源。按分类快速检索，持续更新，让查找与上手更省时间。
          </p>
          <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-600">
            <span><strong class="text-ink-800">{{ stats.onlineSites }}+</strong> 收录站点</span>
            <span><strong class="text-ink-800">{{ stats.categoryCount }}</strong> 个分类</span>
            <span><strong class="text-ink-800">每日</strong> 更新</span>
          </div>
        </section>

        <div
          v-if="pending"
          class="py-16 text-center text-ink-400 text-sm"
        >
          加载中...
        </div>
        <div
          v-else-if="error"
          class="py-16 text-center text-sm"
        >
          <p class="text-red-500 mb-3">
            数据加载失败
          </p>
          <button
            type="button"
            class="text-orange-500"
            @click="refresh()"
          >
            重试
          </button>
        </div>

        <!-- 全部网站：按分类列出全部站点 -->
        <template v-else-if="showOverview">
          <section
            v-if="hotSites.length"
            id="category-hot"
            class="mb-10 scroll-mt-24"
          >
            <div class="flex items-end justify-between mb-4">
              <div>
                <p class="text-[11px] tracking-[0.16em] text-ink-400 mb-1">
                  HOT
                </p>
                <h2 class="text-xl font-semibold">
                  热门推荐
                  <span class="ml-2 text-sm font-normal text-ink-400">{{ hotSites.length }}</span>
                </h2>
              </div>
            </div>
            <div class="grid sm:grid-cols-2 gap-3">
              <button
                v-for="site in hotSites"
                :key="site.id"
                type="button"
                class="group text-left rounded-2xl bg-white border border-cream-300/80 p-4 hover:border-orange-300 hover:shadow-md transition-all"
                @click="openSite(site.url)"
              >
                <div class="flex items-start gap-3">
                  <SiteAvatar
                    :icon="site.icon"
                    :color="site.color"
                    :letter="site.letter"
                    size="size-11"
                  />
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <h3 class="font-semibold truncate">
                        {{ site.name }}
                      </h3>
                      <span class="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-orange-500 text-white">HOT</span>
                    </div>
                    <p class="text-sm text-ink-400 line-clamp-2">
                      {{ site.description }}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </section>

          <CategorySection
            v-for="(section, index) in sections"
            :key="section.category.id"
            :ref="(el) => setSectionRef(section.category.id, el as any)"
            :category="section.category"
            :sites="section.sites"
            :index="index"
            @open="openSite"
          />
        </template>

        <!-- 搜索结果 -->
        <section
          v-else
          class="mb-6"
        >
          <div class="flex items-end justify-between mb-4 gap-3">
            <div>
              <p class="text-[11px] tracking-[0.16em] text-ink-400 mb-1">
                SEARCH
              </p>
              <h2 class="text-xl font-semibold">
                搜索：{{ search.trim() }}
                <span class="ml-2 text-sm font-normal text-ink-400">{{ searchTotal }}</span>
              </h2>
            </div>
            <button
              type="button"
              class="text-sm text-ink-500 hover:text-orange-500 shrink-0"
              @click="search = ''; selectCategory('all')"
            >
              返回全部
            </button>
          </div>

          <div
            v-if="searchPending"
            class="py-16 text-center text-ink-400 text-sm"
          >
            加载中...
          </div>
          <div
            v-else-if="!searchSites.length"
            class="rounded-2xl border border-dashed border-cream-400 bg-cream-50 py-16 text-center text-ink-400 text-sm"
          >
            未找到相关站点
          </div>
          <div
            v-else
            class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            <button
              v-for="site in searchSites"
              :key="site.id"
              type="button"
              class="text-left rounded-2xl bg-white border border-cream-300/80 p-3.5 hover:border-orange-300 hover:shadow-md transition-all"
              @click="openSite(site.url)"
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
      </div>

      <aside class="lg:sticky lg:top-24 self-start space-y-4">
        <div class="rounded-2xl bg-white border border-cream-300/80 p-4 shadow-sm max-h-[70vh] overflow-y-auto">
          <p class="text-[11px] tracking-[0.14em] text-ink-400 uppercase mb-3">
            分类 / INDEX
          </p>
          <nav class="flex flex-col gap-1">
            <button
              v-for="(cat, index) in categories"
              :key="cat.id"
              type="button"
              class="flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors"
              :class="activeCategory === cat.id
                ? 'bg-ink-800 text-white'
                : 'text-ink-600 hover:bg-cream-200'"
              @click="selectCategory(cat.id)"
            >
              <span
                v-if="cat.id !== 'all'"
                class="w-5 text-[11px] tabular-nums opacity-60"
              >{{ String(index).padStart(2, '0') }}</span>
              <span class="flex-1 text-left truncate">{{ cat.name }}</span>
              <span class="text-[11px] tabular-nums opacity-70">{{ cat.count }}</span>
            </button>
          </nav>
        </div>

        <div class="rounded-2xl border border-cream-300/80 bg-cream-50 p-4">
          <p class="text-sm font-medium mb-1">
            发现好站？欢迎投稿
          </p>
          <p class="text-xs text-ink-400 mb-3 leading-relaxed">
            提交你常用的开发工具或社区，审核通过后将收录进导航。
          </p>
          <button
            type="button"
            class="text-sm font-medium text-orange-500 hover:text-orange-600"
            @click="openSubmitModal"
          >
            立即投稿 →
          </button>
        </div>
      </aside>
    </div>

    <footer class="border-t border-cream-300/70 mt-4">
      <div class="mx-auto max-w-[1200px] px-5 h-14 flex items-center justify-between text-sm text-ink-400">
        <p>© {{ new Date().getFullYear() }} 程序员导航网</p>
        <div class="flex gap-4">
          <a
            href="#"
            class="hover:text-ink-700"
          >友情链接</a>
          <a
            href="#"
            class="hover:text-ink-700"
          >开源协议</a>
          <NuxtLink
            to="/admin/login"
            class="hover:text-ink-700"
          >
            后台管理
          </NuxtLink>
        </div>
      </div>
    </footer>

    <div
      v-if="showSubmitModal"
      class="fixed inset-0 z-50 bg-ink-900/40 flex items-center justify-center p-4"
      @click.self="closeSubmitModal"
    >
      <form
        class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4"
        @submit.prevent="submitSite"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-ink-800">
              提交站点
            </h3>
            <p class="text-xs text-ink-400 mt-1">
              审核通过后将收录进导航
            </p>
          </div>
          <button
            type="button"
            class="size-8 rounded-full text-ink-400 hover:bg-cream-100 hover:text-ink-700 grid place-items-center"
            aria-label="关闭"
            @click="closeSubmitModal"
          >
            <UIcon
              name="i-lucide-x"
              class="size-4"
            />
          </button>
        </div>

        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">站点名称</span>
          <input
            v-model="submitForm.name"
            required
            maxlength="80"
            placeholder="例如：GitHub"
            class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none border border-transparent focus:border-orange-300"
          >
        </label>

        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">站点链接</span>
          <input
            v-model="submitForm.url"
            required
            placeholder="https://example.com"
            class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none border border-transparent focus:border-orange-300"
          >
        </label>

        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">网站图标（选填）</span>
          <div class="flex items-center gap-3">
            <SiteAvatar
              :icon="submitForm.icon"
              :letter="submitForm.name"
              size="size-10"
              class="text-sm"
            />
            <input
              v-model="submitForm.icon"
              placeholder="https://example.com/favicon.ico"
              class="flex-1 h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none border border-transparent focus:border-orange-300"
            >
          </div>
        </label>

        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">简介</span>
          <textarea
            v-model="submitForm.description"
            rows="3"
            maxlength="200"
            placeholder="一句话介绍这个站点"
            class="w-full rounded-xl bg-cream-100 px-3 py-2 text-sm outline-none border border-transparent focus:border-orange-300 resize-none"
          />
        </label>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs text-ink-400 mb-1 block">分类</span>
            <select
              v-model="submitForm.categoryId"
              required
              class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none border border-transparent focus:border-orange-300"
            >
              <option
                v-for="cat in submitCategories"
                :key="cat.id"
                :value="cat.id"
              >
                {{ cat.name }}
              </option>
            </select>
          </label>
          <label class="block">
            <span class="text-xs text-ink-400 mb-1 block">提交人（选填）</span>
            <input
              v-model="submitForm.submitter"
              maxlength="40"
              placeholder="昵称或邮箱"
              class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none border border-transparent focus:border-orange-300"
            >
          </label>
        </div>

        <p
          v-if="submitError"
          class="text-sm text-red-500"
        >
          {{ submitError }}
        </p>
        <p
          v-else-if="submitSuccess"
          class="text-sm text-emerald-600"
        >
          提交成功，等待审核
        </p>

        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            class="h-10 px-4 rounded-full border border-cream-300 text-sm text-ink-600"
            :disabled="submitting"
            @click="closeSubmitModal"
          >
            取消
          </button>
          <button
            type="submit"
            class="h-10 px-5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
            :disabled="submitting || submitSuccess"
          >
            {{ submitting ? '提交中...' : '提交审核' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
