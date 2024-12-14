function isFiniteAndNonzero(x: number) {
  return Number.isFinite(x) && x;
}

// Arrow notation with standard numbers
function arrow(a: number, x: number, y: number): number {
  if (x <= 1 || y === 1) {
    return Math.pow(a, x);
  } else {
    var result = arrow(a, x % 1, y);
    for (var i = 0; i < Math.floor(x); i++) {
      result = arrow(a, result, y - 1);
    }
    return result;
  }
}

// Inverse arrow notation with standard numbers (hyper-logarithm)
function inverseArrow(a: number, x: number, y: number) {
  if (x <= a || y === 1) {
    return Math.log10(x) / Math.log10(a);
  } else {
    var result = 0;
    while (x >= a) {
      x = inverseArrow(a, x, y - 1);
      result++;
    }
    result += inverseArrow(a, x, y - 1);
    return result;
  }
}

class HugeNumber {
  // Constants
  public static readonly ZERO = new HugeNumber(0);
  public static readonly ONE = new HugeNumber(1);
  public static readonly E = new HugeNumber(Math.E);
  public static readonly PI = new HugeNumber(Math.PI);
  public static readonly TEN = new HugeNumber(10);

  // Max chain length (to preevnt memory leak)
  public static readonly MAX_ARRAY_LENGTH = 1000;

  public sign!: number;
  public array!: number[];
  public constructor(sign: string);
  public constructor(sign: number, array?: number[]);
  public constructor(huge: HugeNumber);
  public constructor(
    signOrHuge: string | number | HugeNumber,
    array?: number[],
  ) {
    if (array === undefined) {
      if (typeof signOrHuge === "number") {
        // Convert from standard number
        this.sign = signOrHuge < 0 || Object.is(signOrHuge, -0) ? -1 : 1;
        this.array = [Math.log10(Math.abs(signOrHuge))];
      } else if (typeof signOrHuge === "string") {
        let param = signOrHuge.toLowerCase();
        // Handle negative number strings
        this.sign = param[0] === "-" ? -1 : 1;
        if (this.sign === -1) param = param.slice(1);

        // Convert from string
        // Currently can include scientific notation (even nested exponent like "1e1e1e1e500") but not arrows
        const parts = param.split("e").map(Number);
        let temp = new HugeNumber(Number(parts[parts.length - 1]));
        for (let i = parts.length - 2; i >= 0; i--) {
          temp = new HugeNumber(Number(parts[i])).mul(temp.exp10());
        }
        this.array = temp.array;
      } else if (signOrHuge instanceof HugeNumber) {
        // Convert from other HugeNumber object
        this.sign = signOrHuge.sign;
        this.array = signOrHuge.array;
      }
    } else {
      // Convert from sign and chained arrow notation array (this is the internal representation)
      // Value = sign * 10 -> array[0] -> array[1] -> array[2] -> array[3]...
      this.sign = signOrHuge as number;
      this.array = array;
      this.normalize();
    }
  }

  // Normalize properties
  public normalize() {
    if (this.array.length > HugeNumber.MAX_ARRAY_LENGTH) {
      throw new Error("exceeded max array length");
    }

    // Handle small second arguments
    // e.g. 10 -> 2 -> 2 can be simplified to 10 -> 10
    // Currently have yet to implement this for arrays with length of 3+
    while (
      this.array.length === 2 &&
      this.array[0] < inverseArrow(10, Number.MAX_VALUE, this.array[1]) + 1 &&
      this.array[1] > 1
    ) {
      this.array[0] = arrow(10, this.array[0] - 1, this.array[1]);
      this.array[1] = this.array[1] - 1;
    }

    // Cut off at the last 1
    if (this.array.includes(1)) {
      this.array = this.array.slice(0, this.array.indexOf(1));
    }

    // Empty arrays have 1 added back (to save checks in arithmetic operators)
    if (!this.array.length) {
      this.array.push(1);
    }
  }

  // Clone
  public clone() {
    return new HugeNumber(this.sign, this.array);
  }

  // Absolute value
  public abs() {
    return new HugeNumber(1, this.array);
  }

  // Negete
  public neg() {
    return new HugeNumber(-this.sign, this.array);
  }

