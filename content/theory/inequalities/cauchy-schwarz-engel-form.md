---
title: "Cauchy–Schwarz and the Engel form"
topic: inequalities
topics: [inequalities, algebra]
tags: [cauchy-schwarz, engel-form, titu, proof-technique, standard-toolkit]
section: theorem
level: standard
summary: "Statement, proof, and the two rearrangements — Engel (Titu) form and the L2 norm form — that solve most olympiad inequality problems."
statement: "For real a_i, b_i: (Σ a_i b_i)² ≤ (Σ a_i²)(Σ b_i²), with equality iff the vectors are linearly dependent. Engel form: Σ x_i²/a_i ≥ (Σ x_i)²/(Σ a_i) for a_i > 0."
related: [acute-triangle-sine-sum, jensen-inequality-concavity]
status: polished
date: 2025-01-30
---

## Statement

**Cauchy–Schwarz.** For real numbers $a_{1},\dots,a_{n}$ and
$b_{1},\dots,b_{n}$,

$$
\left(\sum_{i=1}^{n}a_{i}b_{i}\right)^{2}
\le\left(\sum_{i=1}^{n}a_{i}^{2}\right)\left(\sum_{i=1}^{n}b_{i}^{2}\right).
$$

Equality holds if and only if the vectors $(a_{1},\dots,a_{n})$ and
$(b_{1},\dots,b_{n})$ are linearly dependent — that is, $a_{i}=\lambda b_{i}$ for
all $i$ and some fixed $\lambda$, or one vector is zero.

