# Delta for Asignaciones UI

## MODIFIED Requirements

### Requirement: Asignaciones Semanales Dashboard UI

The system SHALL render the weekly assignment dashboard using modern visual hierarchy, dynamic cards for each calendar day, badges with custom colors per assignment category, `<re-icon>` iconography, and smooth responsive design.

#### Scenario: Displaying calendar days with modern cards and current day glow
- GIVEN the user navigates to `/asignaciones`
- WHEN the weekly assignments data loads
- THEN the system MUST render each calendar day as a styled card with smooth borders and subtle shadows
- AND the card corresponding to today's date MUST be highlighted with a distinctive accent glow and border
- AND non-current month or past days MUST have subtle muted styling.

#### Scenario: Rendering assignment badges with icons
- GIVEN a calendar day contains active assignments
- WHEN the day card is rendered
- THEN each assignment MUST be displayed as a distinct badge featuring its category icon via `<re-icon>` and a category-specific color theme
- AND assigned group vs assigned user MUST be clearly distinguishable.

#### Scenario: Editing or adding an assignment via modern modal
- GIVEN the user clicks on a day or an assignment item
- WHEN the assignment modal opens
- THEN the system MUST display elevated, glassmorphism-inspired styling with clean input fields and icon buttons
- AND when the assignment type is "Aseo Salon", only the group selector MUST be shown
- AND for other assignment types, the person selector MUST be shown.
