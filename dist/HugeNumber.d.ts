declare class HugeNumber {
    static readonly ZERO: HugeNumber;
    static readonly ONE: HugeNumber;
    static readonly E: HugeNumber;
    static readonly PI: HugeNumber;
    static readonly TEN: HugeNumber;
    static readonly MAX_ARRAY_LENGTH = 1000;
    sign: number;
    array: number[];
    constructor(sign: string);
    constructor(sign: number, array?: number[]);
    constructor(huge: HugeNumber);
    normalize(): void;
    clone(): HugeNumber;
    abs(): HugeNumber;
    neg(): HugeNumber;
    add(other: HugeNumber): HugeNumber;
    add(other: string): HugeNumber;
    add(other: number): HugeNumber;
    sub(other: HugeNumber): HugeNumber;
    sub(other: string): HugeNumber;
    sub(other: number): HugeNumber;
    mul(other: HugeNumber): HugeNumber;
    mul(other: string): HugeNumber;
    mul(other: number): HugeNumber;
    div(other: HugeNumber): HugeNumber;
    div(other: string): HugeNumber;
    div(other: number): HugeNumber;
    mod(other: HugeNumber): HugeNumber;
    mod(other: string): HugeNumber;
    mod(other: number): HugeNumber;
    exp10(): HugeNumber;
    exp(): HugeNumber;
    pow(other: HugeNumber): HugeNumber;
    pow(other: string): HugeNumber;
    pow(other: number): HugeNumber;
    sqrt(): HugeNumber;
    cbrt(): HugeNumber;
    log10(): HugeNumber;
    log(): HugeNumber;
    logb(base: HugeNumber): HugeNumber;
    logb(base: string): HugeNumber;
    logb(base: number): HugeNumber;
    floor(): HugeNumber;
    ceil(): HugeNumber;
    round(): HugeNumber;
    sin(): HugeNumber;
    cos(): HugeNumber;
    tan(): HugeNumber;
    asin(): HugeNumber;
    acos(): HugeNumber;
    atan(): HugeNumber;
    cmp(other: HugeNumber): 0 | 1 | -1;
    cmp(other: string): 0 | 1 | -1;
    cmp(other: number): 0 | 1 | -1;
    eq(other: HugeNumber): boolean;
    eq(other: string): boolean;
    eq(other: number): boolean;
    ne(other: HugeNumber): boolean;
    ne(other: string): boolean;
    ne(other: number): boolean;
    lt(other: HugeNumber): boolean;
    lt(other: string): boolean;
    lt(other: number): boolean;
    le(other: HugeNumber): boolean;
    le(other: string): boolean;
    le(other: number): boolean;
    gt(other: HugeNumber): boolean;
    gt(other: string): boolean;
    gt(other: number): boolean;
    ge(other: HugeNumber): boolean;
    ge(other: string): boolean;
    ge(other: number): boolean;
    min(other: HugeNumber): HugeNumber;
    min(other: string): HugeNumber;
    min(other: number): HugeNumber;
    max(other: HugeNumber): HugeNumber;
    max(other: string): HugeNumber;
    max(other: number): HugeNumber;
    toNumber(): number;
    toString(): string;
    toExponential(): string;
    toArrow(): string;
    toChainedArrow(): string;
}
export { HugeNumber };
//# sourceMappingURL=HugeNumber.d.ts.map