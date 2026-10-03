---
title: "∫₀⁴ ln x / √(4x − x²) dx = 0: singular at both ends, yet exact"
topic: integrals
tags:
  - definite-integrals
  - integrals
  - king-property
  - symmetry
  - improper-integrals
  - trigonometric-substitution
summary: An improper integral over the semicircle √(4x − x²) whose integrand blows up at both endpoints, proved to equal exactly 0 by reflecting x ↦ 4 − x and reducing it to the classical log-cosine integral.
difficulty: standard
keyIdea: The quadratic 4x − x² = x(4 − x) is symmetric about x = 2, and that same expression reappears in the numerator once x is paired with 4 − x; the averaged integrand becomes ln(4x − x²)/√(4x − x²), which the substitution x = 2 + 2 sin θ turns into ∫ ln(4cos²θ) dθ, whose value collapses to 0 through the classical ∫₀^(π/2) ln cos θ dθ = −(π/2) ln 2.
answer: "0"
status: stub
draft: false
---

## Problem

Show that the improper integral

$$I=\int_{0}^{4}\frac{\ln x}{\sqrt{4x-x^{2}}}\,dx$$

converges and that $I=0$, where $\ln$ denotes the natural logarithm.

*Reading taken from the statement:* the upper limit is exactly $4$, the lower limit is $0$, and the numerator is the natural logarithm of a real variable. Since $4x-x^{2}=x(4-x)$ is positive exactly on $(0,4)$ and vanishes at both ends, while $\ln x\to-\infty$ as $x\to0^{+}$, the integrand is singular at *both* endpoints: near $x=0$ it behaves like $\ln x/(2\sqrt{x})$, and near $x=4$ like $(\ln 4)/(2\sqrt{4-x})$. The integral is therefore improper at both limits of integration, and both ends must be handled before any symbolic manipulation is legitimate.

## Solution

**Step 1: the integral converges (indeed absolutely).** Write $4x-x^{2}=x(4-x)$, which is positive on $(0,4)$. For $0<x\le 1$ we have $4-x\ge 3$, hence $\sqrt{x(4-x)}\ge\sqrt{3x}$ and

$$\left|\frac{\ln x}{\sqrt{x(4-x)}}\right|\le\frac{|\ln x|}{\sqrt{3x}}.$$

The comparison integral is finite. Substituting $x=t^{2}$, so that $dx=2t\,dt$ and $\sqrt{x}=t$ for $t>0$,

$$\int_{0}^{1}\frac{|\ln x|}{\sqrt{x}}\,dx=\int_{0}^{1}\frac{|\ln t^{2}|}{t}\,2t\,dt=2\int_{0}^{1}|\ln t^{2}|\,dt=4\int_{0}^{1}(-\ln t)\,dt=4\Bigl[t-t\ln t\Bigr]_{0}^{1}=4,$$

because $t\ln t\to 0$ as $t\to0^{+}$ and $t\ln t=0$ at $t=1$. The comparison test for improper integrals of non-negative functions therefore gives convergence of $\int_{0}^{1}\bigl|\ln x\bigr|\big/\sqrt{x(4-x)}\,dx$.

For $3\le x<4$ we have $|\ln x|\le\ln 4$ and $\sqrt{x(4-x)}\ge\sqrt{3}\,\sqrt{4-x}$, so

$$\left|\frac{\ln x}{\sqrt{x(4-x)}}\right|\le\frac{\ln 4}{\sqrt{3}}\,(4-x)^{-1/2},\qquad \int_{3}^{4}(4-x)^{-1/2}\,dx=2<\infty.$$

Hence $I$ converges absolutely. That fact is used twice below: it justifies the change of variable $x\mapsto 4-x$ on an improper integral, and it lets us add two copies of $I$ rather than juggle an $\infty-\infty$.

**Step 2: reflect about the midpoint $x=2$.** Put $x=4-t$, $dx=-dt$. Since $4(4-t)-(4-t)^{2}=4t-t^{2}$ and $\ln x$ becomes $\ln(4-t)$,

$$I=\int_{0}^{4}\frac{\ln(4-t)}{\sqrt{4t-t^{2}}}\,dt=\int_{0}^{4}\frac{\ln(4-x)}{\sqrt{4x-x^{2}}}\,dx.$$

Adding this second copy of $I$ to the first,

$$2I=\int_{0}^{4}\frac{\ln x+\ln(4-x)}{\sqrt{x(4-x)}}\,dx=\int_{0}^{4}\frac{\ln\bigl(x(4-x)\bigr)}{\sqrt{x(4-x)}}\,dx.$$

This is the hinge of the problem: $x(4-x)$ *is* $4x-x^{2}$, so the argument of the logarithm is exactly the expression sitting under the square root. After symmetrising, the numerator has collapsed into a function of the denominator alone.

**Step 3: the trigonometric substitution $x=2+2\sin\theta$.** The denominator is $\sqrt{4-(x-2)^{2}}$, the upper semicircle of the circle $(x-2)^{2}+y^{2}=4$, so we parametrise by $x=2+2\sin\theta$ with $\theta\in(-\pi/2,\pi/2)$. On that open interval the map is strictly increasing and $C^{1}$, taking $(0,4)$ bijectively onto $(-\pi/2,\pi/2)$, with $x\to0^{+}\leftrightarrow\theta\to-\pi/2^{+}$ and $x\to4^{-}\leftrightarrow\theta\to\pi/2^{-}$: the two improper endpoints correspond to each other. Also

$$dx=2\cos\theta\,d\theta,\qquad 4x-x^{2}=4-(x-2)^{2}=4-4\sin^{2}\theta=4\cos^{2}\theta,$$

