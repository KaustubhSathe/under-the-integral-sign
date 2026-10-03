---
title: "In an acute triangle, show sin A + sin B + sin C > 2"
topic: inequalities
topics: [inequalities, geometry]
tags: [concavity, extremal-principle, triangle-inequalities, sine, jensen]
difficulty: warmup
exam: rmo
source: "Classical; a standard RMO/INMO warm-up"
summary: "Fix one angle, notice sin A + sin B is concave in the remaining freedom, so the minimum sits at the boundary of the acute constraint — then it is one trig estimate."
keyIdea: "For a symmetric quantity on a constrained domain, look at the boundary first. Fixing C makes A ↦ sin A + sin(π − C − A) strictly concave, so its minimum over the feasible interval occurs at an endpoint."
related: [jensen-inequality-concavity, am-gm-weighted-and-unweighted]
status: polished
date: 2025-01-14
---

Let $A, B, C$ be the angles of a triangle, all strictly less than $\pi/2$. Prove
that

$$
\sin A+\sin B+\sin C>2 .
$$

<details>
<summary>Hint</summary>

Fix $C$ for a moment. Then $A+B=\pi-C$ is fixed, and you are looking at a
one-variable function of $A$. Where does a concave function attain its
*minimum* on an interval?

</details>

## Solution

Fix $C$. Then $B=\pi-C-A$, and we study

$$
F(A)=\sin A+\sin(\pi-C-A)=\sin A+\sin(A+C)
$$

as $A$ varies. (The second equality uses $\sin(\pi-x)=\sin x$ with
$x=C+A$.) Differentiating twice,

$$
F''(A)=-\sin A-\sin(A+C)<0
$$

throughout $(0,\pi)$, since both angles lie in $(0,\pi)$. So $F$ is **strictly
concave**, and a strictly concave function on a closed interval attains its
minimum at an endpoint — never in the interior.

What is the feasible interval for $A$? The triangle is acute, so

$$
A<\frac{\pi}{2}\quad\text{and}\quad B=\pi-C-A<\frac{\pi}{2}
\ \Longleftrightarrow\ A>\frac{\pi}{2}-C .
$$

So $A$ ranges over $\left(\frac{\pi}{2}-C,\ \frac{\pi}{2}\right)$. At the two ends, using $\sin(\pi-x)=\sin x$ and $\sin\frac{\pi}{2}=1$,

$$
F\!\left(\frac{\pi}{2}\right)=1+\cos C,
\qquad
F\!\left(\frac{\pi}{2}-C\right)=\cos C+1 .
$$

Both endpoints give the same value $1+\cos C$, hence for every interior $A$,

$$
\sin A+\sin B=F(A)>1+\cos C .
$$

Adding $\sin C$ to both sides,

$$
\sin A+\sin B+\sin C>1+\cos C+\sin C .
$$

Finally, since $C\in\left(0,\frac{\pi}{2}\right)$,

$$
\sin C+\cos C=\sqrt{2}\,\sin\!\left(C+\frac{\pi}{4}\right)>1,
$$

because $C+\frac{\pi}{4}\in\left(\frac{\pi}{4},\frac{3\pi}{4}\right)$ and
$\sin$ is strictly greater than $\frac{\sqrt2}{2}$ on that open interval.
Therefore

$$
\sin A+\sin B+\sin C>1+1=2 . \qquad \blacksquare
$$

Equality is approached only in the degenerate limit $C\to 0$,
$A\to\frac{\pi}{2}$, $B\to\frac{\pi}{2}$ — which is why the inequality is strict
for every genuine acute triangle.

> **The tempting wrong turn.**
> Jensen's inequality is the first thing most people reach for. Since $\sin$ is
> concave on $(0,\pi)$ and $A+B+C=\pi$,
>
> $$\sin A+\sin B+\sin C\ \le\ 3\sin\frac{\pi}{3}=\frac{3\sqrt3}{2}\approx 2.598 .$$
>
> That is a *maximum*, and it says nothing about being bigger than $2$. The
> problem asks for a lower bound, so Jensen is pointed the wrong way. Before
> applying a convexity bound, check whether it bounds the quantity in the
> direction you actually need.

## The reusable idea

For a symmetric expression on a constrained domain, the extreme values live on
the **boundary**, not at the symmetric centre. Here "symmetric centre" is the
equilateral triangle, which is exactly where the *maximum* of this sum occurs.
The minimum hides at the edge of the acute constraint, where one angle is
pushed to $\pi/2$.

The technical device is worth stealing: **freeze all but one variable**, prove
the resulting one-variable function is monotone or concave, and read off the
extremum. It converts an $n$-variable inequality into a one-variable calculus
check.

## Related practice

- Prove that in an acute triangle, $\cos^2A+\cos^2B+\cos^2C<1$ using the same
  freeze-one-variable strategy.
- Show that for *any* triangle (not necessarily acute),
  $\sin A+\sin B+\sin C>2$ still holds, by taking the limit $C\to\pi$ instead.
