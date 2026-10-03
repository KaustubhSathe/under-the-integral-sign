---
title: "Fermat's little theorem and the multiplicative order"
topic: number-theory
topics: [number-theory, abstract-algebra]
tags: [fermat, euler-theorem, multiplicative-order, primitive-roots, standard-toolkit]
section: theorem
level: standard
summary: "Fermat, Euler, and the order of an element — plus the three moves (order divides, order of a power, primitive roots) that turn divisibility questions into congruences."
statement: "For p prime and p ∤ a: a^(p−1) ≡ 1 (mod p). More generally for gcd(a,n)=1: a^(φ(n)) ≡ 1 (mod n). The order ord_n(a) is the least k>0 with a^k ≡ 1, and ord_n(a) | φ(n)."
related: [divisors-of-2m-plus-1, divisibility-and-modular-toolkit]
status: polished
date: 2025-01-30
---

## Statement

**Fermat's little theorem.** Let $p$ be prime and $a$ an integer with
$p\nmid a$. Then

$$
a^{p-1}\equiv1\pmod p .
$$

Equivalently $a^{p}\equiv a\pmod p$ for *every* integer $a$ (the case $p\mid a$
being trivial).

**Euler's theorem.** Let $n\ge1$ and $\gcd(a,n)=1$. Then

$$
a^{\varphi(n)}\equiv1\pmod n,
$$

where $\varphi$ is Euler's totient. Fermat is the case $n=p$, where
$\varphi(p)=p-1$.

**Multiplicative order.** For $\gcd(a,n)=1$, the *order of $a$ modulo $n$* is the
least positive integer $k$ with

$$
a^{k}\equiv1\pmod n .
$$

It exists by Euler's theorem, and

$$
\operatorname{ord}_{n}(a)\ \big|\ \varphi(n).
$$

If $\operatorname{ord}_{n}(a)=\varphi(n)$, then $a$ is a **primitive root**
modulo $n$.

## Proof

**Euler's theorem.** The units $(\mathbb{Z}/n)^{\times}$ form a group of order
$\varphi(n)$ under multiplication. The element $a$ has finite order $k$; by
Lagrange's theorem $k$ divides the group order, so $a^{\varphi(n)}=a^{k\cdot(\varphi(n)/k)}=1$.
$\square$

This group-theoretic proof is short but hides Lagrange's theorem, which is itself
a counting argument. The **elementary** proof (no group theory) is worth having:

*Proof.* Let $r_{1},\dots,r_{\varphi(n)}$ be the residues in $\{1,\dots,n\}$
coprime to $n$. Since $\gcd(a,n)=1$, multiplication by $a$ permutes this set: the
products $ar_{1},\dots,ar_{\varphi(n)}$ are again a complete list of the residues
coprime to $n$ (injectivity: $ar_{i}\equiv ar_{j}$ implies
$r_{i}\equiv r_{j}$ after multiplying by $a^{-1}$). Therefore the two products are
congruent as products:

$$
\prod_{i}(ar_{i})\equiv\prod_{i}r_{i}\pmod n
\quad\Longrightarrow\quad
a^{\varphi(n)}\prod_{i}r_{i}\equiv\prod_{i}r_{i}\pmod n .
$$

Since $\gcd\!\left(\prod r_{i},n\right)=1$, cancel it:

$$
a^{\varphi(n)}\equiv1\pmod n . \qquad\square
$$

Note how the cancellation at the end requires coprimality — this is why the
theorem needs $\gcd(a,n)=1$ and fails otherwise (e.g. $2^{2}\equiv0\not\equiv1
\pmod 4$).

## The three moves that solve problems

**Move 1: order divides a known exponent.** If $a^{m}\equiv1$ then
$\operatorname{ord}(a)\mid m$. This is the workhorse: it converts "$a^{m}\equiv1$"
into a divisibility statement about the order, and then Lagrange/Euler
($\operatorname{ord}\mid\varphi(n)$) converts that into a congruence on $n$.

**Move 2: order of a power.** For $k\ge1$,

$$
\operatorname{ord}_{n}(a^{k})=\frac{\operatorname{ord}_{n}(a)}{\gcd\!\left(k,\operatorname{ord}_{n}(a)\right)} .
$$

Useful for showing that a specific power of $a$ has a specific order, and for
counting elements of each order in a cyclic group.

**Move 3: $a^{n}\equiv-1$ pins the order exactly.** If $a^{m}\equiv-1\pmod n$
then $a^{2m}\equiv1$ and $a^{m}\not\equiv1$, so $\operatorname{ord}_{n}(a)$
divides $2m$ but not $m$. Combined with $\operatorname{ord}\mid\varphi(n)$, this
traps $n$ modulo a divisor of $2m$. **This is the single most useful application
for competition problems about divisors of $a^{m}\pm1$.**

