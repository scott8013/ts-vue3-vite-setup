import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useLogin, useSign } from '@store'
import * as _ from 'lodash'

const Login = async () => import('@/views/Login.vue')

declare module 'vue-router' {
  interface RouteMeta {
    menu: boolean
    title: string
    icon: string
    auth: boolean
  }
}
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/home',
    name: 'home',
    component: async () => import('@/views/Home.vue'),
    redirect: '/home/sign',
    meta: {
      menu: true,
      title: '考勤管理',
      icon: 'document-copy',
      auth: true,
    },
    children: [
      {
        path: 'sign',
        name: 'sign',
        component: async () => import('@/views/Sign.vue'),
        meta: {
          menu: true,
          title: '在线打卡签到',
          icon: 'calendar',
          auth: true,
        },
        async beforeEnter(to, from, next) {
          const usersInfos = useLogin().infos
          const signsInfos = useSign().infos

          if (_.isEmpty(signsInfos)) {
            const { errmsg, infos } = await useSign().getInfos({
              // @ts-ignore
              userid: usersInfos._id,
            })
            if (errmsg === 'ok') {
              useSign().updateInfos(infos)
              next()
            }
          } else {
            next()
          }
        },
      },
      {
        path: 'exception',
        name: 'exception',
        component: async () => import('@/views/Exception.vue'),
        meta: {
          menu: true,
          title: '异常考勤查询',
          icon: 'warning',
          auth: true,
        },
      },
      {
        path: 'apply',
        name: 'apply',
        component: async () => import('@/views/Apply.vue'),
        meta: {
          menu: true,
          title: '添加考勤审批',
          icon: 'document-add',
          auth: true,
        },
      },
      {
        path: 'check',
        name: 'check',
        component: async () => import('@/views/Check.vue'),
        meta: {
          menu: true,
          title: '我的考勤审批',
          icon: 'finished',
          auth: true,
        },
      },
    ],
  },
]
const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const { token, getUserInfos, updateInfos } = useLogin()
  if (to.meta.auth) {
    if (token) {
      const { infos, errcode } = await getUserInfos()
      // store data to pinia
      if (errcode === 0) {
        await updateInfos(infos)
        next()
      } else {
        next()
      }
    } else {
      next('/login')
    }
  } else if (token && to.path === '/login') {
    next('/')
  } else {
    next()
  }
})

export default router
