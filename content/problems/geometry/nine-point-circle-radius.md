---
title: "Why the nine-point circle has radius R/2"
topic: geometry
topics: [geometry]
tags: [nine-point-circle, homothety, orthocentre, circumcircle, euler-circle, reflection]
difficulty: standard
exam: olympiad-other
source: "Classical; standard olympiad geometry"
summary: "Six of the nine points fall out of one homothety about the orthocentre with ratio 1/2; the three side-midpoints follow from the nine-point centre being the midpoint of OH plus one vector computation."
keyIdea: "Reflecting H in a side lands on the circumcircle, and the altitude foot is the midpoint of that reflected point with H. So the homothety h(H, ½) sends A, B, C and the three reflected points to six of the nine points. The side-midpoints are handled by showing the centre is N = midpoint(OH) and checking NM_a = R/2 with vectors."
related: [acute-triangle-sine-sum]
status: polished
date: 2025-01-22
---

Let $ABC$ have circumcircle $\Gamma$ with centre $O$ and radius $R$, and
orthocentre $H$. Prove that the nine points

- the three side-midpoints $M_{a},M_{b},M_{c}$,
- the three altitude feet $D,E,F$,
- the three midpoints of $AH,BH,CH$,

are concyclic, and find the radius of their circle.

## Step 1: two facts about reflecting H

**Fact A.** The reflection $H_{a}$ of $H$ in the line $BC$ lies on $\Gamma$.

*Proof.* Reflection fixes angles at points of the mirror line, so
$\angle BH_{a}C=\angle BHC$. Since $BH\perp AC$ and $CH\perp AB$, the angle
between $BH$ and $CH$ equals the angle between $AC$ and $AB$, so

$$
\angle BHC=180^{\circ}-\angle A .
$$

Hence $\angle BH_{a}C=180^{\circ}-\angle A$, and since
$\angle BAC=\angle A$, the quadrilateral $ABH_{a}C$ has opposite angles summing
to $180^{\circ}$ — so it is cyclic and $H_{a}\in\Gamma$. $\square$

**Fact B.** The altitude foot $D$ is the midpoint of $HH_{a}$.

*Proof.* The reflection fixes $D\in BC$ and swaps $H\leftrightarrow H_{a}$, so
$DH=DH_{a}$ with $D,H,H_{a}$ collinear. Hence $D$ bisects $HH_{a}$. $\square$

## Step 2: the homothety h(H, ½) gives six of the nine points

Let $h$ be the homothety with centre $H$ and ratio $\tfrac12$, so $h(X)$ is the
midpoint of segment $HX$. Being a homothety of ratio $\tfrac12$, it maps the
circle $\Gamma$ onto a circle $h(\Gamma)$ of radius $\tfrac12R$. Now:

$$
h(A),h(B),h(C)
= \text{the midpoints of } AH,BH,CH ,
$$

because $A,B,C\in\Gamma$; and by Facts A and B,

$$
h(H_{a})=\text{midpoint of }HH_{a}=D\in h(\Gamma),
$$

with the same argument giving $E,F\in h(\Gamma)$. So six of the nine points lie
on the circle $h(\Gamma)$ of radius $\tfrac R2$.

## Step 3: the side-midpoints lie on the same circle

These do **not** come from $h$: note $h(H_{a})=D$, not $M_{a}$. They come from
identifying the centre of $h(\Gamma)$.

The image of a circle under a homothety of ratio $\tfrac12$ about $H$ is the
circle centred at $h(O)$, the midpoint of $OH$. Write

$$
N:=h(O)=\text{midpoint of }OH .
$$

So $h(\Gamma)$ is the circle with centre $N$ and radius $\tfrac R2$, and it
remains to show $NM_{a}=NM_{b}=NM_{c}=\tfrac R2$.

Do this with vectors. Put $O$ at the origin and let $\vec a,\vec b,\vec c$ be the
position vectors of $A,B,C$; all have length $R$. The orthocentre has position
vector

$$
\vec h=\vec a+\vec b+\vec c ,
\tag{$\star$}
$$

