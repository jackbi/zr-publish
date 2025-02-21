<!--
 * @Description: 
 * @Version: 1.0
 * @Author: wenbin
 * @Date: 2025-02-12 11:13:03
 * @LastEditors: wenbin
 * @LastEditTime: 2025-02-20 15:31:49
 * @FilePath: /zr-publish/src/views/Project/index.vue
 * Copyright (C) 2025 wenbin. All rights reserved.
-->
<template>
  <el-card style="width: 100%; height: 100%" body-class="w-full h-[calc(100%-51px)] box-border">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="text-[#333] text-[16px]">项目管理</div>
        <div class="flex items-center">
          <el-button @click="addProjectItem" type="primary">新增项目</el-button>
          <el-button @click="importProject" type="primary">导入项目</el-button>
          <el-input
            class="w-[200px] ml-[15px]"
            type="text"
            v-model="search"
            placeholder="请输入项目名称或备注"
          ></el-input>
        </div>
      </div>
    </template>
    <div class="w-full h-full">
      <el-table :data="filterTableData" style="width: 100%" border script height="100%">
        <el-table-column prop="name" label="项目名称" min-width="120" />
        <el-table-column prop="path" show-overflow-tooltip label="项目路径" min-width="120" />
        <el-table-column prop="package_name" label="打包后文件名" width="120" />
        <el-table-column prop="version" label="项目版本" width="100" />
        <el-table-column prop="desc" label="备注" min-width="100" />
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button
              text
              type="primary"
              style="padding: 0"
              :icon="Edit"
              size="default"
              @click="handleEdit(row)"
            ></el-button>
            <el-button
              text
              type="primary"
              style="padding: 0"
              title="vscode打开"
              size="default"
              :icon="FolderOpened"
              @click="vscodeOpen(row)"
            ></el-button>
            <!-- <el-button
              text
              type="primary"
              style="padding: 0"
              title="打包"
              size="default"
              :icon="FolderChecked"
              @click="handleBuildProject(row)"
            ></el-button> -->
            <el-button
              text
              type="danger"
              style="padding: 0"
              :icon="Delete"
              size="default"
              @click="handleDelete(row)"
            ></el-button>
          </template>
        </el-table-column>
      </el-table>
      <projectChange ref="projectChangeRef" @success="getTableData"></projectChange>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { Delete, Edit, FolderOpened } from '@element-plus/icons-vue';
import { getProjectList, removeProject, batchAddProject } from '@/DB/index.db';
import { ProjectItemType, ProjectItemTypeNoId } from '@/types/index.type';
import { computed, defineAsyncComponent, ref } from 'vue';
import { ElMessageBox } from 'element-plus';

const projectChange = defineAsyncComponent(() => import('@/components/project/change.vue'));
const projectData = ref<ProjectItemType[]>([]);
const projectChangeRef = ref();
const search = ref('');

const filterTableData = computed(() =>
  projectData.value.filter(
    (data) =>
      !search.value ||
      data.name.toLowerCase().includes(search.value.toLowerCase()) ||
      (data.desc && data.desc.toLowerCase().includes(search.value.toLowerCase())),
  ),
);

const getTableData = () => {
  getProjectList().then((res) => {
    projectData.value = res;
  });
};

const importProject = () => {
  const files = (window as any).utools.showOpenDialog({
    title: '选择项目路径',
    properties: ['openDirectory', 'multiSelections'],
  });
  const params: ProjectItemTypeNoId[] = [];
  // const noPackage: string[] = [];
  files.forEach((element: string) => {
    const fileList = (window as any).services.readDir(`${element}`);
    if (fileList.includes('package.json')) {
      const packageJsonData = (window as any).services.readFile(`${element}/package.json`);
      const data = JSON.parse(packageJsonData);
      if (data) {
        params.push({
          name: data.name,
          path: element,
          package_name: '',
          version: data.version,
          desc: '',
        });
      }
    } else {
      params.push({
        name: element,
        path: element,
        package_name: '',
        version: '',
        desc: '',
      });
    }
  });

  batchAddProject(params as ProjectItemType[]).then(() => {
    getTableData();
  });
};

const addProjectItem = () => {
  projectChangeRef.value.init();
};

const handleEdit = (row: ProjectItemType) => {
  projectChangeRef.value.init(row);
};

const vscodeOpen = (row: ProjectItemType) => {
  window.utools.shellOpenExternal(`vscode://file/${row.path}`);
};
const handleDelete = (row: ProjectItemType) => {
  ElMessageBox.confirm('确定要删除吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      removeProject(row.id).then(() => {
        getTableData();
      });
    })
    .catch(() => {
      // 取消操作
    });
};

getTableData();
</script>
<style lang="scss" scoped></style>
