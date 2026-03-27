import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
#loaded data
energy_df = pd.read_csv(r'C:\Users\firea\Desktop\uwu\Intelligent_abnormal_electricity_usage_dataset_REALWORLD.csv')
#dropped null values
energy_df.isnull().sum()
energy_df = energy_df.dropna()
#dropped useless column
energy_df = energy_df.drop(columns=['Meter_Id'], errors='ignore')


numeric_cols_with_units = ["Expected_Energy(kwh)", "Actual_Energy(kwh)", "Cluster_Avg_Energy(kwh)"]
for col in numeric_cols_with_units:
    energy_df[col] =energy_df[col].replace('[^\d\.]', '', regex=True).astype(float)

energy_df["Connected_Load(kw)"] = energy_df["Connected_Load(kw)"].replace('[^\d\.]', '', regex=True).astype(float)
X = energy_df.drop(columns=["Date", "Region_Code", "Dwelling_Type", "Abnormal_Usage"])
y = energy_df["Abnormal_Usage"]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)


y_pred = clf.predict(X_test)

print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))

feature_importances = clf.feature_importances_
feature_names = X.columns  
importance_df = pd.DataFrame({
    'Feature': feature_names,
    'Importance': feature_importances
}).sort_values(by='Importance', ascending=False)

plt.figure(figsize=(10,6))
plt.barh(importance_df['Feature'], importance_df['Importance'], color='skyblue')
plt.gca().invert_yaxis()  
plt.xlabel('Feature Importance (%)')
plt.title('Feature Importances WIth Random Forest')
plt.show()