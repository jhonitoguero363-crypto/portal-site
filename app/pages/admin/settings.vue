<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: '设置 · 后台管理'
})

const { data, refresh } = await useFetch<{
  data: { siteName: string, siteUrl: string, allowSubmit: boolean }
}>('/api/settings')

const siteName = ref('')
const siteUrl = ref('')
const allowSubmit = ref(true)
const saving = ref(false)
const message = ref('')

watchEffect(() => {
  if (!data.value?.data) return
  siteName.value = data.value.data.siteName
  siteUrl.value = data.value.data.siteUrl
  allowSubmit.value = data.value.data.allowSubmit
})

async function save() {
  saving.value = true
  message.value = ''
  try {
    await $fetch('/api/settings', {
      method: 'PUT',
      body: {
        siteName: siteName.value,
        siteUrl: siteUrl.value,
        allowSubmit: allowSubmit.value
      }
    })
    await refresh()
    message.value = '已保存'
  } catch (e: any) {
    message.value = e?.data?.statusMessage || '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <p class="text-[12px] text-ink-400 mb-1">
        后台管理 / 设置
      </p>
      <h1 class="text-[30px] font-semibold tracking-tight">
        设置
        <span class="font-serif font-medium text-ink-400 ml-2">Settings</span>
      </h1>
    </div>

    <form
      class="max-w-xl rounded-2xl bg-white border border-cream-300/80 p-6 shadow-sm space-y-5"
      @submit.prevent="save"
    >
      <label class="block">
        <span class="block text-sm text-ink-500 mb-2">站点名称</span>
        <input
          v-model="siteName"
          type="text"
          class="w-full h-11 rounded-xl bg-cream-100 px-3.5 text-sm outline-none border border-transparent focus:border-orange-300 focus:bg-white"
        >
      </label>
      <label class="block">
        <span class="block text-sm text-ink-500 mb-2">站点地址</span>
        <input
          v-model="siteUrl"
          type="url"
          class="w-full h-11 rounded-xl bg-cream-100 px-3.5 text-sm outline-none border border-transparent focus:border-orange-300 focus:bg-white"
        >
      </label>
      <label class="flex items-center justify-between gap-4 py-1">
        <span>
          <span class="block text-sm font-medium">开放投稿</span>
          <span class="block text-xs text-ink-400 mt-0.5">允许访客提交新站点审核</span>
        </span>
        <input
          v-model="allowSubmit"
          type="checkbox"
          class="size-4 accent-orange-500"
        >
      </label>
      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="h-10 px-5 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
          :disabled="saving"
        >
          {{ saving ? '保存中...' : '保存设置' }}
        </button>
        <span
          v-if="message"
          class="text-sm text-ink-500"
        >{{ message }}</span>
      </div>
    </form>
  </div>
</template>
