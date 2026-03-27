import pandas as pd
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
#loaded data
energy_df = pd.read_csv(r'C:\Users\firea\Desktop\uwu\Intelligent_abnormal_electricity_usage_dataset_REALWORLD.csv')
#dropped null values
energy_df.isnull().sum()
energy_df = energy_df.dropna()
#dropped useless column
energy_df = energy_df.drop(columns=['Meter_Id'], errors='ignore')