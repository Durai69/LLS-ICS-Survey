import os

file_path = r"F:\Internship\New folder\LLS Survey\Coomplete structure.txt"

if os.path.exists(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        text = file.read()

    chunk_size = 10000
    for i in range(0, len(text), chunk_size):
        with open(f"F:/Internship/New folder/LLS Survey/part_{i//chunk_size + 1}.txt", "w", encoding="utf-8") as chunk:
            chunk.write(text[i:i+chunk_size])
    print("✅ File successfully split.")
else:
    print("❌ File not found. Double-check the path.")