  // Add
  public add(other: HugeNumber): HugeNumber;
  public add(other: string): HugeNumber;
  public add(other: number): HugeNumber;
  public add(other: HugeNumber | string | number): HugeNumber {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    if (this.sign === -1 && other.sign === -1) {
      // Handle negative numbers
      return this.neg().add(other.neg()).neg();
    } else if (this.sign === -1 && other.sign === 1) {
      return this.neg().sub(other).neg();
    } else if (this.sign === 1 && other.sign === -1) {
      return this.sub(other.neg());
    } else if (this.array.length === 1 && other.array.length === 1) {
      // Both numbers are expressed as log base 10 of their value
      // Add via gaussian logarihm
      var gaussianLog = Math.log10(
        1 + Math.pow(10, other.array[0] - this.array[0]),
      );
      if (!Number.isFinite(gaussianLog)) {
        return other;
      } else {
        return new HugeNumber(1, [this.array[0] + gaussianLog]);
      }
    } else {
      // Approximate as max for large inputs
      return this.max(other);
    }
  }

  // Subtract
  public sub(other: HugeNumber): HugeNumber;
  public sub(other: string): HugeNumber;
  public sub(other: number): HugeNumber;
  public sub(other: HugeNumber | string | number): HugeNumber {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    if (this.lt(other)) {
      // Swap if this < other to make gaussian logarithm computations easier
      return other.sub(this).neg();
    } else if (this.eq(other)) {
      // Return 0 if this === other
      return HugeNumber.ZERO;
    } else if (this.sign === -1 && other.sign === -1) {
      // Handle negative numbers
      return this.neg().sub(other.neg()).neg();
    } else if (this.sign === -1 && other.sign === 1) {
      return this.neg().add(other).neg();
    } else if (this.sign === 1 && other.sign === -1) {
      return this.add(other.neg());
    } else if (this.array.length === 1 && other.array.length === 1) {
      // Both numbers are expressed as log base 10 of their value
      // Subtract via gaussian logarihm
      var gaussianLog = Math.log10(
        Math.abs(1 - Math.pow(10, other.array[0] - this.array[0])),
      );

      if (!Number.isFinite(gaussianLog)) {
        return other;
      } else {
        return new HugeNumber(1, [this.array[0] + gaussianLog]);
      }
    } else {
      // Approximate as max for large inputs
      return this.max(other);
    }
  }

  // Multiply
  public mul(other: HugeNumber): HugeNumber;
  public mul(other: string): HugeNumber;
  public mul(other: number): HugeNumber;
  public mul(other: HugeNumber | string | number): HugeNumber {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    // Use property that 10^x * 10^y = 10^(x + y)
    if (this.array.length === 1 && other.array.length === 1) {
      return new HugeNumber(this.sign * other.sign, [
        this.array[0] + other.array[0],
      ]);
    } else {
      return new HugeNumber(
        this.sign * other.sign,
        this.abs().log10().add(other.abs().log10()).exp10().array,
      );
    }
  }

  // Divide
  public div(other: HugeNumber): HugeNumber;
  public div(other: string): HugeNumber;
  public div(other: number): HugeNumber;
  public div(other: HugeNumber | string | number): HugeNumber {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    // Use property that 10^x / 10^y = 10^(x - y)
    if (this.array.length === 1 && other.array.length === 1) {
      return new HugeNumber(this.sign * other.sign, [
        this.array[0] - other.array[0],
      ]);
    } else {
      return new HugeNumber(
        this.sign * other.sign,
        this.abs().log10().sub(other.abs().log10()).exp10().array,
      );
    }
  }

  // Modulo
  public mod(other: HugeNumber): HugeNumber;
  public mod(other: string): HugeNumber;
  public mod(other: number): HugeNumber;
  public mod(other: HugeNumber | string | number): HugeNumber {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    // Use property that x % y = x - (floor(x / y) * y)
    return this.abs().sub(this.abs().div(other).floor().mul(other));
  }

  // Exponential base 10
  public exp10(): HugeNumber {
    var n = this.toNumber();
    if (this.sign === -1) {
      // Handle negative numbers
      return new HugeNumber(1).div(this.neg().exp10());
    } else if (Number.isFinite(n)) {
      // This is trivial because 10 -> x = 10^x in chained arrow
      return new HugeNumber(1, [n]);
    } else if (this.array.length === 1) {
      return new HugeNumber(1, [inverseArrow(10, this.array[0], 2) + 2, 2]);
    } else if (this.array.length === 2 && this.array[1] === 2) {
      return new HugeNumber(1, [this.array[0] + 1, 2]);
    } else {
      return this;
    }
  }

  // Exponential base e
  public exp() {
    return HugeNumber.E.pow(this);
  }

