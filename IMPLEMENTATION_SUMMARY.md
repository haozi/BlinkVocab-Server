# 實作總結：SRS Review 和 Tasks 端點

## ✅ 已實作功能

### 1. **POST /api/review/submit** - 提交複習結果

**位置**: [src/app/api/review/submit/route.ts](src/app/api/review/submit/route.ts)

**請求體**:

```json
{
  "userWordId": "string (CUID)",
  "correct": boolean
}
```

**SRS 算法** (Spaced Repetition System):

- **正確答案**:
  - `stage` 增加 1（最多到 5）
  - `nextDueAt` = 當前時間 + `intervals[stage]`
  - 狀態：若為 'new' 則轉為 'learning'；若 stage >= 2 則為 'review'

- **錯誤答案**:
  - `stage` 減少 1（最少為 0）
  - `nextDueAt` = 當前時間 + 10 分鐘

**時間間隔** (分鐘):

- Stage 0 → 1: 10 分鐘
- Stage 1 → 2: 1440 分鐘 (1 天)
- Stage 2 → 3: 4320 分鐘 (3 天)
- Stage 3 → 4: 10080 分鐘 (7 天)
- Stage 4 → 5: 21600 分鐘 (15 天)
- Stage 5 →: 43200 分鐘 (30 天)

**事件記錄**:

- 答案正確: `answer_correct` 事件
- 答案錯誤: `answer_wrong` 事件
- 事件 payload 包含: `oldStage`, `newStage`, `correct`

**回應範例**:

```json
{
  "userWordId": "cmlba7ix90017a8jhmzsb8ad9",
  "wordId": "cmlba7iw70003a8jh6j38rhds",
  "lemma": "abundant",
  "stage": 3,
  "status": "learning",
  "nextDueAt": "2026-02-10T04:59:48.598Z",
  "correct": true
}
```

---

### 2. **GET /api/tasks/today** - 獲取今日學習任務

**位置**: [src/app/api/tasks/today/route.ts](src/app/api/tasks/today/route.ts)

**邏輯**:

- **到期的單詞 (due)**: `nextDueAt <= 現在` 且 `status` 不是 'mastered' 或 'ignored'
- **新單詞 (new)**: `status = 'new'`

**回應範例**:

```json
{
  "due": [
    {
      "userWordId": "cmlba7ix90017a8jhmzsb8ad9",
      "wordId": "cmlba7iw70003a8jh6j38rhds",
      "lemma": "accommodate",
      "stage": 0,
      "status": "learning",
      "nextDueAt": "2026-02-07T00:00:00.000Z"
    }
  ],
  "new": [
    {
      "userWordId": "cmlba7ix90018a8jhmzsb8ad9",
      "wordId": "cmlba7iw70004a8jh6j38rhds",
      "lemma": "abundant",
      "stage": 0,
      "status": "new",
      "nextDueAt": "2026-02-07T04:59:33.745Z"
    }
  ]
}
```

---

## 🧪 驗收測試結果

所有驗收標準已通過 ✅

### Test 1: 提交正確答案

- ✅ Stage 從 1 增加到 2
- ✅ nextDueAt 推後 1440 分鐘 (1 天)
- ✅ 建立 `answer_correct` 事件

### Test 2: 提交錯誤答案

- ✅ Stage 從 3 減少到 2
- ✅ nextDueAt 設為當前時間 + 10 分鐘
- ✅ 建立 `answer_wrong` 事件

### Test 3: 獲取今日任務

- ✅ 返回 due 清單 (nextDueAt <= 現在)
- ✅ 返回 new 清單 (status = 'new')

### Test 4: SRS 間隔驗證

- ✅ 所有 6 個間隔正確配置
- ✅ 錯誤答案總是 10 分鐘

---

## 📝 更新的檔案

1. **[src/types/review.ts](src/types/review.ts)**
   - 更新 `SRS_INTERVALS_MINUTES` 為 6 個間隔

2. **[src/app/api/review/submit/route.ts](src/app/api/review/submit/route.ts)**
   - 添加狀態轉換邏輯
   - 更新事件類型為 `answer_correct`/`answer_wrong`
   - 更新 payload 結構為 `oldStage`, `newStage`

3. **[prisma/test-review-and-tasks.ts](prisma/test-review-and-tasks.ts)**
   - 更新為使用 6 個 SRS 間隔
   - 更新事件類型檢查

---

## 🚀 如何測試

```bash
# 啟動開發伺服器
pnpm dev

# 執行完整測試
pnpm exec dotenv -e .env.local -- ts-node prisma/test-review-and-tasks.ts

# 執行驗收測試
pnpm exec dotenv -e .env.local -- ts-node prisma/test-acceptance.ts

# 手動測試 API
# 提交答案
curl -X POST http://localhost:3000/api/review/submit \
  -H "x-user-id: <user-id>" \
  -H "Content-Type: application/json" \
  -d '{"userWordId":"<user-word-id>","correct":true}'

# 獲取今日任務
curl http://localhost:3000/api/tasks/today \
  -H "x-user-id: <user-id>"
```

---

## ✨ 特性

- ✅ 完整的 SRS (Spaced Repetition System) 實現
- ✅ 自動狀態轉換 (new → learning → review)
- ✅ 事件日誌記錄用於追蹤學習進度
- ✅ 類型安全 (Zod 驗證)
- ✅ 事務保護確保數據一致性
- ✅ 權限驗證 (user-id 檢查)
