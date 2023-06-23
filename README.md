# hugenumberjs
[![npm version](https://badge.fury.io/js/hugenumberjs.svg)](https://badge.fury.io/js/hugenumberjs)

A library for storing extremely large numbers (up to {10, 1000, 1, 1, 2}) in JavaScript. Supports both Node and browser.

Internally, number is represented as a sign (1 if positive, -1 if negative) and array. The value represented is `sign` * 10 → `array[0]` → `array[1]` → `array[2]` → `array[2]`... in [chained arrow notation](https://googology.fandom.com/wiki/Chained_arrow_notation)
(specifically Fish's [real number extension of it](https://googology.fandom.com/ja/wiki/%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%83%96%E3%83%AD%E3%82%B0:Kyodaisuu/%E3%83%81%E3%82%A7%E3%83%BC%E3%83%B3%E8%A1%A8%E8%A8%98%E3%81%AE%E9%80%A3%E7%B6%9A%E9%96%A2%E6%95%B0%E5%8C%96)). 

## Methods
* `constructor(sign, array)`: Convert from sign and array
* `constructor(num)`: Convert from standard number
* `constructor(str)`: Convert from string, currently can include scientific notation (even nested exponent like "1e1e1e1e500") but not arrows
* `normalize()`: Normalize properties
* `clone()`: Object clone
* `abs()`: Absolute value
* `neg()`: Negate
* `add(other)`: Add
* `sub(other)`: Subtract
* `mul(other)`: Multiply
* `div(other)`: Divide
* `mod(other)`: Modulo
* `exp()`: Base e exponential
* `exp10()`: Base 10 exponential
* `pow(other)`: Raise to power
* `sqrt()`: Square root
* `cbrt()`: Cube root
* `log()`: Base e logarithm
* `log10()`: Base 10 logarithm
* `logb(base)`: Arbitrary base logarithm
* `floor()`: Floor
* `ceil()`: Ceiling
* `round()`: Round to nearest integer
* `sin()`: Sine
* `cos()`: Cosine
* `tan()`: Tangent
* `asin()`: Inverse sine
* `acos()`: Inverse cosine
* `atan()`: Inverse tangent
* `cmp(other)`: Compare to (returns -1 if `this < other`, 0 if `this === other`, 1 if `this > other`)
* `eq(other)`: Equal to
* `ne(other)`: Not equal to
* `lt(other)`: Less than
* `le(other)`: Less than or equal
* `gt(other)`: Greater than
* `ge(other)`: Greater than or equal
* `min(other)`: Minimum
* `max(other)`: Maximum
* `toNumber()`: Convert to standard number
* `toString()`: Convert to string
* `toExponential()`: Convert to scientific notation string (including nested exponents)
* `toArrow()`: Convert to arrow notation string
* `toChainedArrow()`: Convert to chained arrow notation string