  // Power
  public pow(other: HugeNumber): HugeNumber;
  public pow(other: string): HugeNumber;
  public pow(other: number): HugeNumber;
  public pow(other: HugeNumber | string | number): HugeNumber {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    if (other.sign === -1) {
      // Handle negative exponents
      return HugeNumber.ONE.div(this.pow(other.neg()));
    } else if (this.sign === -1 && other.mod(1).ne(0)) {
      // Complex numbers (fractional power with negative base) unsupported, return NaN here
      return new HugeNumber(NaN);
    } else if (this.sign === -1 && other.mod(2).round().eq(1)) {
      // Flip sign for odd power with negative base
      return other.mul(this.log10()).exp10().neg();
    } else {
      // Just use change of base formula with exp10 and log10
      return other.mul(this.log10()).exp10();
    }
  }

  // Square root
  public sqrt() {
    return this.pow(0.5);
  }

  // Cube root
  public cbrt() {
    return this.pow(1 / 3);
  }

  // Logarithm base 10
  public log10() {
    if (this.array.length === 1) {
      return new HugeNumber(this.array[0]);
    } else if (this.array.length === 2 && this.array[1] === 2) {
      return new HugeNumber(1, [this.array[0] - 1, 2]);
    } else {
      return this;
    }
  }

  // Logarithm base e
  public log() {
    return this.logb(Math.E);
  }

  // Logarithm arbitrary base
  public logb(base: HugeNumber): HugeNumber;
  public logb(base: string): HugeNumber;
  public logb(base: number): HugeNumber;
  public logb(base: HugeNumber | string | number): HugeNumber {
    if (!(base instanceof HugeNumber)) {
      base = new HugeNumber(base as any);
    }

    return this.log10().div(base.log10());
  }

  // Floor
  public floor() {
    var n = this.toNumber();
    if (Number.isFinite(n)) {
      return new HugeNumber(Math.floor(n));
    } else {
      return this;
    }
  }

  // Ceilling
  public ceil() {
    var n = this.toNumber();
    if (Number.isFinite(n)) {
      return new HugeNumber(Math.ceil(n));
    } else {
      return this;
    }
  }

  // Round to nearest integer
  public round() {
    var n = this.toNumber();
    if (Number.isFinite(n)) {
      return new HugeNumber(Math.round(n));
    } else {
      return this;
    }
  }

  // Sine
  public sin() {
    var n = this.toNumber();
    if (Number.isFinite(n)) {
      return new HugeNumber(Math.sin(n));
    } else {
      // If the number is beyond 2^1024, we've lost too much precision to compute sine anyway, so just return NaN
      // Same thing for other trignometric functions
      return new HugeNumber(NaN);
    }
  }

  // Cosine
  public cos() {
    var n = this.toNumber();
    if (Number.isFinite(n)) {
      return new HugeNumber(Math.cos(n));
    } else {
      return new HugeNumber(NaN);
    }
  }

  // Tangent
  public tan() {
    var n = this.toNumber();
    if (Number.isFinite(n)) {
      return new HugeNumber(Math.tan(n));
    } else {
      return new HugeNumber(NaN);
    }
  }

  // Inverse sine
  public asin() {
    var n = this.toNumber();
    if (Number.isFinite(n)) {
      return new HugeNumber(Math.asin(n));
    } else {
      return new HugeNumber(NaN);
    }
  }

  // Inverse cosine
  public acos() {
    var n = this.toNumber();
    if (Number.isFinite(n)) {
      return new HugeNumber(Math.acos(n));
    } else {
      return new HugeNumber(NaN);
    }
  }

  // Inverse tangent
  public atan() {
    var n = this.toNumber();
    if (Number.isFinite(n)) {
      return new HugeNumber(Math.atan(n));
    } else {
      return new HugeNumber(NaN);
    }
  }

  // // Tetrate (using linear approximation for non-integers)
  // tetr(other) {
  //     if (!(other instanceof HugeNumber)) {
  //         other = new HugeNumber(other);
  //     }

  //     if(other.lt(-2)) {
  //         return HugeNumber.NaN.clone();
  //     } else if(other.le(-1)) {
  //         return this.tetr(other.logb(this)).add(1);
  //     } else if(other.le(0)) {
  //         // In linear approximation, a^^x = x + 1 if -1 <= x <= 0
  //         return other.add(1);
  //     } else if(other.lt(10000)) {
  //         // Use iterative formula for heights < 10000
  //         var n = other.toNumber();
  //         var result = this.pow(n % 1);
  //         for(var i = 0; i < n; i++) {
  //             result = ;

  //         }
  //         return this.pow(this.tetr(other.sub(1)));
  //     } else {
  //     }
  // }

