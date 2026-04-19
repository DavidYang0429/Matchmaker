// Drop this into your App.jsx and replace fetchAI() with generateReport()
// Returns the same section structure the AI would — renders identically.

function generateReport(p, h, exp, score) {
  const name = p.name.trim() || (p.gender === "male" ? "You" : "You");
  const N = name;
  const isMale = p.gender === "male";
  const age = Number(p.age);
  const income = Number(p.income);
  const assets = Number(p.assets || 0) + Number(p.propertyValue || 0);
  const looks = Number(p.looks);
  const habitAdj = calcHabitAdj(h, p.gender) * 0.5;
  const lvl = getMarketLevel(score);
  const profLabel = (professions[p.gender].find(x => x.value === p.profession) || {}).label || p.profession;

  // --- MARKET REALITY CHECK ---
  function marketReality() {
    let tier = lvl.label;
    let lines = [];

    if (isMale) {
      const incLabel = getIncomeTierLabel(income);
      const assetLabel = getAssetLabel(assets);
      lines.push(`${N}'s overall market score is ${score}/10, placing ${N} in the ${tier} bracket. The primary driver of this score is economic output: an annual income of ${income}万 RMB (${incLabel}) and total assets of ${assets}万 RMB (${assetLabel}).`);

      if (score >= 8) lines.push(`At this level, ${N} can realistically access women aged ${age - 10}–${age - 3} with looks of 6–7+, stable professions, and strong family backgrounds. The main risk is not competition — it's being targeted by candidates who are primarily motivated by economic interest.`);
      else if (score >= 6.5) lines.push(`${N} is competitive for women aged ${age - 5}–${age + 1}, looks 5–6, with stable jobs (civil servant, teacher, SOE). This is a wide and healthy pool — the issue is usually speed, not eligibility.`);
      else if (score >= 5) lines.push(`${N}'s economic foundation needs strengthening before accessing higher-tier candidates. Currently realistic targets are women aged ${age - 2}–${age + 3}, looks 4.5–5.5, standard professions. The pool is workable but requires realistic expectations.`);
      else lines.push(`At the current score, ${N} is in a challenging position. Immediate priorities should be income growth, asset accumulation, or both — before investing heavily in the search process.`);

      if (p.profession === "doctor") lines.push(`Being a top-tier hospital doctor is one of the strongest long-term signals in the market — value increases with age and career seniority. This partially compensates for lower current income or assets.`);
      if (p.profession === "civil") lines.push(`Civil servant status carries a significant stability premium — especially valued by partner families who prioritize long-term security over peak income.`);
      if (p.hasCar === "no" && income >= 15) lines.push(`The absence of a car at this income level is a visibility gap — it reduces perceived status in social and dating contexts even if the underlying financials are solid.`);

    } else {
      lines.push(`${N}'s market score of ${score}/10 (${tier}) is primarily determined by two factors: looks at ${looks}/10 and age window at ${age} years old. These two dimensions carry the heaviest weight for women in the marriage market.`);

      if (age <= 24) lines.push(`At ${age}, ${N} is in the absolute peak window. This is the moment of maximum optionality — the ability to match upward 1–2 tiers is real and time-limited. Acting decisively now yields far better outcomes than waiting.`);
      else if (age <= 27) lines.push(`${N}'s golden window is open. Strong looks combined with this age range creates broad access. However, the window narrows meaningfully after 28 — time is an active factor in decision-making.`);
      else if (age <= 30) lines.push(`The window is still open but the competitive dynamic is shifting. Women aged 22–25 are increasingly the first choice for higher-tier men. ${N} needs to move with clear intent rather than waiting for the "right" feeling.`);
      else if (age <= 33) lines.push(`At ${age}, ${N} is past the yellow line. Options still exist, but the pool of high-quality unmarried men shrinks significantly from here. Realistic targets are men who are slightly older, previously focused on career, or in specific stable-profession categories.`);
      else lines.push(`At ${age}, the market reality is constrained. The most viable path is targeting men aged ${age + 3}–${age + 10} who prioritize stability and shared life-stage over youth. Significant expectation adjustment is non-negotiable.`);

      if (p.profession === "teacher") lines.push(`Tenured teacher is the single most valued female profession across all male market tiers — the combination of stability, school holidays, and perceived nurturing quality makes this a genuine competitive advantage.`);
      if (income >= 100) lines.push(`High income (${income}万) is a double-edged factor for women. It signals competence but can intimidate men who derive their self-worth from being providers. This requires a specific communication and positioning strategy.`);
    }

    if (p.parentsMarried === "divorced") lines.push(`The single most important variable to address: divorced parents. Partner families routinely reject candidates for this reason without stating it directly. Expect silent dropouts at the family-meeting stage. The highest-probability strategy is matching with partners who also come from divorced families.`);
    if (p.marriageHistory === "divorced_with_child") lines.push(`Divorce with child(ren) applies a significant market discount — particularly for women. The highest-probability matches are with others who are also divorced, or with older men who are established and unbothered by this.`);

    return lines.join("\n\n");
  }

  // --- HABIT ASSESSMENT ---
  function habitAssessment() {
    let lines = [];
    const adj = habitAdj;

    lines.push(`${N}'s habit profile contributes a ${adj >= 0 ? "positive +" : "negative "}${Math.abs(adj).toFixed(1)} point adjustment to the overall score. Habits matter less in early dating but become decisive in marriage — they determine the daily texture of shared life.`);

    // Negatives first
    if (h.temper === "volatile") lines.push(`Volatile temper is the single most corrosive habit in marriage. It erodes trust, creates fear-based dynamics, and is the #1 predictor of relationship breakdown. This needs active, structured work — therapy or anger management — before serious commitment.`);
    else if (h.temper === "hot") lines.push(`A quick temper may not destroy a relationship, but it will consistently damage it. In marriage, conflict frequency and resolution style matter more than compatibility on paper. Developing pause-and-respond habits before escalation is a concrete priority.`);

    if (h.gambling === "regular") lines.push(`Regular gambling is near-disqualifying for serious marriage candidates across all tiers. Partner families will investigate — and they will find out. This is not something to manage quietly; it needs to stop.`);
    else if (h.gambling === "occasional") lines.push(`Occasional gambling should not be volunteered early in courtship. It's not a dealbreaker for most, but it raises risk flags that take time to overcome.`);

    if (h.smoking === "daily" && !isMale) lines.push(`Daily smoking carries a heavier penalty for women than men in the marriage market. In-law families consistently rate it as a concern — particularly around child-rearing. It costs roughly 1+ points and is worth addressing seriously.`);
    else if (h.smoking === "daily") lines.push(`Daily smoking is a visible negative signal — particularly to health-conscious partners and families. It also limits the pool of non-smoking partners who have it as a dealbreaker.`);

    if (h.spending === "debt") lines.push(`Consumer debt is a serious red flag for a long-term partner. It signals financial instability and poor impulse control. Before entering serious dating, clearing this debt is a high-priority action — it affects both the score and the foundation of any future partnership.`);
    else if (h.spending === "spender") lines.push(`Free-spending habits tend to create friction with financially disciplined partners — and financially disciplined partners are exactly the ones worth attracting. This doesn't require becoming miserly, but developing visible financial structure helps.`);

    if (h.hygieneLevel === "poor") lines.push(`Poor personal hygiene is a direct physical dealbreaker in close-proximity relationships. It is also one of the most fixable issues — and should be treated as the highest priority because it affects every first impression and every day of cohabitation.`);

    // Positives
    if (h.fitness === "regular") lines.push(`Regular exercise is a compounding asset: it improves looks, signals discipline, and correlates strongly with long-term health — all factors that partners and their families consciously or unconsciously evaluate.`);
    if (h.spending === "saver") lines.push(`Financial discipline is highly attractive across all market tiers. It signals reliability, future-orientation, and the ability to build shared wealth — all of which matter enormously in a marriage context.`);
    if (h.familyOriented === "yes") lines.push(`A family-first mindset is explicitly valued — particularly by partner families who are assessing whether ${N} will be a committed spouse and present parent. This is a genuine competitive advantage.`);
    if (h.punctual === "yes") lines.push(`Punctuality and reliability seem minor but consistently rank high in long-term compatibility surveys. They signal respect and predictability — qualities that become more important once the excitement of early courtship fades.`);
    if (h.sleep === "regular") lines.push(`A regular sleep schedule signals life stability and health consciousness. It also predicts easier cohabitation — wildly mismatched schedules are a common source of chronic friction in married life.`);

    if (adj >= 0.5) lines.push(`Overall, ${N}'s habit profile is a genuine asset. It strengthens the candidacy in ways that are hard to fake and hard for competitors to replicate quickly.`);
    else if (adj < -0.5) lines.push(`The net habit picture requires honest attention. These patterns don't disappear after marriage — they intensify under the pressure of shared finances, children, and daily proximity.`);

    return lines.join("\n\n");
  }

  // --- COMPETITIVE LANDSCAPE ---
  function competitiveLandscape() {
    let lines = [];

    if (isMale) {
      if (income >= 100) {
        lines.push(`${N}'s real competitors are other high-income men — typically mid-30s with established careers, property, and social status. The competition is not about eligibility; it's about differentiation. The candidates ${N} wants are also wanted by many others.`);
        lines.push(`The comparative advantage here is specificity: identify the sub-market where ${N}'s profile is uniquely strong. For example, in Tier 3–4 cities or smaller markets, ${N}'s income level is dominant. In tier-1 cities, the same income faces significantly more competition.`);
      } else if (income >= 40) {
        lines.push(`${N} is competing primarily with similarly-salaried men in the same city and age bracket. The differentiators at this tier are stability signals: property ownership, car, profession type, and family background.`);
        if (p.profession === "doctor" || p.profession === "civil") lines.push(`${N}'s profession (${profLabel}) is a genuine competitive edge at this income level — it signals a trajectory and long-term value that men in private-sector jobs at the same income cannot match.`);
      } else {
        lines.push(`At the current income level, ${N} is competing with a large pool of similarly-positioned men. The path to differentiation is not winning the income race — it's finding the sub-market where other strengths dominate.`);
        lines.push(`The highest-probability niche: women in similar life stages (same age range, starting their careers) who are not yet being pursued by higher-income men. Younger men who compete on energy, attention, and presence — rather than assets — can win this segment.`);
      }
    } else {
      if (looks >= 7) {
        lines.push(`${N}'s looks score of ${looks}/10 places her in a genuinely rare category. The competitive landscape is favorable — but the risk is being targeted for short-term interest by men who are not serious about marriage. The challenge shifts from attracting attention to filtering for genuine intent.`);
      } else if (looks >= 5.5) {
        lines.push(`At looks ${looks}/10, ${N} is competitive but not in a position to rely on appearance alone to outcompete younger or better-looking candidates for the same high-tier men. The differentiating factors need to come from stability signals: profession, family background, and character.`);
      } else {
        lines.push(`Below the looks threshold that high-tier men prioritize, ${N}'s competitive strategy needs to shift. The most effective niche: men who have been too busy building careers to date actively, who are more interested in stability and life-stage alignment than appearance.`);
      }

      if (p.cityTier === "tier1") lines.push(`In a tier-1 city, the female dating pool is highly competitive — quality women from across the country converge here. Serious consideration should be given to expanding the search radius to nearby tier-2 cities (e.g. Hangzhou, Suzhou, Nanjing) where the same profile commands significantly more relative advantage.`);
    }

    lines.push(`The strategic principle: don't fight where ${N} loses. Identify the specific combination of age range, city, profession type, and channel where ${N}'s profile is in the top 20% — and concentrate effort there.`);

    return lines.join("\n\n");
  }

  // --- THE ONE TRADE-OFF ---
  function tradeOff() {
    let lines = [];

    lines.push(`Every person in the marriage market faces one fundamental choice: optimize for emotional value (attraction, chemistry, feeling understood) or optimize for practical value (stability, financial security, family approval). Both cannot be maximized simultaneously.`);

    if (isMale) {
      if (income >= 60) lines.push(`For ${N} at this income level, the temptation is to pursue high-looks women. That pool is accessible — but high-looks women at this tier often come with higher expectations, more options, and lower tolerance for imperfection. The trade-off: if ${N} pursues the most attractive candidates, accept that the relationship will require more effort, more competition, and more uncertainty. If ${N} targets looks 5–6 with exceptional character and stability, the relationship has a dramatically higher probability of long-term success and mutual satisfaction.`);
      else lines.push(`For ${N} at the current stage, the trade-off is looks vs. practicality. Choosing a highly attractive partner means accepting that she has more options and you are not yet her first choice economically. Choosing a practical, stable partner means accepting lower initial excitement — but significantly higher relationship security.`);
    } else {
      if (age <= 27 && looks >= 6) lines.push(`${N} has a genuine window to optimize for both — but not forever. The choice right now is: pursue the most emotionally exciting high-status man (high risk, high reward, narrow window) or lock in a stable, quality match who may not generate the same initial excitement but offers a reliable long-term partnership. Most women who wait for "both" find at 32 that the exciting men have moved to younger candidates and the stable men have been taken.`);
      else if (age >= 30) lines.push(`The trade-off for ${N} at ${age} is between holding out for emotional resonance with a high-tier man, or accepting a high-probability match that may not initially feel "exciting" but is genuinely compatible. The data is unambiguous: the longer this decision is deferred, the narrower the realistic options become. The exciting feeling with an ideal partner is available — but it requires accepting that "ideal" means different things at 30 than it did at 24.`);
      else lines.push(`${N}'s core trade-off: a man who feels exciting but whose long-term trajectory is uncertain, vs. a man who feels stable but requires time to develop emotional depth. The honest answer for most women is that stability, chosen consciously, becomes genuinely attractive over time. The excitement of an early-stage mismatch does not.`);
    }

    return lines.join("\n\n");
  }

  // --- EXPECTATION REALITY CHECK ---
  function expectationCheck() {
    let lines = [];
    const tLooks = Number(exp.targetLooks);
    const tIncome = Number(exp.targetIncome);
    const tFamily = Number(exp.targetFamily);
    const mustHave = exp.mustHave;
    const dealBreaker = exp.dealBreaker;

    const totalDemand = (tLooks + tIncome + tFamily) / 3;
    const gap = expScore !== null ? (expScore - score) : null;

    lines.push(`${N} is placing a combined emphasis of ${totalDemand.toFixed(1)}/10 across looks, income, and family background for a partner. ${gap !== null ? `Against a personal market score of ${score}/10, this represents a ${gap > 0 ? "+" + gap : gap} point gap.` : ""}`);

    if (gap !== null && gap > 2) {
      lines.push(`This is a significant mismatch. The partners ${N} is targeting would be choosing among people with stronger overall profiles. The honest diagnostic question: what does ${N} offer that a competitor with a similar or better score cannot? If the answer is unclear, the expectations need to come down — not as a defeat, but as a strategic recalibration.`);
    } else if (gap !== null && gap > 1) {
      lines.push(`There is a moderate stretch in the expectations. This is achievable but will require either improving the personal score (income, assets, looks) or accepting that securing this level of match will take longer and require more active searching.`);
    } else if (gap !== null && gap <= 0) {
      lines.push(`${N}'s expectations are realistic or conservative relative to the market score. This is the right starting position — the focus should be on execution and channel quality rather than recalibrating targets.`);
    }

    if (mustHave) lines.push(`Stated must-haves: "${mustHave}." Keep these — but apply them as filters after establishing basic compatibility, not as the first screen. Leading with hard requirements tends to eliminate good candidates before any real evaluation can happen.`);
    if (dealBreaker) lines.push(`Stated deal-breakers: "${dealBreaker}." These are legitimate. Apply them early in the screening process to avoid investing time in incompatible matches.`);

    lines.push(`The rule that holds across all tiers: keep 1–2 core non-negotiables, release everything else into the "nice to have" column. Every additional hard requirement cuts the viable pool exponentially — often into single digits for a given city.`);

    return lines.join("\n\n");
  }

  // --- 90-DAY ACTION PLAN ---
  function actionPlan() {
    const actions = [];

    if (isMale) {
      if (p.hasCar === "no" && income >= 15) actions.push(`Buy a mid-range car within 30 days. At ${income}万/year, this is fully achievable and is the single highest-ROI visibility investment available. A BMW 3 series or Mercedes C-class (used) creates an immediate shift in how you are perceived in social and dating contexts.`);
      if (looks < 6) actions.push(`Invest in appearance: hairstyle overhaul (500–1000元), wardrobe upgrade (3000–5000元 on key pieces), and start a structured gym program. Combined, these can add 0.5–1 point to the looks score within 90 days. The ROI is direct and fast.`);
      if (income < 20 && age > 28) actions.push(`Income growth is the highest-leverage action at this stage. Any move that increases annual income — a job switch, a negotiation, a side business — has compounding effects on the marriage market score. Prioritize this above all social efforts.`);
      actions.push(`Activate your referral network immediately. Tell 5–8 people you trust that you are seriously looking. Friends-of-friends introductions are still the highest-conversion channel for serious matches — higher than any app.`);
      actions.push(`Attend 1–2 large-format social or speed-dating events within 60 days. The primary purpose is not to find a match but to calibrate your real-time attractiveness signal — how many people show genuine interest gives you a reliable external score.`);
      if (p.parentsMarried === "divorced") actions.push(`When partner families become involved, address the divorced parents situation proactively and calmly rather than waiting for it to surface. Pairs who are both from divorced families are the highest-probability match — prioritize channels where this can be screened for early.`);
    } else {
      if (age >= 28) actions.push(`Switch to active mode immediately. Waiting for men to approach is a strategy that works at 23 — at ${age}, the highest-quality available men are not necessarily the most visible ones. Reach out first, express interest clearly, and reduce the ambiguity that causes good candidates to self-select out.`);
      if (looks < 5.5) actions.push(`Body composition and styling are the fastest levers available. A 5kg weight loss combined with a professional wardrobe and hair consultation can realistically move the looks score by 0.5–1 point within 90 days. This is the highest-ROI investment at this stage.`);
      actions.push(`Tell your entire trusted network you are actively looking. In non-tier-1 cities especially, family and friend introductions remain the most reliable channel for serious, vetted matches. Reduce any reluctance to be "known to be looking" — it helps, not hurts.`);
      if (p.cityTier === "tier1") actions.push(`Seriously evaluate tier-2 cities within travel distance. The same profile that makes you one of many in Shanghai or Beijing makes you a top candidate in Hangzhou, Suzhou, or Nanjing. A 3-month trial expansion of search radius has low cost and potentially high return.`);
      actions.push(`Join 1–2 curated interest-based groups (not apps) — hiking clubs, professional associations, alumni networks. These create natural contexts for meeting men who are actively engaged in life, which is a stronger signal than app presence.`);
      if (income >= 80) actions.push(`Avoid leading with income or career achievement in early conversations. The goal is to create space for a man to feel genuinely useful and valued — not to compete with him. Save the professional accomplishments for when the relationship has roots.`);
    }

    // Habit-specific actions
    if (h.temper === "volatile" || h.temper === "hot") actions.push(`Start working on emotional regulation concretely — not just intention. A structured approach (therapy, breathing practices, journaling) started within 2 weeks will show tangible results within 90 days and directly improves relationship sustainability.`);
    if (h.spending === "debt") actions.push(`Create a clear debt repayment plan with a specific end date. This is not just about the score — carrying consumer debt into a serious relationship creates foundational tension that compounds over time.`);
    if (h.smoking === "daily") actions.push(`Seriously evaluate quitting smoking before intensifying the search. The cost in perceived attractiveness — especially with partner families — is significant and ongoing. Even reducing to social smoking changes how you are received.`);

    return actions.map((a, i) => `${i + 1}. ${a}`).join("\n\n");
  }

  // --- FINAL VERDICT ---
  function finalVerdict() {
    let lines = [];

    if (score >= 8) {
      lines.push(`${N}'s profile is genuinely strong. The realistic ceiling here is a high-quality match with a partner who is also in the top tier — emotionally grounded, financially stable, and from a solid family. The risk at this level is not failing to attract candidates, but becoming overly selective and allowing analysis to delay action.`);
      lines.push(`The path forward for ${N} is about execution speed and channel quality rather than further self-improvement. The profile is ready. The matches are out there. The variable is how actively and strategically the search is conducted.`);
    } else if (score >= 6.5) {
      lines.push(`${N} is in a solid, competitive position with a realistic path to a quality match. The ceiling is a partner who is stable, values-aligned, and from a good family — not a compromise, but a genuinely good outcome that many people at higher scores still struggle to achieve.`);
      lines.push(`${N} has the foundation. What turns foundation into outcome is consistency of effort — maintaining the search actively, resisting the temptation to over-filter, and being willing to invest real time in candidates who are "good" even if not immediately electrifying.`);
    } else if (score >= 5) {
      lines.push(`${N}'s profile is workable but requires honest prioritization. The realistic ceiling right now is a match within 1 tier — someone who is stable, decent, and genuinely compatible, even if not the profile that was imagined at 22. This is not a disappointing outcome — it is a good life.`);
      lines.push(`The single most important thing ${N} can do is stop waiting for the conditions to be perfect before beginning. Begin now, gather real-world feedback, and let the market calibrate expectations more precisely than any tool can.`);
    } else {
      lines.push(`${N}'s current score reflects a profile that needs structural improvement before the search can be productive. The honest advice: invest the next 6–12 months in the 1–2 highest-leverage improvements (income, asset accumulation, or major habit changes) before intensifying the search.`);
      lines.push(`This is not a permanent position — it is a starting point. Many people have built from here to genuine, happy partnerships. The path requires clarity about what needs to change and the discipline to change it. ${N} has the self-awareness to be here — that is already most of the work.`);
    }

    return lines.join("\n\n");
  }

  return [
    { title: "MARKET REALITY CHECK", body: marketReality() },
    { title: "HABIT ASSESSMENT", body: habitAssessment() },
    { title: "COMPETITIVE LANDSCAPE", body: competitiveLandscape() },
    { title: "THE ONE TRADE-OFF", body: tradeOff() },
    { title: "EXPECTATION REALITY CHECK", body: expectationCheck() },
    { title: "90-DAY ACTION PLAN", body: actionPlan() },
    { title: "FINAL VERDICT", body: finalVerdict() },
  ].map(sec => ({ title: sec.title, body: sec.body.split("\n\n").filter(Boolean) }));
}
