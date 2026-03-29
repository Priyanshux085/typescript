# Multi-Report System

This diagram shows how the files connect via imports and strategy usage.

```mermaid
flowchart TD
  index[index.ts] --> context[context/report-context.ts]
  index --> container[di/container.ts]
  index --> rcmap[di/report-context-map.ts]

  context --> stratIface[strategies/report-strategy.ts]

  container --> rcmap
  container --> stratIndex[strategies/index.ts]

  rcmap --> stratIndex

  stratIndex --> csv[strategies/csv-report.ts]
  stratIndex --> json[strategies/json-report.ts]
  stratIndex --> pdf[strategies/pdf-report.ts]
  stratIndex --> stratIface

  csv --> stratIface
  json --> stratIface
  pdf --> stratIface
```

## Use Cases 

- `index.ts` is the entry point of the application. It imports the `ReportContext`, `ReportContainer`, and `reportContextMap` to generate reports based on the file type.

- If new report types are added, they can be registered in the `ReportContainer` and added to the `reportContextMap` without modifying the existing code in `index.ts`, adhering to the Open/Closed Principle.