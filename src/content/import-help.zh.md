## 如何导入

1. **导入文件** — 使用上方的**立即导入文件**，选择一个 `.json` 测验，Quizzy 会将其复制到你的测验文件夹。
2. **放入文件夹** — 打开测验文件夹，在根目录放入 `.json` 文件，然后在首页点击**刷新**。不会读取子文件夹中的文件。

如果文件没有出现，请查看首页的红色提示。常见原因：JSON 无效、缺少必填字段，或测验 `id` 已被其他文件使用。

## 用 AI 生成

点击右上角的**复制提示词**，粘贴到任意大模型助手，把 `{topic}` 换成你的主题，将回复保存为 `.json` 文件后再导入。

## 文件格式

每个顶层 `.json` 文件对应一份测验。

| 字段 | 规则 |
| --- | --- |
| `id` | 必填。在所有测验文件中必须唯一。 |
| `title` | 必填。 |
| `description`、`tags` | 可选。`tags` 为字符串列表。 |
| `questions` | 至少一道题。同一测验内题目 `id` 必须唯一。 |

每道题需要 `id`、`type` 和 `prompt`。`explanation` 可选。文本支持 Markdown、表格、代码块和 KaTeX 数学公式。

### 题型

- **`single_choice`** — `options`（2 个或以上）和 `answerIndex`（从 0 开始）。
- **`multiple_choice`** — `options`（2 个或以上）和 `answerIndices`（不重复的索引，从 0 开始）。按完全匹配计分。
- **`true_false`** — `answer` 为 `true` 或 `false`。

### 示例

```json
{
  "id": "web-basics",
  "title": "Web Basics",
  "description": "A short mixed-format quiz.",
  "tags": ["web"],
  "questions": [
    {
      "id": "q1",
      "type": "single_choice",
      "prompt": "Which language styles web pages?",
      "options": ["HTML", "CSS", "SQL"],
      "answerIndex": 1
    },
    {
      "id": "q2",
      "type": "multiple_choice",
      "prompt": "Which run in a browser frontend?",
      "options": ["HTML", "CSS", "JavaScript", "PostgreSQL"],
      "answerIndices": [0, 1, 2]
    },
    {
      "id": "q3",
      "type": "true_false",
      "prompt": "JSON supports comments.",
      "answer": false,
      "explanation": "Standard JSON syntax does not include comments."
    }
  ]
}
```
