<script setup lang="ts">
import type {Checkpoint} from '../../domain/route/checkpoints';
defineProps<{arrival:Checkpoint|null;passedNames:string[]}>();
defineEmits<{dismiss:[]}>();
</script>
<template><div v-if="arrival||passedNames.length" class="trail-feedback" :class="{'is-overtake':!arrival}" role="status" :data-testid="arrival?'arrival-toast':'overtake-toast'">
 <span class="feedback-seal" aria-hidden="true">{{ arrival?'⚑':'↗' }}</span><div><small>{{ arrival?'山路上的一站':'脚步轻快' }}</small><strong v-if="arrival">已抵达 · {{ arrival.name }}</strong><strong v-else>超过了 {{ passedNames.slice(0,2).join('、') }}{{ passedNames.length>2?' 等 '+passedNames.length+' 位山友':'' }}</strong><span>{{ arrival?'这一站，留下你的足迹':'保持节奏，继续向前' }}</span></div><button aria-label="关闭行进提示" @click="$emit('dismiss')">×</button>
</div></template>
