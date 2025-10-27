const routes = [
  {
    path: '/login',
    component: () => import('src/layouts/AuthLayout.vue'),
    meta: { public: true },
    children: [
      {
        path: '',
        component: () => import('src/pages/auth/LoginPage.vue'),
      },
    ],
  },
  {
    path: '/authenticate/:token?/:userId?',
    component: () => import('src/layouts/AuthLayout.vue'),
    meta: { public: true },
    children: [
      {
        path: '',
        component: () => import('src/pages/auth/AuthenticattionPage.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { public: false },
    children: [
      {
        path: '',
        name: 'index',
        meta: { requiresAuth: true },
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: '/test-pdf',
        name: 'test_pdf',
        meta: { requiresAuth: true },
        component: () => import('pages/PdfTestPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
