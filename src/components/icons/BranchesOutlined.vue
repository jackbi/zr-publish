<template>
  <!-- 24 视框的描边图标：原 1024 视框填充路径在 14px 下会糊成一团（看起来像乱码） -->
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <line x1="6" y1="4" x2="6" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
</template>

<script lang="ts" setup>
defineOptions({ name: 'BranchesOutlined' });
</script>
