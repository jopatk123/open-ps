<script setup lang="ts">
import type { IconName } from './names';

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 20 });
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <!-- 工具 -->
    <template v-if="name === 'move'">
      <path
        d="M3 2.5v11.5l2.8-2.6 2 4.4 1.6-.7-2-4.4h3.8z"
        fill="currentColor"
        stroke-linejoin="miter"
      />
      <path d="M14.5 9.5v8M10.5 13.5h8" />
      <path
        d="M14.5 8.5l-1.6 1.8h3.2zM14.5 18.5l-1.6-1.8h3.2zM9.5 13.5l1.8-1.6v3.2zM19.5 13.5l-1.8-1.6v3.2z"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'marquee'">
      <rect x="3.5" y="4.5" width="13" height="11" stroke-dasharray="2 1.6" stroke-linecap="butt" />
    </template>
    <template v-else-if="name === 'magicWand'">
      <path d="M3 17.5l8.5-8.5" stroke-width="2.4" />
      <path d="M11.5 9l1.3-1.3" stroke-width="2.4" stroke="currentColor" opacity="0.55" />
      <path
        d="M15 2v2.6M15 7.4V10M11 6h2.6M16.4 6H19M12.2 3.2l1.4 1.4M16.4 7.4l1.4 1.4M17.8 3.2l-1.4 1.4"
      />
    </template>
    <template v-else-if="name === 'crop'">
      <path
        d="M6 2v12h12M2 6h12v12"
        stroke-width="1.8"
        stroke-linecap="butt"
        stroke-linejoin="miter"
      />
    </template>
    <template v-else-if="name === 'brush'">
      <path d="M17.5 2.5l-7 7" stroke-width="2" />
      <path d="M10.2 9.8l-1-1" stroke-width="2.6" stroke-linecap="butt" />
      <path
        d="M8.4 10.2c-2.4-.2-3.6 1.6-3.7 3.4-.1 1.9-1.4 3-2.4 3.5 3.6.9 7.8-.4 8-4.4z"
        fill="currentColor"
      />
    </template>
    <template v-else-if="name === 'eyedropper'">
      <path d="M12.6 4.2a2.4 2.4 0 0 1 3.4 3.4l-1.7 1.7-3.4-3.4z" fill="currentColor" />
      <path d="M10 5.2l4.8 4.8" stroke-width="1.6" />
      <path d="M12 8L5 15" stroke-width="2" />
      <path d="M5 15l-2 2.6" />
    </template>
    <template v-else-if="name === 'pen'">
      <g transform="rotate(-40 10 10)">
        <path d="M10 1.5l4.2 7-2.2 6h-4l-2.2-6z" fill="currentColor" fill-opacity="0.15" />
        <path d="M10 1.5v6.8" />
        <circle cx="10" cy="9.3" r="1.1" fill="currentColor" stroke="none" />
        <path d="M7.6 15.2h4.8v3h-4.8z" fill="currentColor" />
      </g>
    </template>
    <template v-else-if="name === 'clone'">
      <circle cx="10" cy="4.2" r="2.4" fill="currentColor" stroke="none" />
      <path d="M8.8 6.4h2.4l1.2 4.4H7.6z" fill="currentColor" />
      <rect
        x="3.5"
        y="11"
        width="13"
        height="3.4"
        rx="0.6"
        fill="currentColor"
        fill-opacity="0.2"
      />
      <path d="M4.5 17h11" stroke-width="1.6" />
    </template>
    <template v-else-if="name === 'fill'">
      <path d="M9 3.5l6.5 6.5-6 6-6.5-6.5z" fill="currentColor" fill-opacity="0.15" />
      <path d="M3 9.5h12.5" />
      <path d="M9 3.5C7.6 1.6 5.4 2.4 6.2 5" />
      <path
        d="M17.2 11.6s-1.8 2.4-1.8 3.6a1.8 1.8 0 0 0 3.6 0c0-1.2-1.8-3.6-1.8-3.6z"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'text'">
      <path
        d="M4 3.5h12V7h-1l-.6-2H11.2v10.4l1.8.6v1H7v-1l1.8-.6V5H5.6L5 7H4z"
        fill="currentColor"
        stroke="none"
      />
    </template>

    <!-- 面板与通用 -->
    <template v-else-if="name === 'eye'">
      <path d="M1.5 10C4.2 5.6 15.8 5.6 18.5 10 15.8 14.4 4.2 14.4 1.5 10z" />
      <circle cx="10" cy="10" r="2.6" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'newLayer'">
      <path d="M5 3.5h7l3 3v10H5z" fill="#fff" />
      <path d="M12 3.5v3h3" />
    </template>
    <template v-else-if="name === 'trash'">
      <path d="M4 5.5h12M8 5.5V3.5h4v2" />
      <path d="M5.5 5.5l.8 11h7.4l.8-11" fill="currentColor" fill-opacity="0.12" />
      <path d="M8.3 8v6.5M11.7 8v6.5" />
    </template>
    <template v-else-if="name === 'close'">
      <path d="M6 6l8 8M14 6l-8 8" stroke-width="1.5" />
    </template>
    <template v-else-if="name === 'commit'">
      <path d="M4 10.5l4 4 8-9" stroke-width="2" />
    </template>
    <template v-else-if="name === 'cancel'">
      <circle cx="10" cy="10" r="6.5" stroke-width="1.6" />
      <path d="M5.5 14.5l9-9" stroke-width="1.6" />
    </template>
    <template v-else-if="name === 'panelMenu'">
      <path d="M5 6h10M5 9h10M5 12h10" />
      <path d="M12 14.5h4l-2 2.2z" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'chevronDown'">
      <path d="M6 8h8l-4 4.5z" fill="currentColor" stroke="none" />
    </template>

    <!-- 选区模式 -->
    <template v-else-if="name === 'selNew'">
      <rect x="4.5" y="4.5" width="11" height="11" fill="currentColor" fill-opacity="0.35" />
    </template>
    <template v-else-if="name === 'selAdd'">
      <path d="M2.5 2.5h9v4h6v11h-9v-4h-6z" fill="currentColor" fill-opacity="0.35" />
    </template>
    <template v-else-if="name === 'selSubtract'">
      <path d="M2.5 2.5h9v4h-3v7h-6z" fill="currentColor" fill-opacity="0.35" />
      <rect x="8.5" y="6.5" width="9" height="11" />
    </template>
    <template v-else-if="name === 'selIntersect'">
      <rect x="2.5" y="2.5" width="9" height="11" />
      <rect x="8.5" y="6.5" width="9" height="11" />
      <rect
        x="8.5"
        y="6.5"
        width="3"
        height="7"
        fill="currentColor"
        fill-opacity="0.5"
        stroke="none"
      />
    </template>

    <!-- 文字对齐 -->
    <template v-else-if="name === 'alignLeft'">
      <path d="M3 5h14M3 8.5h9M3 12h14M3 15.5h9" />
    </template>
    <template v-else-if="name === 'alignCenter'">
      <path d="M3 5h14M5.5 8.5h9M3 12h14M5.5 15.5h9" />
    </template>
    <template v-else-if="name === 'alignRight'">
      <path d="M3 5h14M8 8.5h9M3 12h14M8 15.5h9" />
    </template>
  </svg>
</template>
