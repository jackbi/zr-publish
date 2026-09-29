/*
 * @Description:
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2023-06-07 16:10:25
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-11 16:44:31
 * @FilePath: /zr-publish/src/vite-env.d.ts
 * Copyright (c) 2023 wenbin
 */
/// <reference types="vite/client" />

declare module '*.vue' {
  import { App, defineComponent } from 'vue';
  const component: ReturnType<typeof defineComponent> & {
    install(app: App): void;
  };

  export default component;
}

type Any = any;

type Awaitable<T> = T | Promise<T>;

type Arrayable<T> = T | Array<T>;

type Fn<A extends Any[] = [], R = void> = (...args: A) => R;

type AnyFn = Fn<Any[], Any>;

type Lazy<T> = Fn<[...Any], Promise<T>>;

type Nullable<T> = T | null | undefined;

type Literal = string | number | boolean;

type PlainObject = {
  [x: string]: Nullable<Arrayable<Literal | PlainObject>>;
};

type AnyObject<T = Any> = Record<string, T>;

type Spread<L, R> = Omit<L, keyof R> & R;

type TreeNode<T extends PlainObject, K extends string = 'children'> = Omit<T, K> & {
  [key in K]: Array<TreeNode<T, K>>;
};
