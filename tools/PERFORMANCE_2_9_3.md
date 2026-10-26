# 2.9.3 measured performance versus 2.9.2

Five rotating-order runs; predefined threshold max(5% baseline, 1 ms). Every measured metric passes.

| Metric | 2.9.2 | 2.9.3 |
| --- | ---: | ---: |
| coldMs (600 messages) | 171.1 | 163.64 |
| medianMs (600 messages) | 42.94 | 44.82 |
| coldMs (2000 messages) | 362.16 | 353.16 |
| medianMs (2000 messages) | 70.95 | 70.86 |
| parseReportMedianMs | 0.4425 | 0.4351 |
| processResponseMedianMs | 0.6186 | 0.5764 |
| promptConstructMedianMs | 0.3058 | 0.2958 |
| promptCharacters | 14832 | 14832 |
| populatedPromptCharacters | 18528 | 18528 |

Timings are ms; prompts are character counts. Both ordinary prompt profiles were also compared as strings and are byte-identical. Not every operation is faster; all remain within the predefined threshold. Model/I/O/history counts are unchanged (OPERATIONS_2_9_3.jsonl). Native UI and provider/network latency remain unmeasured.
