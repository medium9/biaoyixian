<script setup lang="ts">import {formatElapsed} from '../../utils/format-walk';import type { Walker } from '../../types/walker';import { MODES } from '../../domain/walking/walking-engine';defineProps<{walkers:Walker[];selfId?:string}>();defineEmits<{close:[]}>();</script>
<template><aside v-if="walkers.length" class="walker-info" aria-label="人物信息"><div class="section-title"><strong>路上的同行者</strong><button @click="$emit('close')" aria-label="关闭人物信息">×</button></div><ul><li v-for="w in walkers" :key="w.id"><strong>{{ w.nickname }}</strong><span>{{ MODES[w.mode].label }} · {{ formatElapsed(w.elapsedSeconds) }} · {{ (w.progressM/1000).toFixed(2) }} km</span><small>{{ w.id===selfId?'我的人物':w.source==='online'?'在线山友':'模拟山友' }} · 虚拟里程</small></li></ul></aside></template>



