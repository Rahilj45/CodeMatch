# Recommendation Engine Algorithm & Math 🧠

The CodeMatch recommendation algorithm is deterministic, transparent, and reproducible. It answers **why** each problem was selected rather than producing opaque black-box recommendations.

## Scoring Formula

For each candidate problem $P$ from the Codeforces catalogue that the user has **never solved**, the composite recommendation score $S(P)$ is defined as:

$$S(P) = w_{\text{diff}} S_{\text{diff}}(P) + w_{\text{weak}} S_{\text{weak}}(P) + w_{\text{sem}} S_{\text{sem}}(P) + w_{\text{qual}} S_{\text{qual}}(P) + \Delta_{\text{retry}}$$

Where weights are calibrated to:
- $w_{\text{diff}} = 0.35$ (Difficulty suitability)
- $w_{\text{weak}} = 0.30$ (Topic weakness & remediation)
- $w_{\text{sem}} = 0.20$ (Semantic vector similarity)
- $w_{\text{qual}} = 0.15$ (Community problem quality)
- $\Delta_{\text{retry}} = +0.08$ (Redemption bonus for attempted but unsolved problems)

---

## 1. Difficulty Matching ($S_{\text{diff}}$)

The algorithm calculates the user's optimal target difficulty $R_{\text{target}}$:
$$R_{\text{target}} = R_{\text{user}} + \Delta_{\text{offset}} \quad (\text{default offset: } +75)$$

Difficulty suitability follows a Gaussian decay curve centered around $R_{\text{target}}$ with $\sigma = 180$:

$$S_{\text{diff}}(P) = \exp\left( - \frac{(R_{\text{prob}} - R_{\text{target}})^2}{2 \sigma^2} \right)$$

This ensures problems that are slightly above the user's rating receive the highest scores, while problems that are either trivial or impossibly hard are penalized.

---

## 2. Topic Weakness Remediation ($S_{\text{weak}}$)

For each tag $t \in P.\text{tags}$, the user's performance is analyzed:
- **Weak Topic** (accuracy $< 40\%$, $\ge 4$ attempts): priority $0.95$
- **Developing Topic** ($40\% \le \text{accuracy} < 70\%$): priority $0.75$
- **Insufficient Data** ($< 4$ attempts): exploratory priority $0.60$
- **Strong Topic** ($\text{accuracy} \ge 70\%$): maintenance priority $0.40$

$$S_{\text{weak}}(P) = \max_{t \in P.\text{tags}} \text{Priority}(t)$$

---

## 3. Semantic Similarity ($S_{\text{sem}}$)

Using Sentence Transformers (`all-MiniLM-L6-v2`), 384-dimensional dense vectors $\mathbf{e}_{\text{prob}}$ are generated for problem metadata and matched against the user's target focus vector $\mathbf{e}_{\text{focus}}$ via cosine similarity:

$$S_{\text{sem}}(P) = \max\left(0, \frac{\mathbf{e}_{\text{focus}} \cdot \mathbf{e}_{\text{prob}}}{\|\mathbf{e}_{\text{focus}}\| \|\mathbf{e}_{\text{prob}}\|}\right)$$

---

## 4. Solved Problem Exclusion & Redemption Policy

1. **Strict Exclusion**: Any problem key where the user has a submission with `verdict == 'OK'` is strictly filtered out.
2. **Redemption Opportunity**: Problems where the user submitted failed attempts (WA, TLE, MLE) without ever solving them are boosted with a redemption explanation.

---

## 5. Topic Diversity Mechanism

To prevent presenting 10 consecutive Dynamic Programming or Math problems, the selection algorithm tracks tag frequencies in the output set. If a candidate's primary tag has already appeared in 2 selections, it is deprioritized in favor of other essential algorithms.
