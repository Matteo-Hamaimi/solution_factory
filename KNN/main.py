import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import nltk
from nltk.probability import FreqDist
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split
from sklearn.neighbors import KNeighborsRegressor
from sklearn import metrics
from sklearn.feature_extraction.text import TfidfVectorizer

# Lire les données
df = pd.read_csv("data.csv")

# Supprimer les colonnes inutiles
df.drop(
    [
        "Id",
        "ProductId",
        "UserId",
        "ProfileName",
        "HelpfulnessNumerator",
        "HelpfulnessDenominator",
        "Time",
    ],
    axis=1,
    inplace=True,
)

# Prétraitement des données textuelles
stop_words = set(stopwords.words("english"))
lemmatizer = WordNetLemmatizer()


def preprocess_text(text):
    # Conversion en minuscules
    text = text.lower()
    # Tokenization des mots
    words = nltk.word_tokenize(text)
    # Suppression des caractères spéciaux, des mots vides et du mot "br"
    words = [
        word
        for word in words
        if word.isalnum() and word not in stop_words and word != "br"
    ]
    # Lemmatisation des mots
    words = [lemmatizer.lemmatize(word) for word in words]
    # Reconstitution du texte prétraité
    processed_text = " ".join(words)
    return processed_text


df["ProcessedText"] = df["Text"][:10000].apply(preprocess_text)

# Plot distribution de fréquence des mots
words = nltk.word_tokenize(df["ProcessedText"][:10000].str.cat(sep=" "))
fdist = FreqDist(words)
plt.figure(figsize=(25, 10))
fdist.plot(100, cumulative=False)
plt.show()

score_counts = df["Score"].value_counts() / len(df)

# Afficher les pourcentages des scores
print("Pourcentage des scores :")
for score in range(1, 6):
    percentage = score_counts[score] * 100
    print(f"Score {score}: {percentage:.2f}%")

# Visualiser la distribution des scores de sentiment
plt.hist(df["Score"], bins=[1, 2, 3, 4, 5, 6], align="left", rwidth=0.5)
plt.xlabel("Score")
plt.ylabel("Count")
plt.xticks(range(1, 6))
plt.show()

# Fractionnement en sous-ensembles d'apprentissage et de test
X = df["ProcessedText"][:10000]
y = df["Score"][:10000]
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Vectorisation des données textuelles
vectorizer = TfidfVectorizer()
X_train = vectorizer.fit_transform(X_train)
X_test = vectorizer.transform(X_test)

# Entraînement du modèle KNN Regression
knnRegression = KNeighborsRegressor(n_neighbors=5)
knnreg = knnRegression.fit(X_train, y_train)
y_pred = knnreg.predict(X_test)

# Evaluation des performances du modèle
print("Mean Absolute Error:", metrics.mean_absolute_error(y_test, y_pred))
print("Mean Squared Error:", metrics.mean_squared_error(y_test, y_pred))
print("Root Mean Squared Error:", np.sqrt(metrics.mean_squared_error(y_test, y_pred)))
print("R2 Score:", metrics.r2_score(y_test, y_pred))
print("Explained Variance Score:", metrics.explained_variance_score(y_test, y_pred))
print("Max Error:", metrics.max_error(y_test, y_pred))
