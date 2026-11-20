<script setup lang="ts">
import { MODES } from '../../domain/walking/walking-engine';
import type { WalkingMode } from '../../types/walker';
defineProps<{modelValue:WalkingMode;disabled:boolean;compact?:boolean}>();const emit=defineEmits<{ 'update:modelValue':[value:WalkingMode] }>();
</script>
<template><fieldset :disabled="disabled" :class="{'dock-pace':compact}"><legend>选择步调</legend><div class="modes"><button v-for="(mode,id) in MODES" :key="id" :class="{chosen:modelValue===id}" :aria-pressed="modelValue===id" @click="emit('update:modelValue',id)"><strong>{{ mode.label }}</strong><span>{{ mode.hours }} 小时<span v-if="!compact"> / 全程</span></span></button></div></fieldset></template>

