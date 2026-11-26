## Cómo importar

1. **Importar un archivo** — usa **Importar un archivo ahora** arriba, elige un cuestionario `.json` y Quizzy lo copia a tu carpeta.
2. **Colocar en la carpeta** — abre la carpeta de cuestionarios, añade archivos `.json` en el nivel superior y luego pulsa **Actualizar** en Inicio. Se ignoran las subcarpetas.

Si un archivo no aparece, revisa el aviso rojo en Inicio. Causas comunes: JSON no válido, un campo obligatorio faltante o un `id` de cuestionario que ya usa otro archivo.

## Generar con IA

Usa **Copiar prompt** (arriba a la derecha), pégalo en cualquier agente LLM, sustituye `{topic}` por tu tema y guarda la respuesta como un archivo `.json`. Luego impórtalo.

## Formato de archivo

Cada archivo `.json` de nivel superior es un cuestionario.

| Campo | Reglas |
| --- | --- |
| `id` | Obligatorio. Único entre todos los archivos de cuestionarios. |
| `title` | Obligatorio. |
| `description`, `tags` | Opcionales. `tags` es una lista de cadenas. |
| `questions` | Al menos una. Los `id` de pregunta deben ser únicos dentro del cuestionario. |

Cada pregunta necesita `id`, `type` y `prompt`. `explanation` es opcional. El texto admite Markdown, tablas, bloques de código y matemáticas KaTeX.

### Tipos de pregunta

- **`single_choice`** — `options` (2+) y `answerIndex` (desde 0).
- **`multiple_choice`** — `options` (2+) y `answerIndices` (índices únicos desde 0). Se califica por coincidencia exacta.
- **`true_false`** — `answer` es `true` o `false`.

### Ejemplo

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
