# 2.8.2 performance comparison

Five rotating-order rounds; medians of per-process medians. Times are milliseconds.

| Operation | Supplied 2.8.1 | Pinned 2.8.21 | Rebuild 2.8.2 |
| --- | ---: | ---: | ---: |
| 600 messages, cold | 99.73 | 119.89 | 76.98 |
| 600 messages, warm | 52.17 | 54.16 | 37.47 |
| 2,000 messages, cold | 150.75 | 189.09 | 117.21 |
| 2,000 messages, warm | 72.61 | 87.04 | 58.68 |
| Report normalization | 0.3789 | 0.4071 | 0.4041 |
| Response processing | 0.5223 | 0.5993 | 0.607 |
| Prompt construction | 4.1086 | 0.2838 | 0.2812 |
| Static request characters | 14471 | 15528 | 13054 |
| Populated request characters | 16584 | 19133 | 16510 |

All timed metrics satisfy the predefined max(5%, 1 ms) increase threshold against both comparators. The report/response differences below 0.1 ms are permitted, rather than concealed as speed gains. Exact provider tokens and live refresh latency were not measured. See CLEAN_REBUILD.md and BENCHMARK_2_8_2.json for commands, policy, raw rounds and I/O/history counters.
