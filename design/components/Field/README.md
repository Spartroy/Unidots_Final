A labelled text input with optional hint and inline error. Props: `label` (always visible: never a placeholder), `hint`, `error`, `value`, `type`, `dir`.

The border is `border-control` (3:1); an invalid field gets a 2px `danger` border and an `alert` message beneath it that says what to do, not who was wrong. Pass `dir="rtl"` for Arabic.