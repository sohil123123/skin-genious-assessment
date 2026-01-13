const routes = [
  {
    path: '/login',
    component: () => import('src/layouts/AuthLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        component: () => import('src/pages/auth/LoginPage.vue'),
      },
    ],
  },
  {
    path: '/authenticate',
    component: () => import('src/layouts/AuthLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        component: () => import('src/pages/auth/AuthenticationPage.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'appointments/:clinic_id?/:therapist_id?',
        name: 'appointments',
        component: () => import('src/pages/AppointmentPage.vue'),
      },
      {
        path: 'iv-assessment',
        name: 'iv-assessment',
        component: () => import('src/pages/IVAssessment.vue'),
      },
      {
        path: ':user_id/treatment-prep/:assessment_id/:session_id/:appointment_id?',
        name: 'TreatmentPrep',
        component: () => import('pages/PreparationStep.vue'),
        props: true,
      },
      {
        path: ':user_id/treatment-steps/:assessment_id/:session_id/:step/:appointment_id?',
        name: 'TreatmentSteps',
        component: () => import('pages/TreatmentSteps.vue'),
        props: true,
      },
      {
        path: ':user_id/treatment-complete/:assessment_id/:session_id/:appointment_id?',
        name: 'TreatmentComplete',
        component: () => import('pages/TreatmentComplete.vue'),
        props: true,
      },
      {
        path: ':user_id/:step/:appointment_id?',
        name: 'index',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: ':user_id/:step/:appointment_id?',
        name: 'index-with-id',
        component: () => import('pages/IndexPage.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