(the standard identity: $(\vec h-\vec a)\cdot(\vec b-\vec c)
=(\vec b+\vec c)\cdot(\vec b-\vec c)=|\vec b|^{2}-|\vec c|^{2}=0$, so the line
through $A$ and $h$ is perpendicular to $BC$ — and similarly for the other two
vertices). Therefore

$$
\vec N=\tfrac12\left(\vec a+\vec b+\vec c\right),
\qquad
\vec M_{a}=\tfrac12\left(\vec b+\vec c\right),
$$

so

$$
\overrightarrow{NM_{a}}
=\vec M_{a}-\vec N
=-\tfrac12\vec a ,
\qquad
\left|\overrightarrow{NM_{a}}\right|
=\tfrac12|\vec a|
=\tfrac R2 .
$$

Identically $NM_{b}=NM_{c}=\tfrac R2$. Hence $M_{a},M_{b},M_{c}$ lie on the
circle with centre $N$ and radius $\tfrac R2$ — which is exactly $h(\Gamma)$.

## Conclusion

All nine points lie on the circle $h(\Gamma)$, whose centre is $N$, the midpoint
of $OH$, and whose radius is

$$
\boxed{\ \frac{R}{2}\ }
\qquad\blacksquare
$$

This is the **nine-point circle** (Euler circle) of $ABC$.

*Numerical check.* For $A=(1,3)$, $B=(-1,0)$, $C=(4,0)$ one gets
$O=(1.5,\tfrac16)$, $H=(1,\tfrac23)$, $R^{2}=\tfrac{85}{36}$, and
$N=(1.5,\tfrac{5}{12})$. The nine points are
$M_{a}=(1.5,0)$, $M_{b}=(2.5,1.5)$, $M_{c}=(0,1.5)$, $D=(1,0)$,
$E=(1,2)$, $F=(2,2)$, and $(1,\tfrac{11}{6})$, $(0,\tfrac13)$,
$(2.5,\tfrac13)$ — the last three being the midpoints of $AH,BH,CH$. Each
satisfies $(x-1.5)^{2}+(y-\tfrac{5}{12})^{2}=\tfrac{85}{144}$, i.e. distance
$\tfrac R2$ from $N$. I also checked the same nine distance identities for a
genuinely scalene triangle, $A=(0,0)$, $B=(7,1)$, $C=(3,6)$, and for an obtuse
one, $A=(0,0)$, $B=(4,0)$, $C=(1,1)$; all nine points satisfy
$|PN|=R/2$ in every case. Note that the first example is right-angled at $A$,
where $H=A$ and the "nine" points are not all distinct — the theorem still
holds, degenerately.

## The reusable ideas

**1. Reflection in a side sends the orthocentre to the circumcircle.** The
highest-yield single fact in triangle geometry. It converts every statement about
altitude feet into a statement about $\Gamma$, where $O$, $R$ and symmetry are
available.

**2. Transport incidences in bulk with one map.** Rather than checking nine
concyclicity conditions by angle chasing, find one map carrying a known circle
onto the target circle and show each target point is the image of a point you
already know lies on the source circle. Six of the nine points fell out this way
in two lines.

**3. Know which homothety you are using.** The medial triangle is the image of
$ABC$ under the homothety of ratio $-\tfrac12$ about the *centroid*, while the
nine-point circle is the image of $\Gamma$ under the homothety of ratio
$\tfrac12$ about the *orthocentre*. Both involve $\tfrac12$, which is exactly why
they get conflated. Here $h(H_a)=D$, not $M_a$ — a good reason to compute rather
than assume.

**4. Vectors finish the job.** With $\vec h=\vec a+\vec b+\vec c$, the identity
$|\overrightarrow{NM_a}|=\tfrac12|\vec a|$ needs one subtraction and no angle
chasing at all. When a synthetic route stalls, coordinates/vectors usually give a
two-line finish.

## Related practice

- Prove $(\star)$ by the perpendicularity computation shown above, and deduce
  that $H$ coincides with a vertex exactly when the triangle is right-angled.
- Show that $N$ is the midpoint of $OH$ directly from $h(H,\tfrac12)$ mapping $O$
  to $N$ — the homothety does it with no computation.
- Prove that the nine-point circle is tangent to the incircle and the three
  excircles (Feuerbach's theorem) — much harder; see the Feuerbach note.
