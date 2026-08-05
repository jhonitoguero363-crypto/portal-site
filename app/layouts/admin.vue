<script setup lang="ts">
const route = useRoute()

const { data: reviewData } = useFetch<{ meta: { counts: { pending: number } } }>('/api/reviews', {
  query: { status: 'pending' }
})

const pendingCount = computed(() => reviewData.value?.meta.counts.pending || 0)

const navItems = computed(() => [
  { label: '仪表盘', to: '/admin', icon: 'i-lucide-layout-dashboard' },
  { label: '站点管理', to: '/admin/sites', icon: 'i-lucide-globe' },
  { label: '分类管理', to: '/admin/categories', icon: 'i-lucide-tags' },
  { label: '提交审核', to: '/admin/reviews', icon: 'i-lucide-inbox', badge: pendingCount.value || undefined },
  { label: '设置', to: '/admin/settings', icon: 'i-lucide-settings' }
])

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}

const todayLabel = computed(() => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${days[d.getDay()]} · ${d.getFullYear()}.${mm}.${dd}`
})

const loggingOut = ref(false)

async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await navigateTo('/admin/login')
  } finally {
    loggingOut.value = false
  }
}</script>

<template>
  <div class="h-screen overflow-hidden bg-cream-100 text-ink-800 flex">
    <aside class="w-[248px] h-full shrink-0 border-r border-cream-300/70 bg-cream-100 flex flex-col px-4 py-5">
      <NuxtLink
        to="/admin"
        class="flex items-center gap-3 px-2 mb-8 shrink-0"
      >
        <img
          src="/logo.png"
          alt="程序员导航网"
          class="size-10 rounded-xl object-cover shadow-sm"
        >
        <span class="leading-tight">
          <span class="block font-semibold text-[15px]">程序员导航网</span>
          <span class="block text-[11px] tracking-[0.14em] text-ink-400 uppercase mt-0.5">后台管理 · ADMIN</span>
        </span>
      </NuxtLink>

      <p class="px-3 mb-2 text-[11px] tracking-[0.16em] text-ink-400 uppercase shrink-0">
        Navigation
      </p>

      <nav class="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="group flex items-center gap-3 rounded-full px-3.5 py-2.5 text-[14px] transition-colors"
          :class="isActive(item.to)
            ? 'bg-ink-800 text-white shadow-sm'
            : 'text-ink-600 hover:bg-cream-200'"
        >
          <UIcon
            :name="item.icon"
            class="size-[18px]"
          />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.badge"
            class="min-w-5 h-5 px-1.5 rounded-full bg-orange-500 text-white text-[11px] font-semibold grid place-items-center"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </nav>

      <div class="shrink-0 pt-6">
        <div class="rounded-2xl bg-white border border-cream-300/80 px-3 py-3 flex items-center gap-3 shadow-sm">
          <span class="size-9 rounded-full bg-orange-500 text-white grid place-items-center text-sm font-semibold">
            管
          </span>
          <span class="leading-tight">
            <span class="block text-sm font-medium">管理员</span>
            <span class="block text-[11px] tracking-[0.12em] text-ink-400 uppercase">Super Admin</span>
          </span>
        </div>
      </div>
    </aside>

    <div class="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
      <header class="h-16 shrink-0 px-8 flex items-center justify-between border-b border-cream-300/60 bg-cream-100/80 backdrop-blur z-10">
        <div class="text-[12px] text-ink-400">
          后台管理
        </div>
        <div class="flex items-center gap-4">
          <span class="text-[12px] tracking-[0.08em] text-ink-400 font-medium tabular-nums">
            {{ todayLabel }}
          </span>
          <button
            type="button"
            class="size-9 rounded-full border border-cream-300 bg-white text-ink-500 grid place-items-center hover:border-ink-300 transition-colors"
            aria-label="通知"
          >
            <UIcon
              name="i-lucide-bell"
              class="size-4"
            />
          </button>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-cream-300 bg-white text-ink-600 text-sm font-medium hover:border-ink-300 hover:text-ink-800 transition-colors disabled:opacity-60"
            :disabled="loggingOut"
            aria-label="退出登录"
            @click="logout"
          >
            <UIcon
              name="i-lucide-log-out"
              class="size-3.5"
            />
            {{ loggingOut ? '退出中...' : '退出登录' }}
          </button>
          <span class="size-9 rounded-full bg-orange-500 text-white grid place-items-center text-sm font-semibold">
            管
          </span>
        </div>
      </header>

      <main class="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        <slot />
      </main>
    </div>
  </div>
</template>
