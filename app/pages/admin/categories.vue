<script setup lang="ts">
import type { Category } from '~/utils/types'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: '分类管理 · 后台管理'
})

const { data, pending, refresh } = await useFetch<{ data: Category[] }>('/api/categories')
const list = computed(() => data.value?.data || [])

const showForm = ref(false)
const editing = ref<Category | null>(null)
const saving = ref(false)
const formError = ref('')
const form = reactive({
  id: '',
  name: '',
  sortOrder: 99
})

function openCreate() {
  editing.value = null
  form.id = ''
  form.name = ''
  form.sortOrder = (list.value.at(-1)?.sortOrder || 0) + 1
  formError.value = ''
  showForm.value = true
}

function openEdit(cat: Category) {
  editing.value = cat
  form.id = cat.id
  form.name = cat.name
  form.sortOrder = cat.sortOrder || 99
  formError.value = ''
  showForm.value = true
}

async function saveCategory() {
  saving.value = true
  formError.value = ''
  try {
    if (editing.value) {
      await $fetch(`/api/categories/${editing.value.id}`, {
        method: 'PUT',
        body: { ...form }
      })
    } else {
      await $fetch('/api/categories', {
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

async function removeCategory(cat: Category) {
  if (!confirm(`确认删除分类「${cat.name}」？`)) return
  try {
    await $fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    alert(e?.data?.statusMessage || '删除失败')
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-end justify-between gap-4">
      <div>
        <p class="text-[12px] text-ink-400 mb-1">
          后台管理 / 分类管理
        </p>
        <h1 class="text-[30px] font-semibold tracking-tight">
          分类管理
          <span class="font-serif font-medium text-ink-400 ml-2">Categories</span>
        </h1>
      </div>
      <button
        type="button"
        class="h-10 px-4 rounded-full bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
        @click="openCreate"
      >
        + 新增分类
      </button>
    </div>

    <div
      v-if="pending"
      class="py-16 text-center text-sm text-ink-400"
    >
      加载中...
    </div>
    <div
      v-else
      class="grid sm:grid-cols-2 xl:grid-cols-3 gap-3"
    >
      <article
        v-for="(cat, index) in list"
        :key="cat.id"
        class="rounded-2xl bg-white border border-cream-300/80 p-4 shadow-sm flex items-center gap-3"
      >
        <span class="size-10 rounded-xl bg-cream-100 text-ink-500 grid place-items-center text-xs font-semibold tabular-nums">
          {{ String(index + 1).padStart(2, '0') }}
        </span>
        <div class="flex-1 min-w-0">
          <p class="font-medium">
            {{ cat.name }}
          </p>
          <p class="text-xs text-ink-400">
            ID: {{ cat.id }} · {{ cat.count }} 个站点
          </p>
        </div>
        <button
          type="button"
          class="text-sm text-ink-500 hover:text-ink-800 mr-2"
          @click="openEdit(cat)"
        >
          编辑
        </button>
        <button
          type="button"
          class="text-sm text-red-500 hover:text-red-600"
          @click="removeCategory(cat)"
        >
          删除
        </button>
      </article>
    </div>

    <div
      v-if="showForm"
      class="fixed inset-0 z-50 bg-ink-900/40 flex items-center justify-center p-4"
      @click.self="showForm = false"
    >
      <form
        class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4"
        @submit.prevent="saveCategory"
      >
        <h3 class="text-lg font-semibold">
          {{ editing ? '编辑分类' : '新增分类' }}
        </h3>
        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">分类 ID</span>
          <input
            v-model="form.id"
            required
            :readonly="!!editing"
            pattern="[a-zA-Z][a-zA-Z0-9_-]{0,63}"
            placeholder="例如 frontend"
            title="以字母开头，仅含字母、数字、下划线或短横线"
            class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none"
            :class="editing ? 'text-ink-400 cursor-not-allowed' : ''"
          >
        </label>
        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">名称</span>
          <input
            v-model="form.name"
            required
            class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none"
          >
        </label>
        <label class="block">
          <span class="text-xs text-ink-400 mb-1 block">排序</span>
          <input
            v-model.number="form.sortOrder"
            type="number"
            class="w-full h-10 rounded-xl bg-cream-100 px-3 text-sm outline-none"
          >
        </label>
        <p
          v-if="formError"
          class="text-sm text-red-500"
        >
          {{ formError }}
        </p>
        <div class="flex justify-end gap-2">
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
