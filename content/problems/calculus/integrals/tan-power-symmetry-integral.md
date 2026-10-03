---
title: "A hundredth power of tan, and why the answer is still π/4"
topic: calculus
subtopic: integrals
tags: [definite-integrals, symmetry, integration-bee, king-property, trigonometric-substitution]
difficulty: warmup
exam: integration-bee
source: "Integration bee staple"
summary: "The exponent 100 is a red herring: substituting x → π/2 − x produces the reciprocal integrand, and averaging the two forms collapses everything to π/4."
keyIdea: "For definite integrals where the integrand pairs with its reciprocal under x ↦ a − x, average the integral with its substituted twin: I + I = ∫ 1 dx."
answer: "pi/4"
related: [riemann-sum-arctangent-limit]
status: polished
date: 2025-01-26
---

Evaluate

$$
I=\int_{0}^{\pi/2}\frac{dx}{1+\tan^{100}x}.
$$

<details>
<summary>Hint</summary>

The exponent $100$ never needs to be touched. Try the substitution
$x\mapsto\frac{\pi}{2}-x$ and see what happens to $\tan^{100}x$.

</details>

## Solution

Both $1$ and $\tan^{100}x$ are continuous on $[0,\pi/2)$ with the integrand
bounded between $0$ and $1$ there, so $I$ converges; more explicitly the
integrand extends continuously to $x=0$ with value $1$ and satisfies
$0\le\frac{1}{1+\tan^{100}x}\le1$, so $I\in[0,\pi/2]$.

Apply the substitution $u=\frac{\pi}{2}-x$, so $dx=-du$ and $u$ runs from
$\frac{\pi}{2}$ down to $0$. Then

$$
I=\int_{0}^{\pi/2}\frac{dx}{1+\tan^{100}x}
=\int_{0}^{\pi/2}\frac{du}{1+\tan^{100}\!\left(\frac{\pi}{2}-u\right)} .
$$

Since $\tan\!\left(\frac{\pi}{2}-u\right)=\cot u=\dfrac{1}{\tan u}$, we get

$$
\tan^{100}\!\left(\frac{\pi}{2}-u\right)=\frac{1}{\tan^{100}u},
$$

and therefore

$$
\frac{1}{1+\tan^{100}\!\left(\frac{\pi}{2}-u\right)}
=\frac{1}{1+\dfrac{1}{\tan^{100}u}}
=\frac{\tan^{100}u}{1+\tan^{100}u} .
$$

So the substitution has turned the integral into

$$
I=\int_{0}^{\pi/2}\frac{\tan^{100}x}{1+\tan^{100}x}\,dx .
$$

**Now add the two expressions for $I$** (renaming the dummy variable in the
second one):

$$
2I
=\int_{0}^{\pi/2}\frac{1}{1+\tan^{100}x}\,dx
+\int_{0}^{\pi/2}\frac{\tan^{100}x}{1+\tan^{100}x}\,dx
=\int_{0}^{\pi/2}\frac{1+\tan^{100}x}{1+\tan^{100}x}\,dx
=\int_{0}^{\pi/2}1\,dx .
$$

Hence $2I=\dfrac{\pi}{2}$ and

$$
\boxed{\ I=\frac{\pi}{4}\ }
\qquad\blacksquare
$$

Notice that the value of the exponent was never used. The answer is $\pi/4$ for
$\tan^{n}$ with any real $n$, and indeed for any positive function $f$ in place of
$\tan^{100}$ provided the substitution $x\mapsto\frac\pi2-x$ replaces $f$ by
$1/f$:

$$
\int_{0}^{\pi/2}\frac{dx}{1+f(x)}=\frac{\pi}{4}
\qquad\text{whenever } f\!\left(\tfrac{\pi}{2}-x\right)=\frac{1}{f(x)} .
$$

## The reusable idea

**Pair an integral with its substituted twin and average.** The pattern is:

1. The domain is symmetric about a point (here $[0,\pi/2]$ about $\pi/4$).
2. The substitution $x\mapsto a-x$ maps the integrand to something related —
   typically the reciprocal, or $1$ minus itself.
3. Add the original and the transformed integral. The integrands combine into
   something trivial, and $2I$ becomes an easy integral.

The same manoeuvre gives $\displaystyle\int_0^{\pi/2}\frac{dx}{1+\cot^{n}x}=\frac\pi4$
(immediate by the identity above) and, in a different guise,

$$
\int_0^{1}\frac{dx}{1+e^{x}}=\int_0^1\frac{e^{-x}}{e^{-x}+1}\,dx,
$$

whose sum gives $\int_0^1\frac{dx}{1+e^{x}}+\int_0^1\frac{dx}{1+e^{-x}}=1$ — hence
each equals $\tfrac12$.

**Recognise it by the shape of the domain.** Symmetric limits plus an integrand
involving $f(x)$ and a reciprocal or complement of $f$ is the signature. In a bee
round, spotting this takes about two seconds and the exponent is irrelevant — the
whole point of the question is to test whether you flinch at the $100$.

## Related practice

- Evaluate $\displaystyle\int_{-1}^{1}\frac{dx}{1+2^{x}}$ in one line by the same
  trick (answer: $1$).
- Compute $\displaystyle\int_{0}^{\pi/2}\frac{\sin^{n}x}{\sin^{n}x+\cos^{n}x}\,dx$
  for every real $n$, and explain why the answer does not depend on $n$.
- Show that $\displaystyle\int_0^{\pi/2}\frac{dx}{1+\tan^{100}x}=\int_0^{\pi/2}\frac{\tan^{100}x}{1+\tan^{100}x}\,dx$
  directly, without substituting, by using the symmetry of the two integrands
  about $x=\pi/4$.
