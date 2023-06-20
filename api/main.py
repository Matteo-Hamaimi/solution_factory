from flask import Flask, request
from transformers import AutoTokenizer, TFAutoModelForSequenceClassification, pipeline
import numpy as np
from transformers import pipeline
import pandas as pd


def load_model_albert():
    model = TFAutoModelForSequenceClassification.from_pretrained("albert_model")
    tokenizer = AutoTokenizer.from_pretrained(
        "nlptown/bert-base-multilingual-uncased-sentiment"
    )

    return pipeline(
        "sentiment-analysis", model=model, tokenizer=tokenizer, return_all_scores=True
    )


def load_model_roberta():
    return pipeline(
        "question-answering",
        model="deepset/roberta-base-squad2",
        tokenizer="deepset/roberta-base-squad2",
    )


def load_model_summarizer():
    return pipeline("summarization", model="knkarthick/MEETING_SUMMARY")


def load_model_point_summarizer():
    return pipeline("zero-shot-classification", model="facebook/bart-large-mnli")


def get_score(comment):
    score = 0.0
    result = albert_analyzer(comment)[0]
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


def get_global_score(comments):
    global_score = get_scores(comments)

    return np.mean([comment["score"] for comment in global_score])


def get_chat_bot(comments):
    QA_input = {
        "question": "Why is model conversion important?",
        "context": "The option to convert models between FARM and transformers gives freedom to the user and let people easily switch between frameworks.",
    }
    return roberta_analyzer(QA_input)


def get_summary(comments):
    df = pd.DataFrame(get_scores(comments))
    if len(comments) < 6:
        result = point_analyzer("".join(df["comment"]), summary_words)
        sorted_labels = sorted(
            result["labels"],
            key=lambda x: result["scores"][result["labels"].index(x)],
            reverse=True,
        )
        return sorted_labels[:2], sorted_labels[-2:]

    elif len(comments) < 11:
        result_bad = point_analyzer("".join(df["comment"][:3]), negative_words)
        result_good = point_analyzer("".join(df["comment"][-3:]), positive_words)
        sorted_labels_bad = sorted(
            result_bad["labels"],
            key=lambda x: result_bad["scores"][result_bad["labels"].index(x)],
            reverse=True,
        )
        sorted_labels_good = sorted(
            result_good["labels"],
            key=lambda x: result_good["scores"][result_good["labels"].index(x)],
            reverse=True,
        )
        return (
            sorted_labels_bad[:3],
            sorted_labels_good[:3],
        )
    else:
        result_bad = point_analyzer("".join(df["comment"][:5]), negative_words)
        result_good = point_analyzer("".join(df["comment"][-5:]), positive_words)
        sorted_labels_bad = sorted(
            result_bad["labels"],
            key=lambda x: result_bad["scores"][result_bad["labels"].index(x)],
            reverse=True,
        )
        sorted_labels_good = sorted(
            result_good["labels"],
            key=lambda x: result_good["scores"][result_good["labels"].index(x)],
            reverse=True,
        )
        return sorted_labels_bad[:5], sorted_labels_good[:5]


app = Flask(__name__)

positive_words = [
    "Reliable",
    "Efficient",
    "High-quality",
    "Durable",
    "User-friendly",
    "Innovative",
    "Versatile",
    "Stylish",
    "Powerful",
    "Convenient",
]

negative_words = [
    "Unreliable",
    "Inefficient",
    "Low-quality",
    "Fragile",
    "Complicated",
    "Outdated",
    "Limited",
    "Bulky",
    "Weak",
    "Inconvenient",
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

albert_analyzer = load_model_albert()

summary_analyzer = load_model_summarizer()

point_analyzer = load_model_point_summarizer()

roberta_analyzer = load_model_roberta()


@app.get("/")
def index():
    return "Hello World"


@app.post("/alyz")
def analyze_website():
    try:
        comments = np.array(request.get_json()["comments"])
    except KeyError as e:
        return f"Une clé invalide a été utilisée : {e}", 400
    except TypeError as e:
        return f"Une erreur de type s'est produite : {e}", 400
    except Exception as e:
        return f"Une erreur inattendue s'est produite : {e}", 500

    return {"score": get_global_score(comments), "summary": get_summary(comments)}


if __name__ == "__main__":
    app.run()
