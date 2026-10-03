---
title: "A Riemann sum that collapses to π/4"
topic: integrals
tags: [riemann-sums, limits, telescoping, definite-integrals]
difficulty: standard
exam: jee-advanced
source: "JEE Advanced 2013, Paper 2"
year: 2013
summary: "The summand is a Riemann sum in disguise; recognising the sampling points turns the limit into an arctangent integral."
keyIdea: "Write the summand as (1/n)·f(k/n) so the limit becomes ∫₀¹ f(x) dx, then substitute x = tan θ."
answer: "pi/4"
related: [tan-power-symmetry-integral]
status: polished
date: 2025-01-12
---

Evaluate

$$
\lim_{n\to\infty}\ \sum_{k=1}^{n}\frac{n}{n^{2}+k^{2}} .
$$

<details>
<summary>Hint 1</summary>

Every term has an $n$ upstairs and an $n^2$ downstairs. Divide numerator and
denominator by $n^{2}$ so that the expression looks like a Riemann sum.

</details>

<details>
<summary>Hint 2</summary>

After dividing, the sampling point should be $k/n$. Which function is being
sampled?

</details>

## Solution

Divide the numerator and denominator of each term by $n^{2}$:

$$
\sum_{k=1}^{n}\frac{n}{n^{2}+k^{2}}
=\frac{1}{n}\sum_{k=1}^{n}\frac{1}{1+\left(\frac{k}{n}\right)^{2}} .
$$

This is a right-endpoint Riemann sum for $f(x)=\dfrac{1}{1+x^{2}}$ on $[0,1]$.
Since $f$ is continuous there, the limit is the integral:

$$
\lim_{n\to\infty}\frac{1}{n}\sum_{k=1}^{n}\frac{1}{1+\left(\frac{k}{n}\right)^{2}}
=\int_{0}^{1}\frac{dx}{1+x^{2}}
=\Big[\arctan x\Big]_{0}^{1}
=\frac{\pi}{4}.
$$

## Why the trick works

The whole problem is a change of scale. Each term initially "looks" like it
depends on $n$ and $k$ separately, but after dividing by $n^{2}$ the only
quantity left is the ratio $k/n$ — and a sum of the form
$\frac{1}{n}\sum g(k/n)$ is *by definition* a Riemann sum. The habit worth
building: whenever you see a limit of a sum with a $1/n$-shaped factor hiding
inside, hunt for the ratio $k/n$.

> **Note.** The same move resolves
> $\displaystyle\lim_{n\to\infty}\sum_{k=1}^{n}\frac{n}{n^{2}+k^{2}}$
> for any polynomial denominator: normalise by the highest power of $n$, and the
> limit is $\int_0^1 f(x)\,dx$ provided the resulting $f$ is Riemann integrable.

## Variations to try

1. Replace $k^{2}$ by $k$ to get $\sum \frac{n}{n^{2}+k} \to \ln 2$.
2. Replace $k^{2}$ by $k^{3}$: the answer involves $\ln 2$ and $\arctan$ terms.
3. Show that $\displaystyle\sum_{k=1}^{n}\frac{n}{n^{2}+k^{2}} > \frac{\pi}{4}$
   for every $n \ge 1$ by comparing with an integral.
