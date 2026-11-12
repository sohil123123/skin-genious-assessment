<template>
  <section>
    <h2 class="text-h5">Treatment history and progress</h2>
    <p class="text-grey-7">
      {{ progress.recorded_sessions }} recorded visits · Course of
      {{ progress.planned_sessions || '—' }}
    </p>
    <q-banner rounded class="bg-grey-2 text-caption q-mb-md">{{
      progress.measurement_note
    }}</q-banner>
    <template v-if="progress.zones?.length">
      <q-tabs
        v-model="active"
        align="left"
        active-color="black"
        indicator-color="black"
        dense
        no-caps
        class="q-mb-lg"
        ><q-tab
          v-for="item in progress.zones"
          :key="item.zone_id"
          :name="item.zone_id"
          :label="item.label"
          no-caps
      /></q-tabs>
      <template v-if="zone">
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-8">
            <q-card flat bordered
              ><q-card-section>
                <div class="text-subtitle2">{{ zone.label }} · Terminal follicle density / cm²</div>
                <svg
                  v-if="chart.points.length"
                  viewBox="0 0 680 255"
                  role="img"
                  :aria-label="`${zone.label} recorded density by session`"
                  style="width: 100%; min-height: 220px"
                >
                  <g v-for="tick in chart.ticks" :key="tick.y">
                    <line x1="52" :y1="tick.y" x2="642" :y2="tick.y" stroke="#ddd" />
                    <text x="5" :y="tick.y + 4" fill="#687573" font-size="12">
                      {{ tick.value }}
                    </text>
                  </g>
                  <polyline :points="chart.path" fill="none" stroke="#12645d" stroke-width="3" />
                  <g v-for="point in chart.points" :key="point.session_id">
                    <circle :cx="point.x" :cy="point.y" r="5" fill="#12645d" />
                    <text :x="point.x" :y="point.y - 10" text-anchor="middle" font-size="12">
                      {{ point.density }}
                    </text>
                    <text :x="point.x" y="235" text-anchor="middle" font-size="12">
                      S{{ point.session_number }}
                    </text>
                  </g>
                </svg>
                <p v-else class="text-grey-7 q-my-xl">
                  No calibrated numeric measurements yet. Treatment records still appear below.
                </p>
                <p class="text-caption text-grey-7">
                  Recorded calibrated AI estimates; gaps are not replaced with test numbers.
                </p>
              </q-card-section></q-card
            >
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="q-mb-md"
              ><q-card-section
                ><div class="text-caption">REDUCTION FROM BASELINE</div>
                <div class="text-h4">
                  {{ zone.cleared_percent == null ? 'Not available' : `${zone.cleared_percent}%` }}
                </div>
                <div class="text-caption">
                  {{ zone.baseline ?? '—' }} → {{ zone.latest ?? '—' }} follicles/cm²
                </div></q-card-section
              ></q-card
            >
            <q-card flat bordered
              ><q-card-section
                ><div class="text-caption">ESTIMATE TO 85% REDUCTION</div>
                <div class="text-h5">
                  {{
                    zone.projection.sessions_remaining == null
                      ? 'More measurements needed'
                      : `${zone.projection.sessions_remaining} more visits`
                  }}
                </div>
                <p class="text-caption text-grey-7">{{ zone.projection.reason }}</p></q-card-section
              ></q-card
            >
          </div>
        </div>
        <q-markup-table flat bordered wrap-cells class="q-mb-lg"
          ><thead>
            <tr>
              <th>Session / date</th>
              <th>Density / cm²</th>
              <th>Change</th>
              <th>Calibre (µm)</th>
              <th>Regrowth (days)</th>
              <th>Fluence (J/cm²)</th>
              <th>Pulse / SHR energy</th>
              <th>Endpoint</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in zone.sessions" :key="row.session_id">
              <td>S{{ row.session_number }}<br />{{ row.date || 'Not recorded' }}</td>
              <td>{{ row.density ?? 'Not measurable' }}</td>
              <td>{{ row.change_percent == null ? '—' : `${row.change_percent}%` }}</td>
              <td>{{ row.calibre ?? 'Not measurable' }}</td>
              <td>{{ row.regrowth_days ?? '—' }}</td>
              <td>{{ row.fluence ?? '—' }}</td>
              <td>
                <template v-if="row.energy_kj != null"
                  >{{ row.energy_kj }} kJ<br />{{ row.grid_size_cm2 ?? '—' }} cm² grid</template
                >
                <template v-else>{{ row.pulse == null ? '—' : `${row.pulse} ms` }}</template>
              </td>
              <td>{{ row.endpoint ?? '—' }}</td>
            </tr>
          </tbody></q-markup-table
        >
      </template>
      <q-markup-table flat bordered wrap-cells
        ><thead>
          <tr>
            <th>All zones</th>
            <th>Recorded visits</th>
            <th>Baseline / cm²</th>
            <th>Latest / cm²</th>
            <th>Reduction</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in progress.zones" :key="item.zone_id">
            <td>{{ item.label }}</td>
            <td>{{ item.sessions.length }}</td>
            <td>{{ item.baseline ?? '—' }}</td>
            <td>{{ item.latest ?? '—' }}</td>
            <td>{{ item.cleared_percent == null ? '—' : `${item.cleared_percent}%` }}</td>
          </tr>
        </tbody></q-markup-table
      >
    </template>
    <p v-else class="text-grey-7">
      Progress begins after the first treatment is completed and transferred for review.
    </p>
  </section>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { progressChart } from 'src/utils/lhr/progress'
const props = defineProps({ progress: { type: Object, required: true } })
const active = ref('')
watch(
  () => props.progress.zones,
  (zones) => {
    if (!zones?.some((zone) => zone.zone_id === active.value))
      active.value = zones?.[0]?.zone_id || ''
  },
  { immediate: true },
)
const zone = computed(() => props.progress.zones?.find((item) => item.zone_id === active.value))
const chart = computed(() => progressChart(zone.value))
</script>
