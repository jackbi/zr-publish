<!--
 * @Description: 使用文档页面
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-14 17:00:00
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-14 17:00:00
 * @FilePath: /zr-publish/src/views/Doc/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <div class="page-stack">
    <header class="page-header page-header--sticky">
      <div class="page-title">使用文档</div>
    </header>

    <div class="page-content page-content--plain page-content--scroll">
      <article class="doc-content">
        <div class="doc-container">
          <!-- 项目简介 -->
          <section class="doc-section">
            <h2>项目简介</h2>
            <div>
              <p>
                ZR-Publish 是一个用于将文件部署到远程服务器的 Utools 插件，主要用于没有搭建
                Jenkins、CI/CD 服务的代码发布场景。
              </p>
              <div class="doc-features">
                <div class="doc-feature">
                  <span class="doc-feature__icon">
                    <el-icon><Promotion /></el-icon>
                  </span>
                  <span>快速部署前端静态代码</span>
                </div>
                <div class="doc-feature">
                  <span class="doc-feature__icon">
                    <el-icon><FolderOpened /></el-icon>
                  </span>
                  <span>支持后端 jar 包上传</span>
                </div>
                <div class="doc-feature">
                  <span class="doc-feature__icon">
                    <el-icon><Lightning /></el-icon>
                  </span>
                  <span>支持上传后自动执行命令</span>
                </div>
                <div class="doc-feature">
                  <span class="doc-feature__icon">
                    <el-icon><Refresh /></el-icon>
                  </span>
                  <span>Git 状态实时展示</span>
                </div>
                <div class="doc-feature">
                  <span class="doc-feature__icon">
                    <el-icon><Files /></el-icon>
                  </span>
                  <span>多端数据同步</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 快速开始 -->
          <section class="doc-section">
            <h2>快速开始</h2>
            <div>
              <h3>1. 添加远程服务器</h3>
              <p>在「远程管理」页面添加 SSH 连接信息：</p>
              <ul>
                <li>服务器名称（便于识别）</li>
                <li>主机地址（IP 或域名）</li>
                <li>端口号（默认 22）</li>
                <li>用户名</li>
                <li>密码或密钥</li>
              </ul>

              <h3>2. 配置远程目录</h3>
              <p>在「远程目录」页面添加常用的部署路径，例如：</p>
              <ul>
                <li>
                  <code>/var/www/html</code>
                  - Web 根目录
                </li>
                <li>
                  <code>/home/user/apps</code>
                  - 应用目录
                </li>
                <li>
                  <code>/opt/services</code>
                  - 服务目录
                </li>
              </ul>

              <h3>3. 添加项目</h3>
              <p>在「项目管理」页面添加或导入本地项目：</p>
              <ul>
                <li>支持单个项目添加</li>
                <li>支持批量导入（扫描目录下所有项目）</li>
                <li>自动检测项目类型（Vue、React、Node、Vite）</li>
                <li>自动读取 package.json 信息</li>
              </ul>

              <h3>4. 创建发布任务</h3>
              <p>在「首页」创建发布任务，配置：</p>
              <ul>
                <li>选择本地项目</li>
                <li>选择目标服务器（支持多选）</li>
                <li>选择目标路径</li>
                <li>配置上传前/后执行的命令（可选）</li>
              </ul>

              <h3>5. 执行发布</h3>
              <p>点击任务卡片的「发布」按钮，系统将自动：</p>
              <ol>
                <li>
                  执行上传前命令（如
                  <code>npm run build</code>
                  ）
                </li>
                <li>通过 SSH 上传文件到服务器</li>
                <li>
                  执行上传后命令（如
                  <code>pm2 restart app</code>
                  ）
                </li>
                <li>显示实时日志</li>
              </ol>
            </div>
          </section>

          <!-- 功能说明 -->
          <section class="doc-section">
            <h2>功能说明</h2>
            <div>
              <h3>项目管理</h3>
              <ul>
                <li>
                  <strong>新增项目</strong>
                  ：手动添加单个项目
                </li>
                <li>
                  <strong>导入项目</strong>
                  ：批量扫描目录，自动识别所有项目
                </li>
                <li>
                  <strong>项目类型识别</strong>
                  ：自动检测 Vue、React、Node.js、Vite 项目
                </li>
                <li>
                  <strong>版本信息</strong>
                  ：自动读取 package.json 中的版本号
                </li>
                <li>
                  <strong>快速打开</strong>
                  ：支持在终端、VS Code、IDEA、文件管理器中打开
                </li>
              </ul>

              <h3>Git 状态展示（只读）</h3>
              <div class="doc-note doc-note--warning">
                <strong>重要变更：</strong>
                Git 功能已改为只读展示模式
              </div>
              <ul>
                <li>
                  <strong>分支显示</strong>
                  ：当前 Git 分支名称（纯文本）
                </li>
                <li>
                  <strong>代码状态</strong>
                  ：显示本地与远程的同步状态
                  <ul>
                    <li>
                      <span class="legend-dot legend-dot--success"></span>
                      最新 - 本地与远程一致
                    </li>
                    <li>
                      <span class="legend-dot legend-dot--primary"></span>
                      领先 X - 本地有 X 个提交未推送
                    </li>
                    <li>
                      <span class="legend-dot legend-dot--warning"></span>
                      落后 X - 远程有 X 个提交未拉取
                    </li>
                    <li>
                      <span class="legend-dot legend-dot--danger"></span>
                      分叉 - 本地和远程都有独立提交
                    </li>
                    <li>
                      <span class="legend-dot legend-dot--muted"></span>
                      无远程 - 未配置远程仓库
                    </li>
                  </ul>
                </li>
                <li>
                  <strong>未提交更改</strong>
                  ：显示未提交的文件数量（警示图标）
                </li>
                <li>
                  <strong>手动刷新</strong>
                  ：点击「刷新所有 Git 状态」按钮更新
                </li>
                <li>
                  <strong>性能优化</strong>
                  ：
                  <ul>
                    <li>页面加载时只显示缓存数据（瞬间加载）</li>
                    <li>异步队列更新（最多 3 个并发）</li>
                    <li>Git 信息缓存到 IndexedDB</li>
                  </ul>
                </li>
              </ul>

              <div class="doc-note doc-note--info">
                <strong>提示：</strong>
                所有 Git 操作（Pull、Push、Commit、切换分支等）请通过终端或 IDE
                完成，插件只负责展示状态。
              </div>

              <h3>SSH 管理</h3>
              <ul>
                <li>
                  <strong>多服务器</strong>
                  ：管理多个远程服务器
                </li>
                <li>
                  <strong>密码加密</strong>
                  ：密码使用 AES 加密存储
                </li>
                <li>
                  <strong>连接测试</strong>
                  ：保存前自动测试连接
                </li>
                <li>
                  <strong>密钥支持</strong>
                  ：支持使用 SSH 私钥认证
                </li>
              </ul>

              <h3>指令管理</h3>
              <ul>
                <li>
                  <strong>预设命令</strong>
                  ：保存常用的命令（如
                  <code>npm run build</code>
                  ）
                </li>
                <li>
                  <strong>快速引用</strong>
                  ：创建任务时快速选择预设命令
                </li>
                <li>
                  <strong>分类管理</strong>
                  ：支持为命令添加标签和描述
                </li>
              </ul>

              <h3>远程路径管理</h3>
              <ul>
                <li>
                  <strong>路径预设</strong>
                  ：保存常用的远程目录
                </li>
                <li>
                  <strong>路径验证</strong>
                  ：支持验证远程路径是否存在
                </li>
                <li>
                  <strong>快速填充</strong>
                  ：创建任务时快速选择路径
                </li>
              </ul>

              <h3>任务组管理</h3>
              <ul>
                <li>
                  <strong>任务分组</strong>
                  ：将相关任务组织到一起
                </li>
                <li>
                  <strong>批量发布</strong>
                  ：一键发布整个任务组
                </li>
                <li>
                  <strong>顺序执行</strong>
                  ：任务组按顺序串行发布
                </li>
              </ul>

              <h3>数据同步</h3>
              <ul>
                <li>
                  <strong>导出数据</strong>
                  ：导出所有配置和任务到 JSON 文件
                </li>
                <li>
                  <strong>导入数据</strong>
                  ：从 JSON 文件恢复配置
                </li>
                <li>
                  <strong>多端同步</strong>
                  ：在不同设备间同步配置
                </li>
                <li>
                  <strong>备份恢复</strong>
                  ：定期备份，防止数据丢失
                </li>
              </ul>
            </div>
          </section>

          <!-- 操作指南 -->
          <section class="doc-section">
            <h2>操作指南</h2>
            <div>
              <h3>如何添加项目？</h3>
              <ol>
                <li>进入「项目管理」页面</li>
                <li>点击右上角「新增」按钮</li>
                <li>填写项目名称和本地路径</li>
                <li>系统会自动检测项目类型和版本</li>
                <li>保存后可在列表中看到项目信息</li>
              </ol>

              <h3>如何导入多个项目？</h3>
              <ol>
                <li>进入「项目管理」页面</li>
                <li>点击右上角「导入」按钮</li>
                <li>选择包含多个项目的父目录</li>
                <li>系统会扫描该目录下所有子目录</li>
                <li>自动识别并导入所有项目</li>
              </ol>

              <h3>如何查看 Git 状态？</h3>
              <ol>
                <li>进入「项目管理」页面</li>
                <li>首次加载会显示缓存的 Git 信息</li>
                <li>点击右上角「刷新所有 Git 状态」更新</li>
                <li>等待异步加载完成（显示骨架屏）</li>
                <li>查看分支名称、同步状态、未提交更改</li>
              </ol>

              <h3>如何通过终端管理 Git？</h3>
              <ol>
                <li>在项目列表中找到目标项目</li>
                <li>点击「操作」下拉菜单</li>
                <li>选择「终端打开」</li>
                <li>
                  在打开的终端中执行 Git 命令：
                  <ul>
                    <li>
                      <code>git pull</code>
                      - 拉取远程更新
                    </li>
                    <li>
                      <code>git push</code>
                      - 推送本地提交
                    </li>
                    <li>
                      <code>git checkout branch-name</code>
                      - 切换分支
                    </li>
                    <li>
                      <code>git add . && git commit -m "message"</code>
                      - 提交更改
                    </li>
                  </ul>
                </li>
                <li>完成后返回插件，点击刷新查看最新状态</li>
              </ol>

              <h3>如何创建发布任务？</h3>
              <ol>
                <li>进入「首页」</li>
                <li>点击「新增任务」按钮</li>
                <li>填写任务名称和描述</li>
                <li>选择本地项目（从项目管理中添加的）</li>
                <li>选择目标服务器（支持多选）</li>
                <li>选择远程路径</li>
                <li>
                  （可选）配置上传前命令（如
                  <code>npm run build</code>
                  ）
                </li>
                <li>
                  （可选）配置上传后命令（如
                  <code>pm2 restart</code>
                  ）
                </li>
                <li>保存任务</li>
              </ol>

              <h3>如何批量发布任务组？</h3>
              <ol>
                <li>进入「首页」</li>
                <li>点击「新增任务组」按钮创建任务组</li>
                <li>编辑任务，将任务分配到对应的任务组</li>
                <li>点击任务组标题右侧的「发布」按钮</li>
                <li>系统会按顺序发布该组下的所有任务</li>
                <li>在右侧抽屉查看实时日志</li>
              </ol>

              <h3>如何在多台设备间同步数据？</h3>
              <ol>
                <li>
                  <strong>设备 A（导出）</strong>
                  ：
                  <ul>
                    <li>点击右下角 FAB 菜单的「数据同步」按钮</li>
                    <li>点击「导出数据」</li>
                    <li>将 JSON 文件保存到云盘或 U 盘</li>
                  </ul>
                </li>
                <li>
                  <strong>设备 B（导入）</strong>
                  ：
                  <ul>
                    <li>打开「数据同步」页面</li>
                    <li>点击「导入数据」</li>
                    <li>选择从设备 A 导出的 JSON 文件</li>
                    <li>确认导入，所有配置和任务将被同步</li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          <!-- 常见问题 -->
          <section class="doc-section">
            <h2>常见问题</h2>
            <div>
              <h3>Q: 为什么 Git 状态显示错误？</h3>
              <p>
                <strong>A:</strong>
                可能的原因：
              </p>
              <ul>
                <li>
                  项目路径不是 Git 仓库 → 在终端执行
                  <code>git init</code>
                  初始化
                </li>
                <li>
                  未配置远程仓库 → 执行
                  <code>git remote add origin &lt;url&gt;</code>
                </li>
                <li>缓存数据过期 → 点击「刷新所有 Git 状态」更新</li>
              </ul>

              <h3>Q: 为什么不能在插件中执行 Git 操作？</h3>
              <p>
                <strong>A:</strong>
                基于以下考虑，Git 功能改为只读展示：
              </p>
              <ul>
                <li>
                  <strong>职责聚焦</strong>
                  ：插件专注于部署任务，Git 管理由专业工具完成
                </li>
                <li>
                  <strong>安全可靠</strong>
                  ：避免误操作导致代码冲突或丢失
                </li>
                <li>
                  <strong>性能优化</strong>
                  ：去除 Git 操作逻辑，加载速度提升 50-100 倍
                </li>
                <li>
                  <strong>体验更好</strong>
                  ：终端和 IDE 提供更专业的 Git 操作界面
                </li>
              </ul>

              <h3>Q: 上传失败怎么办？</h3>
              <p>
                <strong>A:</strong>
                检查以下几点：
              </p>
              <ul>
                <li>SSH 连接是否正常 → 在「远程管理」测试连接</li>
                <li>本地路径是否存在 → 检查项目路径配置</li>
                <li>远程路径是否有写权限 → 检查用户权限</li>
                <li>网络是否稳定 → 尝试重新上传</li>
              </ul>

              <h3>Q: 如何修改已保存的 SSH 密码？</h3>
              <p>
                <strong>A:</strong>
                进入「远程管理」页面，点击对应服务器的「编辑」按钮，修改密码后保存。
              </p>

              <h3>Q: 上传前命令执行失败怎么办？</h3>
              <p>
                <strong>A:</strong>
                可能的原因：
              </p>
              <ul>
                <li>命令语法错误 → 在终端手动测试命令</li>
                <li>
                  缺少依赖 → 确保
                  <code>node_modules</code>
                  已安装
                </li>
                <li>工作目录错误 → 命令会在项目根目录执行</li>
              </ul>

              <h3>Q: 如何实现自动化部署？</h3>
              <p>
                <strong>A:</strong>
                配置完整的任务流程：
              </p>
              <ol>
                <li>
                  上传前命令：
                  <code>npm run build</code>
                  - 构建项目
                </li>
                <li>
                  上传路径：选择构建输出目录（如
                  <code>dist</code>
                  ）
                </li>
                <li>
                  上传后命令：
                  <code>pm2 restart app-name</code>
                  - 重启服务
                </li>
              </ol>

              <h3>Q: 为什么项目类型识别错误？</h3>
              <p>
                <strong>A:</strong>
                项目类型基于
                <code>package.json</code>
                中的依赖识别：
              </p>
              <ul>
                <li>
                  Vue 项目 → 包含
                  <code>vue</code>
                  依赖
                </li>
                <li>
                  React 项目 → 包含
                  <code>react</code>
                  依赖
                </li>
                <li>
                  Vite 项目 → 包含
                  <code>vite</code>
                  依赖
                </li>
                <li>
                  Node 项目 → 包含
                  <code>express</code>
                  或
                  <code>koa</code>
                  等
                </li>
              </ul>
              <p>
                如果识别错误，可以手动编辑
                <code>package.json</code>
                添加对应依赖，然后刷新项目。
              </p>

              <h3>Q: 数据存储在哪里？</h3>
              <p>
                <strong>A:</strong>
                所有数据使用 IndexedDB 存储在本地浏览器中，包括：
              </p>
              <ul>
                <li>任务配置</li>
                <li>SSH 连接信息（密码加密）</li>
                <li>项目信息</li>
                <li>Git 缓存数据</li>
              </ul>
              <p>建议定期通过「数据同步」功能导出备份。</p>
            </div>
          </section>

          <!-- 终端支持 -->
          <section class="doc-section">
            <h2>终端支持</h2>
            <div>
              <p>插件支持在以下终端中打开项目：</p>

              <h3>macOS</h3>
              <ul>
                <li>iTerm2（优先）</li>
                <li>Terminal.app（系统默认）</li>
                <li>Warp</li>
                <li>Hyper</li>
              </ul>

              <h3>Windows</h3>
              <ul>
                <li>Windows Terminal（优先）</li>
                <li>PowerShell</li>
                <li>CMD</li>
              </ul>

              <h3>Linux</h3>
              <ul>
                <li>gnome-terminal</li>
                <li>konsole</li>
                <li>xterm</li>
              </ul>

              <div class="doc-note doc-note--info">
                <strong>提示：</strong>
                系统会按优先级自动检测可用终端，并在「设置」页面显示当前使用的终端。
              </div>
            </div>
          </section>

          <!-- 技术栈 -->
          <section class="doc-section">
            <h2>技术栈</h2>
            <div>
              <ul>
                <li>
                  <strong>框架</strong>
                  ：Vue 3 + TypeScript
                </li>
                <li>
                  <strong>UI 库</strong>
                  ：Element Plus
                </li>
                <li>
                  <strong>构建工具</strong>
                  ：Vite
                </li>
                <li>
                  <strong>数据库</strong>
                  ：IndexedDB
                </li>
                <li>
                  <strong>加密</strong>
                  ：CryptoJS (AES)
                </li>
                <li>
                  <strong>SSH</strong>
                  ：node-ssh
                </li>
                <li>
                  <strong>Git</strong>
                  ：simple-git
                </li>
                <li>
                  <strong>平台</strong>
                  ：Utools Plugin
                </li>
              </ul>
            </div>
          </section>

          <!-- 版本历史 -->
          <section class="doc-section">
            <h2>版本历史</h2>
            <div>
              <div class="doc-changelog">
                <div class="doc-changelog__item">
                  <div class="doc-changelog__version">v2.0.0</div>
                  <div class="doc-changelog__date">2025-02-14</div>
                  <div class="doc-changelog__content">
                    <p><strong>重大更新：</strong></p>
                    <ul>
                      <li>新增项目管理功能（支持导入、类型识别）</li>
                      <li>新增 Git 状态展示（只读模式）</li>
                      <li>新增数据同步功能（导出/导入）</li>
                      <li>新增任务组管理（批量发布）</li>
                      <li>新增终端自动检测（支持 10+ 终端）</li>
                      <li>异步队列优化（Git 信息加载提速 50-100 倍）</li>
                      <li>Git 信息缓存（瞬间加载）</li>
                      <li>UI 全面重构（卡片式布局）</li>
                      <li>密码加密存储（AES）</li>
                      <li>移除 Git 操作功能（改为只读展示）</li>
                    </ul>
                  </div>
                </div>

                <div class="doc-changelog__item">
                  <div class="doc-changelog__version">v1.0.0</div>
                  <div class="doc-changelog__date">2025-02-11</div>
                  <div class="doc-changelog__content">
                    <p><strong>初始版本：</strong></p>
                    <ul>
                      <li>基础发布功能</li>
                      <li>SSH 管理</li>
                      <li>指令管理</li>
                      <li>远程路径管理</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 反馈与支持 -->
          <section class="doc-section">
            <h2>反馈与支持</h2>
            <div>
              <p>如有问题或建议，欢迎反馈：</p>
              <ul>
                <li>通过 Utools 插件中心反馈</li>
                <li>联系开发者：wenbin</li>
              </ul>
              <div class="doc-note doc-note--success">
                <strong>感谢使用 ZR-Publish！</strong>
              </div>
            </div>
          </section>
        </div>
      </article>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Files, FolderOpened, Lightning, Promotion, Refresh } from '@element-plus/icons-vue';
// 纯展示页面，无需逻辑
</script>

<style lang="scss" scoped>
/* 页面排版统一由全局样式（main.css / index.scss 的设计令牌）负责，
   这里只保留 Doc 特有的「提示块」。 */
.doc-note {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-border-strong);
  background: var(--color-surface-sunken);
  color: var(--color-text-secondary);
  margin: var(--space-4) 0;
  font-size: var(--text-base);

  strong {
    color: var(--color-text);
  }

  &--info {
    background: var(--color-info-soft);
    border-color: var(--color-info);
  }

  &--warning {
    background: var(--color-warning-soft);
    border-color: var(--color-warning);
  }

  &--success {
    background: var(--color-success-soft);
    border-color: var(--color-success);
  }
}
</style>
