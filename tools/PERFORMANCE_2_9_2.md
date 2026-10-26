# 2.9.2 performance versus 2.9.1

Five rotating-order runs; predefined threshold max(5% baseline, 1 ms). All metrics pass. Small timing differences are not guaranteed speed gains.

| Metric | 2.9.1 | 2.9.2 |
| --- | ---: | ---: |
| coldMs (600 messages) | 172.46 | 158.14 |
| medianMs (600 messages) | 41.35 | 40.88 |
| coldMs (2000 messages) | 345.15 | 333.7 |
| medianMs (2000 messages) | 66.53 | 63.78 |
| parseReportMedianMs | 0.4063 | 0.4049 |
| processResponseMedianMs | 0.5522 | 0.5648 |
| promptConstructMedianMs | 0.2729 | 0.3005 |
| promptCharacters | 14832 | 14832 |
| populatedPromptCharacters | 18528 | 18528 |

Timings are milliseconds; prompt sizes are characters, not exact tokens. Static and populated prompts are byte-for-byte identical in the tested profiles. Instrumented updates: one model call, six chat reads, one metadata write, two storage reads and four writes in both. Panel indexed history reads: 9,101 in both on 600 messages; measured traversals each run once. Counts are measured in separate fresh processes. No live host/network latency measurement.
