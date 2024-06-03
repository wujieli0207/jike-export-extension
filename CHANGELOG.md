# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.5.0](https://github.com/wujieli0207/jike-export-extension/compare/v1.4.2...v1.5.0) (2024-06-03)

### Features

- 增加导出范围筛选功能 ([801aafa](https://github.com/wujieli0207/jike-export-extension/commit/801aafa3d2429255d2026d1ec1abe231b23c92f0))
-

## [1.4.2](https://github.com/wujieli0207/jike-export-extension/compare/v1.4.1...v1.4.2) (2024-05-25)

### Bug Fixes

- 修复 heic 格式的图片展示异常问题 ([e7e1fc9](https://github.com/wujieli0207/jike-export-extension/commit/e7e1fc98122088ad0e3dac83c361f485ab1b9382))

### [1.4.1](https://github.com/wujieli0207/jike-export-extension/compare/v1.3.0...v1.4.1) (2024-05-22)

### Features

- 调整支付链接 ([956bd23](https://github.com/wujieli0207/jike-export-extension/commit/956bd23f9007145d21a16b5d688a0b4d75bb78f2))

## [1.4.0](https://github.com/wujieli0207/jike-export-extension/compare/v1.3.0...v1.4.0) (2024-05-20)

### Features

- markdown 导出单文件优化，不需要图片时直接导出为单文件 ([517873f](https://github.com/wujieli0207/jike-export-extension/commit/517873fdc03bb779a986cff0223d19580383db4d))
- txt 单文件下载优化，不用 zip 打包直接下载 txt ([09bc1d4](https://github.com/wujieli0207/jike-export-extension/commit/09bc1d46c73d34f9deb94a2c2f65a8ea5024da8f))
- 体验优化，导出时增加全局 loading ([80b90ba](https://github.com/wujieli0207/jike-export-extension/commit/80b90baf6129e92f266217cf90b1aa947af3a3d0))
- 单文件导出支持设置时间排序方式 ([035183b](https://github.com/wujieli0207/jike-export-extension/commit/035183bbb31be3700efee784ee941ea3595d21bc))
- 增加导出类型文件设置，导出 markdown 代码优化 ([3f12b82](https://github.com/wujieli0207/jike-export-extension/commit/3f12b82bf85a0bacd7655ddb5eb692b076716eb7))
- 导出配置自动存储在 localstorage 中 ([264ca2c](https://github.com/wujieli0207/jike-export-extension/commit/264ca2c9044b4c656267474088248489dd5b7257))
- 支持导出为 csv 文件格式 ([1ad7491](https://github.com/wujieli0207/jike-export-extension/commit/1ad74917a921d813ff0ebb284d58566fc0398121))
- 支持导出为 excel 设置 ([8191435](https://github.com/wujieli0207/jike-export-extension/commit/81914352e0cc508017f1287b7a917f4ba89ff092))
- 支持导出为 txt 纯文本文件 ([e15217e](https://github.com/wujieli0207/jike-export-extension/commit/e15217ef18c0cdeb85f81cf95a19b6efec75c1f6))
- 进入页面时，根据是否激活展示激活验证内容 ([d3bb708](https://github.com/wujieli0207/jike-export-extension/commit/d3bb708e167f21f19e89fcb185a06b05e132c96d))

### Bug Fixes

- 获取的图片链接不是原图链接 ([857c363](https://github.com/wujieli0207/jike-export-extension/commit/857c363e3e009c9abd69d78cb24a3748274cc760))

## [1.3.0](https://github.com/wujieli0207/jike-export-extension/compare/v1.2.1...v1.3.0) (2024-05-12)

### Features

- 支持导出个人收藏 ([e12cc86](https://github.com/wujieli0207/jike-export-extension/commit/e12cc86646bf2026ac5955392dfaafcd92855642))
- 支持是否单独导出图片设置 ([056f278](https://github.com/wujieli0207/jike-export-extension/commit/056f27880a66c4fc1156b8d4e9998b69ecc118fd))

### [1.2.1](https://github.com/wujieli0207/jike-export-extension/compare/v1.2.0...v1.2.1) (2024-05-04)

### Features

- 导出和激活提示语优化 ([af85df2](https://github.com/wujieli0207/jike-export-extension/commit/af85df2c703e149e1ed9ca88cf228457cd834be2))
- 支持导出动态引用的链接，单文件导出排序优化，提示语优化 ([543a430](https://github.com/wujieli0207/jike-export-extension/commit/543a430372eb7aab11d77a3df657e8363b344ff4))

### Bug Fixes

- 没有在动态中禁止选择文件，提示语优化 ([6926f82](https://github.com/wujieli0207/jike-export-extension/commit/6926f82818807797e997a2d3f665d80288150bed))

## 1.2.0 (2024-05-03)

### Features

- 实现基础内容导出和动态导出 ([4fe8815](https://github.com/wujieli0207/jike-export-extension/commit/4fe881566bd34646fed19727361df96f77d61eb0))
- 导出动态增加原文链接 ([dc65472](https://github.com/wujieli0207/jike-export-extension/commit/dc654726a1753d8ba1179c36eb8c9a6a35c4c464))
- 导出数据支持导出所属圈子 ([0de8ab5](https://github.com/wujieli0207/jike-export-extension/commit/0de8ab55047f5317a31e48d0470b95b5674277aa))
- 支持单文件导出，导出文件名优化 ([4501ef3](https://github.com/wujieli0207/jike-export-extension/commit/4501ef36301dbeb28da0976fdc0212936ccf950f))
- 支持发布相关内容调整 ([11848d6](https://github.com/wujieli0207/jike-export-extension/commit/11848d611e218fffe0157fd2f20650975ace3ab6))
- 支持导出引用动态的圈子 ([a7fedfa](https://github.com/wujieli0207/jike-export-extension/commit/a7fedfa2f6c56edf4cfa9d62c66f1c10a4284831))
- 支持滚动到底部导出全部动态 ([912a2b8](https://github.com/wujieli0207/jike-export-extension/commit/912a2b81556b829610f69c87064c5fa584cd8b23))
- 激活功能实现 ([d08f24e](https://github.com/wujieli0207/jike-export-extension/commit/d08f24ebb573aecbbdac43415de435515fafdd42))

### Bug Fixes

- 图片导出问题为空问题，样式展示问题 ([934a977](https://github.com/wujieli0207/jike-export-extension/commit/934a9771f84a57c376a1b0b693535cc5380f447e))
- 多图片导出异常问题修复 ([af9b9e1](https://github.com/wujieli0207/jike-export-extension/commit/af9b9e1d90950e912988dc3eef38b0f81a10241c))
