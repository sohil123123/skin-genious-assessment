const routes = [
  // {
  //   path: '/login',
  //   component: () => import('src/layouts/AuthLayout.vue'),
  //   meta: { public: true },
  //   children: [
  //     {
  //       path: '',
  //       component: () => import('src/pages/auth/LoginPage.vue'),
  //     },
  //   ],
  // },
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
        meta: { requiresAuth: false },
        component: () => import('pages/IndexPage.vue'),
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
