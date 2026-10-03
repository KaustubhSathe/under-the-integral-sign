---
title: "Divisibility and modular arithmetic: the working toolkit"
topic: number-theory
topics: [number-theory]
tags: [crt, lte, quadratic-residues, modular-arithmetic, cheatsheet, standard-toolkit]
section: cheatsheet
level: standard
summary: "A one-page reference: order facts, CRT, lifting the exponent, quadratic residues, and the standard small-modulus table — plus which tool to reach for when."
statement: "Collects the divisibility facts used constantly in olympiad number theory, with the precise hypotheses each one needs."
related: [fermat-little-theorem-and-orders, divisors-of-2m-plus-1]
status: polished
date: 2025-01-30
---

## Order and cyclicity facts

For $\gcd(a,n)=1$, let $r=\operatorname{ord}_{n}(a)$ be the least $k>0$ with
$a^{k}\equiv1\pmod n$.

$$
a^{m}\equiv1\pmod n \iff r\mid m,
\qquad
r\mid\varphi(n),
\qquad
\operatorname{ord}_{n}(a^{k})=\frac{r}{\gcd(k,r)} .
$$

If $a^{m}\equiv-1\pmod n$ then $r\mid2m$ and $r\nmid m$; conversely those two
conditions give $a^{m}\equiv-1$ only when $r$ is exactly $2$ times an odd divisor
structure — in general you must compute $a^{m}$, not just its order.

**Cyclicity.** $(\mathbb{Z}/n)^{\times}$ is cyclic exactly for
$n\in\{1,2,4,p^{k},2p^{k}\}$ with $p$ an odd prime. So primitive roots exist for
those $n$ and not others — $n=8$ and $n=2^{k}$ ($k\ge3$) have no primitive root.

## Chinese remainder theorem

For pairwise coprime $m_{1},\dots,m_{k}$, the system $x\equiv a_{i}\pmod{m_{i}}$
has a unique solution modulo $M=m_{1}\cdots m_{k}$. Two consequences used
constantly:

- **Multiplicativity of $\varphi$:** $\varphi(mn)=\varphi(m)\varphi(n)$ for
  $\gcd(m,n)=1$.
- **Order lcm rule:** for $\gcd(a,mn)=1$ with $\gcd(m,n)=1$,

$$
\operatorname{ord}_{mn}(a)=\operatorname{lcm}\!\left(\operatorname{ord}_{m}(a),\operatorname{ord}_{n}(a)\right).
$$

## Lifting the exponent (LTE)

All statements need $p$ an odd prime, $p\mid x-y$, and $p\nmid xy$:

$$
v_{p}(x^{n}-y^{n})=v_{p}(x-y)+v_{p}(n)
\qquad\text{for all } n\ge1 .
$$

For $p=2$, the clean case is: if $n$ is even and $x,y$ are odd, then

$$
v_{2}(x^{n}-y^{n})=v_{2}(x-y)+v_{2}(x+y)+v_{2}(n)-1 .
$$

**The plus-sign versions are not the same statement.** For $n$ **odd** and
$p\nmid xy$ with $p\mid x+y$:

$$
v_{p}(x^{n}+y^{n})=v_{p}(x+y)+v_{p}(n) .
$$

Applied with $x=2$, $y=1$, $p=3$:
$v_{3}(2^{n}+1)=v_{3}(3)+v_{3}(n)=1+v_{3}(n)$ for odd $n$ — the fact used in the
$2^{m}+1$ problem. **Watch the parity hypothesis $n$ odd: for even $n$ the
formula is false.**

## Quadratic residues

For odd prime $p$ and $p\nmid a$, the Legendre symbol is

$$
\left(\frac{a}{p}\right)=
\begin{cases}\ \ 1,& a \text{ is a nonzero square mod } p,\\ -1,&\text{otherwise,}\end{cases}
\qquad
\left(\frac{a}{p}\right)\equiv a^{(p-1)/2}\pmod p .
$$

Euler's criterion is that congruence. Consequences worth memorising:

$$
\left(\frac{-1}{p}\right)=(-1)^{(p-1)/2},
\qquad
\left(\frac{2}{p}\right)=(-1)^{(p^{2}-1)/8},
\qquad
\left(\frac{a}{p}\right)\left(\frac{b}{p}\right)=\left(\frac{ab}{p}\right).
$$

