import { useState } from "react";

const STEPS = ["Profile", "Habits", "Expectations", "Report"];

const professions = {
  male: [
    { label: "Top-tier hospital doctor", value: "doctor", score: 9.5 },
    { label: "Civil servant / government", value: "civil", score: 8.5 },
    { label: "Big tech engineer", value: "bigtech", score: 8 },
    { label: "Finance — investment banking", value: "finance_ib", score: 8 },
    { label: "Finance — general (bank teller etc.)", value: "finance_gen", score: 5.5 },
    { label: "State-owned enterprise", value: "soe", score: 7.5 },
    { label: "Private company employee", value: "private", score: 5.5 },
    { label: "Self-employed / entrepreneur", value: "self", score: 7 },
    { label: "Other", value: "other", score: 5 },
  ],
  female: [
    { label: "Teacher — public school, tenured", value: "teacher", score: 9.5 },
    { label: "Civil servant / government", value: "civil", score: 9 },
    { label: "Doctor / nurse", value: "doctor", score: 8.5 },
    { label: "State-owned enterprise", value: "soe", score: 8 },
    { label: "Big tech employee", value: "bigtech", score: 7 },
    { label: "Private company employee", value: "private", score: 5.5 },
    { label: "Self-employed / entrepreneur", value: "self", score: 6 },
    { label: "Other", value: "other", score: 5 },
  ],
};

const eduScore = { phd: 10, masters_top: 9.5, masters: 8.5, bachelors_top: 8, bachelors: 7, associate: 5, highschool: 3.5 };
const eduLabels = { phd: "PhD", masters_top: "Master's — top university", masters: "Master's — other", bachelors_top: "Bachelor's — top university", bachelors: "Bachelor's — other", associate: "Associate / vocational", highschool: "High school or below" };
const cityLabels = { tier1: "Tier 1 city (Beijing / Shanghai / Shenzhen)", tier2: "Tier 2 city (provincial capitals)", tier3: "Tier 3–4 city (smaller cities)" };
const cityMul = { tier1: 0.85, tier2: 1, tier3: 1.1 };

// --- SCORING ENGINE ---

function calcAgeWindow(gender, age) {
  const a = Number(age);
  if (gender === "male") {
    if (a >= 33 && a <= 36) return 10;
    if (a >= 29 && a < 33) return 9;
    if (a >= 37 && a <= 40) return 8;
    if (a >= 24 && a < 29) return 7;
    if (a > 40 && a <= 45) return 5;
    if (a > 45) return 3.5;
    return 3;
  } else {
    if (a >= 22 && a <= 24) return 10;
    if (a >= 25 && a <= 27) return 8.5;
    if (a >= 28 && a <= 30) return 6.5;
    if (a >= 31 && a <= 33) return 4;
    if (a >= 34 && a <= 35) return 2.5;
    if (a >= 36) return 1.5;
    return 9;
  }
}

function calcIncomeTier(income) {
  const i = Number(income);
  if (i < 10) return 1.5;
  if (i < 20) return 4;
  if (i < 40) return 6;
  if (i < 100) return 8;
  if (i < 300) return 9.5;
  return 10;
}

function calcAssetTier(assets, propertyValue) {
  const a = Number(assets) + Number(propertyValue || 0);
  if (a < 10) return 1;
  if (a < 30) return 2.5;
  if (a < 100) return 4;
  if (a < 300) return 6;
  if (a < 1000) return 7.5;
  if (a < 5000) return 9;
  return 10;
}

function calcFamilyScore(p) {
  let score = 6;
  if (p.parentsMarried === "married") score += 2;
  else score -= 2;
  if (p.siblingStatus === "only") score += 1.5;
  else if (p.siblingStatus === "has_sister") score += 0.5;
  else score -= 0.5;
  if (p.familyAssetTier === "a8plus") score += 1;
  else if (p.familyAssetTier === "a7") score += 0;
  else score -= 1;
  return Math.min(10, Math.max(1, score));
}

function calcHabitAdj(h, gender) {
  let s = 0;
  if (h.smoking === "daily") s += gender === "female" ? -1.5 : -1.0;
  else if (h.smoking === "social") s += gender === "female" ? -0.7 : -0.4;
  if (h.drinking === "heavy") s -= 1.0;
  else if (h.drinking === "rarely") s += 0.1;
  if (h.gambling === "regular") s -= 1.5;
  else if (h.gambling === "occasional") s -= 0.5;
  if (h.sleep === "regular") s += 0.2;
  else if (h.sleep === "irregular") s -= 0.3;
  if (h.fitness === "regular") s += 0.35;
  else if (h.fitness === "none") s -= 0.1;
  if (h.spending === "saver") s += 0.3;
  else if (h.spending === "spender") s -= 0.3;
  else if (h.spending === "debt") s -= 0.9;
  if (h.temper === "calm") s += 0.25;
  else if (h.temper === "hot") s -= 0.5;
  else if (h.temper === "volatile") s -= 1.1;
  if (h.familyOriented === "yes") s += 0.25;
  else if (h.familyOriented === "no") s -= 0.3;
  if (h.punctual === "yes") s += 0.1;
  if (h.hygieneLevel === "excellent") s += 0.2;
  else if (h.hygieneLevel === "poor") s -= 0.5;
  if (h.socialMedia === "oversharing") s -= 0.2;
  return s;
}

