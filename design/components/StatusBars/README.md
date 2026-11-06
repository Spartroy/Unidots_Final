Horizontal bars for a status distribution in pipeline order. Props: `items` (`{status, count, label}`), `label`.

Use this instead of a pie chart. Each row shows the status shape, its name and its count; the bar fill is `status-<name>-fg`, which differs in lightness as well as hue. Never rely on bar colour alone: the label is always on the row.