So $-1$ is a square mod $p$ if and only if $p\equiv1\pmod4$, and $2$ is a square
mod $p$ if and only if $p\equiv\pm1\pmod8$. Quadratic reciprocity: for distinct
odd primes $p,q$,

$$
\left(\frac{p}{q}\right)\left(\frac{q}{p}\right)=(-1)^{\frac{p-1}{2}\cdot\frac{q-1}{2}} .
$$

## Small-modulus reference table

| modulus | facts |
|---|---|
| $3$ | $2\equiv-1$; $2^{n}\equiv(-1)^{n}$, so $3\mid2^{n}+1$ iff $n$ odd |
| $4$ | squares are $0,1$; $x^{2}\equiv0,1$; $2^{n}\equiv0$ for $n\ge2$ |
| $5$ | $\operatorname{ord}_{5}(2)=4$; powers of $2$: $2,4,3,1$; $5\mid2^{n}+1$ iff $n\equiv2\pmod4$ |
| $7$ | $\operatorname{ord}_{7}(2)=3$; powers of $2$: $2,4,1$; so $7\nmid2^{n}+1$ always |
| $8$ | odd squares are $1$; $n^{2}\equiv0,1,4\pmod8$ |
| $9$ | $\operatorname{ord}_{9}(2)=6$; powers of $2$: $2,4,8,7,5,1$ |
| $11$ | $\operatorname{ord}_{11}(2)=10$, so $2$ is a primitive root; $11\mid2^{n}+1$ iff $n\equiv5\pmod{10}$ |
| $13$ | $\operatorname{ord}_{13}(2)=12$, primitive root |
| $17$ | $\operatorname{ord}_{17}(2)=8$; $17\mid2^{n}+1$ iff $n\equiv4\pmod8$ |

The pattern in the last column is the one to internalise: **the set of $n$ with
$p\mid2^{n}+1$ is either empty or a single congruence class modulo
$\operatorname{ord}_{p}(2)/2$ when $-1$ is a power of $2$, and empty otherwise.**

## Which tool when

| you see… | reach for… |
|---|---|
| $p\mid a^{n}\pm1$, want to constrain $p$ | multiplicative order (Move 3 of the Fermat note) |
| "exactly how many factors of $p$" | lifting the exponent |
| last $k$ digits of $a^{n}$ | Euler/Fermat to reduce the exponent, then square-and-multiply |
| system of simultaneous congruences | CRT |
| "is $a$ a square mod $p$?" | Legendre symbol + Euler's criterion |
| sum of two squares / representability | Fermat's two-squares theorem, Gaussian integers |
| $x^{2}\equiv a\pmod{p^{k}}$ | Hensel lifting |

## Common failure modes

1. **Dropping coprimality.** Euler, orders, and inverses all need
   $\gcd(a,n)=1$. Check it first, every time.
2. **Using the odd-$n$ LTE formula with even $n$.** The plus-sign formula
   $v_{p}(x^{n}+y^{n})=v_{p}(x+y)+v_{p}(n)$ requires $n$ odd. For even $n$, use
   $x^{n}+y^{n}$ with $n=2m$: then $x^{n}+y^{n}=(x^{m})^{2}+(y^{m})^{2}$, which is
   a *sum of squares* and has a different factorisation theory entirely.
3. **Assuming a primitive root exists.** Only for the moduli listed above.
4. **Confusing $r\mid2m$ with $r=2m$.** From $a^{m}\equiv-1$ you get
   $r\mid2m$, $r\nmid m$; the exact value needs the $2$-adic valuation of $m$.
5. **Using reciprocity without checking the hypotheses** — distinct odd primes;
   the prime $2$ needs the separate supplement $(\frac2p)$.

## References

- Ireland & Rosen, *A Classical Introduction to Modern Number Theory*.
- Hardy & Wright, *An Introduction to the Theory of Numbers*, chapters on orders
  and quadratic residues.

## Related vault entries

- Fermat's little theorem and orders — the theory behind the first table.
- Divisors of $2^{m}+1$ — a full worked problem using orders and LTE together.
