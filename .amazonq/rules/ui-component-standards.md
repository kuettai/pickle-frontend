# UI Component Standards for Pickleball Scoring System

## Visual Design Standards

### Score Display Component
- Font size: minimum 10vh (viewport height)
- Font weight: bold (700 or higher)
- Font family: sans-serif for clarity
- Color: white text on dark background (#000 or dark green)
- Position: top center of court
- Animation: smooth transitions for score changes
- Visibility: readable from 10+ feet away

### Player Name Components
- Font size: minimum 3vh, responsive to court size
- Position: Singles (center of court side), Doubles (top/bottom per team)
- Current server highlighting:
  - Border: 4px solid yellow/orange (#FFA500)
  - Background: semi-transparent highlight (rgba(255,165,0,0.3))
  - Font weight: extra bold (900)
  - Animation: subtle pulsing effect (1-2 second cycle)
  - Box shadow: prominent shadow for depth

### Court Layout Standards
- Dimensions: 100vw × 100vh (full screen)
- Left area: 38% width
- Kitchen area: 24% width, light grey background (#ccc)
- Right area: 38% width
- Colors: Green court (#4a7c59), white lines (2-3px)
- Touch zones: entire left/right areas clickable

### Button Standards
- Minimum size: 44px × 44px (touch-friendly)
- Padding: minimum 12px
- Font size: minimum 16px
- High contrast colors
- Clear visual feedback on press
- Rounded corners: 4-8px for modern look

## Component Architecture Standards

### Component Structure
```javascript
// Standard component structure
class ComponentName {
  constructor(container, options = {}) {
    this.container = container;
    this.options = { ...defaultOptions, ...options };
    this.state = {};
    this.init();
  }
  
  init() {
    this.render();
    this.bindEvents();
  }
  
  render() {
    // DOM creation logic
  }
  
  bindEvents() {
    // Event listener setup
  }
  
  update(newState) {
    // State update and re-render logic
  }
  
  destroy() {
    // Cleanup logic
  }
}
```

### State Management
- Use immutable state updates
- Validate state before applying changes
- Emit events for state changes
- Maintain component isolation

### Event Handling
- Use event delegation where possible
- Implement both touch and click handlers
- Provide immediate visual feedback
- Handle edge cases (rapid taps, simultaneous touches)

## Responsive Design Standards

### Tablet Optimization
- Design for landscape orientation only
- Support screen sizes: 768px - 1366px width
- Use flexible layouts (flexbox/grid)
- Avoid fixed positioning for critical elements

### Media Query Breakpoints
```css
/* iPad */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* iPad-specific styles */
}

/* Samsung Tablets */
@media screen and (min-width: 800px) and (max-width: 1280px) {
  /* Samsung tablet styles */
}

/* Windows Tablets */
@media screen and (min-width: 1024px) and (max-width: 1366px) {
  /* Windows tablet styles */
}
```

### Touch Interaction Standards
- Touch target minimum: 44px × 44px
- Spacing between targets: minimum 8px
- Visual feedback within 100ms
- Support for touch, mouse, and keyboard
- Prevent accidental touches with proper spacing

## Animation Standards

### Performance Guidelines
- Use CSS transforms instead of changing layout properties
- Prefer opacity and transform for animations
- Keep animations under 300ms for UI feedback
- Use easing functions for natural motion
- Avoid animating expensive properties (width, height, top, left)

### Score Update Animations
```css
.score-update {
  transition: transform 0.2s ease-out, opacity 0.2s ease-out;
}

.score-update.updating {
  transform: scale(1.1);
  opacity: 0.8;
}
```

### Server Highlighting Animation
```css
.current-server {
  border: 4px solid #FFA500;
  font-weight: 900;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

## Accessibility Standards

### Color Contrast
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text (18pt+)
- Test with color blindness simulators
- Provide alternative indicators beyond color

### Touch Accessibility
- Large touch targets for all interactive elements
- Clear visual focus indicators
- Logical tab order for keyboard navigation
- Screen reader friendly labels and descriptions

### Visual Hierarchy
- Use size, weight, and color to establish hierarchy
- Ensure important information (scores, current server) stands out
- Maintain consistent spacing and alignment
- Use white space effectively

## Error State Standards

### Visual Error Indicators
- Red color for errors (#DC3545)
- Clear error messages with actionable instructions
- Non-intrusive error display (toast notifications)
- Automatic error dismissal after 5-10 seconds

### Loading States
- Show loading indicators for API calls >500ms
- Disable interactive elements during processing
- Provide progress feedback for long operations
- Maintain responsive feel during loading

## Component Testing Standards

### Visual Testing
- Test on actual tablet devices
- Verify touch responsiveness
- Check readability from distance
- Validate in different lighting conditions

### Interaction Testing
- Test rapid touch interactions
- Verify multi-touch scenarios
- Test edge cases (simultaneous touches)
- Validate keyboard navigation

### Performance Testing
- Measure touch response times
- Monitor animation frame rates
- Test memory usage during extended use
- Validate battery impact