---
title: "The expected number of fixed points of a random permutation"
topic: probability
topics: [probability, combinatorics]
tags: [linearity-of-expectation, indicator-random-variables, permutations, derangements]
difficulty: warmup
exam: undergrad
source: "Standard; appears in every probability course"
summary: "Linearity of expectation gives the answer 1 with no computation of the distribution, and the trick is that the indicators are not independent — they do not need to be."
keyIdea: "Write F = Σ 1[σ(i) = i] and take expectations term by term. Each indicator has mean 1/n, so E[F] = n · (1/n) = 1. Independence is never required, and the whole point is that it is absent here."
answer: "1"
related: [permutations-fixed-points-bound, generating-functions-first-look]
status: polished
date: 2025-01-28
---

Let $\sigma$ be a uniformly random permutation of $\{1,2,\dots,n\}$ and let
$F(\sigma)$ be the number of fixed points of $\sigma$. Find $\mathbb{E}[F]$.

<details>
<summary>Hint</summary>

Do not try to compute the distribution of $F$. Write $F$ as a sum of indicators —
one per position — and use linearity of expectation.

</details>

## Solution

For each $i\in\{1,\dots,n\}$ let

$$
X_{i}=\mathbf{1}\!\left[\sigma(i)=i\right]
=\begin{cases}1,&\sigma(i)=i,\\0,&\text{otherwise.}\end{cases}
$$

Then $F=\sum_{i=1}^{n}X_{i}$, since each fixed point is counted exactly once.
By **linearity of expectation**,

$$
\mathbb{E}[F]=\mathbb{E}\!\left[\sum_{i=1}^{n}X_{i}\right]=\sum_{i=1}^{n}\mathbb{E}[X_{i}] .
$$

Now compute $\mathbb{E}[X_{i}]$. Because $\sigma$ is uniform on $S_{n}$,
$\sigma(i)$ is uniformly distributed on $\{1,\dots,n\}$: exactly $(n-1)!$ of the
$n!$ permutations satisfy $\sigma(i)=i$, so

$$
\mathbb{P}\!\left[\sigma(i)=i\right]=\frac{(n-1)!}{n!}=\frac{1}{n},
\qquad
\mathbb{E}[X_{i}]=\frac{1}{n} .
$$

Therefore

$$
\mathbb{E}[F]=\sum_{i=1}^{n}\frac{1}{n}
=n\cdot\frac{1}{n}
=1 .
\qquad\blacksquare
$$

The expected number of fixed points is exactly $1$, for every $n\ge1$.

## Why this is not a trick about independence

The indicators $X_{1},\dots,X_{n}$ are emphatically **not** independent. For
instance $X_{1}=1,\dots,X_{n-1}=1$ forces $\sigma(n)=n$ as well, so

$$
\mathbb{P}\!\left[X_{n}=1 \mid X_{1}=\cdots=X_{n-1}=1\right]=1
\neq \frac1n=\mathbb{P}[X_{n}=1]
$$

(except when $n=1$). Linearity of expectation, unlike the variance, requires no
independence whatsoever. This is the entire reason the answer is so clean and the
distribution is not — the distribution of $F$ is given by the rencontres numbers,

$$
\mathbb{P}[F=k]=\frac{D_{n-k}}{k!\,(n-k)!}
=\frac{1}{k!}\sum_{i=0}^{n-k}\frac{(-1)^{i}}{i!},
$$

which does depend on $n$ in a complicated way, yet always has mean $1$.

## Consistency check

The distribution above gives

$$
\mathbb{E}[F]=\sum_{k=0}^{n}k\,\mathbb{P}[F=k]
=\sum_{k=0}^{n}k\binom{n}{k}\frac{D_{n-k}}{n!}=1,
$$

agreeing with the one-line argument. As $n\to\infty$ the distribution of $F$
converges to a Poisson distribution with parameter $1$: the probability of no
fixed point tends to $e^{-1}\approx0.368$, and the mean stays at $1$ for every
$n$. So "the average permutation has exactly one fixed point" is true at every
finite $n$, not merely in the limit.

## The reusable ideas

**1. Linearity of expectation needs no independence.** This is the single most
useful fact in elementary probability. Whenever a random variable counts
*occurrences* of qualitatively similar events, write it as a sum of $0/1$
indicators and add the means. Dependencies, however tangled, are irrelevant to
the mean.

**2. Choose indicators that are individually easy.** Each $X_{i}$ has a
one-line distribution because it depends on only one value of $\sigma$. The
difficulty of the joint distribution is what you are deliberately refusing to
compute.

**3. Expectation is often far simpler than distribution.** A useful habit: before
attacking a "find the expected number" problem, check whether the distribution is
needed at all. Usually it is not, and attempting it first is the main way people
lose time on such questions.

## Related practice

- Find $\mathbb{E}[F^{2}]$ and hence $\operatorname{Var}(F)$; show the variance is
  again exactly $1$ for every $n\ge1$ (this needs the joint distributions, so it
  is genuinely harder than the mean).
- Let $X$ count the number of inverse-descents of $\sigma$; is $\mathbb{E}[X]$ as
  easy? Identify the indicators and decide.
- Use linearity to show that the expected number of cycles in a random
  permutation of $n$ elements is $H_{n}=1+\tfrac12+\cdots+\tfrac1n$, and that
  the expected number of cycles of length exactly $k$ is $1/k$ for $k\le n$.
