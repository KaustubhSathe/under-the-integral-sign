---
title: "A projection's trace equals its rank"
topic: linear-algebra
topics: [linear-algebra]
tags: [trace, rank, projections, idempotent, eigenvalues, undergrad]
difficulty: standard
exam: undergrad
source: "Standard first course in linear algebra"
summary: "For a linear map with P² = P, the trace equals the rank — proved by choosing a basis adapted to the decomposition V = im P ⊕ ker P."
keyIdea: "An idempotent is diagonalisable with eigenvalues only 0 and 1; the multiplicity of eigenvalue 1 is dim(im P) = rank P, and the trace is the sum of the eigenvalues counted with multiplicity."
related: [fermat-little-theorem-and-orders]
status: polished
date: 2025-01-24
---

Let $V$ be a finite-dimensional vector space over a field $F$, and let
$P:V\to V$ be a linear map with $P^{2}=P$ (a *projection*, or idempotent). Prove
that

$$
\operatorname{tr}(P)=\operatorname{rank}(P).
$$

<details>
<summary>Hint</summary>

Show first that $V=\operatorname{im}P\oplus\ker P$, then pick a basis adapted to
this decomposition and write down the matrix of $P$.

</details>

## Solution

### Step 1: V decomposes as image ⊕ kernel

We claim

$$
V=\operatorname{im}P\oplus\ker P .
$$

**The sum is direct.** Suppose $v\in\operatorname{im}P\cap\ker P$. As
$v\in\operatorname{im}P$, there is $u$ with $v=P(u)$. Then

$$
v=P(u)=P^{2}(u)=P(P(u))=P(v)=0,
$$

using $P^{2}=P$ and $v\in\ker P$. So the intersection is $\{0\}$.

**The sum spans $V$.** For any $v\in V$, write

$$
v=\underbrace{P(v)}_{\in\,\operatorname{im}P}+\underbrace{(v-P(v))}_{\in\,\ker P},
$$

and indeed $P(v-P(v))=P(v)-P^{2}(v)=P(v)-P(v)=0$. (This is the standard
"idempotent splits a vector into its projected and complementary parts"
decomposition.)

Hence $V=\operatorname{im}P\oplus\ker P$.

### Step 2: the matrix of P in an adapted basis

Choose a basis of $V$ consisting of a basis
$\mathcal{B}_{1}=(e_{1},\dots,e_{r})$ of $\operatorname{im}P$ followed by a basis
$\mathcal{B}_{0}=(f_{1},\dots,f_{s})$ of $\ker P$, where $r=\operatorname{rank}P$
and $r+s=\dim V$.

- For $e_{i}\in\operatorname{im}P$: write $e_{i}=P(u_{i})$; then
  $P(e_{i})=P^{2}(u_{i})=P(u_{i})=e_{i}$. So $P$ fixes every $e_{i}$.
- For $f_{j}\in\ker P$: $P(f_{j})=0$ by definition.

Therefore the matrix of $P$ in this basis is block diagonal,

$$
[P]_{\mathcal{B}}=
\begin{pmatrix} I_{r} & 0\\ 0 & 0_{s}\end{pmatrix},
$$

where $I_{r}$ is the $r\times r$ identity and $0_{s}$ the $s\times s$ zero block.
Its trace is the sum of its diagonal entries:

$$
\operatorname{tr}(P)=r+0+\cdots+0=r=\operatorname{rank}P .
\qquad\blacksquare
$$

### Alternative proof via eigenvalues

If you have the spectral machinery, the same result is immediate. If
$P^{2}=P$ then for any eigenvalue $\lambda$ and eigenvector $v\neq0$,

$$
\lambda^{2}v=P^{2}v=Pv=\lambda v
\ \Longrightarrow\
\lambda^{2}=\lambda
\ \Longrightarrow\
\lambda\in\{0,1\}.
$$

So $\operatorname{tr}(P)$ is the multiplicity of the eigenvalue $1$. The
eigenspace for $\lambda=1$ is exactly $\ker(P-I)=\operatorname{im}P$ (for
$v=P(u)$ we have $P(v)=v$; conversely $P(v)=v$ means $v\in\operatorname{im}P$).
Hence the multiplicity of $1$ is $\dim\operatorname{im}P=\operatorname{rank}P$,
giving $\operatorname{tr}P=\operatorname{rank}P$ again.

Note the two proofs use different hypotheses. The first needs only that
$V=\operatorname{im}P\oplus\ker P$, which holds over *any* field. The second
identifies trace with the sum of eigenvalues, which requires the characteristic
polynomial to split — automatic over $\mathbb{C}$, not automatic over finite
fields. **Over $\mathbb{F}_{2}$ the first proof still works and the eigenvalue
argument needs care**, which is a good reason to prefer the basis argument when
the field is not specified.

## The reusable ideas

**1. Idempotents split the space.** $V=\operatorname{im}P\oplus\ker P$ whenever
$P^{2}=P$ is the structural fact behind almost every statement about projections.
The device of writing $v=P(v)+(v-P(v))$ is worth memorising.

**2. Choose a basis adapted to the structure.** Trace and rank are both
basis-invariant, but they become transparent in the *right* basis. When a problem
involves both, look for the basis in which the map is as simple as possible —
here, diagonal with $r$ ones and $s$ zeros.

**3. Trace is basis-independent, so compute it anywhere.** $\operatorname{tr}(P)$
does not depend on the choice of basis, so you are always free to pick the basis
that makes the matrix trivial.

## Related practice

- Show that for idempotents $P,Q$ the map $P+Q$ is idempotent if and only if
  $PQ=QP=0$, and conclude $\operatorname{rank}(P+Q)=\operatorname{rank}P+\operatorname{rank}Q$
  in that case.
- Prove that a diagonalisable matrix satisfies $A^{2}=A$ if and only if
  $\operatorname{rank}A=\operatorname{tr}A$ and all eigenvalues are $0$ or $1$.
- Give an example over a field of characteristic $2$ where an idempotent fails to
  be diagonalisable, if one exists — or prove that it cannot happen.
