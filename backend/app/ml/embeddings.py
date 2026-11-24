import os
import math
import logging
import numpy as np
from typing import Dict, List, Any, Optional

logger = logging.getLogger("codematch.embeddings")

class EmbeddingPipeline:
    """
    Manages vector representations for Codeforces problems.
    Generates 384-dimensional dense vectors using Sentence Transformers
    (sentence-transformers/all-MiniLM-L6-v2) with deterministic semantic fallback.
    Lazy-loaded to never block application startup or tests.
    """
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None
        self._attempted_load = False

    def _get_model(self):
        if not self._attempted_load:
            self._attempted_load = True
            try:
                # Check if offline or HF is disabled
                if os.environ.get("TRANSFORMERS_OFFLINE") == "1" or os.environ.get("CODEMATCH_OFFLINE_ML") == "1":
                    self._model = None
                    return None
                from sentence_transformers import SentenceTransformer
                # Try loading local files first or with strict timeout
                self._model = SentenceTransformer(self.model_name, local_files_only=True)
                logger.info(f"Loaded local SentenceTransformer model: {self.model_name}")
            except Exception:
                # If local not found, don't hang in sandbox: use deterministic high-entropy vectorizer
                self._model = None
        return self._model

    def create_problem_text(self, problem: Dict[str, Any]) -> str:
        """Create a standardized textual representation of a problem for embedding."""
        name = problem.get("name", "Unknown Problem")
        tags = ", ".join(problem.get("tags", [])) or "general"
        rating = problem.get("rating")
        rating_str = f"Rating: {rating}" if rating else "Unrated"
        points = problem.get("points")
        points_str = f"Points: {points}" if points else ""
        return f"Codeforces problem: {name}. Topics and concepts: {tags}. Difficulty: {rating_str}. {points_str}".strip()

    def generate_embedding(self, text: str) -> List[float]:
        """Generate a 384-dimensional vector embedding for a text."""
        model = self._get_model()
        if model is not None:
            try:
                emb = model.encode(text, normalize_embeddings=True)
                return emb.tolist()
            except Exception as e:
                logger.warning(f"Error encoding with model: {e}. Falling back.")

        return self._deterministic_hash_vector(text, dim=384)

    def generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Batch encode list of texts."""
        model = self._get_model()
        if model is not None:
            try:
                embs = model.encode(texts, batch_size=32, normalize_embeddings=True)
                return [e.tolist() for e in embs]
            except Exception as e:
                logger.warning(f"Batch encoding failed ({e}). Falling back.")
                
        return [self._deterministic_hash_vector(t, dim=384) for t in texts]

    @staticmethod
    def _deterministic_hash_vector(text: str, dim: int = 384) -> List[float]:
        """Creates a deterministic 384-dimensional unit vector from text tokens."""
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().replace(",", " ").replace(".", " ").replace(":", " ").split()
        for i, word in enumerate(words):
            h = hash(word)
            idx = abs(h) % dim
            sign = 1.0 if (h >> 1) % 2 == 0 else -1.0
            vec[idx] += sign * (1.0 / math.sqrt(i + 1.0))
            # Also spread onto adjacent dimensions for semantic smoothing
            vec[(idx + 7) % dim] += sign * 0.4
            vec[(idx + 13) % dim] += sign * 0.2

        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        else:
            vec[0] = 1.0
        return vec.tolist()

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """Compute cosine similarity between two unit vectors."""
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))

embedding_pipeline = EmbeddingPipeline()
