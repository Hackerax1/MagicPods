# MTGSvelte Design Guide

## Color System
Our color system is built around a primary indigo palette and a secondary blue palette, with semantic colors for different states.

### Primary Colors (Indigo)
- Primary Lightest (#eef2ff) - Backgrounds, hover states
- Primary (#4f46e5) - Primary buttons, active states
- Primary Dark (#4338ca) - Button hover states
- Primary Darker (#3730a3) - Text on light backgrounds

### Secondary Colors (Blue)
- Secondary Lightest (#f0f9ff) - Alternate backgrounds
- Secondary (#0284c7) - Secondary actions
- Secondary Dark (#0369a1) - Secondary hover states

### Semantic Colors
- Success (#10b981) - Positive actions and states
- Warning (#f59e0b) - Cautionary actions and states
- Error (#ef4444) - Negative actions and states
- Info (#3b82f6) - Informational states

## Typography

### Font Families
- Primary: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
- Monospace: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace

### Font Sizes
- xs (12px) - Fine print, supporting text
- sm (14px) - Secondary text, labels
- base (16px) - Body text
- lg (18px) - Emphasized body text
- xl (20px) - Small headings
- 2xl-5xl (24px-48px) - Section and page headings

## Spacing
Our spacing scale uses 4px increments for consistent rhythm:
- 4px - Minimal spacing, tight elements
- 8px - Standard spacing between related elements
- 16px - Spacing between distinct elements
- 24px+ - Section spacing

## Components

### Buttons
```svelte
<Button variant="primary">Primary Action</Button>
<Button variant="secondary">Secondary Action</Button>
<Button variant="outline">Tertiary Action</Button>
```

### Inputs
```svelte
<Input label="Card Name" placeholder="Enter card name" />
<Input type="number" label="Quantity" />
```

### Cards
```svelte
<Card title="Deck Information" elevation="raised">
  <div slot="content">Card content</div>
</Card>
```

## Accessibility Guidelines

1. Color Contrast
- Maintain WCAG 2.1 AA standard (4.5:1 for normal text, 3:1 for large text)
- Use semantic colors with sufficient contrast
- Don't rely on color alone to convey meaning

2. Keyboard Navigation
- All interactive elements must be focusable
- Use logical tab order
- Provide visible focus indicators
- Support standard keyboard shortcuts

3. Screen Readers
- Use semantic HTML elements
- Provide descriptive alt text for images
- Use ARIA labels where needed
- Ensure proper heading hierarchy

4. Interactive Elements
- Minimum touch target size of 44x44px
- Clear hover/focus states
- Descriptive button text
- Loading states for async actions

## Best Practices

1. Component Usage
- Use consistent spacing between components
- Follow established patterns for similar interactions
- Maintain consistent button hierarchy
- Use appropriate input types

2. Layout
- Mobile-first responsive design
- Consistent grid system
- Clear visual hierarchy
- Whitespace for readability

3. Forms
- Group related fields
- Clear error states
- Required field indicators
- Helpful validation messages