so $\sqrt{4x-x^{2}}=2\cos\theta$, because $\cos\theta>0$ on the open interval and no absolute value is needed. Using $x(4-x)=4x-x^{2}=4\cos^{2}\theta$ from Step 2,

$$2I=\int_{-\pi/2}^{\pi/2}\frac{\ln\bigl(4\cos^{2}\theta\bigr)}{2\cos\theta}\,2\cos\theta\,d\theta=\int_{-\pi/2}^{\pi/2}\ln\bigl(4\cos^{2}\theta\bigr)\,d\theta.$$

The new integrand tends to $-\infty$ at $\theta=\pm\pi/2$, mirroring the two original singularities; it is nevertheless integrable there, since the blow-up is only logarithmic.

**Step 4: the classical log-cosine integral.** On $(-\pi/2,\pi/2)$ we have $\cos\theta>0$, so $\ln(4\cos^{2}\theta)=\ln 4+2\ln\cos\theta$, and $\ln\cos\theta$ is even. Hence

$$2I=\pi\ln 4+2\int_{-\pi/2}^{\pi/2}\ln\cos\theta\,d\theta=\pi\ln 4+4J_0,\qquad J_0:=\int_{0}^{\pi/2}\ln\cos\theta\,d\theta.$$

We now compute $J_0$. Let $K=\int_{0}^{\pi/2}\ln\sin\theta\,d\theta$. The substitution $\theta\mapsto\frac{\pi}{2}-\theta$ (the king property, using $\cos(\tfrac{\pi}{2}-\theta)=\sin\theta$) maps $[0,\pi/2]$ onto itself, so $K=J_0$. Adding the two,

$$2J_0=J_0+K=\int_{0}^{\pi/2}\ln(\sin\theta\cos\theta)\,d\theta=\int_{0}^{\pi/2}\ln\Bigl(\tfrac{1}{2}\sin 2\theta\Bigr)\,d\theta=\int_{0}^{\pi/2}\ln\sin 2\theta\,d\theta-\frac{\pi}{2}\ln 2.$$

For the remaining integral put $u=2\theta$:

$$\int_{0}^{\pi/2}\ln\sin 2\theta\,d\theta=\frac{1}{2}\int_{0}^{\pi}\ln\sin u\,du=\frac{1}{2}\left(\int_{0}^{\pi/2}\ln\sin u\,du+\int_{\pi/2}^{\pi}\ln\sin u\,du\right).$$

The substitution $u\mapsto\pi-u$ shows the second piece equals the first, so the whole expression is $\frac{1}{2}\cdot 2K=K=J_0$. Therefore $2J_0=J_0-\frac{\pi}{2}\ln 2$, that is,

$$J_0=-\frac{\pi}{2}\ln 2.$$

**Step 5: conclusion.** Substituting this value,

$$2I=\pi\ln 4+4\Bigl(-\frac{\pi}{2}\ln 2\Bigr)=\pi\ln 4-2\pi\ln 2=\pi\,(2\ln 2)-2\pi\ln 2=0,$$

so $I=0$, as claimed. The integral converges by Step 1, and the positive contribution of the integrand on $(1,4)$ cancels its negative contribution on $(0,1)$ exactly.

**A second route (independent check).** Skipping the reflection and substituting $x=2+2\sin\theta$ in the original integral directly: write $\ln x=\ln(2+2\sin\theta)=\ln 2+\ln(1+\sin\theta)$, so that the computation of Step 3 gives

$$I=\int_{-\pi/2}^{\pi/2}\ln(2+2\sin\theta)\,d\theta=\pi\ln 2+L,\qquad L:=\int_{-\pi/2}^{\pi/2}\ln(1+\sin\theta)\,d\theta.$$

The interval is symmetric about $0$, so $\theta\mapsto-\theta$ gives $L=\int_{-\pi/2}^{\pi/2}\ln(1-\sin\theta)\,d\theta$; adding,

$$2L=\int_{-\pi/2}^{\pi/2}\ln(1-\sin^{2}\theta)\,d\theta=\int_{-\pi/2}^{\pi/2}\ln\cos^{2}\theta\,d\theta=4J_0=-2\pi\ln 2,$$

hence $L=-\pi\ln 2$ and $I=\pi\ln 2-\pi\ln 2=0$. The two routes agree.

## Key idea

The reflection $x\mapsto 4-x$ about the midpoint $x=2$ is the whole trick. It is available because the denominator $\sqrt{4x-x^{2}}$ is symmetric about that midpoint, and it pays off precisely because $x(4-x)=4x-x^{2}$: pairing $\ln x$ with $\ln(4-x)$ turns the numerator into $\ln(4x-x^{2})$, a function of the denominator alone. The substitution $x=2+2\sin\theta$ then linearises the root and reduces everything to the classical value $\int_{0}^{\pi/2}\ln\cos\theta\,d\theta=-\frac{\pi}{2}\ln 2$, and the two logarithm terms cancel.

The same device (reflect, then average — the king property of definite integrals) computes $\int_{0}^{\pi/2}\ln\sin$, converts $\int_{0}^{\pi}xf(\sin x)\,dx$ into simpler forms, and explains many 'the answer is zero' integrals over symmetric intervals. Two limits are worth remembering. First, the integral must be absolutely convergent *before* you average: adding two divergent copies of an integral is meaningless, which is why the comparison in Step 1 is part of the solution and not decoration. Second, the cancellation needs the numerator and denominator to be paired: change $\ln x$ to $\ln(x+1)$, so that the symmetrised numerator becomes $\ln\bigl((x+1)(5-x)\bigr)$ rather than $\ln(4x-x^{2})$, and the identity is destroyed — the integral is then no longer forced to vanish.