**Engel form (also called Titu's lemma or the Cauchy–Schwarz Engel form).** If
$a_{i}>0$ and $x_{i}$ are real, then

$$
\sum_{i=1}^{n}\frac{x_{i}^{2}}{a_{i}}\ \ge\ \frac{\left(\sum_{i=1}^{n}x_{i}\right)^{2}}{\sum_{i=1}^{n}a_{i}},
$$

with equality if and only if $x_{i}/a_{i}$ is the same for every $i$ (that is,
$x_{i}=\lambda a_{i}$).

## Proof

The short proof is the one worth remembering. For any real $t$, the quadratic

$$
q(t)=\sum_{i=1}^{n}(a_{i}t+b_{i})^{2}
=\left(\sum a_{i}^{2}\right)t^{2}+2\left(\sum a_{i}b_{i}\right)t+\left(\sum b_{i}^{2}\right)
$$

is a sum of squares, hence $q(t)\ge0$ for every $t$. A quadratic with non-negative
leading coefficient that is never negative has non-positive discriminant:

$$
4\left(\sum a_{i}b_{i}\right)^{2}-4\left(\sum a_{i}^{2}\right)\left(\sum b_{i}^{2}\right)\le0,
$$

which is exactly Cauchy–Schwarz after dividing by $4$. Equality forces $q(t)=0$
for the double root $t$, i.e. $a_{i}t+b_{i}=0$ for every $i$ — linear dependence.
$\square$

**Deriving the Engel form.** Apply Cauchy–Schwarz with

$$
a_{i}\ \rightsquigarrow\ \frac{x_{i}}{\sqrt{a_{i}}},
\qquad
b_{i}\ \rightsquigarrow\ \sqrt{a_{i}} .
$$

Then $a_{i}b_{i}=x_{i}$ and

$$
\left(\sum x_{i}\right)^{2}
\le\left(\sum\frac{x_{i}^{2}}{a_{i}}\right)\left(\sum a_{i}\right),
$$

which rearranges to the Engel form. This one-line substitution is the reason Engel
is not really a separate theorem.

## Why it works, and when to reach for it

The engine is that a **sum of squares is non-negative**. Every proof of
Cauchy–Schwarz in the literature is a variation on picking a clever non-negative
quantity; the discriminant trick above is the cleanest. The geometry is that
$\langle a,b\rangle\le\|a\|\,\|b\|$, i.e. $\cos\theta\le1$ — equality when the
vectors are parallel.

**Reach for plain Cauchy–Schwarz when** you see a product of two sums versus a
square of a sum: expressions like $\left(\sum a_{i}\right)^{2}$ against
$\sum a_{i}^{2}$, or a bound of the form "product of two quadratic means". Typical
targets: $\left(\sum a_{i}\right)^{2}\le n\sum a_{i}^{2}$, and the AM–QM bound
$\frac{1}{n}\sum a_{i}\le\sqrt{\frac{1}{n}\sum a_{i}^{2}}$.

**Reach for the Engel form when** you see a sum of *fractions* with a square or a
perfect square in the numerator: $\sum\frac{x_{i}^{2}}{a_{i}}$. The signature is a
denominator you would like to push into a single bracket on the right-hand side.
Common phrasings:

$$
\sum\frac{a^{2}}{b}\ge\frac{(a+b+c)^{2}}{a+b+c},
\qquad
\sum\frac{1}{a_{i}}\ge\frac{n^{2}}{\sum a_{i}} .
$$

The second is the most-used special case, with all $x_{i}=1$:

$$
\sum_{i=1}^{n}\frac{1}{a_{i}}\ \ge\ \frac{n^{2}}{a_{1}+\cdots+a_{n}}
\qquad(a_{i}>0).
$$

## Worked micro-examples

**1.** For $a,b,c>0$, prove $\dfrac{a}{b+c}+\dfrac{b}{c+a}+\dfrac{c}{a+b}\ge\dfrac32$
(Nesbitt). Write each term as $\frac{a^{2}}{a(b+c)}$ and apply Engel:

$$
\sum\frac{a^{2}}{a(b+c)}
\ge\frac{(a+b+c)^{2}}{a(b+c)+b(c+a)+c(a+b)}
=\frac{(a+b+c)^{2}}{2(ab+bc+ca)} .
$$

It remains to check $\frac{(a+b+c)^{2}}{2(ab+bc+ca)}\ge\frac32$, i.e.
$(a+b+c)^{2}\ge3(ab+bc+ca)$, i.e. $a^{2}+b^{2}+c^{2}\ge ab+bc+ca$ — which is
$\frac12\left[(a-b)^{2}+(b-c)^{2}+(c-a)^{2}\right]\ge0$. Done, with equality at
$a=b=c$.

**2.** For positive $a,b,c$ with $abc=1$, prove
$\frac{1}{a^{3}(b+c)}+\frac{1}{b^{3}(c+a)}+\frac{1}{c^{3}(a+b)}\ge\frac32$
(Putnam-style). Multiply numerator and denominator by $a^{2}b^{2}c^{2}=1$ to
convert the numerators into squares, then Engel; this "clear the denominators to
make squares" step is the standard entry.

## Where it fails / what it cannot do

- **Direction.** Cauchy–Schwarz gives *upper* bounds for products of sums and,
  via Engel, *lower* bounds for fraction sums. If a problem needs an upper bound
  on $\sum\frac{x_i^2}{a_i}$, Engel is useless and you want a different tool.
- **Equality cases are not always attainable.** If your constraint set does not
  contain the equality configuration ($x_i = \lambda a_i$), the bound is strict
  and probably not sharp; you may be leaving something on the table.
- **It does not see signs.** For real (not positive) $a_i$ the Engel form is
  invalid; the hypotheses $a_i>0$ matter because the proof multiplies by
  $\sqrt{a_i}$.

## Common failure modes

1. **Applying Engel to the wrong numerator.** The numerator must be a *square*.
   Writing $\frac{a}{b+c}$ as $\frac{a^{2}}{a(b+c)}$ is the move; forgetting to
   square (or squaring inconsistently across terms) breaks the sum on the right.
2. **Losing the cross terms.** When expanding $\sum a_{i}b_{i}$, the cross terms
   are what produce the $2(ab+bc+ca)$-type denominators. Expand carefully.
3. **Stopping at the bound.** Cauchy–Schwarz frequently gives
   $\frac{(a+b+c)^{2}}{2(ab+bc+ca)}$, and the remaining step
   $(a+b+c)^{2}\ge3(ab+bc+ca)$ is a separate small inequality that must still be
   proved.
4. **Assuming equality without checking attainability** — see above.

## References

- Engel form as "Titu's lemma": standard olympiad folklore, stated in most
  inequality handouts.
- Proof by discriminant: any first course in linear algebra or real analysis.

## Related vault entries

- Jensen and concavity cover the *convexity* route to the same style of bound —
  useful when the quantity is a sum of $f(x_i)$ rather than a fraction.
- The acute-triangle sine sum is a case where Cauchy–Schwarz/Jensen both point the
  wrong way, and the extremal-boundary method is needed instead.
