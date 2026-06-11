---
id: markdown-showcase
title: Markdown showcase
tags:
  - markdown
  - demo
  - tables
linkedQuizQuestions:
  - quizId: markdown-showcase
    questionId: md-q1
  - quizId: comprehensive-stress-test
    questionId: stress-sc-01
  - quizId: comprehensive-stress-test
    questionId: stress-sc-08
createdAt: "2026-06-10T12:00:00.000Z"
updatedAt: "2026-06-11T02:05:31.728Z"
---
## Tables

Basic pipe table:

| Feature | Supported |
| ------- | --------- |
| Bold    | **Yes**   |
| Italic  | *Yes*     |
| Code    | `Yes`     |
| Math    | $x^2$     |

Column alignment:

| Left | Center | Right |
| :--- | :----: | ----: |
| A    |   B    |     1 |
| Longer text | C |   100 |

Comparison table with mixed content:

| Hook | Purpose | Example |
| --- | --- | --- |
| `useState` | Local state | `const [n, setN] = useState(0)` |
| `useEffect` | Side effects | Run after render |
| `useMemo` | Memoized value | Avoid recomputation |

## Other markdown

**Bold**, *italic*, and `inline code` still work beside tables.

Math inline ($a^2 + b^2 = c^2$) and block:

$$
\sum_{i=1}^{n} i = \frac{n(n + 1)}{2}
$$

Subscripts with `_` and underline with `\underline`:

- Subscript: $x_1 + y_{n+1}$
- Limit: $\lim_{x \to 0} \dfrac{\sin x}{x}$
- Underline: $\underline{ABC + xyz}$

Indexed variables (common time-series / statistics notation):

- Single subscript: $T_1$, $T_2$, $T_3$
- Letter subscript: $S_t$, $X_t$, $Y_t$
- Mixed: $T_1 + T_2 = S_t$ and $\bar{X}_n = \frac{1}{n}\sum_{i=1}^{n} X_i$

- Bullet lists
- Still render correctly

```js
const total = rows.reduce((sum, row) => sum + row.value, 0);
```