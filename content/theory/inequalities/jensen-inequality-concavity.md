---
title: "Jensen's inequality and convexity: a working guide"
topic: inequalities
topics: [inequalities, analysis]
tags: [jensen, convexity, concavity, tangent-line-trick, standard-toolkit]
section: theorem
level: standard
summary: "Jensen for convex and concave f, the tangent-line proof, the direction table people get wrong, and how to tell when Jensen is the wrong tool."
statement: "If f is convex on an interval and x_i lie in it, then f((1/n)Σx_i) ≤ (1/n)Σf(x_i). With weights w_i summing to 1, f(Σw_i x_i) ≤ Σw_i f(x_i). Reverses for concave f."
related: [cauchy-schwarz-engel-form, acute-triangle-sine-sum]
status: polished
date: 2025-01-30
---

## Statement

Let $f$ be a real function on an interval $I$, and let $x_{1},\dots,x_{n}\in I$
with weights $w_{i}>0$, $\sum w_{i}=1$.

- If $f$ is **convex** on $I$:

$$
f\!\left(\sum_{i=1}^{n}w_{i}x_{i}\right)\ \le\ \sum_{i=1}^{n}w_{i}f(x_{i}).
$$

- If $f$ is **concave** on $I$ the inequality **reverses**:

$$
f\!\left(\sum_{i=1}^{n}w_{i}x_{i}\right)\ \ge\ \sum_{i=1}^{n}w_{i}f(x_{i}).
$$

Equality holds (for strictly convex/concave $f$) if and only if
$x_{1}=\cdots=x_{n}$.

For $f$ twice differentiable, convexity on $I$ is equivalent to $f''\ge0$ on $I$,
and concavity to $f''\le0$.

## Proof (tangent-line version — the one to remember)

Suppose $f$ is convex and differentiable at the point
$m=\sum w_{i}x_{i}$. Convexity says the graph lies above its tangent line
everywhere:

$$
f(x)\ \ge\ f(m)+f'(m)(x-m)
\qquad\text{for all } x\in I .
$$

(This is the *definition* of convexity in the differentiable case; if
$f''\ge0$ it follows from the mean value theorem.) Apply it at each $x_{i}$ and
take the weighted sum:

