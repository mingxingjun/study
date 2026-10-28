import { lazy } from 'react';

/**
 * 路由表：集中管理每个页面的 import 函数。
 *
 * 1) App 用 lazy() 生成按需加载的页面组件；
 * 2) 侧边栏在鼠标悬停 / 键盘聚焦时调用 prefetchRoute 提前下载对应 chunk，
 *    点下去就不会看到骨架屏，切换几乎瞬时完成。
 */
const loaders = {
  '/': () => import('../pages/Dashboard'),
  '/upload': () => import('../pages/Upload'),
  '/quiz': () => import('../pages/Quiz'),
  '/question-bank': () => import('../pages/QuestionBank'),
  '/wrong-book': () => import('../pages/WrongBook'),
  '/supervise': () => import('../pages/Supervise'),
  '/settings': () => import('../pages/Settings'),
  '/manual': () => import('../pages/Manual'),
  '*': () => import('../pages/NotFound')
};

export const pages = Object.fromEntries(
  Object.entries(loaders).map(([path, load]) => [path, lazy(load)])
);

/** 已预取过的路由，避免重复触发同一请求 */
const prefetched = new Set();

/**
 * 预取某个路由的代码
 * @param {string} path - 路由路径，如 '/quiz'
 */
export const prefetchRoute = (path) => {
  const load = loaders[path];
  if (!load || prefetched.has(path)) return;
  prefetched.add(path);
  // 网络差时失败也没关系，真正点击时 App 的 lazy 还会再请求一次
  load().catch(() => prefetched.delete(path));
};

/**
 * 空闲时预取最常用的页面，让第二次进入任何主页面都不再等下载。
 * 省流模式或弱网（2g/3g）下不预取，避免浪费用户流量。
 * @param {string[]} [paths] - 要预取的路径，默认刷题与上传
 */
export const prefetchRoutesIdle = (paths = ['/quiz', '/upload']) => {
  const conn = typeof navigator !== 'undefined' ? navigator.connection : null;
  if (conn?.saveData) return;
  if (conn?.effectiveType && /(^|-)2g$|3g$/.test(conn.effectiveType)) return;

  const run = () => paths.forEach(prefetchRoute);
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 1500);
  }
};