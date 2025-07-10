import pandas as pd

df = pd.read_csv('data/sms_spam.csv', sep='\t', encoding='latin-1')
df.to_csv('data/sms_spam_proper.csv', index=False)
print("Conversion complete!")
