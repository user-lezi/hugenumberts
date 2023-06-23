# hugenumber
A library for storing extremely large numbers (up to {10, 1000, 1, 1, 2}) in JavaScript. Supports both Node and browser.

Internally, number is represented as a sign (1 if positive, -1 if negative) and array. The value represented is `sign` * 10 → `array[0]` → `array[1]` → `array[2]` → `array[2]`... in [chained arrow notation](https://googology.fandom.com/wiki/Chained_arrow_notation)
(specifically Fish's [continuous version of it](https://googology.fandom.com/ja/wiki/%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%83%96%E3%83%AD%E3%82%B0:Kyodaisuu/%E3%83%81%E3%82%A7%E3%83%BC%E3%83%B3%E8%A1%A8%E8%A8%98%E3%81%AE%E9%80%A3%E7%B6%9A%E9%96%A2%E6%95%B0%E5%8C%96)). So array of `[100]` represents a value of