## Worked micro-examples

**1. Compute the last two digits of $3^{2025}$.** Take $n=100$,
$\varphi(100)=100\cdot\frac12\cdot\frac45=40$, and $\gcd(3,100)=1$. Reducing the
exponent modulo $40$:

$$
3^{2025}=3^{40\cdot50+25}\equiv3^{25}\pmod{100}.
$$

Now reduce $3^{25}$ with a short square-and-multiply, keeping only two digits:

$$
3^{2}=9,\quad 3^{4}=81,\quad 3^{8}=81^{2}=6561\equiv61,\quad
3^{16}=61^{2}=3721\equiv21 .
$$

Hence

$$
3^{25}=3^{16}\cdot3^{8}\cdot3^{1}\equiv21\cdot61\cdot3=3843\equiv43\pmod{100}.
$$

So $3^{2025}$ ends in $43$. Note the reduction was legitimate because
$\gcd(3,100)=1$; the exponent $2025$ dropped to $25$ with one application of
Euler, and the rest is arithmetic on two-digit numbers.

**2. $\operatorname{ord}_{7}(2)$.** Powers of $2$ modulo $7$:
$2^{1}=2$, $2^{2}=4$, $2^{3}=8\equiv1$ — so the order is $3$, and indeed
$3\mid\varphi(7)=6$. Consequently $2^{n}\equiv1\pmod7$ if and only if $3\mid n$.
Also $2^{n}\equiv-1\equiv6$ is **impossible** modulo $7$, since the powers of $2$
only ever hit $1,2,4$. Therefore

$$
7\nmid2^{n}+1\qquad\text{for every } n\ge1 .
$$

**This is exactly the pattern used to rule out prime divisors in the $2^{m}+1$
problem**: find the order, list the powers, and check whether $-1$ appears.

**3. Primitive roots mod 7.** $\varphi(7)=6$. From the powers
$3^{1}=3,3^{2}=2,3^{3}=6,3^{4}=4,3^{5}=5,3^{6}=1$, the order of $3$ is $6$, so
$3$ is a primitive root mod $7$. The primitive roots mod $7$ are the
$3^{k}$ with $\gcd(k,6)=1$, i.e. $k\in\{1,5\}$, giving $3$ and $5$ — matching
Move 2.

## Why it works, and when to reach for it

Fermat/Euler is a *reduction* tool: it lets you replace a huge exponent by its
residue modulo $\varphi(n)$, at the cost of requiring coprimality. The order
refinement is a *structural* tool: it tells you the exact period of $a$, which is
what you need when the question is "for which $n$ does $a^{n}\equiv\pm1$?"

**Reach for it when** the problem involves $a^{n}\bmod m$ with large $n$, or
divisibility of $a^{n}\pm1$ by primes, or "prove there are infinitely many primes
$\equiv1\pmod m$" (via orders of prime divisors of $2^{m}-1$).

**Do not reach for it when** $\gcd(a,n)\neq1$: then only the order of $a$ inside
the monoid of non-units is defined, and Euler's theorem simply fails. Also, for
$n$ with no primitive root (e.g. $n=8$, or $n=2^{k}$ for $k\ge3$), do not assume
a primitive root exists — the group $(\mathbb{Z}/n)^{\times}$ is not always
cyclic.

## Common failure modes

1. **Applying Euler without coprimality.** $a^{\varphi(n)}\equiv1$ needs
   $\gcd(a,n)=1$. The "last digit of $2^{n}$" style problems have
   $\gcd(2,10)\neq1$ and need a separate argument (they are eventually periodic,
   not purely periodic).
2. **Confusing $\operatorname{ord}$ with $\varphi$.** The order divides
   $\varphi$, but is usually smaller. Assuming $a$ has order $\varphi(n)$ is
   assuming a primitive root.
3. **Using Fermat with a composite modulus.** $a^{p-1}\equiv1\pmod p$ needs $p$
   prime. For composite $n$, use $\varphi(n)$ (or the Carmichael function
   $\lambda(n)$ for the sharp exponent).
4. **Neglecting the direction in Move 3.** From $a^{m}\equiv-1$ you get
   $\operatorname{ord}\mid2m$ and $\operatorname{ord}\nmid m$ — *not*
   $\operatorname{ord}=2m$ in general. The correct general form involves the
   $2$-adic valuation of $m$; see the $2^{m}+1$ entry for a worked case where the
   order is genuinely smaller than $2m$.

## References

- Any number theory text (Hardy & Wright, Ireland & Rosen) for Euler/Lagrange.
- The Carmichael function for the sharpened exponent when $\varphi$ is not tight.

## Related vault entries

- Divisors of $2^{m}+1$ — Move 3 applied systematically to a Putnam problem.
- The modular arithmetic toolkit for CRT, lifting the exponent, and quadratic
  residues.
