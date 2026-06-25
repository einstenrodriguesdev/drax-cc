# Design decision (Design-CTO)
System: mobile-first, high-contrast, large tap targets (Dona Cláudia on patchy data). No bank-blue (clearance risk). WCAG 2.2 AA target.
Variations to test: A green accent (#16834a) vs B deeper green (#0f6b3c) on the hero CTA.
Metric: hero CTA click-through + WCAG contrast pass rate, tracked over time.
Triggers: scale the variant with higher CTR at equal AA pass; change if either drops below baseline.