function computeScore(p, h) {
  const ageW = calcAgeWindow(p.gender, p.age);
  const incomeS = calcIncomeTier(p.income);
  const assetS = calcAssetTier(p.assets, p.propertyValue);
  const looksS = Number(p.looks);
  const eduS = eduScore[p.education] || 5;
  const profS = (professions[p.gender].find(x => x.value === p.profession) || { score: 5 }).score;
  const familyS = calcFamilyScore(p);
  const mul = cityMul[p.cityTier] || 1;
  const totalAssets = Number(p.assets || 0) + Number(p.propertyValue || 0);
  const habitAdj = calcHabitAdj(h, p.gender) * 0.3;
  // Divorce/remarriage penalty
  const divorcePenalty = p.marriageHistory === "divorced_no_child" ? -0.5 : p.marriageHistory === "divorced_with_child" ? (p.gender === "female" ? -2.0 : -1.0) : 0;

  let raw;
  if (p.gender === "male") {
    raw = (incomeS * 3 + assetS * 2 + looksS * 1 + eduS * 1 + profS * 1.5 + ageW * 1 + familyS * 0.5) / 10;
  } else {
    raw = (looksS * 3 + ageW * 2.5 + familyS * 1.5 + eduS * 1 + profS * 1 + incomeS * 0.5) / 9.5;
  }
  return Math.min(10, Math.max(1, raw * mul + habitAdj + divorcePenalty));
}

function getMarketLevel(score) {
  if (score >= 8) return { label: "S-tier", color: "#1D9E75", bg: "#E1F5EE" };
  if (score >= 6.5) return { label: "A-tier", color: "#185FA5", bg: "#E6F1FB" };
  if (score >= 5) return { label: "B-tier", color: "#BA7517", bg: "#FAEEDA" };
  if (score >= 3.5) return { label: "C-tier", color: "#E24B4A", bg: "#FCEBEB" };
  return { label: "D-tier", color: "#A32D2D", bg: "#FCEBEB" };
}

function getIncomeTierLabel(income) {
  const i = Number(income);
  if (i < 10) return "L1 — Entry level";
  if (i < 20) return "L2 — Basic white-collar";
  if (i < 40) return "L3 — Mid-tier";
  if (i < 100) return "L4 — Strong earner";
  if (i < 300) return "L5 — High earner";
  return "L6 — Top tier";
}

function getAssetLabel(assets) {
  const a = Number(assets);
  if (a < 100) return "Below A6";
  if (a < 300) return "A6 (100–300万)";
  if (a < 1000) return "A7 (300万–1000万)";
  if (a < 5000) return "A8 (1000万–5000万)";
  if (a < 10000) return "A8.5 (5000万–1亿)";
  return "A9+ (1亿+)";
}

function getHabitFlags(h, gender) {
  const flags = [];
  if (h.smoking === "daily") flags.push({ type: "bad", text: "Daily smoking — serious liability, dealbreaker for most families" + (gender === "female" ? " (especially damaging for women)" : "") });
  else if (h.smoking === "social") flags.push({ type: "warn", text: "Social smoker — will raise concerns with many partner families" });
  if (h.drinking === "heavy") flags.push({ type: "bad", text: "Heavy drinking — major red flag for long-term compatibility and family approval" });
  if (h.gambling === "regular") flags.push({ type: "bad", text: "Regular gambling — near-disqualifying for serious marriage candidates" });
  else if (h.gambling === "occasional") flags.push({ type: "warn", text: "Occasional gambling — handle with caution; disclose carefully when appropriate" });
  if (h.spending === "debt") flags.push({ type: "bad", text: "Carrying consumer debt — signals financial instability; undermines trust" });
  else if (h.spending === "spender") flags.push({ type: "warn", text: "Free spender — likely to conflict with partners who value financial discipline" });
  if (h.temper === "volatile") flags.push({ type: "bad", text: "Volatile temper — the #1 predictor of relationship and marriage breakdown" });
  else if (h.temper === "hot") flags.push({ type: "warn", text: "Quick temper — needs active work before serious commitment" });
  if (h.hygieneLevel === "poor") flags.push({ type: "bad", text: "Poor personal hygiene — direct physical dealbreaker in close-proximity relationships" });
  if (h.fitness === "regular") flags.push({ type: "good", text: "Regular exercise — boosts attractiveness, signals self-discipline and health consciousness" });
  if (h.sleep === "regular") flags.push({ type: "good", text: "Stable sleep schedule — signals reliability and life structure; valued by families" });
  if (h.spending === "saver") flags.push({ type: "good", text: "Financially disciplined — strong signal of long-term partner quality" });
  if (h.familyOriented === "yes") flags.push({ type: "good", text: "Family-first mindset — highly valued across all market tiers" });
  if (h.punctual === "yes") flags.push({ type: "good", text: "Punctual and reliable — signals respect; consistently underrated in long-term compatibility" });
  if (h.hygieneLevel === "excellent") flags.push({ type: "good", text: "Excellent personal hygiene — a baseline that surprisingly many candidates fail" });
  return flags;
}

