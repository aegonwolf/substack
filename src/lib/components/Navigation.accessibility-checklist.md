# Navigation Accessibility Testing Checklist

This document provides a comprehensive checklist for manually testing the accessibility features of the Navigation component. These tests should be performed to verify compliance with WCAG 2.1 Level AA standards.

## Prerequisites

- Screen reader software (NVDA, JAWS, or VoiceOver)
- Keyboard-only navigation capability
- Browser developer tools for inspecting ARIA attributes
- Different screen sizes/devices for responsive testing

## ARIA Labels and Attributes Testing

### Desktop Navigation

- [ ] **Navigation Landmark**: Verify main navigation has `aria-label="Main navigation"`
- [ ] **Dropdown Triggers**: Check each dropdown button has:
  - [ ] `aria-haspopup="menu"`
  - [ ] `aria-expanded="false"` when closed, `"true"` when open
  - [ ] `aria-controls` pointing to correct dropdown menu ID
  - [ ] `aria-label` describing the menu (e.g., "Topics menu")
- [ ] **Dropdown Menus**: Verify dropdown containers have:
  - [ ] `role="menu"`
  - [ ] `tabindex="-1"`
  - [ ] `aria-labelledby` pointing to trigger button
- [ ] **Menu Items**: Check dropdown links have:
  - [ ] `role="menuitem"`
  - [ ] `tabindex="-1"`
  - [ ] `aria-current="page"` when active
- [ ] **Icons**: Verify decorative icons have `aria-hidden="true"`

### Mobile Navigation

- [ ] **Mobile Menu Button**: Check hamburger button has:
  - [ ] `aria-label` describing current state ("Open/Close navigation menu")
  - [ ] `aria-expanded="false"` when closed, `"true"` when open
  - [ ] `aria-controls="mobile-navigation-menu"`
- [ ] **Mobile Navigation**: Verify mobile nav container has:
  - [ ] `aria-label="Mobile navigation"`
  - [ ] `id="mobile-navigation-menu"`
- [ ] **Section Headers**: Check expandable section buttons have:
  - [ ] `aria-expanded="false"` when collapsed, `"true"` when expanded
  - [ ] `aria-controls` pointing to section content
  - [ ] `aria-label` describing action ("Expand/Collapse [section] section")
- [ ] **Section Content**: Verify expanded sections have:
  - [ ] `role="group"`
  - [ ] `aria-labelledby` pointing to section header

## Keyboard Navigation Testing

### Desktop Dropdown Navigation

- [ ] **Tab Navigation**: Tab key moves focus through navigation items in logical order
- [ ] **Dropdown Activation**: 
  - [ ] Enter key opens/closes dropdown menus
  - [ ] Space key opens/closes dropdown menus
- [ ] **Arrow Key Navigation**:
  - [ ] ArrowDown from trigger focuses first menu item
  - [ ] ArrowDown/ArrowUp navigate between menu items
  - [ ] Navigation wraps around (last item → first item, first item → last item)
- [ ] **Escape Key**: Closes dropdown and returns focus to trigger button
- [ ] **Tab from Menu**: Closes dropdown and moves focus to next navigation element
- [ ] **Enter on Menu Item**: Navigates to link and closes dropdown

### Mobile Navigation

- [ ] **Mobile Menu Toggle**: 
  - [ ] Enter key opens/closes mobile menu
  - [ ] Space key opens/closes mobile menu
- [ ] **Section Expansion**:
  - [ ] Enter key expands/collapses sections
  - [ ] Space key expands/collapses sections
- [ ] **Tab Navigation**: Tab key moves through mobile navigation items in logical order
- [ ] **Link Activation**: Enter key activates navigation links

## Screen Reader Testing

### Announcements

- [ ] **Mobile Menu**: Screen reader announces "Navigation menu opened/closed"
- [ ] **Dropdown Menus**: Screen reader announces "[Menu name] menu opened/closed"
- [ ] **Mobile Sections**: Screen reader announces "[Section name] section expanded/collapsed"
- [ ] **Announcement Timing**: Announcements clear after ~1 second

### Navigation Experience

- [ ] **Landmarks**: Screen reader identifies navigation landmarks correctly
- [ ] **Menu Structure**: Screen reader reads dropdown menus as menu structures
- [ ] **Current Page**: Screen reader identifies current page with "current page" announcement
- [ ] **State Changes**: Screen reader announces when dropdowns/sections expand/collapse
- [ ] **Focus Changes**: Screen reader follows focus changes appropriately

