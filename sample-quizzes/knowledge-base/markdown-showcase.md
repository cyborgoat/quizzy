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
views: 4
createdAt: "2026-06-10T12:00:00.000Z"
updatedAt: "2026-06-12T01:14:42.198Z"
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

| Left        | Center | Right |
| :---------- | :----: | ----: |
| A           |    B   |     1 |
| Longer text |    C   |   100 |

Comparison table with mixed content:

| Hook        | Purpose        | Example                         |
| ----------- | -------------- | ------------------------------- |
| `useState`  | Local state    | `const [n, setN] = useState(0)` |
| `useEffect` | Side effects   | Run after render                |
| `useMemo`   | Memoized value | Avoid recomputation             |

## Other markdown

**Bold**, *italic*, and `inline code` still work beside tables.

Math inline ($a^2 + b^2 \= c^2$) and block:

$$

\sum\_{i\=1}^{n} i \= \frac{n(n + 1)}{2}

$$

Subscripts with `_` and underline with `\underline`:

* Subscript: $x\_1 + y\_{n+1}$
* Limit: $\lim\_{x \to 0} \dfrac{\sin x}{x}$
* Underline: $\underline{ABC + xyz}$

Indexed variables (common time-series / statistics notation):

* Single subscript: $T\_1$, $T\_2$, $T\_3$
* Letter subscript: $S\_t$, $X\_t$, $Y\_t$
* Mixed: $T\_1 + T\_2 \= S\_t$ and $\bar{X}*n \= \frac{1}{n}\sum*{i\=1}^{n} X\_i$

## Code blocks

Syntax-highlighted fenced blocks:

```js
const total = rows.reduce((sum, row) => sum + row.value, 0);
```

```ts
function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

```json
{ "id": "markdown-showcase", "tags": ["markdown", "demo"] }
```

```python
values = [1, 2, 3]
print(sum(values))
```

```css
.note {
  color: #18181b;
  background: #fafafa;
}
```

```bash
echo "Quizzy markdown showcase"
```

* Bullet lists
* Still render correctly