// Compute expected score of target partner
function calcExpectationScore(exp, targetGender) {
  const looks = Number(exp.targetLooks);
  const income = Number(exp.targetIncome);
  const family = Number(exp.targetFamily);
  const age = Number(exp.targetAge);
  const ageWindow = targetGender === "male" ? calcAgeWindow("male", age) : calcAgeWindow("female", age);
  if (targetGender === "male") {
    return (income * 3 + family * 2 + looks * 1 + ageWindow * 1) / 7;
  } else {
    return (looks * 3 + ageWindow * 2.5 + family * 1.5 + income * 0.5) / 7.5;
  }
}

// --- RULE-BASED REPORT ---

function generateReport(p, h, exp, score, expScore) {
  const name = p.name.trim() || (p.gender === "male" ? "You" : "You");
  const N = name;
  const isMale = p.gender === "male";
  const age = Number(p.age);
  const income = Number(p.income);
  const assets = Number(p.assets || 0) + Number(p.propertyValue || 0);
  const looks = Number(p.looks);
  const habitAdj = calcHabitAdj(h, p.gender) * 0.3;
  const lvl = getMarketLevel(score);
  const profLabel = (professions[p.gender].find(x => x.value === p.profession) || {}).label || p.profession;

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

  function habitAssessment() {
    let lines = [];
    const adj = habitAdj;
    lines.push(`${N}'s habit profile contributes a ${adj >= 0 ? "positive +" : "negative "}${Math.abs(adj).toFixed(1)} point adjustment to the overall score. Habits matter less in early dating but become decisive in marriage — they determine the daily texture of shared life.`);
    if (h.temper === "volatile") lines.push(`Volatile temper is the single most corrosive habit in marriage. It erodes trust, creates fear-based dynamics, and is the #1 predictor of relationship breakdown. This needs active, structured work — therapy or anger management — before serious commitment.`);
    else if (h.temper === "hot") lines.push(`A quick temper may not destroy a relationship, but it will consistently damage it. In marriage, conflict frequency and resolution style matter more than compatibility on paper. Developing pause-and-respond habits before escalation is a concrete priority.`);
    if (h.gambling === "regular") lines.push(`Regular gambling is near-disqualifying for serious marriage candidates across all tiers. Partner families will investigate — and they will find out. This is not something to manage quietly; it needs to stop.`);
    else if (h.gambling === "occasional") lines.push(`Occasional gambling should not be volunteered early in courtship. It's not a dealbreaker for most, but it raises risk flags that take time to overcome.`);
    if (h.smoking === "daily" && !isMale) lines.push(`Daily smoking carries a heavier penalty for women than men in the marriage market. In-law families consistently rate it as a concern — particularly around child-rearing. It costs roughly 1+ points and is worth addressing seriously.`);
    else if (h.smoking === "daily") lines.push(`Daily smoking is a visible negative signal — particularly to health-conscious partners and families. It also limits the pool of non-smoking partners who have it as a dealbreaker.`);
    if (h.spending === "debt") lines.push(`Consumer debt is a serious red flag for a long-term partner. It signals financial instability and poor impulse control. Before entering serious dating, clearing this debt is a high-priority action — it affects both the score and the foundation of any future partnership.`);
    else if (h.spending === "spender") lines.push(`Free-spending habits tend to create friction with financially disciplined partners — and financially disciplined partners are exactly the ones worth attracting. This doesn't require becoming miserly, but developing visible financial structure helps.`);
    if (h.hygieneLevel === "poor") lines.push(`Poor personal hygiene is a direct physical dealbreaker in close-proximity relationships. It is also one of the most fixable issues — and should be treated as the highest priority because it affects every first impression and every day of cohabitation.`);
    if (h.fitness === "regular") lines.push(`Regular exercise is a compounding asset: it improves looks, signals discipline, and correlates strongly with long-term health — all factors that partners and their families consciously or unconsciously evaluate.`);
    if (h.spending === "saver") lines.push(`Financial discipline is highly attractive across all market tiers. It signals reliability, future-orientation, and the ability to build shared wealth — all of which matter enormously in a marriage context.`);
    if (h.familyOriented === "yes") lines.push(`A family-first mindset is explicitly valued — particularly by partner families who are assessing whether ${N} will be a committed spouse and present parent. This is a genuine competitive advantage.`);
    if (h.punctual === "yes") lines.push(`Punctuality and reliability seem minor but consistently rank high in long-term compatibility surveys. They signal respect and predictability — qualities that become more important once the excitement of early courtship fades.`);
    if (h.sleep === "regular") lines.push(`A regular sleep schedule signals life stability and health consciousness. It also predicts easier cohabitation — wildly mismatched schedules are a common source of chronic friction in married life.`);
    if (adj >= 0.5) lines.push(`Overall, ${N}'s habit profile is a genuine asset. It strengthens the candidacy in ways that are hard to fake and hard for competitors to replicate quickly.`);
    else if (adj < -0.5) lines.push(`The net habit picture requires honest attention. These patterns don't disappear after marriage — they intensify under the pressure of shared finances, children, and daily proximity.`);
    return lines.join("\n\n");
  }

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

  function expectationCheck() {
    let lines = [];
    const tLooks = Number(exp.targetLooks);
    const tIncome = Number(exp.targetIncome);
    const tFamily = Number(exp.targetFamily);
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
    if (exp.mustHave) lines.push(`Stated must-haves: "${exp.mustHave}." Keep these — but apply them as filters after establishing basic compatibility, not as the first screen. Leading with hard requirements tends to eliminate good candidates before any real evaluation can happen.`);
    if (exp.dealBreaker) lines.push(`Stated deal-breakers: "${exp.dealBreaker}." These are legitimate. Apply them early in the screening process to avoid investing time in incompatible matches.`);
    lines.push(`The rule that holds across all tiers: keep 1–2 core non-negotiables, release everything else into the "nice to have" column. Every additional hard requirement cuts the viable pool exponentially — often into single digits for a given city.`);
    return lines.join("\n\n");
  }

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
    if (h.temper === "volatile" || h.temper === "hot") actions.push(`Start working on emotional regulation concretely — not just intention. A structured approach (therapy, breathing practices, journaling) started within 2 weeks will show tangible results within 90 days and directly improves relationship sustainability.`);
    if (h.spending === "debt") actions.push(`Create a clear debt repayment plan with a specific end date. This is not just about the score — carrying consumer debt into a serious relationship creates foundational tension that compounds over time.`);
    if (h.smoking === "daily") actions.push(`Seriously evaluate quitting smoking before intensifying the search. The cost in perceived attractiveness — especially with partner families — is significant and ongoing. Even reducing to social smoking changes how you are received.`);
    return actions.map((a, i) => `${i + 1}. ${a}`).join("\n\n");
  }

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

