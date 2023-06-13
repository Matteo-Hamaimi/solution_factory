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


df["ProcessedText"] = df["Text"].apply(preprocess_text)

# Plot distribution de fréquence des mots
words = nltk.word_tokenize(df["ProcessedText"].str.cat(sep=" "))
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

# Sélectionner les 2 000 premières lignes pour chaque classe d'évaluation
df_1_star = df[df["Score"] == 1][:2000]
df_2_star = df[df["Score"] == 2][:2000]
df_3_star = df[df["Score"] == 3][:2000]
df_4_star = df[df["Score"] == 4][:2000]
df_5_star = df[df["Score"] == 5][:2000]

# Concaténer les DataFrames pour obtenir un tableau de 10 000 lignes
df_balanced = pd.concat([df_1_star, df_2_star, df_3_star, df_4_star, df_5_star])

# Mélanger les lignes du tableau
df_balanced = df_balanced.sample(frac=1).reset_index(drop=True)

# Fractionnement en sous-ensembles d'apprentissage et de test
X = df_balanced["ProcessedText"]
y = df_balanced["Score"]
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
