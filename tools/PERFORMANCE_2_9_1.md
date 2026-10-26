# 2.9.1 measured performance

Five rotating-order runs against the supplied untouched 2.9.0. Threshold: max(5%, 1 ms). All measured metrics pass.

| Metric | 2.9.0 | 2.9.1 |
| --- | ---: | ---: |
| Cold panel (ms), 600 messages | 177.85 | 143.21 |
| Warm panel (ms), 600 messages | 52.33 | 39.94 |
| Cold panel (ms), 2000 messages | 392.32 | 336.06 |
| Warm panel (ms), 2000 messages | 90.57 | 64.29 |
| parseReportMedianMs | 0.3744 | 0.3852 |
| processResponseMedianMs | 0.5137 | 0.5489 |
| promptConstructMedianMs | 0.262 | 0.2694 |
| promptCharacters | 15633 | 14832 |
| populatedPromptCharacters | 19329 | 18528 |

Normalization/response differences are below 0.04 ms; these are not claims that every operation is faster. Prompt sizes are characters, not exact tokens. Model calls and I/O counts are unchanged in the instrumented update. See OPERATIONS_2_9_1.jsonl. Live provider latency and UI installation remain unmeasured.
