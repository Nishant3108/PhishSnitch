import pandas as pd
from sklearn.model_selection import train_test_split
from datasets import Dataset
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification, Trainer, TrainingArguments

# Load CSV without header, assign column names
df = pd.read_csv("data/sms_spam_proper.csv", header=None, names=["label", "text"])

# Map 'spam' to 'phishing', 'ham' to 'not phishing'
df['label'] = df['label'].map({'spam': 'phishing', 'ham': 'not phishing'})

# Convert 'not phishing' and 'phishing' to integers for training
df['label'] = df['label'].map({'not phishing': 0, 'phishing': 1})

# Split dataset into training and testing
train_texts, test_texts, train_labels, test_labels = train_test_split(df['text'], df['label'], test_size=0.2)

# Load tokenizer and tokenize data
tokenizer = DistilBertTokenizerFast.from_pretrained('distilbert-base-uncased')
train_encodings = tokenizer(list(train_texts), truncation=True, padding=True)
test_encodings = tokenizer(list(test_texts), truncation=True, padding=True)

# Prepare datasets for Trainer
train_dataset = Dataset.from_dict({**train_encodings, "label": list(train_labels)})
test_dataset = Dataset.from_dict({**test_encodings, "label": list(test_labels)})

# Load DistilBERT model for sequence classification
model = DistilBertForSequenceClassification.from_pretrained('distilbert-base-uncased', num_labels=2)

# Define training arguments
training_args = TrainingArguments(
    output_dir="models/phishsnitch-model",
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    num_train_epochs=3,
    logging_dir="./logs",
    logging_steps=10,
    # Remove evaluation_strategy, save_strategy, load_best_model_at_end
)

# Initialize Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    tokenizer=tokenizer,
)

# Train the model
trainer.train()

# Save the fine-tuned model and tokenizer
model.save_pretrained("models/phishsnitch-model")
tokenizer.save_pretrained("models/phishsnitch-model")