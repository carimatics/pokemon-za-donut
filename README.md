# Pokémon LEGENDS ZA Donut Recipe Finder

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)

Pokémon LEGENDS Z-A DLC「M次元ラッシュ」のストーリー中に作成するドーナツのレシピを探索するためのファンメイドツールです。

🔗 **Live Demo**: [https://carimatics.github.io/pokemon-za-donut/](https://carimatics.github.io/pokemon-za-donut/)

## 📋 機能

- **ドーナツ選択**: 作りたいドーナツを選択
- **きのみ在庫管理**: 所持しているきのみの個数を入力
- **レシピ検索**: 選択したドーナツと在庫きのみから、作成可能なレシピを自動計算
- **星評価システム**: フレーバー合計値に基づく星評価と、プラスレベル・ハラモチエネルギーのブースト計算
- **CSV インポート/エクスポート**: きのみ在庫とレシピ結果のCSV入出力に対応
- **レスポンシブデザイン**: PC・タブレット・スマートフォンに最適化された表示
- **ソート機能**: テーブルの各列をクリックして昇順/降順にソート
- **検索・フィルタリング**: きのみ名での検索、異次元きのみフィルタ

## 🚀 Getting Started

### 前提条件

- Node.js 24.x 以上
- npm

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/carimatics/pokemon-za-donut.git
cd pokemon-za-donut

# 依存関係をインストール
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

### プロダクションビルド

```bash
npm run build
```

ビルド成果物は `dist/` ディレクトリに出力されます。

## 🧪 テスト

```bash
# テストを実行
npm test

# カバレッジ付きでテストを実行
npm run test:coverage
```

## 📊 パフォーマンスモニタリング

このプロジェクトには Web Vitals と Lighthouse CI が統合されています。

### Web Vitals

アプリケーションは自動的に以下のメトリクスを計測します：

- **CLS (Cumulative Layout Shift)**: 視覚的安定性
- **FCP (First Contentful Paint)**: 初回コンテンツ表示
- **LCP (Largest Contentful Paint)**: 最大コンテンツ表示
- **TTFB (Time to First Byte)**: サーバー応答時間
- **INP (Interaction to Next Paint)**: インタラクション応答性

開発環境ではコンソールに詳細なメトリクスが表示されます。

### Lighthouse CI

```bash
# ローカルで Lighthouse を実行（要：@lhci/cli をグローバルインストール）
npm run lighthouse
```

CI/CD パイプラインでは、プルリクエストごとに自動的に Lighthouse CI が実行され、パフォーマンススコアが報告されます。

### バンドルサイズ分析

```bash
# バンドルサイズを可視化して分析
npm run analyze
```

ビルド完了後、自動的にブラウザで `dist/stats.html` が開き、以下の情報が確認できます：

- **各ライブラリのサイズ**: 依存関係ごとのバンドルサイズ
- **Gzip/Brotli サイズ**: 圧縮後のサイズ
- **視覚的なTreemap**: どのモジュールが大きいか一目で把握

### パフォーマンスダッシュボード（開発環境）

開発サーバー起動時、画面左下にリアルタイムのパフォーマンスメトリクスが表示されます：

```bash
npm run dev
```

表示される情報：
- **FPS**: フレームレート（60 FPS が理想）
- **Memory**: JavaScript ヒープメモリ使用量（Chrome のみ）
- **Load Time**: ページ読み込み時間
- **Navigation Timing**: DNS、TCP、リクエスト/レスポンス時間

ダッシュボードは展開/折りたたみ、表示/非表示の切り替えが可能です。

### GPU アクセラレーション（開発中）

⚠️ **現在ステータス: 一時的に無効化**

レシピ検索に WebGPU を使用した GPU アクセラレーションの実装を進めていますが、候補生成アルゴリズムに問題が見つかったため、現在は一時的に無効化されています。全ての検索は最適化された CPU バックトラッキングアルゴリズムで実行されます。

**実装済み機能:**
- ✅ WebGPU サポート検出
- ✅ WGSL コンピュートシェーダー
- ✅ GPU/CPU ハイブリッドアーキテクチャ
- ⚠️ 候補生成アルゴリズム（修正中）

**既知の問題:**
- GPU版の候補生成が全スロットを使用する組み合わせのみを生成し、少ないスロット数で要件を満たすレシピを見逃していた
- 現在は修正済みだが、十分なテストを経てから再度有効化予定

**今後の予定:**
- GPU版とCPU版の結果一致を検証
- パフォーマンステストの実施
- GPU機能の再有効化

詳細な実装計画は [docs/GPU_ACCELERATION_PLAN.md](docs/GPU_ACCELERATION_PLAN.md) を参照してください。

## 🛠️ 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動（パフォーマンスダッシュボード付き） |
| `npm run build` | プロダクション用にビルド |
| `npm run analyze` | バンドルサイズを分析（Treemap表示） |
| `npm run preview` | ビルドしたアプリをプレビュー |
| `npm test` | テストを実行 |
| `npm run test:coverage` | カバレッジ付きでテストを実行 |
| `npm run lighthouse` | Lighthouse CI でパフォーマンスを計測 |
| `npm run lint` | コードをリント |
| `npm run format` | コードをフォーマット |
| `npm run check` | リントとフォーマットをチェック |

## 🏗️ 技術スタック

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5.7](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 7](https://vite.dev/)
- **Routing**: [TanStack Router v1](https://tanstack.com/router)
- **Table**: [TanStack Table v8](https://tanstack.com/table)
- **Virtual Scrolling**: [TanStack Virtual](https://tanstack.com/virtual)
- **GPU Acceleration**: [WebGPU](https://www.w3.org/TR/webgpu/) with WGSL Compute Shaders
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/react)
- **Linting/Formatting**: [Biome](https://biomejs.dev/)
- **Performance Monitoring**: [Web Vitals](https://web.dev/vitals/) + [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

## 📁 プロジェクト構造

```
src/
├── components/          # Reactコンポーネント
│   ├── __tests__/      # コンポーネントのテスト
│   ├── BerryStockTable.tsx
│   ├── DonutSelectionTable.tsx
│   ├── RecipeResultsTable.tsx
│   └── ...
├── data/               # ゲームデータ（きのみ、ドーナツ）
│   ├── berries.ts
│   └── donuts.ts
├── hooks/              # カスタムReact Hooks
│   ├── __tests__/
│   ├── useRecipeFinder.ts
│   └── ...
├── lib/                # ユーティリティ関数
│   ├── finder.ts       # レシピ検索ロジック（CPU版）
│   ├── enhanced-finder.ts  # GPU/CPU ハイブリッドファインダー
│   ├── gpu/            # GPU アクセラレーション
│   │   ├── webgpu-support.ts  # WebGPU サポート検出
│   │   ├── gpu-finder.ts      # GPU レシピ検索
│   │   └── shaders.wgsl.ts    # WGSL コンピュートシェーダー
│   ├── csv.ts          # CSV入出力
│   └── types.ts        # 型定義
└── routes/             # ページルート（TanStack Router）
    └── pokemon-za-donut/
        └── index.tsx
```

## 🎮 使い方

1. **ドーナツを選択**: 「ドーナツ選択」タブで作りたいドーナツをチェック
2. **きのみ在庫を入力**: 「きのみ個数入力」タブで所持しているきのみの個数を入力
3. **レシピを検索**: 画面右下の浮遊ボタン（モバイル）または「レシピ検索」ボタンをクリック
4. **結果を確認**: 「レシピ検索結果」タブで作成可能なレシピを確認

### 星評価システム

フレーバーの合計値に応じて、以下の星評価が付与されます：

| フレーバー合計 | 星 | ブースト倍率 |
|---------------|---|------------|
| 120未満 | ☆ | 1.0x |
| 120以上 | ★ | 1.1x |
| 240以上 | ★★ | 1.2x |
| 350以上 | ★★★ | 1.3x |
| 700以上 | ★★★★ | 1.4x |
| 960以上 | ★★★★★ | 1.5x |

星評価に応じて「プラスレベル」と「ハラモチエネルギー」がブーストされます。

## ⚠️ 免責事項

このサイトは個人が運営するファンメイドツールです。株式会社ポケモン、任天堂株式会社、The Pokémon Company、およびその関連会社とは一切関係ありません。

このツールは「Pokémon LEGENDS Z-A」のゲーム攻略を支援する目的で作成された非公式のツールです。

本ツールの利用によって生じた一切の損害、不利益、トラブル等について、開発者は責任を負いかねます。ご利用は自己責任でお願いいたします。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

Pokémon and Pokémon character names are trademarks of Nintendo.

© 2025 Pokémon. © 1995-2025 Nintendo/Creatures Inc./GAME FREAK inc.

This website is a fan-made tool and is not affiliated with or endorsed by Nintendo, The Pokémon Company, or GAME FREAK.

## 🤝 コントリビューション

プルリクエストを歓迎します。大きな変更を行う場合は、まずissueを開いて変更内容について議論してください。

## 🔗 リンク

- [GitHub Repository](https://github.com/carimatics/pokemon-za-donut)
- [Live Demo](https://carimatics.github.io/pokemon-za-donut/)

---

Made with ❤️ by [carimatics](https://github.com/carimatics)
