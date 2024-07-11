# research_management
google apps script for research management

## 概要

中核申請資料作成用のプログラムを管理するリポジトリです。

## 開発

```
yarn install --frozen-lockfile
# このコマンドでGoogle Apps Script にログインする
clasp login
# webpackしたソースをpush
yarn start
```

## テスト


## 本番へのデプロイ

TODO: 何度も実行するなら自動化する

```
mv .clasp.json .clasp.json.dev
# 本番のID でclone
yarn push
mv .clasp.json.dev .clasp.json
```