// --- UI ---
const inputStyle = { width: "100%", padding: "8px 10px", fontSize: 14, borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", boxSizing: "border-box" };
const labelStyle = { fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 4, display: "block" };
const fStyle = { marginBottom: 16 };

const Tog = ({ options, value, onChange, wrap }) => (
  <div style={{ display: "flex", gap: 6, flexWrap: wrap ? "wrap" : "nowrap" }}>
    {options.map(([v, l]) => (
      <button key={v} onClick={() => onChange(v)} style={{ padding: "6px 10px", borderRadius: 8, border: `0.5px solid ${value === v ? "#1D9E75" : "var(--color-border-secondary)"}`, background: value === v ? "#E1F5EE" : "var(--color-background-primary)", color: value === v ? "#0F6E56" : "var(--color-text-primary)", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap", flex: wrap ? "none" : 1 }}>
        {l}
      </button>
    ))}
  </div>
);

const sectionStyle = {
  "MARKET REALITY CHECK": { bg: "#E6F1FB", border: "#B5D4F4", title: "#0C447C" },
  "HABIT ASSESSMENT": { bg: "#EAF3DE", border: "#C0DD97", title: "#27500A" },
  "COMPETITIVE LANDSCAPE": { bg: "#FAEEDA", border: "#FAC775", title: "#633806" },
  "THE ONE TRADE-OFF": { bg: "#FBEAF0", border: "#F4C0D1", title: "#4B1528" },
  "EXPECTATION REALITY CHECK": { bg: "#EEEDFE", border: "#CECBF6", title: "#26215C" },
  "90-DAY ACTION PLAN": { bg: "#E1F5EE", border: "#9FE1CB", title: "#04342C" },
  "FINAL VERDICT": { bg: "#F1EFE8", border: "#D3D1C7", title: "#2C2C2A" },
};

export default function App() {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({
    name: "", gender: "male", age: "", looks: 5, income: "", assets: "",
    education: "bachelors", profession: "private", parentsMarried: "married",
    siblingStatus: "only", familyAssetTier: "a7", cityTier: "tier2",
    incomeTrend: "stable", hasCar: "no", marriageHistory: "never",
    propertyValue: "0", hukou: "other"
  });
  const [h, setH] = useState({
    smoking: "never", drinking: "rarely", gambling: "never", sleep: "regular",
    fitness: "occasional", spending: "balanced", temper: "calm",
    familyOriented: "yes", punctual: "yes", hygieneLevel: "good", socialMedia: "normal"
  });
  const [exp, setExp] = useState({ targetLooks: 6, targetIncome: 6, targetFamily: 6, targetAge: "", mustHave: "", dealBreaker: "" });
  const [score, setScore] = useState(null);
  const [sections, setSections] = useState([]);

  const sp = (k, v) => setP(x => ({ ...x, [k]: v }));
  const sh = (k, v) => setH(x => ({ ...x, [k]: v }));
  const se = (k, v) => setExp(x => ({ ...x, [k]: v }));
  const canGo0 = p.age && p.income && p.assets;

  function generate() {
    const s = Math.round(computeScore(p, h) * 10) / 10;
    setScore(s);
    const targetGdr = p.gender === "male" ? "female" : "male";
    const es = exp.targetAge ? Math.round(calcExpectationScore(exp, targetGdr) * 10) / 10 : null;
    setSections(generateReport(p, h, exp, s, es));
    setStep(3);
  }

  const lvl = score ? getMarketLevel(score) : null;
  const profLabel = (professions[p.gender].find(x => x.value === p.profession) || {}).label || p.profession;
  const habitFlags = getHabitFlags(h, p.gender);
  const habitAdj = calcHabitAdj(h, p.gender);
  const targetGender = p.gender === "male" ? "female" : "male";
  const expScore = exp.targetAge ? Math.round(calcExpectationScore(exp, targetGender) * 10) / 10 : null;
  const gap = (score && expScore) ? Math.round((expScore - score) * 10) / 10 : null;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>Marriage compatibility matcher</h2>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20 }}>A professional-grade tool to assess your market position and identify your ideal match.</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 3, borderRadius: 2, background: i <= step ? "#1D9E75" : "var(--color-border-tertiary)", marginBottom: 5 }} />
            <span style={{ fontSize: 10, color: i <= step ? "#1D9E75" : "var(--color-text-tertiary)" }}>{s}</span>
          </div>
        ))}
      </div>

      {/* STEP 0 */}
      {step === 0 && (
        <div>
          <div style={fStyle}>
            <label style={labelStyle}>Your name (optional — personalizes your AI report)</label>
            <input style={inputStyle} placeholder="e.g. Sarah, Michael…" value={p.name} onChange={e => sp("name", e.target.value)} />
          </div>
          <div style={fStyle}>
            <label style={labelStyle}>Gender</label>
            <Tog options={[["male","Male"],["female","Female"]]} value={p.gender} onChange={v => sp("gender", v)} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fStyle}>
              <label style={labelStyle}>Age</label>
              <input style={inputStyle} type="number" placeholder="e.g. 28" value={p.age} onChange={e => sp("age", e.target.value)} />
            </div>
            <div style={fStyle}>
              <label style={labelStyle}>Annual income after tax (万 RMB)</label>
              <input style={inputStyle} type="number" placeholder="e.g. 30" value={p.income} onChange={e => sp("income", e.target.value)} />
            </div>
          </div>
          {p.income && <div style={{ fontSize: 12, color: "#185FA5", marginTop: -10, marginBottom: 14 }}>{getIncomeTierLabel(p.income)}</div>}
          <div style={fStyle}>
            <label style={labelStyle}>Income trend</label>
            <Tog options={[["rising","Rising"],["stable","Stable"],["declining","Declining"]]} value={p.incomeTrend} onChange={v => sp("incomeTrend", v)} />
          </div>
          <div style={fStyle}>
            <label style={labelStyle}>Total personal assets (万 RMB — savings, investments, minus debts, excluding property)</label>
            <input style={inputStyle} type="number" placeholder="e.g. 50" value={p.assets} onChange={e => sp("assets", e.target.value)} />
          </div>
          {p.assets && <div style={{ fontSize: 12, color: "#185FA5", marginTop: -10, marginBottom: 14 }}>{getAssetLabel(p.assets)}</div>}
          <div style={fStyle}>
            <label style={labelStyle}>Property value owned (万 RMB, your equity share after mortgage)</label>
            <input style={inputStyle} type="number" placeholder="e.g. 200 (0 if renting)" value={p.propertyValue} onChange={e => sp("propertyValue", e.target.value)} />
          </div>
          {p.propertyValue > 0 && <div style={{ fontSize: 12, color: "#185FA5", marginTop: -10, marginBottom: 14 }}>{Number(p.propertyValue) >= 500 ? "Strong property position" : Number(p.propertyValue) >= 200 ? "Solid property equity" : "Entry-level property equity"}</div>}
          <div style={fStyle}>
            <label style={labelStyle}>Own a car?</label>
            <Tog options={[["yes","Yes"],["no","No"]]} value={p.hasCar} onChange={v => sp("hasCar", v)} />
          </div>
          <div style={fStyle}>
            <label style={labelStyle}>Hukou (household registration)</label>
            <Tog options={[["beijing","Beijing"],["shanghai","Shanghai"],["tier1other","Other tier-1"],["other","Other / N/A"]]} value={p.hukou} onChange={v => sp("hukou", v)} wrap />
          </div>
          <div style={fStyle}>
            <label style={labelStyle}>City tier you live in</label>
            <select style={inputStyle} value={p.cityTier} onChange={e => sp("cityTier", e.target.value)}>
              <option value="tier1">Tier 1 (Beijing / Shanghai / Shenzhen / Guangzhou)</option>
              <option value="tier2">Tier 2 (provincial capitals)</option>
              <option value="tier3">Tier 3–4 (smaller cities / towns)</option>
            </select>
          </div>
          <div style={fStyle}>
            <label style={labelStyle}>Looks — opposite-sex rating: {p.looks}/10</label>
            <input type="range" min="1" max="10" step="0.5" value={p.looks} onChange={e => sp("looks", e.target.value)} style={{ width: "100%" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3 }}>
              <span>3 — below avg</span><span>4–5 — average</span><span>6 — standout</span><span>7+ — rare</span>
            </div>
          </div>
          <div style={fStyle}>
            <label style={labelStyle}>Education</label>
            <select style={inputStyle} value={p.education} onChange={e => sp("education", e.target.value)}>
              {Object.entries(eduLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={fStyle}>
            <label style={labelStyle}>Profession</label>
            <select style={inputStyle} value={p.profession} onChange={e => sp("profession", e.target.value)}>
              {professions[p.gender].map(x => <option key={x.value} value={x.value}>{x.label}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fStyle}>
              <label style={labelStyle}>Parents' marriage</label>
              <select style={inputStyle} value={p.parentsMarried} onChange={e => sp("parentsMarried", e.target.value)}>
                <option value="married">Intact / married</option>
                <option value="divorced">Divorced</option>
              </select>
            </div>
            <div style={fStyle}>
              <label style={labelStyle}>Sibling situation</label>
              <select style={inputStyle} value={p.siblingStatus} onChange={e => sp("siblingStatus", e.target.value)}>
                <option value="only">Only child</option>
                <option value="has_sister">Has sister(s)</option>
                <option value="has_brother">Has brother(s)</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={fStyle}>
              <label style={labelStyle}>Family asset level</label>
              <select style={inputStyle} value={p.familyAssetTier} onChange={e => sp("familyAssetTier", e.target.value)}>
                <option value="a6below">Below A6 (&lt;100万)</option>
                <option value="a6">A6 (100–300万)</option>
                <option value="a7">A7 (300万–1000万)</option>
                <option value="a8plus">A8+ (1000万+)</option>
              </select>
            </div>
            <div style={fStyle}>
              <label style={labelStyle}>Marriage / divorce history</label>
              <select style={inputStyle} value={p.marriageHistory} onChange={e => sp("marriageHistory", e.target.value)}>
                <option value="never">Never married</option>
                <option value="divorced_no_child">Divorced, no children</option>
                <option value="divorced_with_child">Divorced with child(ren)</option>
              </select>
            </div>
          </div>
          <button disabled={!canGo0} onClick={() => setStep(1)} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: canGo0 ? "#1D9E75" : "var(--color-border-tertiary)", color: canGo0 ? "#fff" : "var(--color-text-tertiary)", fontSize: 15, cursor: canGo0 ? "pointer" : "not-allowed", fontWeight: 500 }}>
            Next: Personal habits →
          </button>
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20 }}>Habits reveal who you really are as a daily partner. They shape compatibility as much as income or looks — be honest.</p>
          {[
            { key: "smoking", label: "Smoking", opts: [["never","Non-smoker"],["social","Social smoker"],["daily","Daily smoker"]] },
            { key: "drinking", label: "Drinking", opts: [["rarely","Rarely / never"],["social","Social drinker"],["heavy","Regular / heavy"]] },
            { key: "gambling", label: "Gambling", opts: [["never","Never"],["occasional","Occasionally"],["regular","Regularly"]] },
            { key: "sleep", label: "Sleep schedule", opts: [["regular","Regular hours"],["late","Night owl"],["irregular","Very irregular"]] },
            { key: "fitness", label: "Exercise / fitness", opts: [["regular","Regular (3+/wk)"],["occasional","Occasionally"],["none","Rarely / never"]] },
            { key: "spending", label: "Financial habits", opts: [["saver","Disciplined saver"],["balanced","Balanced"],["spender","Free spender"],["debt","Carrying debt"]] },
            { key: "temper", label: "Emotional control", opts: [["calm","Generally calm"],["hot","Quick-tempered"],["volatile","Volatile"]] },
            { key: "familyOriented", label: "Family orientation", opts: [["yes","Family-first"],["neutral","Neutral"],["no","Career-first"]] },
            { key: "punctual", label: "Punctuality & reliability", opts: [["yes","Reliable & punctual"],["no","Often late / unreliable"]] },
            { key: "hygieneLevel", label: "Personal hygiene", opts: [["excellent","Excellent"],["good","Good"],["poor","Inconsistent / poor"]] },
            { key: "socialMedia", label: "Social media behavior", opts: [["private","Very private"],["normal","Normal"],["oversharing","Overshares publicly"]] },
          ].map(({ key, label, opts }) => (
            <div style={fStyle} key={key}>
              <label style={labelStyle}>{label}</label>
              <Tog options={opts} value={h[key]} onChange={v => sh(key, v)} wrap />
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button onClick={() => setStep(0)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-primary)", fontSize: 14, cursor: "pointer" }}>← Back</button>
            <button onClick={() => setStep(2)} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: "#1D9E75", color: "#fff", fontSize: 15, cursor: "pointer", fontWeight: 500 }}>Next: Expectations →</button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 20 }}>Inflated expectations are the #1 reason good candidates stay single. Be honest about what you're actually looking for.</p>
          {[
            { key: "targetLooks", label: "How important is your partner's looks?" },
            { key: "targetIncome", label: "How important is your partner's income / assets?" },
            { key: "targetFamily", label: "How important is your partner's family background?" },
          ].map(({ key, label }) => (
            <div style={fStyle} key={key}>
              <label style={labelStyle}>{label} — {exp[key]}/10</label>
              <input type="range" min="1" max="10" step="1" value={exp[key]} onChange={e => se(key, e.target.value)} style={{ width: "100%" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-tertiary)" }}>
                <span>1 — not important</span><span>5 — moderate</span><span>10 — non-negotiable</span>
              </div>
            </div>
          ))}
          <div style={fStyle}>
            <label style={labelStyle}>Ideal partner age (for expectation calculation)</label>
            <input style={inputStyle} type="number" placeholder="e.g. 30" value={exp.targetAge} onChange={e => se("targetAge", e.target.value)} />
          </div>
          <div style={fStyle}>
            <label style={labelStyle}>Top 1–2 must-haves</label>
            <input style={inputStyle} placeholder="e.g. stable job, non-smoker, family-oriented" value={exp.mustHave} onChange={e => se("mustHave", e.target.value)} />
          </div>
          <div style={fStyle}>
            <label style={labelStyle}>Absolute deal-breakers</label>
            <input style={inputStyle} placeholder="e.g. smoker, gambling, divorced parents" value={exp.dealBreaker} onChange={e => se("dealBreaker", e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-primary)", fontSize: 14, cursor: "pointer" }}>← Back</button>
            <button onClick={generate} style={{ flex: 2, padding: "10px", borderRadius: 8, border: "none", background: "#1D9E75", color: "#fff", fontSize: 15, cursor: "pointer", fontWeight: 500 }}>Generate my report →</button>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && score !== null && lvl && (
        <div>
          {/* Score card */}
          <div style={{ background: lvl.bg, borderRadius: 12, padding: "1.5rem", marginBottom: 20, textAlign: "center" }}>
            {p.name && <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 2 }}>Report for {p.name}</p>}
            <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 6 }}>Overall compatibility score</p>
            <div style={{ fontSize: 54, fontWeight: 500, color: lvl.color, lineHeight: 1 }}>{score}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: lvl.color, marginTop: 6 }}>{lvl.label} — out of 10</div>
          </div>

          {/* Mini stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
            {[
              { label: "Income", value: getIncomeTierLabel(p.income).split(" — ")[0] },
              { label: "Assets", value: getAssetLabel(p.assets).split(" ")[0] },
              { label: "Age window", value: p.gender === "male" ? (Number(p.age) >= 29 && Number(p.age) <= 40 ? "Prime" : Number(p.age) < 29 ? "Building" : "Post-peak") : (Number(p.age) <= 24 ? "Peak" : Number(p.age) <= 27 ? "Golden" : Number(p.age) <= 30 ? "Active" : Number(p.age) <= 33 ? "Yellow" : "Red line") },
              { label: "Habits", value: (habitAdj >= 0 ? "+" : "") + habitAdj.toFixed(1) + " pts" },
            ].map((m, i) => (
              <div key={i} style={{ background: "var(--color-background-primary)", borderRadius: 8, padding: "10px 8px", border: "0.5px solid var(--color-border-tertiary)", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-primary)" }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Expectation gap */}
          {gap !== null && (
            <div style={{ background: gap > 1.5 ? "#FAEEDA" : gap > 0 ? "#E6F1FB" : "#E1F5EE", border: `0.5px solid ${gap > 1.5 ? "#FAC775" : gap > 0 ? "#B5D4F4" : "#9FE1CB"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: gap > 1.5 ? "#633806" : gap > 0 ? "#0C447C" : "#04342C", marginBottom: 2 }}>
                Expectation gap: {gap > 0 ? "+" : ""}{gap} points
              </p>
              <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
                {gap > 1.5 ? "Your expectations significantly exceed your market score. Serious recalibration needed." : gap > 0 ? "Slight stretch — ambitious but possible with the right approach." : "Your expectations are realistic or conservative. Good foundation."}
              </p>
            </div>
          )}

          {/* Key alerts */}
          {p.parentsMarried === "divorced" && (
            <div style={{ background: "#FCEBEB", border: "0.5px solid #F7C1C1", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#791F1F", marginBottom: 2 }}>Major background liability</p>
              <p style={{ fontSize: 12, color: "#A32D2D", margin: 0 }}>Divorced parents is the single biggest hidden liability — partner families frequently reject candidates for this reason without stating it directly.</p>
            </div>
          )}
          {p.marriageHistory !== "never" && (
            <div style={{ background: "#FAEEDA", border: "0.5px solid #FAC775", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#633806", marginBottom: 2 }}>Divorce history penalty applied</p>
              <p style={{ fontSize: 12, color: "#854F0B", margin: 0 }}>{p.marriageHistory === "divorced_with_child" && p.gender === "female" ? "Divorced with child significantly narrows the candidate pool — market value reduced by ~40–70%. Matching with others in similar situations is the highest-probability path." : "Divorce history applies a market discount. Best strategy: match with others who are also divorced (mutual understanding, no stigma gap)."}</p>
            </div>
          )}
          {p.gender === "male" && p.hasCar === "no" && Number(p.income) >= 15 && (
            <div style={{ background: "#E1F5EE", border: "0.5px solid #9FE1CB", borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "#04342C", marginBottom: 2 }}>Quick win available</p>
              <p style={{ fontSize: 12, color: "#0F6E56", margin: 0 }}>At your income level, buying a mid-range car is the single highest-ROI move for social visibility and perceived stability.</p>
            </div>
          )}

          {/* Habit flags */}
          {habitFlags.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Habit highlights</p>
              {habitFlags.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, marginTop: 1, color: f.type === "good" ? "#1D9E75" : f.type === "warn" ? "#BA7517" : "#E24B4A", flexShrink: 0 }}>{f.type === "good" ? "✓" : f.type === "warn" ? "!" : "✗"}</span>
                  <span style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.5 }}>{f.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Report sections */}
          <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 20, marginBottom: 8 }}>
            <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>Detailed analysis</p>
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 14 }}>
              Personalized breakdown across 7 dimensions — habit impact, competitive landscape, core trade-off, expectation diagnosis, and a 90-day action plan.{p.name ? ` Addressed to ${p.name}.` : ""}
            </p>
            {sections.map((sec, i) => {
              const col = sectionStyle[sec.title];
              return (
                <div key={i} style={{ marginBottom: 12, borderRadius: 10, border: `0.5px solid ${col ? col.border : "var(--color-border-tertiary)"}`, overflow: "hidden" }}>
                  {sec.title && col && <div style={{ padding: "7px 14px", background: col.bg }}><span style={{ fontSize: 10, fontWeight: 500, color: col.title, letterSpacing: "0.06em" }}>{sec.title}</span></div>}
                  <div style={{ padding: "12px 14px", background: "var(--color-background-primary)" }}>
                    {sec.body.map((line, j) => <p key={j} style={{ fontSize: 13, color: "var(--color-text-primary)", lineHeight: 1.75, margin: j > 0 ? "8px 0 0" : 0 }}>{line}</p>)}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => { setStep(0); setScore(null); setSections([]); }} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", background: "transparent", color: "var(--color-text-primary)", fontSize: 14, cursor: "pointer", marginTop: 8 }}>
            ← Start over
          </button>
        </div>
      )}
    </div>
  );
}
