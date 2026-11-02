<template>
    <div class="q-gutter-lg">
        <q-card flat bordered class="rounded-borders">
            <q-card-section>
                <h2 class="text-h6 q-mt-none q-mb-sm">Laser safety screen</h2>
                <p class="text-caption text-grey-7">
                    Record the patient's answers while the example analysis
                    processes.
                </p>
                <div class="row q-col-gutter-sm q-mb-md">
                    <div class="col-6">
                        <q-select
                            v-model="draft.phototype"
                            outlined
                            dense
                            label="Fitzpatrick phototype"
                            :options="['I', 'II', 'III', 'IV', 'V', 'VI']"
                        />
                    </div>
                    <div class="col-6">
                        <q-select
                            v-model="draft.hair"
                            outlined
                            dense
                            label="Hair character"
                            :options="[
                                'Dark, coarse',
                                'Dark, medium',
                                'Dark, fine',
                                'Black, very coarse',
                                'Light or grey',
                            ]"
                        />
                    </div>
                    <div class="col-12">
                        <q-select
                            v-model="draft.sunResponse"
                            outlined
                            dense
                            label="Skin response to strong sun"
                            :options="[
                                'Always burns badly, never tans',
                                'Usually burns, tans a little',
                                'Burns mildly, then tans',
                                'Rarely burns, tans easily',
                                'Never burns',
                            ]"
                        />
                    </div>
                    <div class="col-12">
                        <q-select
                            v-model="draft.tanning"
                            outlined
                            dense
                            label="Tanning response"
                            :options="[
                                'Never',
                                'Minimally',
                                'Gradually',
                                'Easily and deeply',
                                'Very deeply',
                            ]"
                        />
                    </div>
                </div>
                <div
                    v-for="field in SAFETY_FIELDS"
                    :key="field.id"
                    class="q-mb-xs"
                >
                    <q-checkbox
                        v-model="draft.safety[field.id]"
                        :label="field.label"
                        color="black"
                        dense
                    />
                    <div
                        v-if="field.hint && draft.safety[field.id]"
                        class="text-caption text-grey-7 q-ml-lg"
                    >
                        {{ field.hint }}
                    </div>
                </div>
                <q-input
                    v-model.number="draft.safety.daysSinceSun"
                    type="number"
                    outlined
                    dense
                    label="Days since sun exposure or tanning"
                    min="0"
                    max="3650"
                    :rules="[validDays]"
                    class="q-mt-md"
                />
                <q-select
                    v-model="draft.plannedSessions"
                    outlined
                    dense
                    label="Planned course length (sessions)"
                    :options="[6, 8, 10]"
                    class="q-mt-sm"
                />
                <q-input
                    v-model="draft.safety.notes"
                    type="textarea"
                    outlined
                    label="Medication / clinical notes"
                    rows="2"
                    class="q-mt-md"
                />
                <q-banner
                    v-if="flags.length"
                    rounded
                    class="bg-amber-1 q-mt-md text-caption"
                    >{{ flags.length }} safety flag(s) recorded for clinician
                    review. This demo does not determine treatment
                    eligibility.</q-banner
                >
                <q-checkbox
                    v-model="draft.safety.reviewed"
                    color="black"
                    label="I have reviewed all safety answers with the patient"
                    class="q-mt-md"
                />
            </q-card-section>
        </q-card>
        <q-card flat bordered>
            <q-card-section>
                <h2 class="text-h6 q-mt-none q-mb-sm">Consent</h2>
                <div
                    v-for="item in consentFields"
                    :key="item.id"
                    class="q-mb-md"
                >
                    <q-checkbox
                        v-model="draft.consent[item.id]"
                        :label="item.label"
                        color="black"
                        dense
                    />
                    <div class="text-caption text-grey-7 q-ml-lg">
                        {{ item.hint }}
                    </div>
                </div>
                <p class="text-caption text-grey-7 q-mb-none">
                    These are test selections for this preview. No signed
                    consent is saved.
                </p>
            </q-card-section>
        </q-card>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { SAFETY_FIELDS } from "src/utils/lhr/assessment";
const props = defineProps({ modelValue: { type: Object, required: true } });
const draft = computed(() => props.modelValue);
const flags = computed(() =>
    SAFETY_FIELDS.filter(({ id }) => draft.value.safety[id]),
);
const validDays = (value) =>
    (value !== "" &&
        value !== null &&
        Number.isInteger(Number(value)) &&
        Number(value) >= 0 &&
        Number(value) <= 3650) ||
    "Enter whole days between 0 and 3650";
const consentFields = [
    {
        id: "treatment",
        label: "Treatment consent",
        hint: "Discussion of risks, expected course length and aftercare.",
    },
    {
        id: "imaging",
        label: "Clinical imaging consent",
        hint: "For this patient’s clinical assessment and progress tracking. Required before taking images.",
    },
    {
        id: "ai",
        label: "AI image processing consent",
        hint: "Required for imaged analysis. This preview simulates the response locally.",
    },
    {
        id: "marketing",
        label: "Marketing use (optional)",
        hint: "Separate permission. Declining does not affect this assessment.",
    },
];
</script>
