<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})

useSeoMeta({
  title: '后台登录 · 程序员导航网'
})

const account = ref('')
const password = ref('')
const remember = ref(true)
const showPassword = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function onSubmit() {
  loading.value = true
  errorMsg.value = ''
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        account: account.value,
        password: password.value
      }
    })
    await navigateTo('/admin')
  } catch (e: any) {
    errorMsg.value = e?.data?.statusMessage || e?.statusMessage || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid lg:grid-cols-2">
    <section class="relative bg-ink-800 text-white px-10 py-10 flex flex-col min-h-[420px] lg:min-h-screen">
      <div class="flex items-center gap-3 mb-auto">
        <img
          src="/logo.png"
          alt="程序员导航网"
          class="size-10 rounded-xl object-cover"
        >
        <div>
          <p class="font-semibold text-[15px]">
            程序员导航网
          </p>
          <p class="text-[11px] tracking-[0.16em] text-orange-400 uppercase mt-0.5">
            Admin Console
          </p>
        </div>
      </div>

      <div class="py-16 max-w-md">
        <div class="flex items-center gap-3 mb-5">
          <span class="w-8 h-px bg-orange-500" />
          <span class="text-[12px] tracking-[0.16em] text-orange-400 uppercase">01 · Access Control</span>
        </div>
        <h1 class="text-[40px] leading-[1.15] font-semibold tracking-tight mb-4">
          导航站后台<br>管理系统
        </h1>
        <p class="text-white/70 text-[15px] leading-relaxed">
          以让程序员使用更便捷为使命 — 站点收录、分类维护、提交审核，一处管理。
        </p>
      </div>

      <div class="mt-auto">
        <div class="grid grid-cols-3 gap-6 mb-8">
          <div>
            <p class="text-2xl font-semibold tabular-nums">
              128+
            </p>
            <p class="text-xs text-white/50 mt-1">
              收录站点
            </p>
          </div>
          <div>
            <p class="text-2xl font-semibold tabular-nums">
              13
            </p>
            <p class="text-xs text-white/50 mt-1">
              分类
            </p>
          </div>
          <div>
            <p class="text-2xl font-semibold tabular-nums">
              34
            </p>
            <p class="text-xs text-white/50 mt-1">
              在线站点
            </p>
          </div>
        </div>
        <p class="text-xs text-white/35">
          © {{ new Date().getFullYear() }} 程序员导航网 · HAONAV.CN
        </p>
      </div>
    </section>

    <section class="bg-cream-100 flex items-center justify-center px-6 py-12">
      <form
        class="w-full max-w-[420px] rounded-[28px] bg-white border border-cream-300/80 shadow-[0_20px_60px_-30px_rgba(26,23,20,0.35)] px-8 py-9"
        @submit.prevent="onSubmit"
      >
        <h2 class="font-serif text-[32px] leading-none text-ink-800 mb-2">
          欢迎回来
        </h2>
        <p class="text-[12px] tracking-[0.12em] text-ink-400 uppercase mb-8">
          后台管理登录 · Admin Sign In
        </p>

        <label class="block mb-5">
          <span class="block text-[11px] tracking-[0.12em] text-ink-400 uppercase mb-2">Account / 账号</span>
          <div class="flex items-center gap-2.5 h-12 rounded-2xl bg-cream-100 px-3.5 border border-transparent focus-within:border-orange-300 focus-within:bg-white transition-colors">
            <UIcon
              name="i-lucide-user"
              class="size-4 text-ink-400"
            />
            <input
              v-model="account"
              type="text"
              required
              class="flex-1 bg-transparent outline-none text-sm"
              autocomplete="username"
            >
          </div>
        </label>

        <label class="block mb-5">
          <span class="block text-[11px] tracking-[0.12em] text-ink-400 uppercase mb-2">Password / 密码</span>
          <div class="flex items-center gap-2.5 h-12 rounded-2xl bg-cream-100 px-3.5 border border-transparent focus-within:border-orange-300 focus-within:bg-white transition-colors">
            <UIcon
              name="i-lucide-lock"
              class="size-4 text-ink-400"
            />
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="flex-1 bg-transparent outline-none text-sm"
              autocomplete="current-password"
            >
            <button
              type="button"
              class="text-ink-400 hover:text-ink-600"
              :aria-label="showPassword ? '隐藏密码' : '显示密码'"
              @click="showPassword = !showPassword"
            >
              <UIcon
                :name="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                class="size-4"
              />
            </button>
          </div>
        </label>

        <div class="flex items-center justify-between mb-4">
          <label class="inline-flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
            <input
              v-model="remember"
              type="checkbox"
              class="size-4 rounded accent-orange-500"
            >
            记住登录状态
          </label>
          <button
            type="button"
            class="text-sm text-orange-500 hover:text-orange-600"
          >
            忘记密码?
          </button>
        </div>

        <p
          v-if="errorMsg"
          class="text-sm text-red-500 mb-4"
        >
          {{ errorMsg }}
        </p>

        <button
          type="submit"
          class="w-full h-12 rounded-2xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录系统 →' }}
        </button>

        <p class="text-center text-xs text-ink-400 mt-6">
          首次登录? 请联系管理员开通权限。
        </p>
      </form>
    </section>
  </div>
</template>