$$
\sum_{i}w_{i}f(x_{i})
\ \ge\ \sum_{i}w_{i}\left[f(m)+f'(m)(x_{i}-m)\right]
=f(m)\underbrace{\sum_{i}w_{i}}_{=1}+f'(m)\underbrace{\sum_{i}w_{i}(x_{i}-m)}_{=0}
=f(m).
$$

Since $m=\sum w_{i}x_{i}$, that is Jensen's inequality. $\square$

The **finite/counting** form with $w_{i}=1/n$ is the special case
$f\!\left(\frac{1}{n}\sum x_{i}\right)\le\frac{1}{n}\sum f(x_{i})$.

A second proof, worth knowing for its flexibility, is by induction on $n$ using
only the two-point definition of convexity
$f(\lambda x+(1-\lambda)y)\le\lambda f(x)+(1-\lambda)f(y)$.

## Concavity/convexity cheat sheet

| $f(x)$ | convex on | concave on | note |
|---|---|---|---|
| $x^{p}$, $p\ge1$ | $[0,\infty)$ | — | $f''=p(p-1)x^{p-2}\ge0$ |
| $x^{p}$, $0<p\le1$ | — | $(0,\infty)$ | e.g. $\sqrt{x}$ is concave |
| $x^{p}$, $p<0$ | $(0,\infty)$ | — | e.g. $1/x$ is convex |
| $e^{x}$ | $\mathbb{R}$ | — | |
| $\ln x$ | — | $(0,\infty)$ | the classic concave function |
| $\sin x$ | $[\pi,2\pi]$ etc. | $[0,\pi]$ | sign flips every $\pi$ |
| $\cos x$ | $[-\pi/2,\pi/2]$ | $[\pi/2,3\pi/2]$ | |
| $\tan x$ | $(0,\pi/2)$ | — | |
| $x\ln x$ | $(0,\infty)$ | — | convex |
| $1/\sin x$, $x\in(0,\pi)$ | $(0,\pi)$ | — | for the "sine reciprocal" bounds |

**The trap.** $\sin x$ is **concave** on $(0,\pi)$ but **convex** on
$(\pi,2\pi)$. Since triangle angles live in $(0,\pi)$, the concavity branch
applies there — but only there. Getting the branch wrong reverses the inequality,
which is the most common error with Jensen.

## Why it works, and when to reach for it

Jensen converts a statement about a **sum of function values** into a statement
about the function **at the average**. Its power is that the right-hand side
usually collapses: if $x_{1}+\cdots+x_{n}$ is fixed (as when angles sum to $\pi$,
or $\sum x_{i}=$ constant), then the left-hand side is a single number and the
inequality is effectively free.

**Reach for Jensen when:**

- The expression is $\sum f(x_{i})$ and the constraint is on $\sum x_{i}$ — the
  signature case.
- You can identify $f$ and check its convexity on the *whole* range of the $x_i$.
- You want a bound at the symmetric point (all $x_{i}$ equal).

**Do not reach for Jensen when:**

- **You need the opposite direction.** Jensen bounds $\sum f(x_i)$ on the side the
  convexity dictates. Asking for a lower bound when $f$ is concave (or vice versa)
  is hopeless — see the acute-triangle entry, where Jensen gives the *maximum*
  $3\sqrt3/2$ while the problem wants a *lower* bound of $2$.
- **The $x_{i}$ are unconstrained in sum.** Then the left side is not determined
  and Jensen gives nothing useful.
- **You need sharpness at a boundary.** Extreme values of symmetric expressions on
  constrained domains typically occur at the boundary, not at the symmetric
  interior point. Jensen is blind to this.

## Worked micro-examples

**1. AM–GM.** Take $f(x)=-\ln x$ (convex on $(0,\infty)$) and $w_{i}=1/n$:

$$
-\ln\!\left(\frac{a_{1}+\cdots+a_{n}}{n}\right)\le-\frac{1}{n}\sum\ln a_{i}
=-\ln\left(a_{1}\cdots a_{n}\right)^{1/n},
$$

so $\frac{1}{n}\sum a_{i}\ge(a_{1}\cdots a_{n})^{1/n}$. AM–GM is Jensen applied to
$-\ln$.

**2. Weighted AM–GM.** Same $f$ with general weights $w_{i}$:
$\sum w_{i}a_{i}\ge\prod a_{i}^{w_{i}}$.

**3. Triangle angles.** With $f=\ln\sin$ on $(0,\pi)$ (concave, since
$(\ln\sin x)''=-\csc^{2}x<0$) and $A+B+C=\pi$:

$$
\ln\sin A+\ln\sin B+\ln\sin C\le3\ln\sin\frac{\pi}{3},
\quad\text{i.e.}\quad
\sin A\sin B\sin C\le\frac{3\sqrt3}{8}.
$$

This is a *maximum* statement, valid but frequently misapplied to lower-bound
questions.

**4. Power mean.** $f(x)=x^{p}$ convex on $[0,\infty)$ for $p\ge1$ gives
$\left(\frac{1}{n}\sum a_{i}\right)^{p}\le\frac{1}{n}\sum a_{i}^{p}$ — the
"power mean increases with $p$" inequality in the simplest case.

## Common failure modes

1. **Wrong direction.** Check $f''$ *on the actual range* of the variables, and
   check it against the direction you need. Write down which side you want before
   applying anything.
2. **Assuming equality is attainable.** Jensen's equality case is "$x_{i}$ all
   equal"; if the constraints forbid that, the inequality is strict and the bound
   may be far from optimal.
3. **Applying Jensen to a non-symmetric constraint.** If the constraint is not
   simply on $\sum x_{i}$ (e.g. $xyz=1$, or a triangle's angles with an extra
   acuteness condition), the left-hand side does not collapse to a constant and
   Jensen may not apply as hoped.
4. **Forgetting the variables must lie in the interval of convexity** — pulling
   one $x_{i}$ outside $I$ invalidates the whole argument.

## References

- Any real analysis text for the tangent-line characterisation of convexity.
- Standard olympiad inequality handouts (Engel, Mildorf, and the like) for the
  catalogue of applications.

## Related vault entries

- Cauchy–Schwarz and Engel form — the companion tool, used for fraction sums and
  products of sums.
- The acute-triangle sine sum — a worked example where Jensen is deliberately the
  *wrong* tool, and why.
