from flask import Flask, request
import torch
from transformers import (
    AutoTokenizer,
    TFAutoModelForSequenceClassification,
    pipeline,
    PegasusForConditionalGeneration,
    PegasusTokenizer,
)
import numpy as np
import pandas as pd
from flask_cors import CORS
import concurrent.futures
import time
import threading
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM


def load_model():
    global albert_analyzer
    global point_analyzer
    global google_analyzer

    google_analyzer = load_model_google()
    albert_analyzer = load_model_albert()
    point_analyzer = load_model_point_summarizer()


def load_model_albert():
    model = TFAutoModelForSequenceClassification.from_pretrained("albert_model")
    tokenizer = AutoTokenizer.from_pretrained(
        "nlptown/bert-base-multilingual-uncased-sentiment"
    )

    return pipeline(
        "sentiment-analysis", model=model, tokenizer=tokenizer, return_all_scores=True
    )


def load_model_google():
    return pipeline(
        "text2text-generation",
        model="google/flan-t5-large",
        tokenizer="google/flan-t5-large",
    )


def load_model_point_summarizer():
    return pipeline("zero-shot-classification", model="facebook/bart-large-mnli")


def get_score(comment):
    score = 0.0
    result = albert_analyzer(comment[:520])[0]
    for i in range(len(result)):
        score += result[i]["score"] * i

    score /= 4
    return score


def get_scores(comments):
    scores = []
    for comment in comments:
        scores.append({"comment": comment, "score": get_score(comment)})
    scores.sort(key=lambda x: x["score"])
    return scores


def get_global_score(get_scores, comment):
    return np.mean([comment["score"] for comment in get_scores])


def get_chat_bot(question, context):
    answer = str(question) + "\n" + str(context)
    return google_analyzer(answer)[0]["generated_text"]


def get_summary(get_scores):
    threshold = 0.2

    if len(get_scores) < 6:
        comment_bad = "".join(get_scores[1]["comment"])
        comment_good = "".join(get_scores[-1]["comment"])
    else:
        comment_bad = (
            "".join(get_scores[0]["comment"])
            + "".join(get_scores[1]["comment"])
            + "".join(get_scores[2]["comment"])
        )
        comment_good = (
            "".join(get_scores[-3]["comment"])
            + "".join(get_scores[-2]["comment"])
            + "".join(get_scores[-1]["comment"])
        )

    result_bad = point_analyzer(comment_bad, negative_words)
    result_good = point_analyzer(comment_good, positive_words)

    sorted_labels_bad = [
        label
        for label, score in zip(result_bad["labels"], result_bad["scores"])
        if score > threshold
    ]

    sorted_labels_good = [
        label
        for label, score in zip(result_good["labels"], result_good["scores"])
        if score > threshold
    ]

    return sorted_labels_bad, sorted_labels_good


app = Flask(__name__)

CORS(app)


load_model()
positive_words = [
    "Convenient",
    "Elegant",
    "Versatile",
    "Innovative",
    "Affordable",
]


negative_words = [
    "Delicate",
    "Limited",
    "Noisy",
    "Bulky",
    "Expensive",
]

summary_words = [
    "Reliable",
    "Efficient",
    "High-quality",
    "User-friendly",
    "Innovative",
    "Convenient",
    "Fast",
    "Secure",
    "Disappointing",
    "Inconvenient",
]


@app.get("/")
def index():
    return "Hello World"


@app.post("/alyz")
def analyze_website():
    try:
        comments = np.array(request.get_json()["comments"])
        var_get_scores = get_scores(comments)

        return {
            "score": get_global_score(var_get_scores, comments),
            "summary": get_summary(var_get_scores),
        }
    except KeyError as e:
        return f"Une clé invalide a été utilisée : {e}", 400
    except TypeError as e:
        return f"Une erreur de type s'est produite : {e}", 400
    except Exception as e:
        return f"Une erreur inattendue s'est produite : {e}", 500


@app.post("/chatbot")
def chatbot_website():
    try:
        question = np.array(request.get_json()["question"])
        context = np.array(request.get_json()["context"])
        return {"answer": get_chat_bot(question, context)}
    except KeyError as e:
        return f"Une clé invalide a été utilisée : {e}", 400
    except TypeError as e:
        return f"Une erreur de type s'est produite : {e}", 400
    except Exception as e:
        return f"Une erreur inattendue s'est produite : {e}", 500


if __name__ == "__main__":
    app.run()
