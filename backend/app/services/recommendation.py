import math
import logging
from typing import Dict, List, Any, Set, Optional
from collections import defaultdict
from ..models.schemas import RecommendationItem, RecommendationRequest
from ..ml.embeddings import embedding_pipeline
from ..services.analytics import SkillAnalysisEngine

logger = logging.getLogger("codematch.recommendation")

class RecommendationEngine:
    """
    Transparent, deterministic hybrid recommendation engine.
    Combines difficulty matching, weak topic remediation, semantic vector similarity,
    solved problem exclusion, community quality, and topic diversity.
    """
    SIGMA_DIFFICULTY = 180.0  # Standard deviation for Gaussian difficulty curve
    
    # Weights for scoring components (sum to 1.0)
    W_DIFFICULTY = 0.35
    W_WEAKNESS = 0.30
    W_SEMANTIC = 0.20
    W_QUALITY = 0.15

    def generate_recommendations(
        self,
        handle: str,
        profile: Dict[str, Any],
        submissions: List[Dict[str, Any]],
        catalogue: List[Dict[str, Any]],
        embeddings: Dict[str, List[float]],
        request: RecommendationRequest
    ) -> List[RecommendationItem]:
        # 1. Determine user rating & target
        user_rating = profile.get("current_rating") or 1200
        if user_rating <= 0:
            user_rating = 1200
        
        target_rating = profile.get("target_rating") or (user_rating + 75)

        # 2. Extract solved and attempted problem keys
        solved_keys: Set[str] = set()
        attempted_failed_keys: Set[str] = set()
        for s in submissions:
            key = s.get("problem_key")
            if not key:
                continue
            if s.get("verdict") == "OK":
                solved_keys.add(key)
            else:
                attempted_failed_keys.add(key)
        
        # Keys attempted but NEVER solved
        unsolved_attempted_keys = attempted_failed_keys - solved_keys

        # 3. Analyze topic statistics
        analytics = SkillAnalysisEngine.analyze_user_skills(handle, profile, submissions)
        tag_stat_map = {t.tag.lower(): t for t in analytics.tag_stats}
        is_cold_start = (analytics.total_attempted < 6)

        # 4. Generate focus vector for semantic similarity
        # Focus on weak topics or user's requested topic filter
        focus_tags = []
        if request.topic_filter:
            focus_tags.append(request.topic_filter)
        elif analytics.weak_topics:
            focus_tags.extend(analytics.weak_topics[:3])
        elif analytics.developing_topics:
            focus_tags.extend(analytics.developing_topics[:2])
        else:
            focus_tags = ["implementation", "greedy", "math"]

        query_text = f"Competitive programming problems focused on {', '.join(focus_tags)} for rating {target_rating}"
        query_embedding = embedding_pipeline.generate_embedding(query_text)

        # 5. Score candidate problems
        candidates = []
        for prob in catalogue:
            key = prob.get("problem_key")
            if not key:
                continue

            # RULE: Exclude solved problems
            if key in solved_keys:
                continue

            prob_rating = prob.get("rating")
            prob_tags = [t.lower() for t in prob.get("tags", [])]

            # Optional filter by topic
            if request.topic_filter and request.topic_filter.lower() not in prob_tags:
                continue

            # Optional user rating constraints
            if request.min_rating and prob_rating and prob_rating < request.min_rating:
                continue
            if request.max_rating and prob_rating and prob_rating > request.max_rating:
                continue

            # A. Difficulty Score (Gaussian centered around target_rating)
            if prob_rating:
                diff_delta = abs(prob_rating - target_rating)
                difficulty_score = math.exp(- (diff_delta ** 2) / (2 * (self.SIGMA_DIFFICULTY ** 2)))
                diff_label = self._classify_difficulty(prob_rating, user_rating)
            else:
                difficulty_score = 0.4
                diff_label = "Unrated Problem"

            # B. Topic Weakness / Growth Score
            weakness_score, target_topic, topic_reason = self._compute_topic_score(
                prob_tags, tag_stat_map, is_cold_start
            )

            # C. Semantic Vector Similarity
            prob_emb = embeddings.get(key)
            if prob_emb:
                similarity_score = max(0.0, embedding_pipeline.cosine_similarity(query_embedding, prob_emb))
            else:
                similarity_score = 0.5

            # D. Quality / Community solved count score
            solved_count = prob.get("solved_count", 0)
            quality_score = min(1.0, max(0.2, math.log10(solved_count + 1) / 4.5)) if solved_count > 0 else 0.3

            # E. Retry / Unsolved attempt adjustment
            retry_bonus = 0.0
            is_retry = key in unsolved_attempted_keys
            if is_retry and request.include_previously_unsolved:
                retry_bonus = 0.08  # Give a noticeable boost to redeem unsolved attempts

            # Raw deterministic score
            composite_score = (
                self.W_DIFFICULTY * difficulty_score +
                self.W_WEAKNESS * weakness_score +
                self.W_SEMANTIC * similarity_score +
                self.W_QUALITY * quality_score +
                retry_bonus
            )
            composite_score = round(min(1.0, max(0.05, composite_score)), 4)

            # Build human-readable explanation
            explanation = self._build_explanation(
                prob=prob,
                user_rating=user_rating,
                target_rating=target_rating,
                target_topic=target_topic,
                topic_reason=topic_reason,
                is_retry=is_retry,
                is_cold_start=is_cold_start
            )

            candidates.append({
                "problem": prob,
                "composite_score": composite_score,
                "difficulty_score": round(difficulty_score, 4),
                "weakness_score": round(weakness_score, 4),
                "similarity_score": round(similarity_score, 4),
                "quality_score": round(quality_score, 4),
                "target_topic": target_topic,
                "difficulty_label": diff_label,
                "explanation": explanation,
                "primary_tag": prob_tags[0] if prob_tags else "general"
            })

        # Sort candidate pool deterministically
        candidates.sort(key=lambda x: (x["composite_score"], x["problem"].get("solved_count", 0)), reverse=True)

        # 6. Apply Topic Diversity Selection
        # Prevents recommending 10 problems with the same single tag
        selected_recommendations: List[RecommendationItem] = []
        tag_frequency = defaultdict(int)

        for item in candidates:
            if len(selected_recommendations) >= request.count:
                break

            primary_tag = item["primary_tag"]
            # If this topic is already over-represented in top picks, downweight
            if tag_frequency[primary_tag] >= 2 and len(candidates) > request.count * 2:
                continue

            p = item["problem"]
            tag_frequency[primary_tag] += 1
            selected_recommendations.append(RecommendationItem(
                problem_key=p["problem_key"],
                name=p["name"],
                rating=p.get("rating"),
                tags=p.get("tags", []),
                solved_count=p.get("solved_count", 0),
                problem_url=p["problem_url"],
                recommendation_score=item["composite_score"],
                difficulty_score=item["difficulty_score"],
                weakness_score=item["weakness_score"],
                similarity_score=item["similarity_score"],
                quality_score=item["quality_score"],
                target_topic=item["target_topic"],
                difficulty_label=item["difficulty_label"],
                explanation=item["explanation"],
                status="active"
            ))

        # If diversity skipped too many, fill remaining slots
        if len(selected_recommendations) < request.count:
            existing_keys = {r.problem_key for r in selected_recommendations}
            for item in candidates:
                if len(selected_recommendations) >= request.count:
                    break
                p = item["problem"]
                if p["problem_key"] not in existing_keys:
                    existing_keys.add(p["problem_key"])
                    selected_recommendations.append(RecommendationItem(
                        problem_key=p["problem_key"],
                        name=p["name"],
                        rating=p.get("rating"),
                        tags=p.get("tags", []),
                        solved_count=p.get("solved_count", 0),
                        problem_url=p["problem_url"],
                        recommendation_score=item["composite_score"],
                        difficulty_score=item["difficulty_score"],
                        weakness_score=item["weakness_score"],
                        similarity_score=item["similarity_score"],
                        quality_score=item["quality_score"],
                        target_topic=item["target_topic"],
                        difficulty_label=item["difficulty_label"],
                        explanation=item["explanation"],
                        status="active"
                    ))

        return selected_recommendations

    def _classify_difficulty(self, prob_rating: int, user_rating: int) -> str:
        diff = prob_rating - user_rating
        if diff >= 150:
            return f"Stretch Challenge (+{diff} rating)"
        elif diff >= 40:
            return f"Optimal Growth (+{diff} rating)"
        elif diff >= -40:
            return f"Skill Reinforcement ({diff:+d} rating)"
        else:
            return f"Foundational Warm-up ({diff:+d} rating)"

    def _compute_topic_score(
        self,
        prob_tags: List[str],
        tag_stat_map: Dict[str, Any],
        is_cold_start: bool
    ) -> (float, str, str):
        if is_cold_start or not prob_tags:
            return 0.6, prob_tags[0] if prob_tags else "general", "Calibrated baseline for your rating level."

        best_score = 0.4
        chosen_topic = prob_tags[0]
        chosen_reason = "Standard curriculum topic."

        for tag in prob_tags:
            stat = tag_stat_map.get(tag)
            if not stat:
                score = 0.55
                reason = f"Broadens topic coverage into '{tag}' where you have minimal attempts."
            elif stat.skill_level == "Weak":
                score = 0.95
                reason = f"Targets your identified weakness in '{tag}' (accuracy: {stat.accuracy}% over {stat.attempted_count} attempts)."
            elif stat.skill_level == "Developing":
                score = 0.75
                reason = f"Reinforces developing proficiency in '{tag}' (accuracy: {stat.accuracy}%)."
            elif stat.skill_level == "Insufficient Data":
                score = 0.60
                reason = f"Builds foundational experience in '{tag}' with only {stat.attempted_count} prior attempts."
            else: # Strong
                score = 0.40
                reason = f"Maintains mastery in '{tag}' (strong accuracy: {stat.accuracy}%)."

            if score > best_score:
                best_score = score
                chosen_topic = tag
                chosen_reason = reason

        return best_score, chosen_topic, chosen_reason

    def _build_explanation(
        self,
        prob: Dict[str, Any],
        user_rating: int,
        target_rating: int,
        target_topic: str,
        topic_reason: str,
        is_retry: bool,
        is_cold_start: bool
    ) -> str:
        name = prob.get("name", "This problem")
        rating = prob.get("rating")
        rating_info = f"rated {rating}" if rating else "unrated"

        if is_retry:
            return f"Redemption opportunity: you previously attempted '{name}' without solving it. At {rating_info}, returning to it now reinforces {target_topic} mastery."
        
        if is_cold_start:
            return f"Recommended as an optimal entry challenge ({rating_info}) for your {user_rating} rating level in {target_topic}. Recommendations will become increasingly customized as you submit solutions."

        diff_str = f"at {rating} rating ({rating - user_rating:+d} from your rating)" if rating else ""
        return f"Selected for '{target_topic}' practice {diff_str}. {topic_reason}"

recommendation_engine = RecommendationEngine()
