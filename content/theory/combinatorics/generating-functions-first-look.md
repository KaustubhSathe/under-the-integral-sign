---
title: "Generating functions: a first real look"
topic: combinatorics
topics: [combinatorics, algebra, analysis]
tags: [generating-functions, formal-power-series, recurrences, counting, technique]
section: technique
level: hard
summary: "Ordinary and exponential generating functions, the three-step workflow (encode, manipulate, extract), and how to solve linear recurrences without guessing."
statement: "Ordinary GF: A(x) = Σ a_n x^n encodes the sequence (a_n). Product of GFs encodes convolution. Exponential GF: Σ a_n x^n/n! encodes labelled structures, where product encodes the binomial convolution."
related: [permutations-fixed-points-bound, expected-fixed-points-random-permutation]
status: polished
date: 2025-01-30
---

## Statement and setup

Let $(a_{n})_{n\ge0}$ be a sequence of numbers. Its **ordinary generating
function** is the formal power series

$$
A(x)=\sum_{n\ge0}a_{n}x^{n}.
$$

Its **exponential generating function** (EGF) is

$$
\widehat{A}(x)=\sum_{n\ge0}a_{n}\frac{x^{n}}{n!}.
$$

The point of the word *formal* is that we treat $x$ as a symbol and never ask
whether the series converges. All manipulations below are algebraic identities
among formal power series, so they are valid over any coefficient ring containing
$\mathbb{Q}$ (needed for EGFs because of the factorials). When you do want
analysis — asymptotics, contour extraction — you reinterpret the same object as an
analytic function where it converges.

## The dictionary

The reason generating functions work is that combinatorial operations on sequences
correspond to algebraic operations on series.

**Ordinary GFs — unlabelled counting.**

| sequence | GF |
|---|---|
| $a_{n}=1$ | $\dfrac{1}{1-x}$ |
| $a_{n}=\binom{n+k-1}{k-1}$ (multisets) | $\dfrac{1}{(1-x)^{k}}$ |
| $a_{n}=c^{n}$ | $\dfrac{1}{1-cx}$ |
| $a_{n}=\binom{m}{n}$ | $(1+x)^{m}$ |
| Fibonacci $F_{n}$ | $\dfrac{x}{1-x-x^{2}}$ |

Operations:

$$
A(x)+B(x)\ \longleftrightarrow\ (a_{n}+b_{n}),
\qquad
A(x)B(x)\ \longleftrightarrow\ \left(\sum_{k=0}^{n}a_{k}b_{n-k}\right)_{n} .
$$

The second is the crucial one: **products encode convolution**, i.e. "split $n$
into two independent parts and count both". Since $1/(1-x)$ counts a single
unrestricted choice of one object, $1/(1-x)^{k}$ counts choosing $k$ things with
repetition allowed and order irrelevant.

**Exponential GFs — labelled counting.**

| labelled structure | EGF |
|---|---|
| all permutations, $a_{n}=n!$ | $\dfrac{1}{1-x}$ |
| derangements $D_{n}$ | $\dfrac{e^{-x}}{1-x}$ |
| permutations with all cycles length $>1$ | $-\ln(1-x)-x$ |
| subsets of a set | $e^{x}$ |

Operations: the product of EGFs encodes the **binomial convolution**

$$
\widehat{A}(x)\widehat{B}(x)
=\sum_{n\ge0}\left(\sum_{k=0}^{n}\binom{n}{k}a_{k}b_{n-k}\right)\frac{x^{n}}{n!},
$$

which is exactly "partition an $n$-element labelled set into two labelled parts".
This is why EGFs are the right tool when the objects are built on labelled atoms:
the binomial coefficient appears automatically.

## The three-step workflow

**Step 1: Encode.** Write down the GF for the *atoms* of your structure (one item,
one slot, one letter). Products and powers then build composite structures.

**Step 2: Manipulate.** Use algebra to collapse the resulting series into a closed
form, or to derive a functional equation for it. Partial fractions, geometric
series, and differentiating/integrating the series are the main moves.

**Step 3: Extract.** Read off $a_{n}$ as the coefficient $[x^{n}]A(x)$. Either
expand the closed form by hand (partial fractions), or apply
$[x^{n}]A(x)=\dfrac{A^{(n)}(0)}{n!}$.

## Worked micro-examples

**1. The Fibonacci recurrence.** Let $F_{0}=0,F_{1}=1$ and
$F_{n}=F_{n-1}+F_{n-2}$ for $n\ge2$. Multiply the recurrence by $x^{n}$ and sum
over $n\ge2$:

$$
\sum_{n\ge2}F_{n}x^{n}
=\sum_{n\ge2}F_{n-1}x^{n}+\sum_{n\ge2}F_{n-2}x^{n}
=xA(x)+x^{2}A(x),
$$

