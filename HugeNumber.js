var HugeNumber = (function () {
    function isFiniteAndNonzero(x) {
        return Number.isFinite(x) && x;
    }

    // Arrow notation with standard numbers
    function arrow(a, x, y) {
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
    function inverseArrow(a, x, y) {
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
        constructor(sign, array) {
            if (array === undefined) {
                var param = sign;
                if (typeof param === "number") {
                    // Convert from standard number
                    this.sign = (param < 0 || Object.is(param, -0)) ? -1 : 1;
                    this.array = [Math.log10(Math.abs(param))];
                } else if (typeof param === "string") {
                    param = param.toLowerCase();
                    this.sign = 1;

                    if (param[0] === "-") {
                        // Handle negative number strings
                        this.sign = -1;
                        param = param.slice(1);
                    }

                    // Convert from string
                    // Currently can include scientific notation (even nested exponent like "1e1e1e1e500") but not arrows
                    var parts = param.split("e").map(Number);
                    var temp = new HugeNumber(Number(parts[parts.length - 1]));
                    for (var i = parts.length - 2; i >= 0; i--) {
                        temp = new HugeNumber(Number(parts[i])).mul(temp.exp10());
                    }
                    this.array = temp.array;
                } else if (param instanceof HugeNumber) {
                    // Convert from other HugeNumber object
                    this.sign = param.sign;
                    this.array = param.array;
                }
            } else {
                // Convert from sign and chained arrow notation array (this is the internal representation)
                // Value = sign * 10 -> array[0] -> array[1] -> array[2] -> array[3]...
                this.sign = sign;
                this.array = array;
                this.normalize();
            }
        }

        // Normalize properties
        normalize() {
            if(this.array.length > HugeNumber.MAX_ARRAY_LENGTH) {
                throw new Error("exceeded max array length");
            }

            // Handle small second arguments
            // e.g. 10 -> 2 -> 2 can be simplified to 10 -> 10
            // Currently have yet to implement this for arrays with length of 3+ 
            while (this.array.length === 2 && this.array[0] < inverseArrow(10, Number.MAX_VALUE, this.array[1]) + 1 && this.array[1] > 1) {
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
        clone() {
            return new HugeNumber(this.sign, this.array);
        }

        // Absolute value
        abs() {
            return new HugeNumber(1, this.array);
        }

        // Negate
        neg() {
            return new HugeNumber(-this.sign, this.array);
        }

        // Add
        add(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
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
                var gaussianLog = Math.log10(1 + Math.pow(10, other.array[0] - this.array[0]));
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
        sub(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
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
                var gaussianLog = Math.log10(Math.abs(1 - Math.pow(10, other.array[0] - this.array[0])));

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
        mul(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            // Use property that 10^x * 10^y = 10^(x + y)
            if (this.array.length === 1 && other.array.length === 1) {
                return new HugeNumber(this.sign * other.sign, [this.array[0] + other.array[0]]);
            } else {
                return new HugeNumber(this.sign * other.sign, this.abs().log10().add(other.abs().log10()).exp10().array);
            }
        }

        // Divide
        div(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            // Use property that 10^x / 10^y = 10^(x - y)
            if (this.array.length === 1 && other.array.length === 1) {
                return new HugeNumber(this.sign * other.sign, [this.array[0] - other.array[0]]);
            } else {
                return new HugeNumber(this.sign * other.sign, this.abs().log10().sub(other.abs().log10()).exp10().array);
            }
        }

        // Modulo
        mod(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            // Use property that x % y = x - (floor(x / y) * y)
            return this.abs().sub(this.abs().div(other).floor().mul(other));
        }

        // Exponential base 10
        exp10() {
            var n = this.toNumber();
            if (this.s === -1) {
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
        exp() {
            return HugeNumber.E.pow(this);
        }

        // Power
        pow(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
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
        sqrt() {
            return this.pow(0.5);
        }

        // Cube root
        cbrt() {
            return this.pow(1 / 3);
        }

        // Logarithm base 10
        log10() {
            if (this.array.length === 1) {
                return new HugeNumber(this.array[0]);
            } else if (this.array.length === 2 && this.array[1] === 2) {
                return new HugeNumber(1, [this.array[0] - 1, 2]);
            } else {
                return this;
            }
        }

        // Logarithm base e
        log() {
            return this.logb(Math.E);
        }

        // Logarithm arbitrary base
        logb(base) {
            if (!(base instanceof HugeNumber)) {
                base = new HugeNumber(base);
            }

            return this.log10().div(base.log10());
        }

        // Floor
        floor() {
            var n = this.toNumber();
            if (Number.isFinite(n)) {
                return new HugeNumber(Math.floor(n));
            } else {
                return this;
            }
        }

        // Ceilling
        ceil() {
            var n = this.toNumber();
            if (Number.isFinite(n)) {
                return new HugeNumber(Math.ceil(n));
            } else {
                return this;
            }
        }

        // Round to nearest integer
        round() {
            var n = this.toNumber();
            if (Number.isFinite(n)) {
                return new HugeNumber(Math.round(n));
            } else {
                return this;
            }
        }


        // Sine
        sin() {
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
        cos() {
            var n = this.toNumber();
            if (Number.isFinite(n)) {
                return new HugeNumber(Math.cos(n));
            } else {
                return new HugeNumber(NaN);
            }
        }

        // Tangent
        tan() {
            var n = this.toNumber();
            if (Number.isFinite(n)) {
                return new HugeNumber(Math.tan(n));
            } else {
                return new HugeNumber(NaN);
            }
        }

        // Inverse sine
        asin() {
            var n = this.toNumber();
            if (Number.isFinite(n)) {
                return new HugeNumber(Math.asin(n));
            } else {
                return new HugeNumber(NaN);
            }
        }

        // Inverse cosine
        acos() {
            var n = this.toNumber();
            if (Number.isFinite(n)) {
                return new HugeNumber(Math.acos(n));
            } else {
                return new HugeNumber(NaN);
            }
        }

        // Inverse tangent
        atan() {
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
        cmp(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            if (this.sign === -1 && other.sign === -1) {
                // Handle negative numbers
                return -this.neg().cmp(other).neg;
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
        eq(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            return this.cmp(other) === 0;
        }

        // Not equal to
        ne(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            return this.cmp(other) !== 0;
        }

        // Less than
        lt(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            return this.cmp(other) < 0;
        }

        // Less than or equal
        le(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            return this.cmp(other) <= 0;
        }

        // Greater than
        gt(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            return this.cmp(other) > 0;
        }

        // Greater than or equal
        ge(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            return this.cmp(other) >= 0;
        }

        // Minimum
        min(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            return this.gt(other) ? this : other;
        }

        // Maximum
        max(other) {
            if (!(other instanceof HugeNumber)) {
                other = new HugeNumber(other);
            }

            return this.gt(other) ? this : other;
        }

        // Convert to standard number
        toNumber() {
            if (this.array.length <= 2) {
                try {
                    // Chained arrow notation for 3 arguments is same as arrow notation
                    return arrow(10, this.array[0], this.array[1] || 1);
                }
                catch (e) {
                    // If there is stack overflow the number is probably too large anyway
                    return this.sign * Infinity;
                }
            }

            return this.sign * Infinity;

        }

        // Convert to string
        toString() {
            var n = this.toNumber();
            if (this.sign === -1) {
                return "-" + this.neg().toString();
            } else if (isFiniteAndNonzero(n)
                || this.eq(0)
                || this.eq(Infinity)) {
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
        toExponential() {
            var logarithm = this.log10();
            var logNum = logarithm.toNumber();
            var plusPart = logarithm.sign === 1 ? "+" : "-";
            if (Number.isFinite(logNum)) {
                return Math.pow(10, logNum - Math.floor(logNum)).toString() + "e" + plusPart + Math.floor(logNum).toString();
            } else {
                return logarithm.sub(logarithm.floor()).exp10().toString() + "e" + plusPart + logarithm.floor().toString();
            }
        }

        // Convert to arrow notation string
        toArrow() {
            return "10" + "^".repeat(this.array[1]) + this.array[0];
        }

        // Convert to chained arrow notation string
        toChainedArrow() {
            return "10 -> " + this.array.join(" -> ");
        }
    }

    // Constants
    HugeNumber.ZERO = new HugeNumber(0);
    HugeNumber.ONE = new HugeNumber(1);
    HugeNumber.E = new HugeNumber(Math.E);
    HugeNumber.PI = new HugeNumber(Math.PI);
    HugeNumber.TEN = new HugeNumber(10);

    // Max chain length (to preevnt memory leak)
    HugeNumber.MAX_ARRAY_LENGTH = 1000;

    return HugeNumber;
})();

// Export if in node.js
if (typeof module === "object") {
    module.exports = HugeNumber;
}