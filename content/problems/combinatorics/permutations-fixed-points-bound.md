---
title: "Permutations and their fixed points"
topic: combinatorics
topics: [combinatorics]
tags: [imo, permutations, double-counting, derangements, linearity-of-expectation]
difficulty: standard
exam: imo
source: "IMO 1987, Problem 1"
year: 1987
problemNumber: "1"
summary: "Prove that the number of permutations of {1,…,n} with exactly k fixed points is at most n!/k!, in two independent ways."
keyIdea: "The sum of the number of fixed points over all n! permutations equals n!, by counting the pairs (permutation, fixed point) position by position. Equivalently, a permutation with exactly k fixed points is 'choose the k fixed points, then derange the rest', which gives the exact count n!/(k!(n−k)!)·D_{n−k}."
related: [expected-fixed-points-random-permutation, generating-functions-first-look]
status: polished
date: 2025-01-20
---

Let $p_{n}(k)$ denote the number of permutations of $\{1,2,\dots,n\}$ ($n\ge1$)
with exactly $k$ fixed points. Prove that

$$
p_{n}(k)\ \le\ \frac{n!}{k!}.
$$

<details>
<summary>Hint</summary>

Do not try to count permutations with exactly $k$ fixed points directly. Count the
*total* number of fixed points over all $n!$ permutations in two different ways —
and note that a permutation with exactly $k$ fixed points is determined by
choosing those $k$ points and deranging the rest.

</details>

## Solution

### Step 1: the total number of fixed points is n!

Let $F(\sigma)$ be the number of fixed points of a permutation $\sigma$, and set

$$
S=\sum_{\sigma\in S_{n}}F(\sigma).
$$

**Count by position.** Fix $i\in\{1,\dots,n\}$. The number of permutations with
$\sigma(i)=i$ is $(n-1)!$, since the remaining $n-1$ elements may be arranged
freely. So position $i$ contributes $(n-1)!$ to $S$, and summing over all $n$
positions,

$$
S=n\cdot(n-1)!=n! .
\tag{1}
$$

**Count by permutation.** A permutation with exactly $j$ fixed points contributes
$j$, and there are $p_{n}(j)$ of them, so

$$
S=\sum_{j=0}^{n}j\,p_{n}(j).
\tag{2}
$$

Combining (1) and (2),

$$
\sum_{j=0}^{n}j\,p_{n}(j)=n! .
\tag{3}
$$

Since every term in (3) is non-negative, dropping all but the $j=k$ term gives
$k\,p_{n}(k)\le n!$, hence the weaker bound $p_{n}(k)\le n!/k$ for $k\ge1$.

### Step 2: the exact count via derangements

To reach the stronger $n!/k!$ we use the structure of such permutations. Choose
the set of fixed points: $\binom{n}{k}$ ways. The remaining $n-k$ elements must
be permuted with no fixed point at all, i.e. they must form a derangement of the
remaining $n-k$ positions. Writing $D_{m}$ for the number of derangements of $m$
elements,

$$
p_{n}(k)=\binom{n}{k}D_{n-k}
=\frac{n!}{k!\,(n-k)!}\,D_{n-k}.
\tag{4}
$$

Since $D_{m}$ counts a subset of all $m!$ permutations of $m$ elements,
$D_{m}\le m!$, so for $m=n-k$,

$$
\frac{D_{n-k}}{(n-k)!}\le1 .
$$

Substituting into (4),

$$
p_{n}(k)=\frac{n!}{k!}\cdot\underbrace{\frac{D_{n-k}}{(n-k)!}}_{\le1}\ \le\ \frac{n!}{k!}.
\qquad\blacksquare
$$

### Bonus: the ratio, and why the bound is nearly sharp

Inclusion–exclusion for derangements gives

$$
D_{m}=m!\sum_{i=0}^{m}\frac{(-1)^{i}}{i!},
$$

so (4) becomes

$$
\frac{p_{n}(k)}{n!/k!}=\sum_{i=0}^{n-k}\frac{(-1)^{i}}{i!}\ \xrightarrow[\ n-k\to\infty\ ]{}\ e^{-1}\approx0.368 .
$$

So the bound $n!/k!$ is never attained for $n-k\ge2$, and the true count sits
about $37\%$ of the way below it in the limit — a useful sanity check on the
inequality's sharpness.

## The reusable ideas

**1. Double counting.** The identity $\sum_{\sigma}F(\sigma)=n!$ came from
counting one quantity — pairs (permutation, fixed point) — in two ways. This is
the single most reusable technique in combinatorics: when a problem asks about
how many "special" elements a family has, sum that count over the whole family;
the total is often computable even when the individual counts are not.

**2. Indicator variables.** Writing
$F(\sigma)=\sum_{i=1}^{n}\mathbf{1}[\sigma(i)=i]$ makes Step 1 a one-line
calculation by swapping the order of summation. The same manoeuvre underlies
linearity of expectation in probability.

**3. Decompose a structured count into free choice × constrained count.** "Choose
the $k$ fixed points ($\binom{n}{k}$ ways) and derange the rest ($D_{n-k}$ ways)"
is the standard decomposition, and it converts an opaque count into a product of
two known quantities.

## Related practice

- Deduce from (3) that the expected number of fixed points of a uniformly random
  permutation of $n$ elements is exactly $1$, for every $n$.
- Prove $D_{n}=nD_{n-1}+(-1)^{n}$ and conclude $D_{n}=\operatorname{round}(n!/e)$.
- Show that the number of permutations of $n$ elements all of whose cycles have
  length greater than $1$ is $(n-1)!$ — a surprisingly clean answer, obtained by
  a bijection rather than by inclusion–exclusion.
