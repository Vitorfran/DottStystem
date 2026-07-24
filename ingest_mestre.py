import sqlite3
import urllib.request
import json
import re
import os
import sys

# Garantir que o script encontre as dependências instaladas no venv
sys.path.append(os.path.join(os.path.dirname(__file__), "venv", "Lib", "site-packages"))



try:
    import chromadb
    from langflow.services.settings.factory import SettingsServiceFactory
    from langflow.services.auth import utils as auth_utils
except ImportError as e:
    print(f"Erro ao importar dependências: {e}")
    sys.exit(1)

def get_api_key():
    """Recupera e descriptografa a GOOGLE_API_KEY do Langflow."""
    db_paths = [
        os.path.join("venv", "Lib", "site-packages", "langflow", "langflow.db"),
        os.path.join("venv", "Lib", "site-packages", "flow_backend", "langflow.db"),
    ]
    db_path = None
    for p in db_paths:
        if os.path.exists(p):
            db_path = p
            break
            
    if not db_path:
        raise FileNotFoundError("Banco de dados do Langflow não encontrado.")
        
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM variable WHERE name='GOOGLE_API_KEY';")
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        raise ValueError("GOOGLE_API_KEY não encontrada no Langflow.")
        
    encrypted_value = row[0]
    settings_service = SettingsServiceFactory().create()
    fernet = auth_utils.get_fernet(settings_service)
    return fernet.decrypt(encrypted_value.encode()).decode()

def parse_knowledge(file_path):
    """Processa o arquivo Markdown e gera blocos para o vetor DB."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    sections = re.split(r"^(##\s+.*)$", content, flags=re.MULTILINE)
    chunks = []
    current_section = "Geral"
    
    i = 0
    while i < len(sections):
        part = sections[i].strip()
        if not part:
            i += 1
            continue
            
        if part.startswith("##"):
            current_section = part.replace("##", "").strip()
            i += 1
            if i < len(sections):
                body = sections[i].strip()
                lines = body.split("\n")
                for line in lines:
                    line = line.strip()
                    if line:
                        chunks.append({
                            "text": f"{current_section} - {line}",
                            "metadata": {"categoria": current_section}
                        })
            i += 1
        else:
            lines = part.split("\n")
            for line in lines:
                line = line.strip()
                if line and not line.startswith("#"):
                    chunks.append({"text": line, "metadata": {"categoria": "Geral"}})
            i += 1
            
    return chunks

def get_embedding(text, api_key):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key={api_key}"
    payload = {
        "model": "models/gemini-embedding-001",
        "content": {"parts": [{"text": text}]}
    }
    
    req = urllib.request.Request(url)
    req.add_header("Content-Type", "application/json")
    data = json.dumps(payload).encode('utf-8')
    
    with urllib.request.urlopen(req, data=data) as response:
        res_data = json.loads(response.read().decode())
        return res_data["embedding"]["values"]

def main():
    print("Indexing Mestre das Alianças Knowledge into ChromaDB...")
    try:
        api_key = get_api_key()
    except Exception as e:
        print(f"Erro na API Key: {e}")
        return
        
    markdown_file = "mestre_knowledge.md"
    if not os.path.exists(markdown_file):
        print("Arquivo mestre_knowledge.md não encontrado.")
        return
        
    chunks = parse_knowledge(markdown_file)
    persist_dir = "./meubanco"
    client = chromadb.PersistentClient(path=persist_dir)
    
    collection_name = "mestre_aliancas"
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass
        
    collection = client.create_collection(collection_name)
    
    ids, documents, embeddings, metadatas = [], [], [], []
    for idx, chunk in enumerate(chunks):
        text = chunk["text"]
        vector = get_embedding(text, api_key)
        ids.append(f"doc_mestre_{idx}")
        documents.append(text)
        embeddings.append(vector)
        metadatas.append(chunk["metadata"])
        
        if len(ids) >= 10 or idx == len(chunks) - 1:
            collection.add(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)
            ids, documents, embeddings, metadatas = [], [], [], []
            
    print(f"✓ Sucesso! Base da Mestre das Alianças indexada no ChromaDB na coleção '{collection_name}' ({collection.count()} blocos).")

if __name__ == "__main__":
    main()
