from sentence_transformers import SentenceTransformer

print("Downloading BGE-M3...")

model = SentenceTransformer("BAAI/bge-m3")

print("BGE-M3 downloaded successfully!")