where $A(x)=\sum F_{n}x^{n}$. The left side is $A(x)-F_{1}x=A(x)-x$. Hence

$$
A(x)-x=xA(x)+x^{2}A(x)
\quad\Longrightarrow\quad
A(x)=\frac{x}{1-x-x^{2}} .
$$

Partial fractions (roots $x=\frac{1}{\varphi}$ and $x=-\frac{1}{\psi}$ with
$\varphi=\frac{1+\sqrt5}{2}$) give Binet's formula
$F_{n}=\frac{\varphi^{n}-\psi^{n}}{\sqrt5}$. Note how the recurrence was turned
into an *algebraic* equation — no guessing of the form $r^{n}$ was needed.

**2. Counting compositions.** A composition of $n$ is an ordered sum of positive
parts. A single part contributes the GF

$$
x+x^{2}+x^{3}+\cdots=\frac{x}{1-x},
$$

and a composition is a *sequence* of parts, so its GF is

$$
\frac{1}{1-\frac{x}{1-x}}=\frac{1-x}{1-2x}
=(1-x)\sum_{n\ge0}2^{n}x^{n}
=1+\sum_{n\ge1}2^{n-1}x^{n}.
$$

Reading off coefficients: there is exactly $1$ composition of $0$ (the empty
composition) and $2^{n-1}$ compositions of $n\ge1$. The whole counting argument
happened in one line of algebra.

**3. Derangements.** Let $D_{n}$ be the number of permutations of $n$ labelled
elements with no fixed point. A permutation is a set of cycles; a cycle of length
$k$ has EGF $\frac{x^{k}}{k}$, and a nonempty set of cycles gives

$$
\sum_{k\ge1}\frac{x^{k}}{k}=-\ln(1-x)
$$

for all permutations. Restricting to cycles of length $\ge2$ (a derangement has
no $1$-cycle) removes the $k=1$ term:

$$
\sum_{n\ge0}D_{n}\frac{x^{n}}{n!}=-\ln(1-x)-x .
$$

Expanding, $[x^{n}]$ of this is $\sum_{i=0}^{n}\frac{(-1)^{i}}{i!}$ for $n\ge2$,
recovering $D_{n}=n!\sum_{i=0}^{n}\frac{(-1)^{i}}{i!}$ and hence
$D_{n}=\operatorname{round}(n!/e)$. **The "$k=1$ term is the fixed points"
remark is the conceptual core of the whole computation.**

## Why it works, and when to reach for it

A generating function replaces a *sequence* by a *single object* (a series), and
turns operations that are awkward on sequences (splitting, convolutions,
recurrences) into operations that are easy on series (multiplication, division,
composition). The cost is that you must extract coefficients at the end.

**Reach for ordinary GFs when** the objects are unlabelled and being combined by
"multiset of parts" — partitions, coin-change counting, restricted
compositions, independence-polynomial style questions.

**Reach for exponential GFs when** the objects live on a labelled ground set and
you build them by partitioning it — permutations, set partitions, graphs with a
labelled vertex set, anything where $\binom{n}{k}$ shows up naturally.

**Reach for them at all when** you see a recurrence with constant coefficients, a
convolution sum $\sum a_{k}b_{n-k}$, or a counting problem with "independent
parts".

## Common failure modes

1. **Using the wrong kind of GF.** If your objects are labelled, an ordinary GF
   will produce the wrong binomial factors. The tell: does the problem say
   "sets", "vertices", "labelled", or count subsets? Use an EGF.
2. **Forgetting the initial conditions.** The functional equation comes from
   summing the recurrence over its valid range; mishandling the first one or two
   terms leaves the closed form off by a low-order polynomial. In the Fibonacci
   example the $F_{1}x$ term had to be separated out.
3. **Losing track of where coefficient extraction is valid.** Formal
   manipulations are always fine; convergence claims are not. If you write
   $\frac{1}{1-x}=\sum x^{n}$ you are using a *formal* identity — fine — but
   substituting $x=2$ into it is not.
4. **Trying to extract a closed form when a recurrence suffices.** Often you only
   need $a_{n}$ for specific $n$, or the *asymptotic* growth; singular analysis
   (the location of the nearest singularity of $A(x)$) gives the latter without
   any coefficient extraction at all.

## References

- Wilf, *generatingfunctionology* — the standard free reference, and the source
  of the "snake oil" method for coefficient extraction.
- Flajolet & Sedgewick, *Analytic Combinatorics* — for the analytic side and
  asymptotics.

## Related vault entries

- IMO 1987 Problem 1 (permutations and fixed points) — where the derangement EGF
  above answers the counting question.
- Expected fixed points of a random permutation — the probabilistic reading of
  the same structure.
