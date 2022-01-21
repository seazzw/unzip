# unzip

> 基于 node、express、electron 的桌面端程序

## 安装

```bash
git clone git@github.com:seazzw/unzip.git <your_project_name>
```

使用 NPM 安装依赖:

```bash
npm install
```

或者使用 YARN 安装依赖:

```bash
yarn install
```

NPM Scripts 说明:

| `yarn <script>` | Description                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| `start`         | 启动服务                                                                           |
| `pack-win`      | 打包成 windows 可执行 exe 文件，包含源代码                                         |
| `pack-mac`      | 打包成 macOS 可执行文件，包含源代码                                                |
| `build`         | 自动判断当前环境，并打包成安装包，windows 打包成 exe setup 包，mac 下打包成 dmg 包 |
