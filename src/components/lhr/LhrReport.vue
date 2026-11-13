<template>
  <section>
    <h1 class="lhr-title">Session report and clinic-head review</h1>
    <q-banner rounded class="bg-grey-2 q-mb-lg"
      >Treatment completed
      {{
        session.treatment_completed_at
          ? new Date(session.treatment_completed_at).toLocaleString()
          : ''
      }}.
      {{
        session.status === 'completed'
          ? 'Report reviewed and finalised.'
          : 'The clinic head reviews the recorded endpoints and finalises the client report.'
      }}</q-banner
    >
    <p class="text-body2 q-mb-lg">
      Assessment status: <strong>{{ assessmentStatus === 'completed' ? 'Completed' : 'In progress' }}</strong>.
      Session {{ session.session_number }} of {{ session.inputs.plannedSessions || 8 }}.
      The assessment completes after clinic-head review of the last planned session.
    </p>
    <q-markup-table flat bordered wrap-cells class="q-mb-lg"
      ><thead>
        <tr>
          <th class="text-left">Zone</th>
          <th>{{ visual ? 'Visible density / 10' : 'Terminal density / cm²' }}</th>
          <th>{{ visual ? 'Apparent coarseness / 10' : 'Mean calibre (µm)' }}</th>
          <th>Endpoint</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="zone in zones" :key="zone.id">
          <td>{{ zone.label }}</td>
          <td class="text-center">
            {{
              (visual ? session.analysis?.[zone.id]?.density_score : session.analysis?.[zone.id]?.terminal_follicle_density_per_cm2) ??
              'Unavailable'
            }}
          </td>
          <td class="text-center">
            {{ (visual ? session.analysis?.[zone.id]?.coarseness_score : session.analysis?.[zone.id]?.mean_shaft_calibre_um) ?? 'Unavailable' }}
          </td>
          <td class="text-center">
            {{ session.execution?.endpoint_grades?.[zone.id] ?? '—' }} / 4
          </td>
        </tr>
      </tbody></q-markup-table
    >
    <LhrProgress v-if="progress.zones?.length" :progress="progress" class="q-mb-lg" />
    <q-card flat bordered class="q-mb-lg"
      ><q-card-section
        ><h2 class="text-h6 q-mt-none">Therapist observations</h2>
        <p>{{ session.execution?.notes || 'No additional notes.' }}</p>
        <p v-if="session.execution?.adverse_events">
          <strong>Adverse response / actions:</strong> {{ session.execution.adverse_events }}
        </p>
        <p>
          <strong>Test patch:</strong> {{ session.execution?.test_patch_notes }}
        </p></q-card-section
      ></q-card
    >
    <q-btn
      v-if="canManage && session.status === 'awaiting_review'"
      rounded
      unelevated
      no-caps
      color="black"
      :label="session.report ? 'Regenerate report' : 'Generate client report'"
      icon="description"
      :loading="busy"
      @click="$emit('generate')"
    />
    <q-card v-if="session.report" flat bordered class="q-mt-lg"
      ><q-card-section>
        <h2 class="text-h6 q-mt-none">Client report</h2>
        <p>{{ session.report.summary }}</p>
        <ul class="q-pl-md">
          <li v-for="text in session.report.observations" :key="text">{{ text }}</li>
        </ul>
        <h3 class="text-subtitle1">Aftercare</h3>
        <ul class="q-pl-md">
          <li v-for="text in session.report.aftercare" :key="text">{{ text }}</li>
        </ul>
        <h3 class="text-subtitle1">Follow-up</h3>
        <p>{{ session.report.follow_up }}</p>
        <template v-if="canManage && session.status === 'awaiting_review'"
          ><q-input
            v-model="reviewNotes"
            outlined
            type="textarea"
            rows="3"
            label="Clinic-head review notes" /><q-checkbox
            v-model="confirmed"
            color="black"
            label="I have reviewed the treatment record, endpoints and client report"
            class="q-mt-md" /><q-btn
            rounded
            unelevated
            no-caps
            color="black"
            label="Finalise reviewed report"
            class="q-mt-md"
            :disable="!confirmed"
            :loading="busy"
            @click="$emit('review', { review_confirmed: confirmed, review_notes: reviewNotes })"
        />
          <q-btn
            rounded
            unelevated
            no-caps
            color="black"
            label="Confirm and exit"
            icon-right="exit_to_app"
            class="q-mt-md q-ml-sm"
            :disable="!confirmed || busy"
            @click="$emit('confirm-exit', { review_confirmed: confirmed, review_notes: reviewNotes })"
          />
        </template>
        <template v-else-if="session.status === 'completed'"
          ><p v-if="session.report.review_notes">
            Clinic-head notes: {{ session.report.review_notes }}
          </p>
          <p class="text-caption text-grey-7">
            Reviewed by {{ session.report.reviewed_by_name }} ·
            {{ new Date(session.reviewed_at).toLocaleString() }}
          </p>
          <q-btn
            rounded
            unelevated
            no-caps
            color="black"
            icon="download"
            label="Download report PDF"
            :loading="busy"
            @click="$emit('download')"
        />
          <q-btn
            v-if="canManage"
            rounded
            outline
            no-caps
            color="black"
            label="Confirm and exit"
            icon-right="exit_to_app"
            class="q-ml-sm"
            :disable="busy"
            @click="$emit('confirm-exit')"
          />
        </template> </q-card-section
    ></q-card>
    <q-btn
      v-if="
        canManage &&
        session.status === 'completed' &&
        session.session_number < session.inputs.plannedSessions
      "
      outline
      rounded
      no-caps
      label="Create next LHR session"
      icon="add"
      class="q-mt-lg"
      :loading="busy"
      @click="$emit('next')"
    />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { LHR_ZONES } from 'src/utils/lhr/assessment'
import LhrProgress from './LhrProgress.vue'
const props = defineProps({
  session: { type: Object, required: true },
  progress: { type: Object, default: () => ({ zones: [] }) },
  assessmentStatus: { type: String, default: 'in_progress' },
  canManage: Boolean,
  busy: Boolean,
})
defineEmits(['generate', 'review', 'download', 'next', 'confirm-exit'])
const visual = computed(() => Object.values(props.session.analysis || {}).some(z => z.score_version))
const zones = computed(() => LHR_ZONES.filter((zone) => props.session.inputs.zones[zone.id]))
const reviewNotes = ref('')
const confirmed = ref(false)
</script>
