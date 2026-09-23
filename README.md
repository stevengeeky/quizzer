# quizzer

A single-page semi JavaScript-only application for self-assessment. No build step, no dependencies: open `index.html`.

Includes multiple-choice, fill-in-the-blank, and matching questions. Additionally, one can download a quiz and save it for later testing.

A sample quiz (the solar system) is loaded the first time the page opens. Anything you build in the editor is remembered in the browser, and so is a quiz you are in the middle of taking.

## Taking a quiz
Press **Assemble Quiz**. Questions come one at a time:

| key | action |
| --- | --- |
| `1`–`9` | pick that choice (multiple choice) |
| enter | check the answer; enter again moves on |
| tab | next box (matching) |

After each answer you see whether it was right, the correct answer, and the question's explanation if it has one. The results screen shows the percentage and grade, the time taken, and every question missed with its explanation. **Retry Missed Only** re-asks just those until none are left; **Retake Quiz** starts over.

Close the tab in the middle of a quiz and the page offers to resume it next time.

## Building a quiz
Each question has an optional *Explanation* box, shown after the question is answered.

Fill-in-the-blank answers are compared with spaces and case ignored, and understand two forms:

- `?!(a|b|c)` — any one of the options must be given: `?!(8|eight)`
- `??(a)` — the option may be given or left out: `??(the) moon`

## File formats
**Save Quiz** writes a `.qz` file and **Open Quiz** (or dragging a file onto the page) reads one. **Paste Quiz** takes either format pasted as text.

### Plain text (`.qz`)
One block per question. `{CHECKED}` marks the right choice; a `{WHY}` line is an optional explanation and goes last. Multiple choice and matching blocks end with a blank line. Older files without `{WHY}` lines load unchanged.

```
(mc)
Which planet is closest to the Sun?
{CHECKED}Mercury
Venus
Earth
{WHY}Mercury orbits about 58 million km from the Sun.

(fitb)
The largest planet in the solar system is ___.
Jupiter
{WHY}More than twice as massive as every other planet put together.
(mat)
Mars
the red planet
Saturn
the brightest rings
{WHY}Match each planet to its description.

```

### JSON
Either a bare array of questions or `{ "title": "...", "questions": [...] }`.

```json
{
  "title": "solar system",
  "questions": [
    { "type": "mc",   "question": "Which planet is closest to the Sun?",
      "choices": ["Mercury", "Venus", "Earth"], "answer": 0,
      "explanation": "Mercury orbits about 58 million km from the Sun." },
    { "type": "fitb", "question": "Light takes about ___ minutes to reach Earth.",
      "answer": ["8", "eight"] },
    { "type": "mat",  "pairs": [["Mars", "the red planet"], ["Saturn", "the brightest rings"]] }
  ]
}
```

`answer` for multiple choice may be the index or the text of the right choice; for fill-in-the-blank a string or a list of accepted strings. `pairs` may also be an object of `{ "match": "definition" }`.