## Focus Management Testing

### Visual Focus Indicators

- [ ] **Visible Focus**: All interactive elements show clear focus indicators
- [ ] **Focus Contrast**: Focus indicators meet color contrast requirements
- [ ] **Focus Persistence**: Focus indicators remain visible during interaction

### Focus Flow

- [ ] **Logical Order**: Tab order follows visual layout logically
- [ ] **No Focus Traps**: Focus doesn't get trapped in dropdowns unintentionally
- [ ] **Focus Return**: 
  - [ ] Escape from dropdown returns focus to trigger
  - [ ] Closing mobile menu maintains appropriate focus
- [ ] **Focus on Open**: 
  - [ ] Dropdown opening via click focuses first menu item
  - [ ] Mobile menu opening maintains focus on toggle button

## Responsive Accessibility Testing

### Screen Size Variations

- [ ] **Desktop (≥768px)**: Dropdown functionality works with keyboard and screen reader
- [ ] **Mobile (<768px)**: Expandable sections work with keyboard and screen reader
- [ ] **Transition**: Switching between modes maintains accessibility

### Touch vs. Keyboard

- [ ] **Touch Interaction**: Touch users can access all navigation functionality
- [ ] **Keyboard Interaction**: Keyboard users can access all navigation functionality
- [ ] **Equivalent Access**: Both interaction modes provide equivalent functionality

## Browser Compatibility Testing

Test accessibility features across different browsers:

- [ ] **Chrome**: All accessibility features work correctly
- [ ] **Firefox**: All accessibility features work correctly
- [ ] **Safari**: All accessibility features work correctly
- [ ] **Edge**: All accessibility features work correctly

## Assistive Technology Compatibility

### Screen Readers

- [ ] **NVDA (Windows)**: Navigation works correctly with NVDA
- [ ] **JAWS (Windows)**: Navigation works correctly with JAWS
- [ ] **VoiceOver (macOS/iOS)**: Navigation works correctly with VoiceOver
- [ ] **TalkBack (Android)**: Navigation works correctly on mobile devices

### Other Assistive Technologies

- [ ] **Voice Control**: Navigation can be controlled via voice commands
- [ ] **Switch Navigation**: Navigation works with switch-based input devices
- [ ] **High Contrast Mode**: Navigation remains usable in high contrast mode
- [ ] **Zoom**: Navigation remains functional at 200% zoom level

## WCAG 2.1 Compliance Verification

### Level A Requirements

- [ ] **2.1.1 Keyboard**: All functionality available via keyboard
- [ ] **2.1.2 No Keyboard Trap**: No keyboard focus traps
- [ ] **2.4.3 Focus Order**: Focus order is logical and meaningful
- [ ] **4.1.2 Name, Role, Value**: All UI components have accessible names and roles

### Level AA Requirements

- [ ] **2.4.6 Headings and Labels**: Navigation labels are descriptive
- [ ] **2.4.7 Focus Visible**: Focus indicators are clearly visible
- [ ] **1.4.3 Contrast**: Focus indicators meet contrast requirements

## Performance Impact Testing

- [ ] **Load Time**: Accessibility features don't significantly impact load time
- [ ] **Runtime Performance**: Keyboard navigation is responsive
- [ ] **Memory Usage**: Screen reader announcements don't cause memory leaks

## Error Handling Testing

- [ ] **JavaScript Disabled**: Navigation remains functional without JavaScript
- [ ] **Network Issues**: Navigation accessibility isn't affected by slow connections
- [ ] **Broken Links**: Screen readers handle broken navigation links appropriately

## Documentation and Maintenance

- [ ] **Code Comments**: Accessibility features are documented in code
- [ ] **Testing Documentation**: This checklist is kept up to date
- [ ] **Team Training**: Team members understand accessibility requirements

## Sign-off

- [ ] **Developer Testing**: All automated tests pass
- [ ] **Manual Testing**: All manual tests completed successfully
- [ ] **Accessibility Review**: Accessibility expert has reviewed implementation
- [ ] **User Testing**: Users with disabilities have tested the navigation

---

**Testing Date**: ___________
**Tester Name**: ___________
**Browser/OS**: ___________
**Screen Reader**: ___________
**Notes**: ___________