A transient message in three tones: `success`, `error`, `info`. Props: `tone`, `title`, children for one sentence.

Each tone pairs a shape with text and uses the matching status colours. Errors use `role="alert"` and stay until dismissed. Never use `alert()`.