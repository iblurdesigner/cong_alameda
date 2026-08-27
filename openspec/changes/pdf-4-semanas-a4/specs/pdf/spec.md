# Feature Spec: Impresión A4 de 5 Semanas

## Requirements
1. The print document shall render up to 5 weeks of assignments on a single A4 page.
2. The print CSS shall set `@page { size: A4 portrait; margin: 6mm 8mm; }`.
3. Typography, line heights, and table cell padding shall automatically condense when 4 or 5 weeks are selected to guarantee 0 overflow onto page 2.
4. Users shall have a layout toggle between "Tablas Compactas" and "Matriz Mensual" in the PDF preview modal.
