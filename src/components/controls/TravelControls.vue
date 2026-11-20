<script setup lang="ts">
import type {ControlMode} from '../../types/walker';
defineProps<{mode:ControlMode;speed:number;disabled:boolean;soundEnabled:boolean}>();
defineEmits<{change:[mode:ControlMode];sound:[]}>();
</script>
<template><section class="travel-controls" aria-label="行进控制">
 <div class="travel-switch"><button :disabled="disabled" :aria-pressed="mode==='auto'" @click="$emit('change','auto')">自动行进</button><button :disabled="disabled" :aria-pressed="mode==='tap'" @click="$emit('change','tap')">点击行进</button></div>
 <div v-if="mode==='tap'" class="speed-meter"><output aria-label="点击行进速度" aria-live="off" data-testid="travel-speed" :data-speed="speed.toFixed(2)">{{ speed.toFixed(1) }} <small>米/秒</small></output><div class="speed-track" aria-hidden="true"><span :style="{width:Math.min(100,speed/12*100)+'%'}"/></div></div>
 <button class="sound-toggle" aria-label="到达提示音" :aria-pressed="soundEnabled" @click="$emit('sound')">{{ soundEnabled?'♪ 音效开':'♪ 音效关' }}</button>
</section></template>
