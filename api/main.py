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


def load_model_Pegasus1():
    return pipeline(
        "text-generation",
        model="tuner007/pegasus_paraphrase",
        tokenizer="tuner007/pegasus_paraphrase",
    )


def load_model_Pegasus():
    model_name = "tuner007/pegasus_paraphrase"
    torch_device = "cuda" if torch.cuda.is_available() else "cpu"
    tokenizer = PegasusTokenizer.from_pretrained(model_name)
    model = PegasusForConditionalGeneration.from_pretrained(model_name).to(torch_device)

    def get_response(input_text, num_return_sequences, num_beams):
        inputs = tokenizer(
            [input_text],
            truncation=True,
            padding="longest",
            max_length=60,
            return_tensors="pt",
        )
        outputs = model.generate(
            **inputs,
            max_length=60,
            num_beams=num_beams,
            num_return_sequences=num_return_sequences,
            temperature=1.5,
        )
        tgt_text = tokenizer.batch_decode(outputs, skip_special_tokens=True)
        return tgt_text

    return pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
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


def get_chat_bot(question, context):
    df = pd.DataFrame(context)
    QA_input = {
        "question": str(question),
        "context": str(
            "".join(df[0]),
        ),
    }
    return Pegasus_analyzer(
        roberta_analyzer(QA_input)["answer"], num_return_sequences=1, num_beams=1
    )


def get_upgrade_point(comments):
    df = pd.DataFrame(get_scores(comments))
    last_row_index = df.index[-1]

    if len(comments) < 6:
        QA_input_positve = {
            "question": "What is the best feature of this product ?",
            "context": str(
                "".join(df["comment"][1]),
            ),
        }
        QA_input_negative = {
            "question": "What are the worst features of this product ?",
            "context": str(
                "".join(df["comment"]),
            ),
        }
        return (
            roberta_analyzer(QA_input_positve)["answer"],
            roberta_analyzer(QA_input_negative)["answer"],
        )
    else:
        QA_input_positive1 = {
            "question": "What is the positive point?",
            "context": str("".join(df["comment"].iloc[last_row_index])),
        }
        QA_input_positive2 = {
            "question": "What is the positive point?",
            "context": str("".join(df["comment"].iloc[last_row_index - 1])),
        }
        QA_input_positive3 = {
            "question": "What is the positive point?",
            "context": str("".join(df["comment"].iloc[last_row_index - 2])),
        }
        QA_input_negative1 = {
            "question": "What is the negative point?",
            "context": str("".join(df["comment"].iloc[0])),
        }
        QA_input_negative2 = {
            "question": "What is the negative point?",
            "context": str("".join(df["comment"].iloc[1])),
        }
        QA_input_negative3 = {
            "question": "What is the negative point?",
            "context": str("".join(df["comment"].iloc[2])),
        }
        return (
            roberta_analyzer(QA_input_positive1)["answer"],
            roberta_analyzer(QA_input_positive2)["answer"],
            roberta_analyzer(QA_input_positive3)["answer"],
            roberta_analyzer(QA_input_negative1)["answer"],
            roberta_analyzer(QA_input_negative2)["answer"],
            roberta_analyzer(QA_input_negative3)["answer"],
        )


def get_summary(comments):
    df = pd.DataFrame(get_scores(comments))
    threshold = 0.2
    if len(comments) < 6:
        result_bad = point_analyzer("".join(df["comment"][1]), negative_words)
        result_good = point_analyzer("".join(df["comment"][-1]), positive_words)
        sorted_labels_bad = sorted(
            result_bad["labels"],
            key=lambda x: result_bad["scores"][result_bad["labels"].index(x)],
            reverse=True,
        )
        sorted_labels_bad = [
            label
            for label in sorted_labels_bad
            if result_bad["scores"][result_bad["labels"].index(label)] > threshold
        ]

        sorted_labels_good = sorted(
            result_good["labels"],
            key=lambda x: result_good["scores"][result_good["labels"].index(x)],
            reverse=True,
        )
        sorted_labels_good = [
            label
            for label in sorted_labels_good
            if result_good["scores"][result_good["labels"].index(label)] > threshold
        ]
        return (
            sorted_labels_bad,
            sorted_labels_good,
        )

    elif len(comments) < 11:
        result_bad = point_analyzer("".join(df["comment"][:3]), negative_words)
        result_good = point_analyzer("".join(df["comment"][-3:]), positive_words)
        sorted_labels_bad = sorted(
            result_bad["labels"],
            key=lambda x: result_bad["scores"][result_bad["labels"].index(x)],
            reverse=True,
        )
        sorted_labels_bad = [
            label
            for label in sorted_labels_bad
            if result_bad["scores"][result_bad["labels"].index(label)] > threshold
        ]

        sorted_labels_good = sorted(
            result_good["labels"],
            key=lambda x: result_good["scores"][result_good["labels"].index(x)],
            reverse=True,
        )
        sorted_labels_good = [
            label
            for label in sorted_labels_good
            if result_good["scores"][result_good["labels"].index(label)] > threshold
        ]
        return (
            sorted_labels_bad,
            sorted_labels_good,
        )


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

Pegasus_analyzer = load_model_Pegasus()


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


@app.post("/chatbot")
def chatbot_website():
    try:
        question = np.array(request.get_json()["question"])
        context = np.array(request.get_json()["context"])
    except KeyError as e:
        return f"Une clé invalide a été utilisée : {e}", 400
    except TypeError as e:
        return f"Une erreur de type s'est produite : {e}", 400
    except Exception as e:
        return f"Une erreur inattendue s'est produite : {e}", 500

    return {"answer": get_chat_bot(question, context)}


if __name__ == "__main__":
    app.run()
