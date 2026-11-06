The confirmation pattern for destructive actions. Props: `title` (a question naming the object), children (the consequence), `cancelLabel`, `confirmLabel`, `destructive`.

The safe choice sits first, the destructive one is the `danger` button and is labelled with the verb (`Cancel order`), never `Yes`. The consumer provides the overlay, focus trap and Escape handling.