  // Compare (-1 if less, 0 if equal, 1 if greater)
  public cmp(other: HugeNumber): 0 | 1 | -1;
  public cmp(other: string): 0 | 1 | -1;
  public cmp(other: number): 0 | 1 | -1;
  public cmp(other: HugeNumber | string | number): 0 | 1 | -1 {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    if (this.sign === -1 && other.sign === -1) {
      // Handle negative numbers
      return -this.neg().cmp(other.neg()) as 0 | 1 | -1;
    } else if (this.sign === -1 && other.sign === 1) {
      return -1;
    } else if (this.sign === 1 && other.sign === -1) {
      return 1;
    } else if (this.array.length < other.array.length) {
      return -1;
    } else if (this.array.length > other.array.length) {
      return 1;
    } else {
      for (var i = this.array.length - 1; i >= 0; i--) {
        if (this.array[i] > other.array[i]) {
          return 1;
        } else if (this.array[i] < other.array[i]) {
          return -1;
        }
      }
      return 0;
    }
  }

  // Equal to
  public eq(other: HugeNumber): boolean;
  public eq(other: string): boolean;
  public eq(other: number): boolean;
  public eq(other: HugeNumber | string | number): boolean {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    return this.cmp(other) === 0;
  }

  // Not equal to
  public ne(other: HugeNumber): boolean;
  public ne(other: string): boolean;
  public ne(other: number): boolean;
  public ne(other: HugeNumber | string | number): boolean {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    return this.cmp(other) !== 0;
  }

  // Less than
  public lt(other: HugeNumber): boolean;
  public lt(other: string): boolean;
  public lt(other: number): boolean;
  public lt(other: HugeNumber | string | number): boolean {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    return this.cmp(other) < 0;
  }

  // Less than or equal
  public le(other: HugeNumber): boolean;
  public le(other: string): boolean;
  public le(other: number): boolean;
  public le(other: HugeNumber | string | number): boolean {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    return this.cmp(other) <= 0;
  }

  // Greater than
  public gt(other: HugeNumber): boolean;
  public gt(other: string): boolean;
  public gt(other: number): boolean;
  public gt(other: HugeNumber | string | number): boolean {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    return this.cmp(other) > 0;
  }

  // Greater than or equal
  public ge(other: HugeNumber): boolean;
  public ge(other: string): boolean;
  public ge(other: number): boolean;
  public ge(other: HugeNumber | string | number): boolean {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    return this.cmp(other) >= 0;
  }

  // Minimum
  public min(other: HugeNumber): HugeNumber;
  public min(other: string): HugeNumber;
  public min(other: number): HugeNumber;
  public min(other: HugeNumber | string | number): HugeNumber {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    return this.gt(other) ? this : other;
  }

  // Maximum
  public max(other: HugeNumber): HugeNumber;
  public max(other: string): HugeNumber;
  public max(other: number): HugeNumber;
  public max(other: HugeNumber | string | number): HugeNumber {
    if (!(other instanceof HugeNumber)) {
      other = new HugeNumber(other as any);
    }

    return this.gt(other) ? this : other;
  }

  // Convert to standard number
  public toNumber() {
    if (this.array.length <= 2) {
      try {
        // Chained arrow notation for 3 arguments is same as arrow notation
        return arrow(10, this.array[0], this.array[1] || 1);
      } catch (e) {
        // If there is stack overflow the number is probably too large anyway
        return this.sign * Infinity;
      }
    }

    return this.sign * Infinity;
  }

  // Convert to string
  public toString(): string {
    var n = this.toNumber();
    if (this.sign === -1) {
      return "-" + this.neg().toString();
    } else if (isFiniteAndNonzero(n) || this.eq(0) || this.eq(Infinity)) {
      return this.toNumber().toString();
    } else if (this.lt(new HugeNumber(1, [7, 2]))) {
      return this.toExponential();
    } else if (this.array.length === 2 && this.array[1] < 6) {
      return this.toArrow();
    } else {
      return this.toChainedArrow();
    }
  }

  // Convert to scientific notation string
  public toExponential() {
    var logarithm = this.log10();
    var logNum = logarithm.toNumber();
    var plusPart = logarithm.sign === 1 ? "+" : "-";
    if (Number.isFinite(logNum)) {
      return (
        Math.pow(10, logNum - Math.floor(logNum)).toString() +
        "e" +
        plusPart +
        Math.floor(logNum).toString()
      );
    } else {
      return (
        logarithm.sub(logarithm.floor()).exp10().toString() +
        "e" +
        plusPart +
        logarithm.floor().toString()
      );
    }
  }

  // Convert to arrow notation string
  public toArrow() {
    return "10" + "^".repeat(this.array[1]) + this.array[0];
  }

  // Convert to chained arrow notation string
  public toChainedArrow() {
    return "10 -> " + this.array.join(" -> ");
  }
}

export { HugeNumber };
